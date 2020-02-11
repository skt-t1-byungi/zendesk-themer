const Client = require('../Client')
const logger = require('../logger')
const globby = require('globby')
const isFileEqual = require('is-file-equal')
const path = require('path')
const normalizePath = require('normalize-path')
const fs = require('fs').promises

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
        const [targetFiles, themeFiles] = await Promise.all([recurReadDir(cfg.target), recurReadDir(cfg.theme_path)])
            .then(values => values.map(paths => paths.map(p => p.slice(p.indexOf('/')))))

        await Promise.all(targetFiles
            .filter(targetFile => themeFiles.includes(targetFile))
            .map(async p => {
                const targetAbsPath = path.join(cfg.target, p)
                if (await isFileEqual(targetAbsPath, path.join(cfg.theme_path, p))) {
                    await fs.unlink(targetAbsPath)
                }
            })
        )
    }

    logger.succeed('download complete!')
}

function recurReadDir (dir) {
    return globby(normalizePath(path.join(dir, '**/*')))
}
