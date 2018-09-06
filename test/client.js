import Client from '../src/Client'
import test from 'ava'
import env from './env.json'
import { resolve } from 'path'
import fs from 'fs'
import del from 'del'

const login = (info = env, opts) => Client.login(info, opts)

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
  await client.downloadTheme(saveDir)

  t.true(fs.existsSync(saveDir))
  await del(saveDir) // clear
})
