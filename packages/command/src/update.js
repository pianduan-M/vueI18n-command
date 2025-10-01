const fs = require("fs");
const p = require("path");
const { default: traverse } = require("@babel/traverse");
const t = require("@babel/types");
const { get, set } = require("lodash");

const {
  babelParse,
  parseVueFile,
  hmacHash,
  hash,
  scanFile,
  createLanguageFile,
  zhExt,
  validateHashKey,
  getAllKeys,
  readLanguagesFile,
  IgnoreNextLineDirective,
} = require("@pianduan/vue-i18n-command-utils");

module.exports = class Update {
  config = null;
  params = {};
  languages = {};
  newLanguages = {};
  existLanguageKeys = [];
  constructor(config, params) {
    this.config = config;
    this.params = params;
  }

  readLanguagesConfig() {
    const { languages } = this.config;

    this.languages = readLanguagesFile(this.config);

    languages.forEach((item) => {
      this.newLanguages[item.name] = [];
    });
  }

  readFile() {
    const dir = this.config.entry.dir;
    if (typeof dir === "string") {
      this.readFiles(dir);
    } else if (Array.isArray(dir)) {
      dir.forEach((d) => this.readFiles(d));
    }
  }

  readFiles(dir) {
    const __rootPath = this.config.__rootPath;
    const dirPath = p.resolve(__rootPath, dir);
    scanFile(dirPath, this.config, (path) => {
      console.log(`read ${path}`);
      const code = fs.readFileSync(path, { encoding: "utf8" });

      if (/\.vue$/.test(path)) {
        this.vueSfcOpt(code, path);
      } else {
        this.babelOpt(code, path);
      }
    });
  }

  md5Hash(str) {
    if (str) {
      str = str.trim();
    }
    if (this.params && this.params.secretKey) {
      return hmacHash(str, this.params.secretKey);
    } else if (this.config && this.config.md5secretKey) {
      return hmacHash(str, this.config.md5secretKey);
    }
    return hash(str);
  }

  babelOpt(code, file) {
    const { local: importLocal } = this.config.importInfo;

    const ast = babelParse(code, file);

    if (!ast) return;

    let i18nFnName = importLocal;

    const _this = this;

    const ignoreNextLineDirective = new IgnoreNextLineDirective();

    const visitor = {
      enter: function (path) {
        ignoreNextLineDirective.collectIgnoreNextLineDirective(path);
      },
      JSXText(path) {
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
          const id = _this.md5Hash(value);
          _this.validateKey(value, id, file);
        }
      },
      TemplateLiteral(path) {
        if (
          t.isCallExpression(path.parent) &&
          path.parent.callee?.name === i18nFnName
        ) {
          return;
        }

        if (ignoreNextLineDirective.isIgnoreLine(path)) {
          return;
        }

        if (zhExt.test(path.toString())) {
          // 处理这种情况
          // <% if (data.usage === 0) { %>
          // ${'主要用于展示'}
          // <% } else if(data.usage === 1) { %>
          const node = path.node;
          let isCh = false;
          node.quasis &&
            node.quasis.forEach((item) => {
              if (zhExt.test(item.value.raw)) {
                isCh = true;
              }
            });
          if (isCh) {
            const variables = [];
            let i = 0;
            let value = path
              .toString()
              .replace(/^`|`$/g, "")
              .replace(/\$\{([\s\S]+?)\}/g, (...agr) => {
                i++;
                variables.push({
                  id: i,
                  name: agr[1],
                });
                return `{{@${i}}}`;
              });
            const id = _this.md5Hash(value);
            _this.validateKey(value, id, file);
          }
        }
      },
      StringLiteral(path) {
        if (t.isTSLiteralType(path.parent)) {
          return;
        }

        if (ignoreNextLineDirective.isIgnoreLine(path)) {
          return;
        }

        if (t.isCallExpression(path.parent)) {
          if (path.parent.callee.name === i18nFnName) {
            return;
          }

          const parentCallee = path.parent.callee;

          if (
            parentCallee.type === "MemberExpression" &&
            parentCallee.property?.name === "log" &&
            parentCallee.object?.name === "console"
          ) {
            return;
          }
        }
        if (zhExt.test(path.toString())) {
          const value = path.node.value.toString();
          const id = _this.md5Hash(value);
          _this.validateKey(value, id, file);
        }
      },

      CallExpression(path) {
        if (ignoreNextLineDirective.isIgnoreLine(path)) {
          return;
        }

        if (path.node.callee.name === i18nFnName) {
          let key = path.node.arguments[0].value;
          // 如果key是中文（如：_i18n('测试中文')），需要将中文传进去
          if (key) {
            _this.validateKey(zhExt.test(key) ? key : "", key, file);
          }
        }
      },
    };

    traverse(ast, visitor);
  }

  vueSfcOpt(code, file) {
    const { descriptor, errors } = parseVueFile(code);

    if (errors.length > 0) {
      return content;
    }

    const { script, scriptSetup, template } = descriptor;

    if (script?.content) {
      this.babelOpt(script.content, file);
    }

    if (scriptSetup?.content) {
      this.babelOpt(scriptSetup.content, file);
    }

    const _this = this;

    function handle(value, file) {
      const id = _this.md5Hash(value);
      _this.validateKey(value, id, file);
    }

    if (template?.ast) {
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
            handle(value, file);
          }
        },
        4(node) {
          if (node.ast) {
            const { type, consequent, alternate } = node.ast;
            if (type === "ConditionalExpression") {
              visitor.StringLiteral(consequent);
              visitor.StringLiteral(alternate);
            }
          }
        },

        StringLiteral(node) {
          if (node.value) {
            const value = node.value?.trim?.();
            if (value && zhExt.test(value)) {
              handle(value, file);
            }
          }
        },
        5(node) {
          const type = node.content.type;
          const excute = visitor[type];
          if (excute) {
            excute(node.content);
          }
        },
        6(node) {
          if (node.value) {
            const { type, content } = node.value;

            if (type === 2 && zhExt.test(content)) {
              const value = content.trim();
              handle(value, file);
            }
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

      const children = template.ast.children;
      if (children && children.length) {
        children.forEach((child) => {
          const excute = visitor[child.type];
          excute && excute(child);
        });
      }
    }
  }

  validateKey(zh, key, file) {
    if (this.params.clear) {
      this.existLanguageKeys.push(key);
    }

    for (let languageKey in this.languages) {
      if (
        !this.languages[languageKey][key] &&
        !this.newLanguages[languageKey].find((n) => n.id === key)
      ) {
        this.newLanguages[languageKey].push({
          chinese: zh,
          id: key,
          file,
        });
      }
    }
  }

  writeLanguages() {
    const {
      languages,
      __rootPath,
      i18nModule,
      zhLanguageCode = "zh-CN",
    } = this.config;
    languages.forEach((language) => {
      const { name, path } = language;
      const newLanguages = {};
      this.newLanguages[name].forEach((item) => {
        newLanguages[item.id] = name === zhLanguageCode ? item.chinese : "";
      });
      const newLanguageObj = Object.assign(this.languages[name], newLanguages);
      const source = [];
      for (let key in newLanguageObj) {
        source.push({
          value: newLanguageObj[key],
          id: key,
        });
      }
      createLanguageFile(__rootPath, path, i18nModule, name, source);
    });
  }

  clearLanguageKey() {
    const { languages } = this.config;

    const clearKeys = [];

    languages.forEach((language) => {
      const { name } = language;
      Object.keys(this.languages[name]).forEach((key) => {
        if (validateHashKey(key)) {
          if (!this.existLanguageKeys.includes(key)) {
            delete this.languages[name][key];
            clearKeys.push(key);
          }
        }
      });
    });

    console.log(`清除${[...new Set(clearKeys)].join("\n")}`);
  }

  syncLanguages() {
    const { languages } = this.config;
    const syncLocaleObjName = languages[0].name;
    if (!syncLocaleObjName) return;
    const syncLocaleObj = this.languages[syncLocaleObjName];

    const allKeys = getAllKeys(syncLocaleObj);

    allKeys.forEach((key) => {
      languages.slice(1).forEach((language, i) => {
        const { name } = language;
        const localeObj = this.languages[name];
        if (!get(localeObj, key)) {
          set(localeObj, key, "");
        }
      });
    });
  }

  run() {
    this.readLanguagesConfig();
    this.readFile();

    if (this.params.clear) {
      this.clearLanguageKey();
    }

    if (this.params.sync) {
      this.syncLanguages();
    }

    this.writeLanguages();
    console.log("i18n update suceess!");
  }
};
