const Client = require('../lib/Client')
const test = require('ava')
const env = require('./env.json')
const { resolve } = require('path')
const fs = require('fs')
const del = require('del')
const getBrowser = require('../lib/getBrowser')

const login = async (info = env, opts) => Client.login(info, await getBrowser(opts))

// must first run for failed login.
test.serial('login by wrong email, password', async t => {
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

test('download', async t => {
  const client = await login()

  const saveDir = resolve(__dirname, '_tmp')
  await client.downloadCurrentTheme(saveDir)

  t.true(fs.existsSync(saveDir))
  await del(saveDir) // clear
})

test('upload theme', async t => {
  const client = await login()
  await client.uploadTheme(resolve(__dirname, 'fixtures'))
  t.pass()
})
