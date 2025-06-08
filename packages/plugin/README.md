# vue 项目 i18n 插件

支持 webpack 和 vite

i18nConfig.js 配置文件

```javascript
module.exports = {
  // 入口文件
  entry: {
    // 可以是一个数组，指定多个入口
    dir: "./src",
  },
  // 需要读取的文件格式
  file: {
    test: /.*(vue|ts|js|jsx)$/,
  },
  // 忽略的文件
  ignore: {
    list: [],
  },
  // 导入国际化方法
  importInfo: {
    source: "@/locales/useLocale.js",
    imported: "$t",
    local: "_$t",
  },
  // 国际化语言文件配置
  languages: [
    {
      name: "zh-CN",
      path: "./src/locales/messages",
    },
  ],
  // 导出命令配置
  output: {
    fileName: "editor-i18n",
    fileExtension: "xlsx",
    path: "./",
  },
  // 翻译命令配置 目前只支持百度翻译
  translate: {
    appId: "",
    key: "",
    host: "",
  },
};
```

### 1. vite

```javascript
// vite.config.js
import i18nConfig form './i18nConfig.js'
...

export default defineConfig({
  ...
  plugins:[
    VueI18nParse(i18nConfig)
  ]
})

```

### 2. webpack

```javascript
// webpack.config.js
const VueI18nParse = require("vue-i18n-parse")
const i18nConfig = require("./i18nConfig.js")
....
{
  ...
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx|vue)$/,
        use: [
          {
            loader: "vue-i18n-parse",
            options: i18nConfig,
          },
        ],
      },
    ],
  },
}
```
