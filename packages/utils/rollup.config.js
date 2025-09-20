const resolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const json = require("@rollup/plugin-json");
const pkg = require("./package.json");
const copy = require("rollup-plugin-copy");

module.exports = [
  {
    input: "index.js",
    output: [
      {
        file: "./lib/index.cjs", // CommonJS 输出路径
        format: "cjs",
        exports: "auto",
      },
    ],
    external: Object.keys(pkg.dependencies || {}), // 排除 node_modules
    plugins: [
      json(),
      // resolve(), // 解析第三方依赖
      commonjs(), // 转换 CommonJS 模块

      copy({
        targets: [
          {
            src: "src/js-tpl/*",
            dest: "lib/js-tpl",
          },
        ],
      }),
    ],
  },
  {
    input: "index.js",
    output: [
      {
        file: "./lib/index.mjs", // ESM 输出路径
        format: "esm",
      },
    ],
    external: Object.keys(pkg.dependencies || {}), // 排除 node_modules
    plugins: [
      json(),
      // resolve(), // 解析第三方依赖
      commonjs(), // 转换 CommonJS 模块
      copy({
        targets: [
          {
            src: "src/js-tpl/*",
            dest: "lib/js-tpl",
          },
        ],
      }),
    ],
  },
];
