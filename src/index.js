const p = require('path')
const fs = require('fs')
const Update = require('./update')
const Export = require('./export')
const ImportExcel = require('./import')

module.exports = class I18n {
  command = null
  params = {}
  config = {}

  constructor (command, params) {
    this.command = command

    if (!params.isJson) {
      this.params = params
      this.getConfig(params.config)
    }
  }

  getConfig (path = p.resolve(process.cwd(), 'i18nConfig.js')) {
    const configPath = p.resolve(process.cwd(), path)

    this.config = require(configPath)

    this.config.__rootPath = process.cwd()
    this.config.__ignoreList = this.config.ignore?.list || []

    if (this.config.ignore?.sameGit) {
      const gitIgnore = fs
        .readFileSync(p.resolve(process.cwd(), '.gitignore'))
        .toString()

      const gitIgnoreList = gitIgnore.split('\n')
      this.config.__ignoreList.push(...gitIgnoreList)
    }

    this.__configIncludes = this.config.includes
  }

  commands () {
    return {
      update: new Update(this.config, this.params),
      export: new Export(this.config, this.params),
      import: new ImportExcel(this.config, this.params),
    }
  }

  run () {
    return this.commands()[this.command].run()
  }
}
