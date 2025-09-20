const ignore = require("ignore");
const fs = require("fs");
const p = require("path");
const { parse } = require("@babel/parser");

const prettier = require("prettier");
const { traverse } = require("@babel/types");

function prettierJs(data, config = {}) {
  const defaultConfig = {
    parser: "json",
    printWidth: 80,
    tabWidth: 2,
    useTabs: false,
    singleQuote: true,
    semi: true,
    trailingComma: "none",
    bracketSpacing: false,
    quoteProps: "consistent",
    arrowParens: "avoid",
    jsxBracketSameLine: false,
    overrides: [
      {
        files: ["*.json"],
        options: {
          spaceBeforeFunctionParen: true,
        },
      },
    ],
  };
  return prettier.format(data, Object.assign(defaultConfig, config));
}

function dedup(source) {
  const res = new Map();
  source.forEach((item) => {
    if (!res.has(item.id)) {
      res.set(item.id, item);
    }
  });
  return [...res].map((n) => n[1]);
}

async function createLanguageFile(__rootPath, path, i18nModule, name, source) {
  const dirPath = p.resolve(__rootPath, path);

  dirPath.split("/").reduce(($1, $2) => {
    const newPath = $1 + "/" + $2;
    if (!fs.existsSync(newPath)) {
      fs.mkdirSync(newPath);
    }
    return newPath;
  });

  const tpl = fs.readFileSync(
    p.resolve(
      __dirname,
      i18nModule ? "./js-tpl/language.tpl" : "./js-tpl/language2.tpl"
    ),
    {
      encoding: "utf8",
    }
  );

  const data = {};
  dedup(source).forEach((item) => {
    data[item.id] = item.value;
  });

  const file = tpl.replace("$data", () => JSON.stringify(data));

  let curFilePath = p.resolve(dirPath, name + ".json");

  let res = await prettierJs(file);

  fs.writeFileSync(curFilePath, res, {
    encoding: "utf8",
  });
}

function scanFile(dirPath, config, fn) {
  const dirOrFiles = fs.readdirSync(dirPath, { encoding: "utf8" });
  let fileRegex = config.file.test;
  if (fileRegex && typeof fileRegex === "string") {
    // 支持字符串正则表达式
    fileRegex = new RegExp(fileRegex);
  }
  const ig = ignore().add(config.__ignoreList);
  const includes = ignore().add(config.__includes);
  for (let item of dirOrFiles) {
    const relativePath = p.relative(
      config.__rootPath,
      p.resolve(dirPath, item)
    );

    if (!ig.ignores(relativePath) || includes.ignores(relativePath)) {
      const path = p.resolve(dirPath, item);
      const stat = fs.lstatSync(path);
      if (stat.isFile()) {
        if (fileRegex.test(item)) {
          fn(path);
        }
      } else {
        scanFile(path, config, fn);
      }
    }
  }
}

function readLanguagesFile(config) {
  const languagesData = {};

  const { languages, __rootPath, i18nModule = false } = config;

  languages.forEach((language) => {
    const { name, path } = language;
    let dirPath = p.resolve(__rootPath, path, language.name + ".json");

    if (!fs.existsSync(dirPath)) {
      createLanguageFile(__rootPath, path, i18nModule, name, []);
      this.languages[name] = {};
    } else {
      const code = fs.readFileSync(dirPath, { encoding: "utf8" });

      let obj;
      if (i18nModule) {
        const ast = parse(code, {
          sourceType: "module",
          plugins: ["typescript", "javascript"],
        });

        traverse(ast, {
          ObjectProperty: function (path) {
            const key = path.node.key.value || path.node.key.name;

            const value =
              path.node.value.value ??
              path.node.value.name ??
              path.node.value.quasis[0].value.raw;

            obj[key] = value;
          },
        });
      } else {
        obj = JSON.parse(code);
      }

      languagesData[name] = obj;
    }
  });

  return languagesData;
}

function readLocaleFile(languages, languageName = "zh-CN") {
  let locale = {};

  if (!languages || !languages.length) {
    return locale;
  }

  const chinesePath = languages.find(function (language) {
    return language.name === languageName;
  }).path;

  if (!chinesePath) {
    return locale;
  }

  const chineseFunc = (chinesePath) => {
    let code;
    let filePath = p.resolve(
      getRootPath(),
      chinesePath,
      `${languageName}.json`
    );
    code = fs.readFileSync(filePath, "utf8");

    return JSON.parse(code);
  };

  if (typeof chinesePath === "string") {
    locale = chineseFunc(chinesePath);
  } else if (Array.isArray(chinesePath)) {
    chinesePath.forEach(function (p) {
      const result = chineseFunc(p);

      if (!locale) {
        locale = result;
      } else {
        locale = {
          ...locale,
          ...result,
        };
      }
    });
  }

  return locale;
}

module.exports = {
  createLanguageFile,
  scanFile,
  prettierJs,
  readLanguagesFile,
  readLocaleFile,
};
