# vueI18n-command
vue 项目 i18n 辅助工具

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
``` vueI18n import ```
把 excel 文件转成 locale json 文件，excel 格式参考 export 导出格式

### 5. server
``` vueI18n server [--port]```
读取本地的 locale 文件，启动一个 http 服务，提供修改服务