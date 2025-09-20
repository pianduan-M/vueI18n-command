const p = require("path");
const fs = require("fs");
const xlsx = require("node-xlsx");
const {
  createLanguageFile,
  readLanguagesFile,
  getAllKeys,
} = require("@pianduan/vue-i18n-command-utils");
const lodash = require("lodash");

function setValue(obj, key, value) {
  if (!key) return;

  const keys = key.split(".");

  keys.forEach((k, i) => {
    if (i === keys.length - 1) {
      obj[k] = value;
      return;
    }

    obj[k] = obj[k] || {};
    obj = obj[k];
  });
}

class ImportExcel {
  config = null;
  params = {};
  languageData = null;

  constructor(config, params) {
    this.config = config;
    this.params = params;
  }

  writeLanguages() {
    const { languages, __rootPath, i18nModule } = this.config;

    languages.forEach((language) => {
      const { name, path } = language;
      if (!this.languageData[name]) return;

      let dirPath = p.resolve(__rootPath, path, language.name + ".json");

      if (fs.existsSync(dirPath)) {
        this.backup(dirPath, language);
      }

      const source = [];
      const newLanguageObj = this.languageData[name];

      for (let key in newLanguageObj) {
        source.push({
          value: newLanguageObj[key],
          id: key,
        });
      }

      createLanguageFile(__rootPath, path, i18nModule, name, source);
    });
  }

  backup(filePath, language) {
    const { __rootPath } = this.config;

    const form = filePath;
    const toDir = p.resolve(__rootPath, language.path, "__backup");
    const to = p.resolve(toDir, language.name + ".json");

    if (!fs.existsSync(toDir)) {
      fs.mkdirSync(toDir);
    }

    // 复制文件
    fs.copyFile(form, to, (err) => {
      if (err) throw err;
      console.log("backup successful");
    });
  }

  readExcelFile() {
    const { _: params = [] } = this.params;
    let [filePath, sheetIndex = 0] = params;

    if (!filePath) {
      console.error("no filePath param");
      process.exit(0);
    }

    filePath = p.resolve(process.cwd(), filePath);

    if (!fs.existsSync(filePath)) {
      console.error("File does not exist");
      process.exit(0);
    }

    const workSheetsFromFile = xlsx.parse(fs.readFileSync(filePath));

    const data = workSheetsFromFile?.[sheetIndex]?.data || null;

    this.format(data);
  }

  format(data) {
    if (!data) {
      console.error("未读取到数据");
      process.exit(0);
    }
    const result = {};
    const keys = data.shift();

    data.forEach((item) => {
      const [key] = item;

      for (let i = 1; i < keys.length; i++) {
        const name = keys[i];
        result[name] = result[name] || {};

        setValue(result[name], key, item[i]);
        // lodash.set(result[name], key, item[i]);
      }
    });

    this.languageData = result;
  }

  syncLanguage() {
    console.log(`同步到本地语言包中...`);

    const { languages } = this.config;

    if (!languages || !languages.length) return;

    const localLanguageData = readLanguagesFile(this.config);

    const allKeys = getAllKeys(localLanguageData[languages[0].name]);

    languages.forEach((item) => {
      allKeys.forEach((key) => {
        const value = lodash.get(this.languageData[item.name], key);
        if (value) {
          lodash.set(localLanguageData[item.name], key, value);
        }
      });
    });

    this.languageData = localLanguageData;
    console.log(`同步成功！`);
  }

  run() {
    this.readExcelFile();

    if (this.params.sync) {
      this.syncLanguage();
    }

    this.writeLanguages();

    console.log("import excel locales successfully");
  }
}

module.exports = ImportExcel;
