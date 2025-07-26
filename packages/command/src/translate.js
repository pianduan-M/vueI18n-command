const p = require('path')
const fs = require('fs')
const axios = require('axios')
const crypto = require('crypto')
const { sleep, prettierJs } = require('./utils')

class Translate {
  config = null
  params = null
  translateTable = {}
  translateSource = {}

  constructor(config, params) {
    this.config = config
    this.params = params
  }

  readFile() {
    const { languages, zhLanguageCode = 'zh-CN' } = this.config

    this.chinese = this.readLanguages(zhLanguageCode)
    let needTranslateLangueges = this.params._[0]?.split?.(',')

    if (!needTranslateLangueges) {
      needTranslateLangueges = languages.filter((item) => item.name !== zhLanguageCode).map((item) => item.name)
    }

    needTranslateLangueges.forEach((l) => {
      const res = this.readLanguages(l)
      this.translateSource[l] = res
      const needTranslateWord = []

      for (let key in res) {
        if (!res[key]) {
          // 语料数值为空时，则添加到待翻译列表
          const chinese = this.chinese[key]
          needTranslateWord.push({
            key,
            chinese,
          })
        }
      }
      this.translateTable[l] = needTranslateWord
    })
  }

  readLanguages(name) {
    const languages = this.config.languages
    const info = languages.find((item) => item.name === name)

    let curFilePath = p.resolve(process.cwd(), info.path, info.name + '.json')

    const file = fs.readFileSync(curFilePath, { encoding: 'utf-8' })

    let data
    try {
      data = JSON.parse(file)
    } catch (error) {
      console.error(error)
      process.exit(0)
    }

    return data
  }

  async translate() {
    const { i18nModule, languages, translate } = this.config
    const curQps = translate.qps || 1 // 翻译API有QPS限制

    for (let curLanguage in this.translateTable) {
      const info = languages.find((n) => n.name === curLanguage)
      const words = this.translateTable[curLanguage]

      const list = this.sliceWords(words)
      const newData = {
        ...this.translateSource[curLanguage],
      }

      for (let item of list) {
        const formatChinese = (word) => word.chinese.replace(/(\{\{(\@[0-9]+?)\}\})/g, ($1, $2, $3) => $3)

        item = item.filter((n) => {
          if (!n.chinese) {
            console.log('\x1B[31m%s\x1B[0m', `waring: ${n.key}没有对应的中文`)
            return false
          } else {
            return true
          }
        })

        const data = await this.requestTranslate(item.map((n) => formatChinese(n)).join('\n'), info.name)

        for (let i = 0; i < data.length; i++) {
          const target = item.find((n) => formatChinese(n) === data[i].src)
          const translated = data[i].dst.replace(/\@\s*([0-9]+)/g, ($1, $2) => `{{@${$2}}}`)
          if (target) {
            console.log(`${target.chinese} => ${translated}`)
            newData[target.key] = translated
          }
        }

        const sleepTime = Math.round(1000 / curQps)
        if (sleepTime > 0) {
          await sleep(sleepTime)
        }
      }

      const file = JSON.stringify(newData)

      let curFilePath = p.resolve(process.cwd(), info.path, info.name + '.json')

      fs.writeFileSync(curFilePath, await prettierJs(file), {
        encoding: 'utf-8',
      })
    }
  }

  async requestTranslate(word, targetLanguage) {
    const { appId, key, host } = this.config.translate
    const salt = Date.now().toString()
    const from = 'zh'
    const to = this.getTargetLanguage(targetLanguage) || 'en'

    const md5 = crypto.createHash('md5')
    md5.update(Buffer.from(appId + word + salt + key))
    const sign = md5.digest('hex')
    const path =
      '/api/trans/vip/translate' +
      `?q=${encodeURIComponent(word)}&from=${from}&to=${to}&appid=${appId}&salt=${salt}&sign=${sign}`

    const res = await axios({ baseURL: host, url: path, method: 'get' })
    let trans_result = ''
    if (res.status === 200) {
      if (res.data.error_code) {
        throw new Error(res.data.error_msg)
      }
      trans_result = res.data.trans_result
    }
    return trans_result
  }

  /*
 获取百度翻译对应语种key
 暂支持 16 种语言翻译
*/
  getTargetLanguage(language) {
    let curLanguage = language.toLowerCase().trim()
    switch (curLanguage) {
      case 'zh-cn':
      case 'zh-hans':
        // 简体中文
        curLanguage = 'zh'
        break
      case 'en-us':
      case 'en':
        // 英语(美国)
        curLanguage = 'en'
        break
      case 'ko-kr':
        // 韩语（朝鲜语）
        curLanguage = 'kor'
        break
      case 'ja-jp':
      case 'ja_jp':
        // 日语
        curLanguage = 'jp'
        break
      case 'es-es':
        // 西班牙语
        curLanguage = 'spa'
        break
      case 'th-th':
        // 泰语	th
        curLanguage = 'th'
        break
      case 'ar-dz':
        // 阿拉伯语	ara
        curLanguage = 'ara'
        break
      case 'ru-ru':
        // 俄语	ru
        curLanguage = 'ru'
        break
      case 'sv-se':
        // 瑞典语	swe
        curLanguage = 'swe'
        break
      case 'pt-br':
        // 葡萄牙语	pt
        curLanguage = 'pt'
        break
      case 'de-at':
        // 德语	de
        curLanguage = 'de'
        break
      case 'it-it':
        // 意大利语	it
        curLanguage = 'it'
        break
      case 'el-gr':
        // 希腊语	el
        curLanguage = 'el'
        break
      case 'nl-be':
        // 荷兰语	nl
        curLanguage = 'nl'
        break
      case 'pl-pl':
        // 波兰语	pl
        curLanguage = 'pl'
        break
      case 'fr-fr':
        // 法语	fra
        curLanguage = 'fra'
        break
      case 'bg-bg':
        // 保加利亚语	bul
        curLanguage = 'bul'
        break
      case 'da-dk':
        // 丹麦语	dan
        curLanguage = 'dan'
        break
      case 'fi-fi':
        // 芬兰语	fin
        curLanguage = 'fin'
        break
      case 'cs-cz':
        // 捷克语	cs
        curLanguage = 'cs'
        break
      case 'ro-ro':
        // 罗马尼亚语	rom
        curLanguage = 'rom'
        break
      case 'sl-si':
        // 斯洛文尼亚语	slo
        curLanguage = 'slo'
        break
      case 'hu-hu':
        // 匈牙利语	hu
        curLanguage = 'hu'
        break
      case 'vi-vn':
        // 越南语	vie
        curLanguage = 'vie'
        break
      case 'sq-al':
        // 阿尔巴尼亚语
        curLanguage = 'alb'
        break
      case 'zh-TW':
      case 'zh-tw':
      case 'zh-hant':
        // 中文繁体
        curLanguage = 'cht'
        break
      default:
        // 默认翻译成英文
        curLanguage = curLanguage || 'en'
    }
    return curLanguage
  }

  sliceWords(words) {
    const len = words.length
    const res = []
    let i = 0
    const resLen = 50
    while (i < len) {
      res.push(words.slice(i, i + resLen))
      i += resLen
    }
    return res
  }

  run() {
    this.readFile()
    this.translate()
    console.log('translate successfully!')
  }
}

module.exports = Translate
