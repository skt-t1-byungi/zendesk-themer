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
    .example('themer down')
    .example('themer down -config themer.json')
    .option('-c, --config', 'Load config file.')
    .action(async ({ config }) => {
        const opts = await (config ? loadConf(config) : askOptsOrExit())
        const [downDir, err] = await down(opts)

        if (err || config) return

        const { willSaveConf } = await prompts({
            type: 'confirm',
            message: 'Do you want to save the current config?',
            name: 'willSaveConf'
        })

        if (willSaveConf) {
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
    .option('-c, --config', 'Use config file.')
    .example('themer up themes/test-theme/')
    .example('themer up themer.json')
    .example('themer up themes/**/themer.json -m')
    .action(async function handleUp (src, { persist, multiple, useConfig }) {
        if (multiple) {
            const paths = await globby(src)
            return paths.forEach(path => handleUp(path, { persist, useConfig: true }))
        }

        let opts
        if (useConfig || src.endsWith('.json')) {
            opts = await loadConf(src)
        } else {
            try {
                opts = await loadConf(path.resolve(src, 'themer.json'))
            } catch (err) {
                opts = await askOptsOrExit()
            }
        }

        await up(opts, { persist })
    })

prog.parse(process.argv)

async function loadConf (conf) {
    const opts = await loadJson(conf)
    const confDir = path.dirname(await fs.realpath(conf))

    if ('target' in opts) opts.target = await path.resolve(confDir, opts.target)
    if ('theme_path' in opts) opts.theme_path = await path.resolve(confDir, opts.theme_path)

    return opts
}

function askOptsOrExit () {
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
