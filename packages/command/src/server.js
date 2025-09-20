const fs = require("fs");
const p = require("path");
const http = require("http");
const url = require("url");
const lodash = require("lodash");
const {
  createLanguageFile,
  getAllKeys,
} = require("@pianduan/vue-i18n-command-utils");

module.exports = class I18nServer {
  config = null;
  params = {};
  languages = {};
  newLanguages = {};
  existLanguageKeys = [];
  constructor(config, params) {
    this.config = config;
    this.params = params;
    this.port = this.params.port || this.config.port || 3000;
  }

  readLanguagesConfig() {
    const { languages, __rootPath, i18nModule = false } = this.config;
    languages.forEach((language) => {
      const { name, path } = language;
      let dirPath = p.resolve(__rootPath, path, language.name + ".json");

      if (!fs.existsSync(dirPath)) {
        createLanguageFile(__rootPath, path, i18nModule, name, []);
        this.languages[name] = {};
      } else {
        const code = fs.readFileSync(dirPath, { encoding: "utf8" });

        let obj;

        obj = JSON.parse(code);

        this.languages[name] = obj;
      }
      this.newLanguages[name] = [];
    });
  }

  createServer() {
    const server = http.createServer(this.requestHandler);

    function startServer(port, maxTries = 10) {
      if (maxTries <= 0) {
        console.error(
          "Error: Could not find available port after multiple attempts"
        );
        process.exit(1);
      }

      server
        .listen(port, () => {
          console.log(`Server running at http://localhost:${port}`);
        })
        .on("error", (err) => {
          if (err.code === "EADDRINUSE") {
            console.log(`Port ${port} is in use, trying port ${port + 1}...`);
            startServer(port + 1, maxTries - 1);
          } else {
            console.error("Server error:", err);
            process.exit(1);
          }
        });
    }

    startServer(this.port);
  }

  requestHandler = (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    if (pathname.startsWith("/api")) {
      this.handleUpdateColumn(req, res);
    } else {
      this.sendHtml(res);
    }
  };

  handleUpdateColumn = (req, res) => {
    let body = "";

    // 监听 data 事件
    req.on("data", (chunk) => {
      body += chunk;
    });

    // 监听 end 事件
    req.on("end", () => {
      // 解析请求的 body (如果是 JSON)
      try {
        body = JSON.parse(body);
        const { key, prop, newValue } = body;

        lodash.set(this.languages[prop], key, newValue);

        this.writeLanguages(prop);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Request received", data: body }));
      } catch (err) {
        console.log(err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Invalid JSON" }));
      }
    });

    // 处理请求中的错误
    req.on("error", (err) => {
      console.error("Request error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Server error" }));
    });
  };

  sendHtml(res) {
    let htmlStr = fs.readFileSync(
      p.join(__dirname, "./js-tpl/html.tpl"),
      "utf-8"
    );

    const data = {};
    const colHeaders = ["key"];
    const columns = [{ data: "key", readOnly: true }];
    const { languages } = this.config;
    languages.forEach((language, i) => {
      const { name } = language;
      colHeaders.push(name);
      columns.push({ data: name });

      const obj = this.languages[name];

      const keys = getAllKeys(obj);

      keys.forEach((k) => {
        data[k] = data[k] || { key: k };
        data[k][name] = lodash.get(obj, k);
      });
    });

    const list = Object.entries(data).map(([key, value]) => {
      return {
        key,
        ...value,
      };
    });

    htmlStr = htmlStr.replace("$data", JSON.stringify(list));
    htmlStr = htmlStr.replace("$colHeaders", JSON.stringify(colHeaders));
    htmlStr = htmlStr.replace("$columns", JSON.stringify(columns));

    res.end(htmlStr);
  }

  writeLanguages(name) {
    const { languages, __rootPath, i18nModule } = this.config;
    const language = languages.find((item) => item.name === name);
    if (!language) {
      console.error(`${name} configuration is not exist`);
    }
    const { path } = language;

    const newLanguageObj = Object.assign(this.languages[name], {});
    const source = [];
    for (let key in newLanguageObj) {
      source.push({
        value: newLanguageObj[key],
        id: key,
      });
    }
    createLanguageFile(__rootPath, path, i18nModule, name, source);
  }

  run() {
    this.readLanguagesConfig();
    this.createServer();
  }
};
