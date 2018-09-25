const prompts = require('prompts')
const themer = require('..')
const logger = require('../logger')
const { resolve } = require('path')

module.exports = async opts => {
    const [client, loginErr] = await logger.of(themer(opts), 'attempt login.')
    if (loginErr) return [null, loginErr]

    const downDir = opts.target || resolve(
        process.cwd(),
        await prompts({
            type: 'text',
            message: 'Please specify folder to save.',
            name: 'val',
            initial: client.getDefaultThemePath()
        })
            .then(p => p.val)
    )

    const [, downErr] = await logger.of(
        client.downloadLiveTheme(downDir),
        `download live theme to "${downDir}"`
    )

    if (downErr) {
        console.log(downErr.message || downErr)
    } else {
        logger.succeed('download complete!')
    }

    await client.close()

    return [downDir, downErr]
}
