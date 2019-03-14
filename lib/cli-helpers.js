const prompts = require('prompts')
const normalizeUrl = require('normalize-url')
const loadJson = require('load-json-file')
const fs = require('fs-extra')
const path = require('path')

/**
 * @param {string} confPath
 */
export async function loadConfig (confPath) {
    const conf = await loadJson(confPath)
    const confDir = path.dirname(await fs.realpath(confPath))

    if ('target' in conf) conf.target = await path.resolve(confDir, conf.target)
    if ('theme_path' in conf) conf.theme_path = await path.resolve(confDir, conf.theme_path)

    return conf
}

export function askAccountOrExit () {
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

export function askSaveConfig () {
    return prompts({
        type: 'confirm',
        message: 'Do you want to save the current config?',
        name: 'wantConfigSave'
    }).then(p => p.wantConfigSave)
}

export async function askSaveDir (initial) {
    return path.resolve(
        process.cwd(),
        await prompts({
            type: 'text',
            message: 'Please specify folder to save.',
            name: 'val',
            initial
        }).then(p => p.val)
    )
}
