#!/usr/bin/env node
const sade = require('sade')
const pkg = require('../package.json')
const prog = sade('themer')
const globby = require('globby')
const fs = require('fs-extra')
const logger = require('./logger')
const writeJson = require('write-json-file')
const { askAccountOrExit, askSaveConfig, loadConfig, askSaveDir } = require('./cli-helpers')
const { resolve } = require('path')
const down = require('./commands/down')
const up = require('./commands/up')

prog.version(pkg.version)

prog
    .command('down <path>')
    .describe('Download live theme.')
    .example('down')
    .example('down ./theme')
    .example('down **/themer.json')
    .action(createTransferAction(down))

prog
    .command('up <path>')
    .describe('Upload a live theme.')
    .option('-p, --persist', 'No remove a old theme.')
    .example('up')
    .example('up themes/test-theme/ -p')
    .example('up themes/**/themer.json')
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
        config.target = (new URL(config.domain)).host
    } else {
        if (path.endsWith('themer.json') && await fs.pathExists(path)) {
            isConfigExist = true
            config = await loadConfig(path)
        } else {
            path = resolve(path, 'themer.json')
            if (await fs.pathExists(path)) {
                isConfigExist = true
                config = await loadConfig(path)
            } else {
                config = await askAccountOrExit()
                config.target = await askSaveDir((new URL(config.domain)).host)
            }
        }
    }

    command(config, opts)

    if (!isConfigExist && await askSaveConfig()) {
        await writeJson(resolve(config.target, 'themer.json'), config)
        logger.succeed('saved the config file.')
    }
}
