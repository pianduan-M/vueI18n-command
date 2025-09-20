const { parse } = require("@babel/parser");
const { parse: vueParseFn } = require("@vue/compiler-sfc");

function babelParse(code, filePath) {
  const ast = parse(code, {
    sourceType: "module",
    errorRecovery: true,
    plugins: [
      "typescript",
      "decorators-legacy",
      /.*(tsx|jsx)$/.test(filePath) && "jsx",
    ].filter((n) => n),
  });

  if (ast.errors.length > 0) {
    console.error(ast.errors);
    return;
  }
  return ast;
}

module.exports = {
  babelParse,
  parseVueFile: vueParseFn,
};
