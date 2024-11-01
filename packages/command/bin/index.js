#!/usr/bin/env node
const yArgsParser = require('yargs-parser');
const I18n = require('../../../src/index');
const command = process.argv[2];
const params = yArgsParser(process.argv.slice(3));

const i18n = new I18n(command, params);
i18n.run();
