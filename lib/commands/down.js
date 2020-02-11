const Client = require('../Client')
const logger = require('../logger')
const globby = require('globby')
const isFileEqual = require('is-file-equal').default
const path = require('path')
const normalizePath = require('normalize-path')
const fs = require('fs').promises
const pathSort = require('cross-path-sort')

module.exports = async function (cfg) {
    const [client, loginErr] = await logger.of(Client.login(cfg), 'attempt login.')
    if (loginErr) return

    const [, downErr] = await logger.of(client.downloadLiveTheme(cfg.target), `download live theme to "${cfg.target}"`)
    await client.close()

    if (downErr) {
        logger.fail(downErr.message || downErr)
        return
    }

    if (cfg.theme_path) {
        const [targetPaths, themePaths] = await Promise.all([cfg.target, cfg.theme_path]
            .map(async dir => {
                const pattern = [
                    normalizePath(path.join(dir, '**/*')),
                    '!manifest.json',
                    '!themer.json'
                ]
                const paths = (await globby(pattern, { onlyFiles: true })).map(p => p.slice(dir.length))
                return pathSort.sort(paths, { deepFirst: true })
            }))

        for (const targetPath of targetPaths) {
            if (!themePaths.includes(targetPath)) continue

            const targetAbsPath = path.join(cfg.target, targetPath)
            if (!await isFileEqual(targetAbsPath, path.join(cfg.theme_path, targetPath))) continue

            await fs.unlink(targetAbsPath)
            const dir = path.dirname(targetAbsPath)
            if ((await fs.readdir(dir)).length === 0) await fs.rmdir(dir)
        }
    }

    logger.succeed('download complete!')
}
