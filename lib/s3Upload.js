const got = require('got')
const FormData = require('form-data')

module.exports = async function s3Upload (url, packer, params = {}) {
  const form = new FormData()
  const tmpZip = await packer.pack()

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
