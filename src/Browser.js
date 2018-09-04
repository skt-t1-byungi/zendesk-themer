import puppeteer from 'puppeteer'
import url from 'url'

export default class Client {
  constructor (browser, domain) {
    this._browser = browser
    this._domain = domain
  }

  static async login ({domain, email, password, ...opts}) {
    const browser = new this(await puppeteer.launch(opts), domain)
    await browser._login(email, password)
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
    await (await iframe.$('[type="submit"]')).click()

    await page.waitForNavigation()

    // return !res.url().includes('/login')
  }

  _url (path) {
    return url.resolve(this._domain, path)
  }
}
