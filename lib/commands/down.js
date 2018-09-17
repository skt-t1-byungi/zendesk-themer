const prompts = require('prompts')
const normalizeUrl = require('normalize-url')
const loadJson = require('load-json-file')
const Client = require('../Client')
const logger = require('../logger')
const {resolve} = require('path')

module.exports = async function ({config}) {
  const opts = await (config ? loadJson(config) : prompts([
    {
      type: 'text',
      name: 'domain',
      message: 'Enter zendesk hc domain.',
      format: url => normalizeUrl(url)
    },
    {
      type: 'text',
      name: 'email',
      message: 'Enter zendesk email for login.'
    },
    {
      type: 'password',
      name: 'password',
      message: 'Enter zendesk password for login.'
    }
  ], {
    onCancel: process.exit
  }))

  const [client, err] = await logger.of(Client.login(opts), 'attempt login.')
  if (err) return

  const downDir = resolve(
    process.cwd(),
    opts.theme_path || await prompts({
      type: 'text',
      name: 'downDir',
      message: 'Please specify folder to save.',
      initial: opts.domain
    }).downDir
  )

  await logger.of(client.downloadLiveTheme(downDir), `download live theme to "${downDir}".`)
  await client.close()
}
