import got from 'got'
import FormData from 'form-data'
import archiver from 'archiver'
import tempWrite from 'temp-write'
import fs from 'fs'
import {promisify} from 'util'

const stat = promisify(fs.stat)
const unlink = promisify(fs.unlink)

export default async function s3Upload (url, srcDir, params = {}) {
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
    remove: () => unlink(path),
    size: (await stat(path)).size
  }
}
