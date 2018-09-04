import Browser from '../src/Browser'
import test from 'ava'
import env from './env.json'

test('login', async t => {
  t.plan(2)

  // login error
  await Browser.login({
    domain: env.domain,
    email: 'test',
    password: 'wrong'
  }).then(() => t.fail())
    .catch(() => t.pass())

  const browser = await Browser.login({
    domain: env.domain,
    email: env.email,
    password: env.password
  })

  t.true(browser instanceof Browser)
})
