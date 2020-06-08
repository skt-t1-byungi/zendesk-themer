const archiver = require('archiver')
const uniqueFilename = require('unique-filename')
const fs = require('fs-extra')
const globby = require('globby')
const { join, resolve, relative } = require('path')
const writeJson = require('write-json-file')
const loadJson = require('load-json-file')
const mergeri = require('mergeri')
const normalizePath = require('normalize-path')

module.exports = class ZipPacker {
    constructor (targetPath, themePath) {
        this._targetPath = targetPath
        this._themePath = themePath
        this._archiver = archiver('zip')
    }

    async _archive (patterns, baseDir) {
        (await globby([].concat(patterns).map(pattern => normalizePath(pattern)))).forEach(path => {
            this._archiver.file(path, { name: relative(baseDir, path) })
        })
    }

    async pack () {
        if (this._themePath) {
            await this._mergeManifest()

            const themeFiles = [
                join(this._themePath, '**/*'),
                '!' + join(this._themePath, 'manifest.json'),
                '!themer.json'
            ]
            const targetFiles = [
                join(this._targetPath, 'settings/**/*'),
                join(this._targetPath, 'manifest.json'),
                '!themer.json'
            ]

            await this._archive(themeFiles, this._themePath)
            await this._archive(targetFiles, this._targetPath)
        } else {
            await this._archive(join(this._targetPath, '**/*'), this._targetPath)
        }

        const zipPath = await this._createZip()

        return {
            stream: fs.createReadStream(zipPath),
            remove: () => fs.unlink(zipPath),
            size: (await fs.stat(zipPath)).size
        }
    }

    async _mergeManifest () {
        const themeManifest = await loadJson(resolve(this._themePath, 'manifest.json'))
        const targetPath = resolve(this._targetPath, 'manifest.json')

        let mergedManifest
        try {
            const targetManifest = await loadJson(targetPath)
            mergedManifest = mergeri({
                settings: 'label',
                'settings.*.variables': 'identifier',
                'settings.*.variables.*.options': ['label', 'value']
            }, themeManifest, { settings: targetManifest.settings })
        } catch (error) {
            mergedManifest = themeManifest
        }

        await writeJson(targetPath, mergedManifest)
    }

    async _createZip () {
        this._archiver.finalize()

        const zipPath = uniqueFilename(this._targetPath, 'zendesk-themer')
        await new Promise(resolve => {
            this._archiver.pipe(fs.createWriteStream(zipPath)).on('finish', resolve)
        })

        return zipPath
    }
}
