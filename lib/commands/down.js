const Client = require('../Client')
const logger = require('../logger')

module.exports = async function (config) {
    const [client, loginErr] = await logger.of(Client.login(config), 'attempt login.')
    if (loginErr) return

    const [, downErr] = await logger.of(client.downloadLiveTheme(config.target), `download live theme to "${config.target}"`)
    await client.close()
    if (downErr) return

    logger.succeed('download complete!')
}
