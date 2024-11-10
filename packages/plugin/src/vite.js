const { parserI18n } = require("./utils");

module.exports = function (options) {
  return {
    name: "vite-plugin-react-i18n",
    enforce: "pre",
    transform: function (code, file) {
      var res = code;
      if (!/node_modules/.test(file)) {
        if (/.(js|ts|tsx|jsx|vue)$/.test(file)) {
          res = parserI18n(code, { realpath: file }, options);
        }
      }

      return {
        code: res,
        map: null,
      };
    },
  };
};
