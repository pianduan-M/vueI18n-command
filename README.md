



## vue-i18n-command

通过 cli 和 loader 或 vite 插件轻松解决项目中文字翻译

### 插件

1. 使用方法：

webpack 项目

``` 
1. 安装 @pianduan/vue-i18n-parser-webpack
npm i @pianduan/vue-i18n-parser-webpack -D
2. 配置 loader webpack.config.js
module.exports = {
	...
 module: {
    rules: [
      {
        test: /\.(js|vue)$/,
        use: [
          {
            loader: require.resolve("@pianduan/vue-i18n-parser-webpack"),
            // 配置项，如果没有手动传入会自动读取项目根目录配置文件
            // options: i18nConfig,
          },
        ],
      },
    ],
  },
}

```

2. 注意点

   因为是直接编译替换中文文本在 js 文件中的中文会失去响应式，开发者需要自己处理

```js
// /test.js

// original
const obj = {
  test1:"测试文本1",
  test2:"测试文本2"
}
// transform
const obj = {
  // _$t 方法是配置文件中的 importInfo 字段
  test1:_$t("e3261acdf7e7ed3183a348a2991a8488ef"),
  test2:_$t("fb9b915830296bed75ad6fb71327b323fd")
}
```



3. `vueI18n-ignore-next-line`  忽略下一行文本提取

   ```
   // vueI18n-ignore-next-line
   const name = "张三" // 忽略
   
   
   <template>
   	<!-- vueI18n-ignore-next-line -->
   	<div>测试文本</div>
   </template>
   ```

   

vite 项目

```
1. 安装 @pianduan/vue-i18n-parser-vite
2. 修改 vite.config.js
import vueI18nParser form "@pianduan/vue-i18n-parser-vite"
export default defineConfig({
	...
	plugins:[
		// 可接受配置对象，没有自动读取项目根目录配置文件
		vueI18nParser()
	]
})
```



### cli

i18nConfig.js 配置文件

```javascript
module.exports = {
  // 入口文件
  entry: {
    // 可以是一个数组，指定多个入口
    dir: './src',
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
    source: '@/locales/useLocale.js',
    imported: '$t',
    local: '_$t',
  },
	// 国际化语言文件配置
  languages: [
    {
      name: 'zh-CN',
      path: './src/locales/messages',
    },
  ],
  // 导出命令配置
  output: {
    fileName: 'editor-i18n',
    fileExtension: 'xlsx',
    path: './',
  },
  // 翻译命令配置 目前只支持百度翻译
  translate: {
    appId: '', 
    key: '',
    host: '',
  },
};

```



### 1. update
``` vueI18n update [--clear]```

收集项目中的中文，以 hash 为 key 存放指定文件目录，示例：

```
// 模版文件只会收集静态文本
// 正确
<template>
	<div title="文本1">文本2</div>
</template>
// 错误 以下文本都不会收集
<template>
	<div :title="'文本1'">{{'文本2'}}</div>
</template>

// js 对象的 key 如果是中文也会被收集，避免使用中文或在配置中忽略该文件
const obj = {
	"文本1":"test"
}
```
`--clear` 参数会清空没有使用的 key (只会清除 32 位 hash 的 key)

### 2. translate
```vueI18n translate [language]```

读取中文翻译文件调用配置配置中的 api 翻译成指定的语言（如果没有传参直接读取 languages 中除中文外所有语言）

命令中可以指定多个语言  `vueI18n translate en-US ja-JP`

```
// 只会翻译空值 
// en-US.json
{
  // 会翻译
  "key":"",
  // 不会翻译
  "key":"value"
}
```

### 3. export
``` vueI18n export ```

把 locale 文件导出成 excel
示例：

| key   | zh-CN | en-US |
| ----- | ----- | ----- |
| a     | 文本  | 文本  |
| a.b.c | 文本  | 文本  |


### 4. import
``` vueI18n import [filepath] [sheetIndex] [--sync]```
把 excel 文件转成 locale json 文件，excel 格式参考 export 导出格式

--sync 同步翻译文件 没有此参数是直接用导入的文件覆盖项目翻译

### 5. server
``` vueI18n server [--port]```
读取本地的 locale 文件，启动一个 http 服务，提供修改服务