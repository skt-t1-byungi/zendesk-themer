#!/usr/bin/env node
const sade = require('sade')
const pkg = require('../package.json')

const down = require('./commands/down')

const prog = sade('zenth')
prog.version(pkg.version)
prog
  .command('down')
  .describe('Download live theme.')
  .option('-c, --config', 'by config file.')
  .action(down)

prog.parse(process.argv)
