import i18nUtils from "@pianduan/vue-i18n-command-utils";

export default function (options = {}) {
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
