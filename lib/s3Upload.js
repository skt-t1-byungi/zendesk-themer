const got = require('got')
const FormData = require('form-data')
const archiver = require('archiver')
const tempWrite = require('temp-write')
const fs = require('fs-extra')

module.exports = async function s3Upload (url, srcDir, params = {}) {
  const tmpZip = await createTmpZip(srcDir)

  const form = new FormData()
  Object.keys(params).forEach(k => form.append(k, params[k]))
  form.append('file', tmpZip.stream, {
    filename: 'theme.zip',
    knownLength: tmpZip.size
  })

  const trackingUrl = await got.post(url, {body: form, followRedirect: false})
    .then(response => response.headers.location)
  await tmpZip.remove()

  return trackingUrl
}

async function createTmpZip (dir) {
  const zipStream = archiver('zip')
  zipStream.directory(dir, false).finalize()

  const path = await tempWrite(zipStream)

  return {
    stream: fs.createReadStream(path),
    remove: () => fs.unlink(path),
    size: (await fs.stat(path)).size
  }
}
