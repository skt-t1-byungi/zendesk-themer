const archiver = require('archiver')
const tempWrite = require('temp-write')
const fs = require('fs-extra')
const globby = require('globby')
const { join, resolve, relative } = require('path')
const writeJson = require('write-json-file')
const loadJson = require('load-json-file')

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

        this._archive.finalize()
        const path = await tempWrite(this._archive)

        return {
            stream: fs.createReadStream(path),
            remove: () => fs.unlink(path),
            size: (await fs.stat(path)).size
        }
    }

    async _updateManifest () {
        const fromJson = await loadJson(resolve(this._themeDir, 'manifest.json'))

        const toPath = resolve(this._baseDir, 'manifest.json')
        const toJson = await loadJson(toPath)
            .then(({ settings }) => extendManifest(fromJson, settings))
            .catch(() => fromJson)

        await writeJson(toPath, toJson)
    }
}

function extendManifest (manifest, settings) {
    return Object.assign({}, manifest, {
        settings: Object.assign({}, manifest.settings, settings)
    })
}
