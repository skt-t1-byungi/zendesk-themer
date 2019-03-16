#!/usr/bin/env node
const sade = require('sade')
const pkg = require('../package.json')
const prog = sade('themer')
const globby = require('globby')
const fs = require('fs-extra')
const logger = require('./logger')
const writeJson = require('write-json-file')
const prompts = require('prompts')
const normalizeUrl = require('normalize-url')
const loadJson = require('load-json-file')
const path = require('path')
const { resolve } = require('path')
const down = require('./commands/down')
const up = require('./commands/up')

prog.version(pkg.version)

prog
    .command('down <path>')
    .describe('Download live theme.')
    .example('down')
    .example('down ./theme')
    .example('down */themer.json')
    .action(createTransferAction(down))

prog
    .command('up <path>')
    .describe('Upload a live theme.')
    .option('-p, --persist', 'No remove a old theme.')
    .example('up')
    .example('up themes/test-theme/ -p')
    .example('up themes/*/themer.json')
    .action(createTransferAction(up))

prog.parse(process.argv)

function createTransferAction (command) {
    return async (path, opts) => {
        if (path && path.includes('*')) {
            await runCommandMany(command, path, opts)
        } else {
            await runCommandOnce(command, path, opts)
        }
    }
}

async function runCommandMany (command, pattern, opts) {
    for (let path of await globby(pattern)) {
        if (!path.endsWith('themer.json')) path = resolve(path, 'themer.json')
        if (await fs.pathExists(path)) await command(await loadConfig(path), opts)
    }
}

async function runCommandOnce (command, path, opts) {
    let config
    let isConfigExist = false

    if (!path) {
        config = await askAccountOrExit()
        config.target = resolve(process.cwd(), (new URL(config.domain)).host)
    } else {
        if (path.endsWith('themer.json') && await fs.pathExists(path)) {
            isConfigExist = true
            config = await loadConfig(path)
        } else {
            if (await fs.pathExists(resolve(path, 'themer.json'))) {
                isConfigExist = true
                config = await loadConfig(resolve(path, 'themer.json'))
            } else {
                config = await askAccountOrExit()
                config.target = resolve(process.cwd(), path)
            }
        }
    }

    await command(config, opts)

    if (!isConfigExist && await askSaveConfig()) {
        await writeJson(resolve(config.target, 'themer.json'), config)
        logger.succeed('saved the config file.')
    }
}

async function loadConfig (confPath) {
    const conf = await loadJson(confPath)
    const confDir = path.dirname(await fs.realpath(confPath))

    if ('target' in conf) conf.target = await path.resolve(confDir, conf.target)
    if ('theme_path' in conf) conf.theme_path = await path.resolve(confDir, conf.theme_path)

    return conf
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

function askSaveConfig () {
    return prompts({
        type: 'confirm',
        message: 'Do you want to save the current config?',
        name: 'wantConfigSave'
    }).then(p => p.wantConfigSave)
}
