const p = require("path");
const fs = require("fs");
const xlsx = require("node-xlsx");
const {
  createLanguageFile,
} = require('./utils')

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

      const source = []
      const newLanguageObj = this.languageData[name]

      for (let key in newLanguageObj) {
        source.push({
          value: newLanguageObj[key],
          id: key
        })
      }

      createLanguageFile(__rootPath, path, i18nModule, name, source)

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
    let [filePath] = params;

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

    const data = workSheetsFromFile?.[0]?.data || null;

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
        result[name][key] = item[i];
      }
    });

    this.languageData = result;
  }

  run() {
    this.readExcelFile();
    this.writeLanguages();
    console.log('import excel locales successfully');
  }
}

module.exports = ImportExcel;