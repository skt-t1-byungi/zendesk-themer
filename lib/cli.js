#!/usr/bin/env node
const sade = require('sade')
const pkg = require('../package.json')
const prompts = require('prompts')
const loadJson = require('load-json-file')
const writeJson = require('write-json-file')
const normalizeUrl = require('normalize-url')
const path = require('path')
const fs = require('fs-extra')
const logger = require('./logger')
const globby = require('globby')

// commands
const down = require('./commands/down')
const up = require('./commands/up')

const prog = sade('themer')
prog.version(pkg.version)

prog
    .command('down')
    .describe('Download live theme.')
    .example('down')
    .example('down --config themer.json')
    .option('-c, --config', 'Using config file.')
    .action(async ({ config }) => {
        const opts = await (config ? loadConfig(config) : askAccountOrExit())
        const [downDir, err] = await down(opts)

        if (err || config) return

        const { wantConfigSave } = await prompts({
            type: 'confirm',
            message: 'Do you want to save the current config?',
            name: 'wantConfigSave'
        })

        if (wantConfigSave) {
            const conf = Object.assign({ target: './' }, opts)
            await writeJson(path.resolve(downDir, 'themer.json'), conf)
            logger.succeed('config saved.')
        }
    })

prog
    .command('up <src>')
    .describe('Upload a live theme.')
    .option('-p, --persist', 'No remove a old theme.')
    .option('-m, --multiple', 'Upload multiple themes.')
    .example('up themes/test-theme/')
    .example('up json')
    .example('up themes/**/themer.json --multiple')
    .action(async function runner (src, { persist, multiple, useConfig }) {
        if (multiple) {
            for (const path of await globby(src)) {
                await runner(path, { persist, useConfig: true })
            }
            return
        }

        let opts
        if (useConfig || src.endsWith('.json')) {
            opts = await loadConfig(src)
        } else {
            try {
                opts = await loadConfig(path.resolve(src, 'themer.json'))
            } catch (err) {
                opts = await askAccountOrExit()
                opts.target = path.resolve(process.cwd(), src)
            }
        }

        await up(opts, { persist })
    })

prog.parse(process.argv)

async function loadConfig (conf) {
    const opts = await loadJson(conf)
    const confDir = path.dirname(await fs.realpath(conf))

    if ('target' in opts) opts.target = await path.resolve(confDir, opts.target)
    if ('theme_path' in opts) opts.theme_path = await path.resolve(confDir, opts.theme_path)

    return opts
}

function askAccountOrExit () {
    return prompts([
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
