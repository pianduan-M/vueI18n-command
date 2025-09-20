import require$$0$2 from 'ignore';
import require$$1$1 from 'fs';
import require$$2 from 'path';
import require$$5 from '@babel/types';
import require$$0 from '@babel/parser';
import require$$1 from '@vue/compiler-sfc';
import require$$0$1 from 'crypto';
import require$$4 from 'prettier';
import require$$7 from '@babel/helper-module-imports';
import require$$8 from '@babel/generator';
import require$$9 from '@babel/traverse';

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var transform = {};

var parse_1;
var hasRequiredParse;

function requireParse () {
	if (hasRequiredParse) return parse_1;
	hasRequiredParse = 1;
	const { parse } = require$$0;
	const { parse: vueParseFn } = require$$1;

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

	parse_1 = {
	  babelParse,
	  parseVueFile: vueParseFn,
	};
	return parse_1;
}

var common;
var hasRequiredCommon;

function requireCommon () {
	if (hasRequiredCommon) return common;
	hasRequiredCommon = 1;
	const crypto = require$$0$1;

	// Hmac算法: 需要配置一个密钥（俗称加盐）
	function hmacHash(str, secretKey) {
	  const curSecretKey = secretKey || "vue-i18n";
	  const md5 = crypto.createHmac("md5", curSecretKey);
	  return md5.update(str).digest("hex");
	}

	function validateHashKey(key) {
	  return /^[a-zA-Z0-9_]{32}$/.test(key);
	}

	function hash(str) {
	  const md5 = crypto.createHash("md5");
	  return md5.update(str).digest("hex");
	}

	/**
	 * 生成 8 位随机数字。
	 *
	 * @return {string} 8位随机数字
	 */
	function guid() {
	  function s4() {
	    return Math.floor((1 + Math.random()) * 0x10000)
	      .toString(16)
	      .substring(1);
	  }
	  return s4() + s4() + s4();
	}

	function sleep(ms) {
	  return new Promise((resolve) => setTimeout(resolve, ms));
	}

	const zhExt = /[\u4e00-\u9fa5]+/;
	const zhExt2 = /[\u4e00-\u9fa5]+/g;

	function getAllKeys(obj, prefix = "", keys = []) {
	  // 确保传入的是对象且不为null（因为typeof null === 'object'）
	  if (typeof obj !== "object" || obj === null) {
	    return keys;
	  }

	  Object.keys(obj).forEach((key) => {
	    const currentKey = prefix ? `${prefix}.${key}` : key;

	    // 如果当前属性的值是对象且不是数组（因为数组也是对象），则递归处理
	    if (
	      typeof obj[key] === "object" &&
	      obj[key] !== null &&
	      !Array.isArray(obj[key])
	    ) {
	      getAllKeys(obj[key], currentKey, keys);
	    } else {
	      keys.push(currentKey);
	    }
	  });

	  return keys;
	}

	function md5Hash(str, md5secretKey) {
	  if (md5secretKey) {
	    return hmacHash(str, md5secretKey);
	  }
	  return hash(str);
	}

	const getRootPath = process.env.UNI_INPUT_DIR
	  ? () => process.env.UNI_INPUT_DIR
	  : () => process.cwd();

	function isConsoleLogNode(node) {
	  if (
	    node.type === "CallExpression" &&
	    node.callee.type === "MemberExpression" &&
	    node.callee.object.name === "console" &&
	    node.callee.property.name === "log"
	  ) {
	    return true;
	  }
	  return false;
	}

	const VueNodeTypesEnum = {
	  ELEMENT: 1,
	  TEXT: 2,
	  SIMPLE_EXPRESSION: 4,
	  INTERPOLATION: 5,
	  ATTRIBUTE: 6,
	  DIRECTIVE: 7,
	};

	common = {
	  hmacHash,
	  hash,
	  guid,
	  sleep,
	  validateHashKey,
	  getAllKeys,
	  md5Hash,
	  getRootPath,
	  isConsoleLogNode,
	  zhExt,
	  zhExt2,
	  VueNodeTypesEnum,
	};
	return common;
}

var file;
var hasRequiredFile;

function requireFile () {
	if (hasRequiredFile) return file;
	hasRequiredFile = 1;
	const ignore = require$$0$2;
	const fs = require$$1$1;
	const p = require$$2;
	const { parse } = require$$0;

	const prettier = require$$4;
	const { traverse } = require$$5;

	function prettierJs(data, config = {}) {
	  const defaultConfig = {
	    parser: "json",
	    printWidth: 80,
	    tabWidth: 2,
	    useTabs: false,
	    singleQuote: true,
	    semi: true,
	    trailingComma: "none",
	    bracketSpacing: false,
	    quoteProps: "consistent",
	    arrowParens: "avoid",
	    jsxBracketSameLine: false,
	    overrides: [
	      {
	        files: ["*.json"],
	        options: {
	          spaceBeforeFunctionParen: true,
	        },
	      },
	    ],
	  };
	  return prettier.format(data, Object.assign(defaultConfig, config));
	}

	function dedup(source) {
	  const res = new Map();
	  source.forEach((item) => {
	    if (!res.has(item.id)) {
	      res.set(item.id, item);
	    }
	  });
	  return [...res].map((n) => n[1]);
	}

	async function createLanguageFile(__rootPath, path, i18nModule, name, source) {
	  const dirPath = p.resolve(__rootPath, path);

	  dirPath.split("/").reduce(($1, $2) => {
	    const newPath = $1 + "/" + $2;
	    if (!fs.existsSync(newPath)) {
	      fs.mkdirSync(newPath);
	    }
	    return newPath;
	  });

	  const tpl = fs.readFileSync(
	    p.resolve(
	      __dirname,
	      i18nModule ? "./js-tpl/language.tpl" : "./js-tpl/language2.tpl"
	    ),
	    {
	      encoding: "utf8",
	    }
	  );

	  const data = {};
	  dedup(source).forEach((item) => {
	    data[item.id] = item.value;
	  });

	  const file = tpl.replace("$data", () => JSON.stringify(data));

	  let curFilePath = p.resolve(dirPath, name + ".json");

	  let res = await prettierJs(file);

	  fs.writeFileSync(curFilePath, res, {
	    encoding: "utf8",
	  });
	}

	function scanFile(dirPath, config, fn) {
	  const dirOrFiles = fs.readdirSync(dirPath, { encoding: "utf8" });
	  let fileRegex = config.file.test;
	  if (fileRegex && typeof fileRegex === "string") {
	    // 支持字符串正则表达式
	    fileRegex = new RegExp(fileRegex);
	  }
	  const ig = ignore().add(config.__ignoreList);
	  const includes = ignore().add(config.__includes);
	  for (let item of dirOrFiles) {
	    const relativePath = p.relative(
	      config.__rootPath,
	      p.resolve(dirPath, item)
	    );

	    if (!ig.ignores(relativePath) || includes.ignores(relativePath)) {
	      const path = p.resolve(dirPath, item);
	      const stat = fs.lstatSync(path);
	      if (stat.isFile()) {
	        if (fileRegex.test(item)) {
	          fn(path);
	        }
	      } else {
	        scanFile(path, config, fn);
	      }
	    }
	  }
	}

	function readLanguagesFile(config) {
	  const languagesData = {};

	  const { languages, __rootPath, i18nModule = false } = config;

	  languages.forEach((language) => {
	    const { name, path } = language;
	    let dirPath = p.resolve(__rootPath, path, language.name + ".json");

	    if (!fs.existsSync(dirPath)) {
	      createLanguageFile(__rootPath, path, i18nModule, name, []);
	      this.languages[name] = {};
	    } else {
	      const code = fs.readFileSync(dirPath, { encoding: "utf8" });

	      let obj;
	      if (i18nModule) {
	        const ast = parse(code, {
	          sourceType: "module",
	          plugins: ["typescript", "javascript"],
	        });

	        traverse(ast, {
	          ObjectProperty: function (path) {
	            const key = path.node.key.value || path.node.key.name;

	            const value =
	              path.node.value.value ??
	              path.node.value.name ??
	              path.node.value.quasis[0].value.raw;

	            obj[key] = value;
	          },
	        });
	      } else {
	        obj = JSON.parse(code);
	      }

	      languagesData[name] = obj;
	    }
	  });

	  return languagesData;
	}

	function readLocaleFile(languages, languageName = "zh-CN") {
	  let locale = {};

	  if (!languages || !languages.length) {
	    return locale;
	  }

	  const chinesePath = languages.find(function (language) {
	    return language.name === languageName;
	  }).path;

	  if (!chinesePath) {
	    return locale;
	  }

	  const chineseFunc = (chinesePath) => {
	    let code;
	    let filePath = p.resolve(
	      getRootPath(),
	      chinesePath,
	      `${languageName}.json`
	    );
	    code = fs.readFileSync(filePath, "utf8");

	    return JSON.parse(code);
	  };

	  if (typeof chinesePath === "string") {
	    locale = chineseFunc(chinesePath);
	  } else if (Array.isArray(chinesePath)) {
	    chinesePath.forEach(function (p) {
	      const result = chineseFunc(p);

	      if (!locale) {
	        locale = result;
	      } else {
	        locale = {
	          ...locale,
	          ...result,
	        };
	      }
	    });
	  }

	  return locale;
	}

	file = {
	  createLanguageFile,
	  scanFile,
	  prettierJs,
	  readLanguagesFile,
	  readLocaleFile,
	};
	return file;
}

var directives;
var hasRequiredDirectives;

function requireDirectives () {
	if (hasRequiredDirectives) return directives;
	hasRequiredDirectives = 1;
	class IgnoreNextLineDirective {
	  ignoreLineNumbers = [];
	  directive = "vueI18n-ignore-next-line";

	  collectIgnoreNextLineDirective(path) {
	    const node = path.node;
	    if (!node.leadingComments) return;

	    // 检查每条注释
	    node.leadingComments.forEach((comment) => {
	      const commentText = comment.value.trim();

	      // 检查是否是指令注释
	      if (commentText.startsWith(`${this.directive}`)) {
	        const lineNumber = node.loc.start.line;
	        this.ignoreLineNumbers.push(lineNumber);
	      }
	    });
	  }

	  hasLineNumber(lineNumber) {
	    return this.ignoreLineNumbers.includes(lineNumber);
	  }
	  isIgnoreLine(path) {
	    const node = path.node;
	    const lineNumber = node.loc && node.loc.start.line;

	    if (!lineNumber) return;

	    return this.hasLineNumber(lineNumber);
	  }
	}

	directives = {
	  IgnoreNextLineDirective,
	};
	return directives;
}

var hasRequiredTransform;

function requireTransform () {
	if (hasRequiredTransform) return transform;
	hasRequiredTransform = 1;
	const ignore = require$$0$2;
	const fs = require$$1$1;
	const p = require$$2;
	const t = require$$5;
	const { babelParse, parseVueFile } = requireParse();
	const {
	  md5Hash,
	  getRootPath,
	  isConsoleLogNode,
	  zhExt,
	  VueNodeTypesEnum,
	} = requireCommon();
	const { readLocaleFile } = requireFile();
	const { addNamed } = require$$7;
	const { default: generate } = require$$8;
	const traverse = require$$9.default;
	const { IgnoreNextLineDirective } = requireDirectives();

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

	function getLocale() {
	  return commonjsGlobal.__vueI18nBaseLocale;
	}

	function noLocale(value, id) {
	  const baseLocale = getLocale();
	  if (!baseLocale) {
	    return false;
	  }

	  if (!baseLocale[id]) {
	    console.log(
	      "\x1B[31m%s\x1B[0m",
	      "\n\u3010i18n\u3011\u5728\u8BED\u6599\u5305\u4E2D\u672A\u53D1\u73B0\u4EE5\u4E0B\u5B57\u6BB5 "
	        .concat(id, "\uFF1A")
	        .concat(value, "  \u8BF7\u6267\u884Ci18n update\n")
	    );
	    return false;
	  }
	  return false;
	}

	function transformJsCode(content, file, options, config = {}) {
	  const { realpath: relativePath } = file;
	  const filePath = file.relativePath;

	  const importInfo = options.importInfo;

	  let importSource, importImported, importLocal;

	  if (importInfo) {
	    importSource = importInfo.source;
	    importImported = importInfo.imported;
	    importLocal = importInfo.local;
	  } else {
	    importLocal = "this.$t";
	  }

	  const ast = babelParse(content, filePath);

	  if (ast.errors.length > 0) {
	    return content;
	  }

	  let needI18n = config.needI18n || false;

	  let i18nFnName = importLocal;

	  const ignoreNextLineDirective = new IgnoreNextLineDirective();

	  const visitor = {
	    enter: function (path) {
	      ignoreNextLineDirective.collectIgnoreNextLineDirective(path);
	    },
	    Program: {
	      exit: function (path) {
	        if (needI18n && importInfo) {
	          let addI18n_1 = true;
	          path.traverse({
	            ImportDeclaration: function (importPath) {
	              if (importPath.node.source.value.includes(importSource)) {
	                const specifiers = importPath.node.specifiers;
	                if (specifiers.length > 0) {
	                  const registerLocaleIndex = specifiers.findIndex(
	                    function (n) {
	                      return n.imported?.name === importImported;
	                    }
	                  );
	                  addI18n_1 = registerLocaleIndex === -1;
	                }
	              }
	            },
	          });
	          if (addI18n_1 && importInfo) {
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

	      if (ignoreNextLineDirective.isIgnoreLine(path)) {
	        return;
	      }

	      if (zhExt.test(path.toString())) {
	        const value = path.toString().trim();
	        let id = md5Hash(value, options.md5secretKey);
	        if (noLocale(value, id)) {
	          return;
	        }
	        const origininalValue = path?.node?.value;
	        if (origininalValue) {
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
	      }
	    },
	    TemplateLiteral: function (path) {
	      if (
	        t.isCallExpression(path.parent) &&
	        path.parent?.callee?.name === i18nFnName
	      ) {
	        return;
	      }

	      if (ignoreNextLineDirective.isIgnoreLine(path)) {
	        return;
	      }

	      if (zhExt.test(path.toString())) {
	        const node = path.node;
	        let isCh = false;
	        node.quasis &&
	          node.quasis.forEach(function (item) {
	            if (zhExt.test(item.value.raw)) {
	              isCh = true;
	            }
	          });
	        if (isCh) {
	          let i_1 = 0;
	          const value = path
	            .toString()
	            .replace(/^`|`$/g, "")
	            .replace(/\$\{([\s\S]+?)\}/g, function () {
	              i_1++;
	              return "{{@".concat(i_1, "}}");
	            });
	          var id = md5Hash(value, options.md5secretKey);
	          if (noLocale(value, id)) {
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
	      if (t.isTSLiteralType(path.parent)) {
	        return;
	      }
	      if (
	        t.isCallExpression(path.parent) &&
	        path.parent.callee.name === i18nFnName
	      ) {
	        return;
	      }

	      if (isConsoleLogNode(path)) {
	        return;
	      }

	      if (ignoreNextLineDirective.isIgnoreLine(path)) {
	        return;
	      }

	      const value = path?.node?.value?.toString?.();

	      if (zhExt.test(value)) {
	        const id = md5Hash(value, options.md5secretKey);
	        if (noLocale(value, id)) {
	          return;
	        }
	        if (t.isJSXAttribute(path.parent)) {
	          transformCode;
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

	function transformVueCode(content, file, options) {
	  const { descriptor, errors } = parseVueFile(content);

	  if (errors.length > 0) {
	    return content;
	  }

	  let needI18n;

	  const { script, scriptSetup, template, styles } = descriptor;

	  let templateRes;
	  if (template && template.content) {
	    const templateAstRes = transformVueTemplateCode(template, options);
	    templateRes = createElementStr(templateAstRes.content, template);
	    needI18n = templateAstRes.needI18n;
	  }

	  let scriptSetupRes;
	  if (scriptSetup && scriptSetup.content) {
	    scriptSetupRes = transformJsCode(scriptSetup.content, file, options, {
	      isTs: scriptSetup.lang === "ts",
	      needI18n,
	    });

	    scriptSetupRes = createElementStr(scriptSetupRes, scriptSetup);
	  }

	  let scriptRes;
	  if (script && script.content) {
	    scriptRes = transformJsCode(script.content, file, options, {
	      isTs: script.lang === "ts",
	      needI18n,
	    });

	    scriptRes = scriptRes = createElementStr(scriptRes, script);
	  }

	  return `${templateRes}${scriptRes}${scriptSetupRes}${styles
	    .map((item) => createElementStr(item.content, item))
	    .join("")}`;
	}

	function transformVueTemplateCode(template, options) {
	  let result = "";
	  const ast = template.ast;
	  let templateSource = ast.source;
	  const sourceArr = [];
	  const firstIndex = template.loc.start.offset;
	  let lastIndex = firstIndex;

	  let needI18n = false;

	  const importInfo = options.importInfo;
	  let importLocal;

	  if (importInfo) {
	    importLocal = importInfo.templateImported || importInfo.local || "$t";
	  } else {
	    importLocal = "$t";
	  }

	  const visitor = {
	    [VueNodeTypesEnum.ELEMENT](node) {
	      if (node.props && node.props.length) {
	        node.props.forEach((prop) => {
	          const type = prop?.type;
	          const excute = visitor?.[type];

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
	    [VueNodeTypesEnum.TEXT](node) {
	      if (node.content && zhExt.test(node.content)) {
	        const value = node.content.trim();

	        const id = md5Hash(value, options.md5secretKey);

	        if (noLocale(value, id)) {
	          return;
	        }

	        const content = `{{${importLocal}('${id}')}}`;

	        const { start, end } = node.loc;

	        sourceArr.push(templateSource.slice(lastIndex, start.offset), content);

	        lastIndex = end.offset;
	        needI18n = true;
	      }
	    },
	    [VueNodeTypesEnum.SIMPLE_EXPRESSION](node) {
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
	      const value = node?.value?.trim?.();
	      if (value && zhExt.test(value)) {
	        const id = md5Hash(value, options.md5secretKey);

	        if (noLocale(value, id)) {
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
	    [VueNodeTypesEnum.INTERPOLATION](node) {
	      const type = node.content.type;
	      const excute = visitor[type];
	      if (excute) {
	        excute(node.content);
	      }
	    },
	    [VueNodeTypesEnum.ATTRIBUTE](node) {
	      const { type, content } = node?.value || {};

	      if (type === VueNodeTypesEnum.TEXT && zhExt.test(content)) {
	        const { source, start, end } = node.loc;

	        const value = content.trim();

	        const id = md5Hash(value, options.md5secretKey);

	        if (noLocale(value, id)) {
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
	    [VueNodeTypesEnum.DIRECTIVE](node) {
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

	transform.transformCode = function transformCode(content, file, options) {
	  const filePath = file.realpath;
	  const _ignore = options.ignore || {};
	  const sameGit = _ignore.sameGit;
	  const languages = options.languages || [];
	  const ignoreList = _ignore.list || [];
	  const __includes = options.includes || [];

	  const rootPath = getRootPath();

	  let entries = options?.entry?.dir || rootPath;

	  if (typeof entries === "string") {
	    entries = [entries];
	  }

	  if (sameGit) {
	    const gitIgnore = fs
	      .readFileSync(p.resolve(rootPath, ".gitignore"))
	      .toString();
	    ignoreList.push.apply(ignoreList, gitIgnore.split("\n"));
	  }

	  try {
	    const relativePath = p.relative(rootPath, filePath);

	    const entry = ignore().add(entries);
	    if (!entry.ignores(relativePath)) {
	      return content;
	    }

	    const includes = ignore().add(__includes);
	    const included = includes.ignores(relativePath);
	    const ig = ignore().add(ignoreList);

	    if (ig.ignores(relativePath) && !included) {
	      return content;
	    }
	  } catch (error) {
	    console.log(error, "error");
	    return content;
	  }

	  if (!commonjsGlobal.__vueI18nBaseLocale) {
	    commonjsGlobal.__vueI18nBaseLocale = readLocaleFile(
	      languages,
	      options.zhLanguageCode || languages[0]?.name
	    );
	  }

	  if (/\.(ts|js)$/.test(filePath)) {
	    return transformJsCode(content, file, options);
	  } else if (/\.vue$/.test(filePath)) {
	    if (/<(template|script|style)[\s>]/g.test(content)) {
	      return transformVueCode(content, file, options);
	    } else {
	      return transformJsCode(content, file, options);
	    }
	  }

	  return content;
	};
	return transform;
}

var utils;
var hasRequiredUtils;

function requireUtils () {
	if (hasRequiredUtils) return utils;
	hasRequiredUtils = 1;
	const transform = requireTransform();
	const parse = requireParse();
	const common = requireCommon();
	const directives = requireDirectives();
	const fileUtils = requireFile();

	utils = {
	  ...transform,
	  ...parse,
	  ...common,
	  ...directives,
	  ...fileUtils,
	};
	return utils;
}

var utilsExports = requireUtils();
var index = /*@__PURE__*/getDefaultExportFromCjs(utilsExports);

export { index as default };
