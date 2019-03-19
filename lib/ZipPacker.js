const archiver = require('archiver')
const uniqueFilename = require('unique-filename')
const fs = require('fs-extra')
const globby = require('globby')
const { join, resolve, relative } = require('path')
const writeJson = require('write-json-file')
const loadJson = require('load-json-file')
const mergeri = require('mergeri')

module.exports = class ZipPacker {
    constructor (basePath, themePath) {
        this._basePath = basePath
        this._themePath = themePath
        this._archive = archiver('zip')
    }

    async _globToArchive (patterns, baseDir) {
        if (!patterns.includes('*')) patterns += '/**/*'
        const paths = await globby(['!themer.json'].concat(patterns))
        paths.forEach(path => {
            this._archive.file(path, { name: relative(baseDir, path) })
        })
    }

    async pack () {
        if (this._themePath) {
            await this._extendManifestUsingTheme()

            const globTheme = [
                this._themePath,
                '!' + join(this._themePath, '/settings/**/*'),
                '!' + join(this._themePath, 'manifest.json')
            ]
            const globBase = [
                join(this._basePath, '/settings/**/*'),
                join(this._basePath, 'manifest.json')
            ]

            await this._globToArchive(globTheme, this._themePath)
            await this._globToArchive(globBase, this._basePath)
        } else {
            await this._globToArchive(this._basePath, this._basePath)
        }

        const zipPath = await this._createZip()

        return {
            stream: fs.createReadStream(zipPath),
            remove: () => fs.unlink(zipPath),
            size: (await fs.stat(zipPath)).size
        }
    }

    async _extendManifestUsingTheme () {
        const themeManifest = await loadJson(resolve(this._themePath, 'manifest.json'))
        const currManifestPath = resolve(this._basePath, 'manifest.json')

        const newManifest = await loadJson(currManifestPath)
            .then((manifest) => extendManifest(themeManifest, manifest))
            .catch(() => themeManifest)

        await writeJson(currManifestPath, newManifest)
    }

    async _createZip () {
        this._archive.finalize()

        const zipPath = uniqueFilename(this._basePath, 'zendesk-themer')
        await new Promise(resolve => {
            this._archive.pipe(fs.createWriteStream(zipPath)).on('finish', resolve)
        })

        return zipPath
    }
}

function extendManifest (manifest, { settings }) {
    const matcher = {
        'settings': 'label',
        'settings.*.variables': 'identifier',
        'settings.*.variables.*.options': ['label', 'value']
    }

    return mergeri(matcher, {}, manifest, { settings })
}
