#!/usr/bin/env node
const sade = require('sade')
const prompts = require('prompts')
const pkg = require('../package.json')
const normalizeUrl = require('normalize-url')

const prog = sade('zenth')
prog.version(pkg.version)

prog
  .command('down')
  .describe('Download live theme.')
  .option('-c, --config', 'by config file.')
  .action(async opts => {
    const answers = await prompts([
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
    ])
  })

prog.parse(process.argv)
