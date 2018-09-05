import Client from '../src/Client'
import test from 'ava'
import env from './env.json'

test('login', async t => {
  t.plan(2)

  // error
  await Client.login({
    domain: env.domain,
    email: 'test',
    password: 'wrong'
  }).then(() => t.fail())
    .catch(() => t.pass())

  const client = await Client.login({
    domain: env.domain,
    email: env.email,
    password: env.password
  })

  t.true(client instanceof Client)
})

test.only('download', async t => {
  const client = await Client.login({
    domain: env.domain,
    email: env.email,
    password: env.password
  }, {
    // headless: false,
    // slowMo: 50,
    // devtool: true
  })

  await client.downloadTheme('./')
})
