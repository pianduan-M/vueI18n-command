const { parserI18n } = require("./utils");

class VueI8nPlugin {
  constructor(options) {
    // 接收一个自定义的 transform 回调
    this.options = options;
  }

  apply(compiler) {
    const _this = this;

    compiler.hooks.compilation.tap("TransformPlugin", (compilation) => {
      // 在 NormalModule 生成代码时调用
      compilation.hooks.buildModule.tap("TransformPlugin", (module) => {
        if (
          module.resource &&
          !/node_modules/.test(file) &&
          /.(js|ts|tsx|jsx|vue)$/.test(module.resource)
        ) {
          // 拿到模块的源代码
          module.loaders.push({
            loader: function (source) {
              const file = this.resourcePath;
              try {
                return parserI18n(source, { realpath: file }, _this.options);
              } catch (error) {
                console.warn(error);
                return source;
              }
            },
          });
        }
      });
    });
  }
}

module.exports = VueI8nPlugin;
