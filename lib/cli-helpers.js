const prompts = require('prompts')
const normalizeUrl = require('normalize-url')
const loadJson = require('load-json-file')
const fs = require('fs-extra')
const path = require('path')

/**
 * @param {string} confPath
 */
exports.loadConfig = async function (confPath) {
    const conf = await loadJson(confPath)
    const confDir = path.dirname(await fs.realpath(confPath))

    if ('target' in conf) conf.target = await path.resolve(confDir, conf.target)
    if ('theme_path' in conf) conf.theme_path = await path.resolve(confDir, conf.theme_path)

    return conf
}

exports.askAccountOrExit = function () {
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

exports.askSaveConfig = function () {
    return prompts({
        type: 'confirm',
        message: 'Do you want to save the current config?',
        name: 'wantConfigSave'
    }).then(p => p.wantConfigSave)
}
