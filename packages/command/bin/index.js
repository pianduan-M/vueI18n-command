#!/usr/bin/env node
const yArgsParser = require("yargs-parser");
const params = yArgsParser(process.argv.slice(3));
const I18n = require("../src/index");

const { program } = require("commander");

program
  .name("vueI18n")
  .version(`@pianduan/vueI18n-command ${require("../package").version}`);

program
  .command("update")
  .description("scan project files and update i18n json files")
  .option("--clear", "clean up unused translation fields")
  .option("--sync", "Synchronous translation field")
  .action(() => {
    console.log(params);
    const i18n = new I18n("update", params);
    i18n.run();
  });

program
  .command("export")
  .description("export i18n json files to excel")
  .action(() => {
    const i18n = new I18n("export", params);
    i18n.run();
  });

program
  .command("import <excel-file-path> [sheet-index]")
  .description("import excel files to i18n json files")
  .option("--sync", "Import only the existing fields of the project")
  .action(() => {
    const i18n = new I18n("import", params);
    i18n.run();
  });

program
  .command("server")
  .description("web page to modify project translation files")
  .option("--port", "service port, default 3000")
  .action(() => {
    const i18n = new I18n("server", params);
    i18n.run();
  });

program
  .command("translate [language]")
  .description("translate local files")
  .action(() => {
    const i18n = new I18n("translate", params);
    i18n.run();
  });

program.parse(process.argv);
