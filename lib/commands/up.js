const prompts = require('prompts')
const Client = require('../Client')
const logger = require('../logger')
const {resolve} = require('path')

module.exports = async opts => {
  const [client, loginErr] = await logger.of(Client.login(opts), 'attempt login.')
  if (loginErr) return

  const upDir = resolve(
    process.cwd(),
    await (opts.theme_path || prompts({
      type: 'text',
      message: 'Please specify theme folder to upload.',
      name: 'theme_path',
      initial: client.getDefaultThemePath()
    }).then(prompt => prompt.theme_path))
  )

  const [, upErr] = await logger.of(
    client.updateLiveTheme(upDir, {deleteOld: opts.deleteOld}),
    `upload a live theme from "${upDir}"`
  )
  await client.close()
  if (!upErr) logger.succeed('upload complete!')
}
