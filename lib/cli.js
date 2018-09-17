#!/usr/bin/env node
const sade = require('sade')
const pkg = require('../package.json')
const prompts = require('prompts')
const loadJson = require('load-json-file')
const normalizeUrl = require('normalize-url')

// commands
const down = require('./commands/down')
const up = require('./commands/up')

const prog = sade('themer')
prog.version(pkg.version)

prog
  .command('down')
  .describe('Download current live theme.')
  .option('-c, --config', 'Load config file.')
  .action(async ({config}) => down(await resolveOptsOrExit(config)))

prog
  .command('up')
  .describe('Upload a live theme.')
  .option('-c, --config', 'Load config file.')
  .option('-p --persist', 'No remove a old theme.')
  .action(async ({config, persist}) => {
    const opts = await resolveOptsOrExit(config)
    opts.deleteOld = !persist
    return up(opts)
  })

prog.parse(process.argv)

function resolveOptsOrExit (config) {
  return config ? loadJson(config) : prompts([
    {
      type: 'text',
      name: 'domain',
      message: 'Enter zendesk hc domain.',
      format: url => normalizeUrl(url)
    },
    {
      type: 'text',
      name: 'email',
      message: 'Enter zendesk email for login.'
    },
    {
      type: 'password',
      name: 'password',
      message: 'Enter zendesk password for login.'
    }
  ], {
    onCancel: process.exit
  })
}
