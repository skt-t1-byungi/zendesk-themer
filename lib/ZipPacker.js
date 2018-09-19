const archiver = require('archiver')
const tempWrite = require('temp-write')
const fs = require('fs-extra')
const { join } = require('path')
const globby = require('globby')
const { relative } = require('path')

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
            await this._globToArchive([this._themeDir, '!' + join(this._themeDir, '/settings/**/*')], this._themeDir)
            await this._globToArchive(join(this._baseDir, '/settings/**/*'), this._baseDir)
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
}
