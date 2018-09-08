import got from 'got'
import FormData from 'form-data'
import archiver from 'archiver'
import tempWrite from 'temp-write'
import fs from 'fs'

export default async function s3Upload (url, dir, params = {}) {
  const tmpZip = await createTmpZip(dir)

  const form = new FormData()
  Object.keys(params).forEach(k => form.append(k, params[k]))

  form.append('file', tmpZip.stream, {
    filename: 'theme.zip',
    knownLength: tmpZip.size
  })

  await got.post(url, {body: form, followRedirect: false})

  await tmpZip.remove()
}

async function createTmpZip (dir) {
  const zipStream = archiver('zip')
  zipStream.directory(dir).finalize()

  const path = await tempWrite(zipStream)

  return {
    stream: fs.createReadStream(path),
    remove: () => fs.promises.unlink(path),
    size: (await fs.promises.stat(path)).size
  }
}
