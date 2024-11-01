const fs = require('fs')
const p = require('path')
const { default: traverse } = require('@babel/traverse')
const { isString, isObject, isArray } = require('lodash')
const t = require('@babel/types');
const {
  babelParse,
  vueParse,
  hmacHash,
  hash,
  scanFile,
  createLanguageFile,
  zhExt,
  zhExt2
} = require('./utils')

module.exports = class Update {
  config = null
  params = {}
  languages = {}
  newLanguages = {}
  constructor (config, params) {
    this.config = config
    this.params = params
  }

  readLanguagesConfig () {
    const { languages, __rootPath, i18nModule } = this.config
    languages.forEach(language => {
      const { name, path } = language
      let dirPath = p.resolve(__rootPath, path, language.name + '.json')
      // if (!fs.existsSync(dirPath)) {
      //   dirPath = p.resolve(__rootPath, path, language.name + '.js')
      // }

      if (!fs.existsSync(dirPath)) {
        createLanguageFile(__rootPath, path, i18nModule, name, [])
        this.languages[name] = {}
      } else {
        const code = fs.readFileSync(dirPath, { encoding: 'utf8' })
        // const ast = parse(code, {
        //   sourceType: 'module',
        //   plugins: ['typescript']
        // })
        // const obj = {}
        // traverse(ast, {
        //   ObjectProperty (path) {
        //     const key = path.node.key.value || path.node.key.name
        //     const value =
        //       path.node.value.value ??
        //       path.node.value.name ??
        //       path.node.value.quasis[0].value.raw
        //     obj[key] = value
        //   }
        // })

        let obj = JSON.parse(code)
        this.languages[name] = obj
      }
      this.newLanguages[name] = []
    })
  }

  readFile () {
    const dir = this.config.entry.dir
    if (typeof dir === 'string') {
      this.readFiles(dir)
    } else if (Array.isArray(dir)) {
      dir.forEach(d => this.readFiles(d))
    }
  }

  readFiles (dir) {
    const __rootPath = this.config.__rootPath
    const dirPath = p.resolve(__rootPath, dir)
    scanFile(dirPath, this.config, path => {
      console.log(`read ${path}`)
      const code = fs.readFileSync(path, { encoding: 'utf8' })

      if (/\.vue$/.test(path)) {
        this.vueSfcOpt(code, path)
      } else {
        this.babelOpt(code, path)
      }
    })
  }

  md5Hash (str) {
    if (this.params && this.params.secretKey) {
      return hmacHash(str, this.params.secretKey)
    } else if (this.config && this.config.md5secretKey) {
      return hmacHash(str, this.config.md5secretKey)
    }
    return hash(str)
  }

  babelOpt (code, file) {
    const { local: importLocal } = this.config.importInfo

    const ast = babelParse(code, file)

    if (!ast) return

    let i18nFnName = importLocal

    const _this = this

    const visitor = {
      JSXText (path) {
        if (
          t.isCallExpression(path.parent) &&
          path.parent.callee.name === i18nFnName
        ) {
          return
        }
        if (zhExt.test(path.toString())) {
          const value = path.toString().trim()
          const id = _this.md5Hash(value)
          _this.validateKey(value, id, file)
        }
      },
      TemplateLiteral (path) {
        if (
          t.isCallExpression(path.parent) &&
          path.parent.callee?.name === i18nFnName
        ) {
          return
        }
        if (zhExt.test(path.toString())) {
          // 处理这种情况
          // <% if (data.usage === 0) { %>
          // ${'主要用于展示'}
          // <% } else if(data.usage === 1) { %>
          const node = path.node
          let isCh = false
          node.quasis &&
            node.quasis.forEach(item => {
              if (zhExt.test(item.value.raw)) {
                isCh = true
              }
            })
          if (isCh) {
            const variables = []
            let i = 0
            let value = path
              .toString()
              .replace(/^`|`$/g, '')
              .replace(/\$\{([\s\S]+?)\}/g, (...agr) => {
                i++
                variables.push({
                  id: i,
                  name: agr[1]
                })
                return `{{@${i}}}`
              })
            const id = _this.md5Hash(value)
            _this.validateKey(value, id, file)
          }
        }
      },
      StringLiteral (path) {
        if (t.isTSLiteralType(path.parent)) {
          return
        }
        if (
          t.isCallExpression(path.parent) &&
          path.parent.callee.name === i18nFnName
        ) {
          return
        }
        if (zhExt.test(path.toString())) {
          const value = path.node.value.toString()
          const id = _this.md5Hash(value)
          _this.validateKey(value, id, file)
        }
      },

      CallExpression (path) {
        if (path.node.callee.name === i18nFnName) {
          let key = path.node.arguments[0].value
          if (key === 'me:setting:field:date:dbTypeTip') {
            console.log(key)
          }
          // 如果key是中文（如：_i18n('测试中文')），需要将中文传进去
          if (key) {
            _this.validateKey(zhExt.test(key) ? key : '', key, file)
          }
        }
      }
    }

    traverse(ast, visitor)
  }

  vueSfcOpt (code, file) {
    const { scriptContent, scriptSetupContent, templateAst } = vueParse(code)

    this.babelOpt(scriptContent, file)
    this.babelOpt(scriptSetupContent, file)

    const _this = this

    function handle (value, file) {
      const id = _this.md5Hash(value)
      _this.validateKey(value, id, file)
    }

    if (templateAst) {
      function callback (node) {
        if (node.type !== 2 && node.type !== 3) {
          if (
            node.content &&
            isString(node.content) &&
            zhExt.test(node.content)
          ) {
            const value = node.content

            const values = []

            value.replaceAll(zhExt2, str => {
              values.push(str)
            })

            if (values.length) {
              values.forEach(v => handle(v, file))
            }
          } else if (isObject(node.content)) {
            callback(node.content)
          }
        }

        if (isArray(node.children)) {
          node.children.forEach(child => callback(child))
        }
      }
      callback(templateAst)
    }
  }

  validateKey (zh, key, file) {
    for (let languageKey in this.languages) {
      if (
        !this.languages[languageKey][key] &&
        !this.newLanguages[languageKey].find(n => n.id === key)
      ) {
        this.newLanguages[languageKey].push({
          chinese: zh,
          id: key,
          file
        })
      }
    }
  }

  writeLanguages () {
    const { languages, __rootPath, i18nModule } = this.config
    languages.forEach(language => {
      const { name, path } = language
      const newLanguages = {}
      this.newLanguages[name].forEach(item => {
        newLanguages[item.id] = name === 'zh-CN' ? item.chinese : ''
      })
      const newLanguageObj = Object.assign(this.languages[name], newLanguages)
      const source = []
      for (let key in newLanguageObj) {
        source.push({
          value: newLanguageObj[key],
          id: key
        })
      }
      createLanguageFile(__rootPath, path, i18nModule, name, source)
    })
  }

  run () {
    this.readLanguagesConfig()
    this.readFile()
    this.writeLanguages()
    console.log('i18n update suceess!')
  }
}
