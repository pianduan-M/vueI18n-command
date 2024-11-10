const { parse } = require("@babel/parser");
const { default: traverse } = require("@babel/traverse");
const { default: generate } = require("@babel/generator");
const t = require("@babel/types");
const { addNamed } = require("@babel/helper-module-imports");
const crypto = require("crypto");
const fs = require("fs");
const p = require("path");
const ignore = require("ignore");
const { parse: vueParseFn } = require("@vue/compiler-sfc");

function hash(str) {
  const md5 = crypto.createHash("md5");
  return md5.update(str).digest("hex");
}

// Hmac算法: 需要配置一个密钥（俗称加盐）
function hmacHash(str, secretKey) {
  var curSecretKey = secretKey || "suda-i18n";
  var md5 = crypto.createHmac("md5", curSecretKey);
  return md5.update(str).digest("hex");
}

const zhExt = /[\u4e00-\u9fa5]+/;

let baseLocale = null;

function noLocale(value, id, relativePath) {
  if (!baseLocale) {
    return false;
  }
  if (!baseLocale[id]) {
    console.log(
      "\x1B[31m%s\x1B[0m",
      "\n\u3010i18n\u3011\u5728\u8BED\u6599\u5305\u4E2D\u672A\u53D1\u73B0\u4EE5\u4E0B\u5B57\u6BB5 "
        .concat(relativePath, "\uFF1A")
        .concat(value, "  \u8BF7\u6267\u884Ci18n update\n")
    );
    return false;
  }
  return false;
}

function readChinese(languages) {
  const chinesePath = languages.find(function (language) {
    return language.name === "zh-CN";
  }).path;

  const chineseFunc = function (chinesePath, k) {
    let filePath = p.resolve(process.cwd(), chinesePath, "zh-CN.json");
    if (!fs.existsSync(filePath)) {
      filePath = p.resolve(process.cwd(), chinesePath, "zh-CN.js");
    }
    const code = fs.readFileSync(filePath, "utf8");

    baseLocale["zh-CN"] = JSON.parse(code);

    console.log(baseLocale, "baseLocale");

    // const ast = parse(code, {
    //   sourceType: "module",
    //   plugins: ["typescript"],
    // });
    // traverse(ast, {
    //   ObjectProperty: function (path) {
    //     const key = path.node.key.value || path.node.key.name;
    //     const value = path.node.value.value || path.node.value.name;
    //     baseLocale[key] = value;
    //   },
    // });
  };
  if (typeof chinesePath === "string") {
    chineseFunc(chinesePath);
  } else if (Array.isArray(chinesePath)) {
    chinesePath.forEach(function (p) {
      chineseFunc(p);
    });
  }
}

function parserJSI18n(content, file, options, config = {}) {
  const { relativePath } = file;
  const filePath = file.relativePath;

  const md5Hash = function (str) {
    if (options && options.md5secretKey) {
      return hmacHash(str, options.md5secretKey);
    }
    return hash(str);
  };

  const importInfo = options.importInfo;

  const importSource = importInfo.source;
  const importImported = importInfo.imported;
  const importLocal = importInfo.local;

  const plugins = ["typescript", "decorators-legacy"];

  if (/.*(tsx|jsx)$/.test(filePath) || config.isTs) {
    plugins.push("jsx");
  }

  const ast = parse(content, {
    sourceType: "module",
    errorRecovery: true,
    plugins: plugins,
  });

  if (ast.errors.length > 0) {
    console.warn(ast.errors);
    return content;
  }

  let needI18n = config.needI18n || false;

  let i18nFnName = importLocal;

  const visitor = {
    Program: {
      exit: function (path) {
        if (needI18n) {
          let addI18n_1 = true;
          path.traverse({
            ImportDeclaration: function (importPath) {
              if (importPath.node.source.value.includes(importSource)) {
                const specifiers = importPath.node.specifiers;
                if (specifiers.length > 0) {
                  const registerLocaleIndex = specifiers.findIndex(
                    function (n) {
                      return n.imported.name === importImported;
                    }
                  );
                  addI18n_1 = registerLocaleIndex === -1;
                }
              }
            },
          });
          if (addI18n_1) {
            addNamed(path, importImported, importSource, {
              nameHint: importLocal,
              importPosition: "after",
            });
          }
        }
      },
    },
    JSXText: function (path) {
      if (
        t.isCallExpression(path.parent) &&
        path.parent.callee.name === i18nFnName
      ) {
        return;
      }
      if (zhExt.test(path.toString())) {
        const value = path.toString().trim();
        let id = md5Hash(value);
        if (noLocale(value, id, relativePath)) {
          return;
        }
        const origininalValue = path.node.value;
        const trimmedValue = origininalValue.trim();
        const valueIndex = origininalValue.indexOf(trimmedValue);
        const spacesLeft = origininalValue.substring(0, valueIndex);
        const spacesRight = origininalValue.substring(
          valueIndex + trimmedValue.length
        );
        path.replaceWithMultiple([
          t.jsxText(spacesLeft),
          t.jsxExpressionContainer(
            t.callExpression(t.identifier(importLocal), [t.stringLiteral(id)])
          ),
          t.jsxText(spacesRight),
        ]);
        needI18n = true;
      }
    },
    TemplateLiteral: function (path) {
      var _a;
      if (
        t.isCallExpression(path.parent) &&
        ((_a = path.parent.callee) === null || _a === void 0
          ? void 0
          : _a.name) === i18nFnName
      ) {
        return;
      }
      if (zhExt.test(path.toString())) {
        // 处理这种情况
        // <% if (data.usage === 0) { %>
        // ${'主要用于展示'}
        // <% } else if(data.usage === 1) { %>
        const node = path.node;
        let isCh_1 = false;
        node.quasis &&
          node.quasis.forEach(function (item) {
            if (zhExt.test(item.value.raw)) {
              isCh_1 = true;
            }
          });
        if (isCh_1) {
          const variables_1 = [];
          let i_1 = 0;
          const value = path
            .toString()
            .replace(/^`|`$/g, "")
            .replace(/\$\{([\s\S]+?)\}/g, function () {
              var agr = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                agr[_i] = arguments[_i];
              }
              i_1++;
              variables_1.push({
                id: i_1,
                name: agr[1],
              });
              return "{{@".concat(i_1, "}}");
            });
          var id = md5Hash(value);
          if (noLocale(value, id, relativePath)) {
            return;
          }
          path.replaceWith(
            t.callExpression(t.identifier(importLocal), [
              t.stringLiteral(id),
              t.objectExpression(
                node.expressions.map(function (item, index) {
                  return t.objectProperty(
                    t.stringLiteral("@".concat(index + 1)),
                    item
                  );
                })
              ),
            ])
          );
          needI18n = true;
        }
      }
    },
    StringLiteral: function (path) {
      var _a, _b;
      if (t.isTSLiteralType(path.parent)) {
        return;
      }
      if (
        t.isCallExpression(path.parent) &&
        path.parent.callee.name === i18nFnName
      ) {
        return;
      }
      var value =
        (_b =
          (_a = path === null || path === void 0 ? void 0 : path.node) ===
            null || _a === void 0
            ? void 0
            : _a.value) === null || _b === void 0
          ? void 0
          : _b.toString();
      if (zhExt.test(value)) {
        var id = md5Hash(value);
        if (noLocale(value, id, relativePath)) {
          return;
        }
        if (t.isJSXAttribute(path.parent)) {
          path.replaceWith(
            t.jsxExpressionContainer(
              t.callExpression(t.identifier(importLocal), [t.stringLiteral(id)])
            )
          );
        } else {
          path.replaceWith(
            t.callExpression(t.identifier(importLocal), [t.stringLiteral(id)])
          );
        }
        needI18n = true;
      }
    },
  };

  traverse(ast, visitor);

  if (needI18n) {
    const codeRes = generate(
      ast,
      {
        jsescOption: {
          minimal: true,
        },
        decoratorsBeforeExport: true,
      },
      content
    );
    return codeRes.code;
  } else {
    return content;
  }
}

function createElementStr(content, node) {
  let attrsStr = "";
  const { type, attrs } = node;
  Object.keys(attrs).forEach((k) => {
    const v = attrs[k];
    if (typeof v === "boolean") {
      if (v) {
        attrsStr += `${k} `;
      }
      return;
    }

    attrsStr += `${k}=${v} `;
  });

  return `<${type} ${attrsStr}>${content}</${type}>\n`;
}

function parserVueI18n(content, file, options) {
  const { descriptor, errors } = vueParseFn(content);

  if (errors.length > 0) {
    console.warn(errors);
    return content;
  }

  let needI18n;

  const { script, scriptSetup, template, styles } = descriptor;

  let templateRes;
  if (template && template.content) {
    const templateAstRes = parserVueTemplate(template, options);
    templateRes = createElementStr(templateAstRes.content, template);
    needI18n = templateAstRes.needI18n;
  }

  let scriptSetupRes;
  if (scriptSetup && scriptSetup.content) {
    scriptSetupRes = parserJSI18n(scriptSetup.content, file, options, {
      isTs: scriptSetup.lang === "ts",
      needI18n,
    });

    scriptSetupRes = createElementStr(scriptSetupRes, scriptSetup);
  }

  let scriptRes;
  if (script && script.content) {
    scriptRes = parserJSI18n(script.content, file, options, {
      isTs: script.lang === "ts",
      needI18n,
    });
    scriptRes = scriptRes = createElementStr(scriptRes, script);
  }

  return `${templateRes}${scriptRes}${scriptSetupRes}${styles.map((item) => createElementStr(item.content, item)).join("")}`;
}

function parserVueTemplate(template, options) {
  let result = "";
  const ast = template.ast;
  let templateSource = ast.source;
  const sourceArr = [];
  const firstIndex = template.loc.start.offset;
  let lastIndex = firstIndex;

  let needI18n = false;

  const importInfo = options.importInfo;
  const importLocal = importInfo.templateImported || importInfo.local || "$t";

  const md5Hash = function (str) {
    if (options && options.md5secretKey) {
      return hmacHash(str, options.md5secretKey);
    }
    return hash(str);
  };

  const visitor = {
    1(node) {
      if (node.props && node.props.length) {
        node.props.forEach((prop) => {
          const type = prop.type;
          const excute = visitor[type];

          if (excute) {
            excute(prop);
          }
        });
      }

      if (node.children && node.children.length) {
        node.children.forEach((child) => {
          const c = visitor[child.type];
          c && c(child);
        });
      }
    },
    2(node) {
      if (node.content && zhExt.test(node.content)) {
        const value = node.content.trim();

        const id = md5Hash(value);

        if (noLocale(id)) {
          return;
        }

        const content = `{{${importLocal}('${id}')}}`;

        const { start, end } = node.loc;

        sourceArr.push(templateSource.slice(lastIndex, start.offset), content);

        lastIndex = end.offset;
        needI18n = true;
      }
    },
    4(node) {
      if (node.ast) {
        const { type, consequent, alternate } = node.ast;
        if (type === "ConditionalExpression") {
          const originSource = node.loc.source;
          let source = originSource;

          source = visitor.StringLiteral(consequent, source);
          source = visitor.StringLiteral(alternate, source);

          if (source !== originSource) {
            const { start, end } = node.loc;

            sourceArr.push(
              templateSource.slice(lastIndex, start.offset),
              source
            );

            lastIndex = end.offset;
          }
        }
      }
    },

    StringLiteral(node, source) {
      const value = node.value.trim();
      if (value && zhExt.test(value)) {
        const id = md5Hash(value);

        if (noLocale(id)) {
          return source;
        }

        const content = `${importLocal}('${id}')`;

        source = source.replace(
          new RegExp(`[\'|\"|\`]*${value}[\'|\"|\`]*`),
          content
        );

        needI18n = true;
      }

      return source;
    },
    5(node) {
      const type = node.content.type;
      const excute = visitor[type];
      if (excute) {
        excute(node.content);
      }
    },
    6(node) {
      const { type, content } = node.value;

      if (type === 2 && zhExt.test(content)) {
        const { source, start, end } = node.loc;

        const value = content.trim();

        const id = md5Hash(value);

        if (noLocale(id)) {
          return;
        }

        let replateContent = source.replace(content, () => {
          return `${importLocal}('${id}')`;
        });

        replateContent = `:${replateContent}`;
        sourceArr.push(
          templateSource.slice(lastIndex, start.offset),
          replateContent
        );

        lastIndex = end.offset;

        needI18n = true;
      }
    },
    7(node) {
      if (!node.exp) return;
      const type = node.exp.type;
      const excute = visitor[type];
      if (excute) {
        excute(node.exp);
      }
    },
  };

  ast.children.forEach((child) => {
    const fn = visitor[child.type];
    fn && fn(child);
  });

  if (lastIndex !== firstIndex) {
    sourceArr.push(templateSource.slice(lastIndex, template.loc.end.offset));

    result = sourceArr.join("");
  } else {
    result = template.content;
  }

  return { content: result, needI18n };
}

function parserI18n(content, file, options) {
  const filePath = file.realpath;
  const _ignore = options.ignore || {};
  const sameGit = _ignore.sameGit;
  const languages = options.languages;
  const ignoreList = _ignore.list || [];

  if (sameGit) {
    const gitIgnore = fs
      .readFileSync(p.resolve(process.cwd(), ".gitignore"))
      .toString();
    ignoreList.push.apply(ignoreList, gitIgnore.split("\n"));
  }

  try {
    const relativePath = p.relative(process.cwd(), filePath);
    const includes = ignore().add(options.includes);
    const included = includes.ignores(relativePath);
    const ig = ignore().add(ignoreList);
    if (ig.ignores(relativePath) && !included) {
      return content;
    }
  } catch (error) {
    return content;
  }

  if (!baseLocale) {
    baseLocale = {};
    readChinese(languages);
  }

  if (/\.(ts|js)$/.test(filePath)) {
    return parserJSI18n(content, file, options);
  } else if (/\.vue$/.test(filePath)) {
    return parserVueI18n(content, file, options);
  }

  return content;
}

exports.parserI18n = parserI18n;
