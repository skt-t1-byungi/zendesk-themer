const Client = require('../Client')
const logger = require('../logger')
const ZipPacker = require('../ZipPacker')

module.exports = async function (config, { persist }) {
    const [client, loginErr] = await logger.of(Client.login(config), 'attempt login.')
    if (loginErr) return

    const packer = new ZipPacker(config.target, config.theme_path)

    const [, upErr] = await logger.of(client.updateLiveTheme(packer, { persist }), `upload a live theme from "${config.target}"`)
    await client.close()

    if (upErr) {
        logger.fail(upErr.message || upErr)
        return
    }

    logger.succeed('upload complete!')
}
