const prompts = require('prompts')
const Client = require('../Client')
const logger = require('../logger')
const { resolve } = require('path')
const ZipPacker = require('../Packer')

module.exports = async (opts, { persist = false } = {}) => {
    const [client, loginErr] = await logger.of(Client.login(opts), 'attempt login.')
    if (loginErr) return { err: loginErr }

    const upDir = opts.target || resolve(
        process.cwd(),
        await prompts({
            type: 'text',
            message: 'Please specify theme folder to upload.',
            name: 'val',
            initial: client.getDefaultThemePath()
        }).then(p => p.val)
    )

    const packer = ZipPacker.resolve(upDir)
    if (opts.theme_path) packer.themeDir(opts.theme_path)

    const pUpdate = client.updateLiveTheme(packer, { deleteOld: !persist })
    const [, upErr] = await logger.of(pUpdate, `upload a live theme from "${upDir}"`)

    await client.close()
    if (!upErr) logger.succeed('upload complete!')

    return { error: upErr, upDir }
}
