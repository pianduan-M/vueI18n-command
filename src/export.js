
const xlsx = require('node-xlsx')
const fs = require('fs')
const p = require('path')

class ExportExcel {
  config = null
  params = {}
  languages = {}

  constructor(config, params) {
    this.config = config
    this.params = params
  }

  readLanguagesConfig() {
    const { languages, __rootPath, i18nModule } = this.config
    languages.forEach(language => {
      const { name, path } = language
      let dirPath = p.resolve(__rootPath, path, language.name + '.json')


      if (fs.existsSync(dirPath)) {
        const code = fs.readFileSync(dirPath, { encoding: 'utf8' })

        let obj = JSON.parse(code)
        this.languages[name] = obj
      } else {
        this.languages[name] = {}
      }

    })
  }

  writeXlsx() {
    const { languages = [], output, __rootPath, i18nModule } = this.config
    const lang = languages[0]?.name || 'zh-CN'
    const keys = Object.keys(this.languages[lang])

    const data = [
      ['key', ...languages.map(item => item.name)]
    ]

    keys.map(k => {
      const values = [k,]

      languages.map(item => {
        const name = item.name
        values.push(this.languages[name][k])
      })

      data.push(values)
    })

    const sheetOptions = {
      '!cols': data[0].map(item => ({ wch: 40 })),
    }

    const buffer = xlsx.build([{ name: 'sheet1', data: data }], { sheetOptions }) // Returns a buffer


    const { fileName = "editor-i18n", fileExtension = 'xlsx' } = output

    const outputPath = p.resolve(process.cwd(), output.path || 'output')

    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath)
    }


    fs.writeFileSync(p.resolve(outputPath, [fileName, fileExtension].join(".")), buffer, {
      encoding: 'utf8'
    })

  }


  run() {
    this.readLanguagesConfig()
    this.writeXlsx()
    console.log('i18n export suceess!')
  }
}

module.exports = ExportExcel