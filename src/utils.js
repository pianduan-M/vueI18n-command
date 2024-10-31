const ignore = require('ignore')
const fs = require('fs')
const p = require('path')
const { parse } = require('@babel/parser')
const { parse: vueParseFn } = require('@vue/compiler-sfc')
const { compile } = require('@vue/compiler-dom')
const crypto = require('crypto')
const prettier = require('prettier')

function prettierJs (data, config = {}) {
  const defaultConfig = {
    parser: 'json',
    printWidth: 80,
    tabWidth: 2,
    useTabs: false,
    singleQuote: true,
    semi: true,
    trailingComma: 'none',
    bracketSpacing: false,
    quoteProps: 'consistent',
    arrowParens: 'avoid',
    jsxBracketSameLine: false,
    overrides: [
      {
        files: ['*.json'],
        options: {
          spaceBeforeFunctionParen: true
        }
      }
    ]
  }
  return prettier.format(data, Object.assign(defaultConfig, config))
}

function dedup (source) {
  const res = new Map()
  source.forEach(item => {
    if (!res.has(item.id)) {
      res.set(item.id, item)
    }
  })
  return [...res].map(n => n[1])
}

async function createLanguageFile (__rootPath, path, i18nModule, name, source) {
  const dirPath = p.resolve(__rootPath, path)

  dirPath.split('/').reduce(($1, $2) => {
    const newPath = $1 + '/' + $2
    if (!fs.existsSync(newPath)) {
      fs.mkdirSync(newPath)
    }
    return newPath
  })

  const tpl = fs.readFileSync(
    p.resolve(
      __dirname,
      i18nModule ? './js-tpl/language.tpl' : './js-tpl/language2.tpl'
    ),
    {
      encoding: 'utf8'
    }
  )

  const data = {}
  dedup(source).forEach(item => {
    data[item.id] = item.value
  })
  const file = tpl
    .replace('$name', `'${name}'`)
    .replace('$data', () => JSON.stringify(data))
    .replace('$i18n', i18nModule)

  let curFilePath = p.resolve(dirPath, name + '.json')
  // if (!fs.existsSync(curFilePath)) {
  //   curFilePath = p.resolve(dirPath, name + '.js')
  // }
  // const res = JSON.stringify(file).replaceAll(/\\/g, '')
  let res = await prettierJs(file)

  // console.log(res, 'res')

  fs.writeFileSync(curFilePath, res, {
    encoding: 'utf8'
  })
}

function scanFile (dirPath, config, fn) {
  const dirOrFiles = fs.readdirSync(dirPath, { encoding: 'utf8' })
  let fileRegex = config.file.test
  if (fileRegex && typeof fileRegex === 'string') {
    // 支持字符串正则表达式
    fileRegex = new RegExp(fileRegex)
  }
  const ig = ignore().add(config.__ignoreList)
  const includes = ignore().add(config.__includes)
  for (let item of dirOrFiles) {
    const relativePath = p.relative(config.__rootPath, p.resolve(dirPath, item))
    if (!ig.ignores(relativePath) || includes.ignores(relativePath)) {
      const path = p.resolve(dirPath, item)
      const stat = fs.lstatSync(path)
      if (stat.isFile()) {
        if (fileRegex.test(item)) {
          fn(path)
        }
      } else {
        scanFile(path, config, fn)
      }
    }
  }
}

function babelParse (code, file) {
  const ast = parse(code, {
    sourceType: 'module',
    errorRecovery: true,
    plugins: [
      'typescript',
      'decorators-legacy',
      /.*(tsx|jsx)$/.test(file) && 'jsx'
    ].filter(n => n)
  })

  if (ast.errors.length > 0) {
    console.error(ast.errors)
    return
  }
  return ast
}

function vueParse (code) {
  const { descriptor } = vueParseFn(code)
  const { script, scriptSetup, template } = descriptor

  const templateAst = compile(template.content).ast

  return {
    scriptContent: script.content,
    scriptSetupContent: scriptSetup.content,
    templateAst
  }
}

// Hmac算法: 需要配置一个密钥（俗称加盐）
function hmacHash (str, secretKey) {
  const curSecretKey = secretKey || 'suda-i18n'
  const md5 = crypto.createHmac('md5', curSecretKey)
  return md5.update(str).digest('hex')
}

function hash (str) {
  const md5 = crypto.createHash('md5')
  return md5.update(str).digest('hex')
}

/**
 * 生成 8 位随机数字。
 *
 * @return {string} 8位随机数字
 */
function guid () {
  function s4 () {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1)
  }
  return s4() + s4() + s4()
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const zhExt = /[\u4e00-\u9fa5]+/
const zhExt2 = /[\u4e00-\u9fa5]+/g

module.exports = {
  createLanguageFile,
  scanFile,
  babelParse,
  vueParse,
  hmacHash,
  hash,
  guid,
  sleep,
  prettierJs,
  zhExt,
  zhExt2
}
