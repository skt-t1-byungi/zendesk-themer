const archiver = require('archiver')
const uniqueFilename = require('unique-filename')
const fs = require('fs-extra')
const globby = require('globby')
const { join, resolve, relative } = require('path')
const writeJson = require('write-json-file')
const loadJson = require('load-json-file')
const mergeri = require('mergeri')

module.exports = class ZipPacker {
    constructor () {
        this._baseDir = null
        this._themeDir = null
        this._archive = archiver('zip')
    }

    static resolve (packerOrDir) {
        if (packerOrDir instanceof this) return packerOrDir

        const packer = new this()
        packer.baseDir(packerOrDir)

        return packer
    }

    baseDir (baseDir) {
        this._baseDir = baseDir
    }

    themeDir (themeDir) {
        this._themeDir = themeDir
    }

    async _globToArchive (patterns, baseDir) {
        const paths = await globby(['!themer.json'].concat(patterns))
        paths.forEach(path => {
            this._archive.file(path, { name: relative(baseDir, path) })
        })
    }

    async pack () {
        if (this._themeDir) {
            await this._updateManifest()

            const globTheme = [
                this._themeDir,
                '!' + join(this._themeDir, '/settings/**/*'),
                '!' + join(this._themeDir, 'manifest.json')
            ]
            const globBase = [
                join(this._baseDir, '/settings/**/*'),
                join(this._baseDir, 'manifest.json')
            ]

            await this._globToArchive(globTheme, this._themeDir)
            await this._globToArchive(globBase, this._baseDir)
        } else {
            await this._globToArchive(this._baseDir, this._baseDir)
        }

        const zipPath = await this._createZip()

        return {
            stream: fs.createReadStream(zipPath),
            remove: () => fs.unlink(zipPath),
            size: (await fs.stat(zipPath)).size
        }
    }

    async _updateManifest () {
        const manifest = await loadJson(resolve(this._themeDir, 'manifest.json'))
        const toPath = resolve(this._baseDir, 'manifest.json')

        const toJson = await loadJson(toPath)
            .then(({ settings }) => extendManifest(manifest, settings))
            .catch(() => manifest)

        await writeJson(toPath, toJson)
    }

    async _createZip () {
        this._archive.finalize()

        const zipPath = uniqueFilename(this._baseDir, 'zendesk-themer')
        await new Promise(resolve => {
            this._archive.pipe(fs.createWriteStream(zipPath)).on('finish', resolve)
        })

        return zipPath
    }
}

function extendManifest (manifest, settings) {
    const matcher = {
        'settings': 'label',
        'settings.*.variables': 'identifier',
        'settings.*.variables.*.options': (k1, k2) => k1 === k2
    }

    return mergeri(matcher, {}, manifest, { settings })
}
