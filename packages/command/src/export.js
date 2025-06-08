const xlsx = require("node-xlsx");
const fs = require("fs");
const p = require("path");
const lodash = require("lodash");

class ExportExcel {
  config = null;
  params = {};
  languages = {};

  constructor(config, params) {
    this.config = config;
    this.params = params;
  }

  readLanguagesConfig() {
    const { languages, __rootPath, i18nModule } = this.config;
    languages.forEach((language) => {
      const { name, path } = language;
      let dirPath = p.resolve(__rootPath, path, language.name + ".json");

      if (fs.existsSync(dirPath)) {
        const code = fs.readFileSync(dirPath, { encoding: "utf8" });

        let obj = JSON.parse(code);
        this.languages[name] = obj;
      } else {
        this.languages[name] = {};
      }
    });
  }

  writeXlsx() {
    const { languages = [], output, __rootPath, i18nModule } = this.config;
    const lang = languages[0]?.name || "zh-CN";
    let keys = [];

    const languageTexts = this.languages[lang];

    function getAllKeys(obj, prefix = "", keys = []) {
      // 确保传入的是对象且不为null（因为typeof null === 'object'）
      if (typeof obj !== "object" || obj === null) {
        return keys;
      }

      Object.keys(obj).forEach((key) => {
        const currentKey = prefix ? `${prefix}.${key}` : key;

        // 如果当前属性的值是对象且不是数组（因为数组也是对象），则递归处理
        if (
          typeof obj[key] === "object" &&
          obj[key] !== null &&
          !Array.isArray(obj[key])
        ) {
          getAllKeys(obj[key], currentKey, keys);
        } else {
          keys.push(currentKey);
        }
      });

      return keys;
    }

    keys = getAllKeys(languageTexts);

    const data = [["key", ...languages.map((item) => item.name)]];

    keys.map((k) => {
      const values = [k];

      languages.map((item) => {
        const name = item.name;
        values.push(lodash.get(this.languages[name], k));
      });

      data.push(values);
    });

    const sheetOptions = {
      "!cols": data[0].map((item) => ({ wch: 40 })),
    };

    const buffer = xlsx.build([{ name: "sheet1", data: data }], {
      sheetOptions,
    }); // Returns a buffer

    const { fileName = "editor-i18n", fileExtension = "xlsx" } = output;

    const outputPath = p.resolve(process.cwd(), output.path || "output");

    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath);
    }

    fs.writeFileSync(
      p.resolve(outputPath, [fileName, fileExtension].join(".")),
      buffer,
      {
        encoding: "utf8",
      }
    );
  }

  run() {
    this.readLanguagesConfig();
    this.writeXlsx();
    console.log("i18n export suceess!");
  }
}

module.exports = ExportExcel;
