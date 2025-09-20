const transform = require("./src/transform.js");
const parse = require("./src/parse.js");
const common = require("./src/common.js");
const directives = require("./src/directives.js");
const fileUtils = require("./src/file.js");

module.exports = {
  ...transform,
  ...parse,
  ...common,
  ...directives,
  ...fileUtils,
};
