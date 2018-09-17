#!/usr/bin/env node
const sade = require('sade')
const pkg = require('../package.json')
const prompts = require('prompts')
const loadJson = require('load-json-file')
const writeJson = require('write-json-file')
const normalizeUrl = require('normalize-url')
const {resolve} = require('path')

// commands
const down = require('./commands/down')
const up = require('./commands/up')

const prog = sade('themer')
prog.version(pkg.version)

prog
  .command('down')
  .describe('Download current live theme.')
  .option('-c, --config', 'Load config file.')
  .action(async ({config}) => {
    const opts = await resolveOptsOrExit(config)
    const {err, downDir} = await down(opts)

    if (err || config) return

    const {willSaveConf} = await prompts({
      type: 'confirm',
      message: 'Do you want to save the config?',
      name: 'willSaveConf'
    })

    if (willSaveConf) {
      const conf = Object.assign({target: downDir}, opts)
      await writeJson(resolve(downDir, 'themer.json'), conf)
    }
  })

prog
  .command('up')
  .describe('Upload a live theme.')
  .option('-c, --config', 'Load config file.')
  .option('-p --persist', 'No remove a old theme.')
  .action(async ({config, persist}) => {
    const opts = await resolveOptsOrExit(config)
    opts.deleteOld = !persist

    await up(opts)
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
