const prompts = require('prompts')
const Client = require('../Client')
const logger = require('../logger')
const {resolve} = require('path')

module.exports = async opts => {
  const [client, loginErr] = await logger.of(Client.login(opts), 'attempt login.')
  if (loginErr) return {err: loginErr}

  const downDir = opts.target || resolve(
    process.cwd(),
    await prompts({
      type: 'text',
      message: 'Please specify folder to save.',
      name: 'val',
      initial: client.getDefaultThemePath()
    }).then(p => p.val)
  )

  const pDown = client.downloadLiveTheme(downDir)
  const [, downErr] = await logger.of(pDown, `download live theme to "${downDir}"`)

  await client.close()
  if (!downErr) logger.succeed('download complete!')

  return {error: downErr, downDir}
}
