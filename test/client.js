const Client = require('../lib/Client')
const test = require('ava')
const env = require('./env.json')
const { resolve } = require('path')
const fs = require('fs')
const del = require('del')

const testTheme = resolve(__dirname, 'fixtures/theme')
const login = (info = env) => Client.login(info)

// must first run for failed login.
test('login by wrong email, password', async t => {
  await login({
    domain: env.domain,
    email: 'test',
    password: 'wrong'
  }).then(() => t.fail())
    .catch(() => t.pass())
})

test('success login', async t => {
  const client = await login()

  t.true(client instanceof Client)
})

test('repeat login on same site', async t => {
  await login()
  await login()

  t.pass()
})

test('getThemeInfos', async t => {
  const client = await login()
  const infos = await client.getThemeInfos()

  t.log(infos)

  t.true(Array.isArray(infos))
})

test('downloadLiveTheme', async t => {
  const client = await login()

  const saveDir = resolve(__dirname, '_tmp')
  await client.downloadLiveTheme(saveDir)

  t.true(fs.existsSync(saveDir))
  await del(saveDir) // clear
})

test('uploadTheme, deleteTheme', async t => {
  const client = await login()
  const themeId = await client.uploadTheme(testTheme)
  const isExists = async () => (await client.getThemeInfos()).some(theme => theme.id === themeId)

  t.true(await isExists())
  await client.deleteTheme(themeId)
  t.false(await isExists())
})

test('updateLiveTheme', async t => {
  const client = await login()
  const oldId = await client.getLiveThemeId()
  const newId = await client.updateLiveTheme(testTheme, {deleteOld: false})
  t.is(newId, await client.getLiveThemeId())

  // clear
  await client.setLiveTheme(oldId)
  await client.deleteTheme(newId)
})
