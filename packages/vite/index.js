import i18nUtils from "@pianduan/vue-i18n-command-utils";
import path from "path";
import fs from "fs";

export default function (options) {
  if (!options) {
    const projectPath = i18nUtils.getRootPath();

    let optionsPath = path.resolve(projectPath, "./i18nConfig.js");

    //  判断是否存在配置文件
    if (!fs.existsSync(optionsPath)) {
      options = {};
    } else {
      const configFile = fs.readFileSync(optionsPath, "utf-8");

      const ast = i18nUtils.babelParse(configFile, {
        sourceType: "script",
        plugins: ["javascript"],
      });

      let exportedNode = {};

      i18nUtils.traverse(ast, {
        AssignmentExpression(path) {
          const left = path.node.left;
          // 检测是否是 module.exports = ...
          if (
            left.type === "MemberExpression" &&
            left.object.name === "module" &&
            left.property.name === "exports"
          ) {
            exportedNode = path.node.right;
          }
        },
      });
      options = i18nUtils.astToObject(exportedNode);
    }
  }

  return {
    name: "@pianduan/vue-i18n-parser-vite",
    enforce: "pre",
    transform: function (code, file) {
      let res = code;

      if (!/node_modules/.test(file)) {
        if (/.(js|ts|tsx|jsx|vue)$/.test(file)) {
          res = i18nUtils.transformCode(code, { realpath: file }, options);
        }
      }

      return {
        code: res,
        map: null,
      };
    },
  };
}
