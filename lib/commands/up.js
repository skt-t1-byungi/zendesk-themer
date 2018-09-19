const Client = require('../Client')
const logger = require('../logger')
const ZipPacker = require('../ZipPacker')

module.exports = async (opts, { persist = false } = {}) => {
    const [client, loginErr] = await logger.of(Client.login(opts), 'attempt login.')
    if (loginErr) return [null, loginErr]

    const upDir = opts.target

    const packer = ZipPacker.resolve(upDir)
    if (opts.theme_path) packer.themeDir(opts.theme_path)

    const pUpdate = client.updateLiveTheme(packer, { deleteOld: !persist })
    const [, upErr] = await logger.of(pUpdate, `upload a live theme from "${upDir}"`)

    if (upErr) console.log(upErr.message || upErr)
    else logger.succeed('upload complete!')

    await client.close()

    return [upDir, upErr]
}
