const archiver = require('archiver')
const tempWrite = require('temp-write')
const fs = require('fs-extra')
const {join} = require('path')
const globby = require('globby')
const {relative} = require('path')

module.exports = class Packer {
  constructor () {
    this._baseDir = null
    this._themeDir = null
  }

  static resolve (packerOrDir) {
    if (packerOrDir instanceof Packer) return packerOrDir
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

  async pack () {
    const patterns = this._themeDir ? [
      join(this._baseDir, '/settings/**/*'),
      this._themeDir,
      '!' + join(this._themeDir, '/settings/**/*')
    ] : [
      this._baseDir
    ]

    patterns.push('!themer.json')
    const paths = await globby(patterns)

    const zipStream = archiver('zip')
    paths.forEach(path => {
      zipStream.file(path, {name: relative(this._baseDir, path)})
    })
    zipStream.finalize()

    const path = await tempWrite(zipStream)

    return {
      stream: fs.createReadStream(path),
      remove: () => fs.unlink(path),
      size: (await fs.stat(path)).size
    }
  }
}
