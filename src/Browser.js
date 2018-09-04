import puppeteer from 'puppeteer'
import url from 'url'

export default class Client {
  constructor (browser, domain) {
    this._browser = browser
    this._domain = domain
  }

  static async login ({domain, email, password, ...opts}) {
    const browser = new this(await puppeteer.launch(opts), domain)

    if (!await browser._login(email, password)) {
      throw new Error('Login failed.')
    }

    return browser
  }

  async _login (email, password) {
    /** @type {puppeteer.Page} */
    const page = await this._browser.newPage()

    // move login page
    await page.goto(this._url('/hc/signin'))
    const iframe = await (await page.$('iframe')).contentFrame()
    await iframe.waitFor('#login-form')

    // attempt login
    await iframe.type('#user_email', email)
    await iframe.type('#user_password', password)

    const p = new Promise(resolve => page.once('framenavigated', resolve))
    await iframe.$eval('form#login-form', form => form.submit())
    await p

    const cookies = await page.cookies()
    await page.close() // clear

    return cookies.some(cookie => cookie.name === '_zendesk_session')
  }

  _url (path) {
    return url.resolve(this._domain, path)
  }
}
