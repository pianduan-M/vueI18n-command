const { transformCode, getRootPath } = require("@pianduan/vue-i18n-command-utils");
const path = require("path");
const fs = require("fs");

module.exports = function (source) {
  let options;

  const projectPath = getRootPath();

  if (this.getOptions) {
    options = this.getOptions();
  } else if (this.query) {
    options = this.query;
  }

  if (!options) {
    let optionsPath = path.resolve(projectPath, "./i18nConfig.js");

    //  判断是否存在配置文件
    if (!fs.existsSync(optionsPath)) {
      options = {};
    } else {
      options = commonjsRequire(optionsPath);
    }
  }

  const file = this.resourcePath;

  if (!/node_modules/.test(file)) {
    try {
      source = transformCode(source, { realpath: file }, options);
    } catch (error) {
      console.log(error, file, "error");
    }
  }
  return source;
};
