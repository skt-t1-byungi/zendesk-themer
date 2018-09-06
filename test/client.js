import Client from '../src/Client'
import test from 'ava'
import env from './env.json'
import { resolve } from 'path'
import fs from 'fs-extra'

const login = (info = env, opts) => Client.login(info, opts)

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

test.only('download', async t => {
  const client = await login(env, {
    headless: false,
    slowMo: 50
  })

  const saveDir = resolve(__dirname, '_tmp')
  await client.downloadTheme(saveDir)

  t.true(await fs.pathExists(saveDir))
})

test.after(async t => {
  const saveDir = resolve(__dirname, '_tmp')
  if (await fs.pathExists(saveDir)) await fs.remove(saveDir)
})
