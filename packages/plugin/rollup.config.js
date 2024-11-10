const resolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const { terser } = require("rollup-plugin-terser");
const json = require("@rollup/plugin-json");
const pkg = require("../../package.json");

module.exports = [
  {
    input: "./src/webpack.js",
    output: [
      {
        file: "./lib/webpack.cjs", // CommonJS 输出路径
        format: "cjs",
        exports: "auto",
      },
    ],
    external: Object.keys(pkg.dependencies || {}), // 排除 node_modules
    plugins: [
      json(),
      resolve(), // 解析第三方依赖
      commonjs(), // 转换 CommonJS 模块
      // terser() // 代码压缩
    ],
  },
  {
    input: "./src/vite.js",
    output: [
      {
        file: "./lib/vite.mjs", // ESM 输出路径
        format: "esm",
      },
    ],
    external: Object.keys(pkg.dependencies || {}), // 排除 node_modules
    plugins: [
      json(),
      resolve(), // 解析第三方依赖
      commonjs(), // 转换 CommonJS 模块
      // terser() // 代码压缩
    ],
  },
];
