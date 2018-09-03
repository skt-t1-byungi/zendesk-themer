import puppeteer from 'puppeteer'
import {resolve} from 'url'

export default class Client {
  constructor (browser, domain) {
    this._browser = browser
    this._domain = domain
    this._page = null
  }

  static async create (domain, opts) {
    const browser = await puppeteer.launch(opts)
    return new this(browser, domain)
  }

  async attemptLogin ({id, password}) {
    /** @type {puppeteer.Page} */
    const page = this._page = await this._browser.newPage()

    // move login page
    await page.goto(this._url('/hc/signin'))
    const iframe = await (await page.$('iframe')).contentFrame()
    await iframe.waitFor('#login-form')

    // attempt login
    await iframe.type('#user_email', this._id)
    await iframe.type('#user_password', this._password)
    await (await iframe.$('[type="submit"]')).click()

    const res = await page.waitForNavigation()
    return !res.url().includes('/login')
  }

  _url (path) {
    return resolve(this._domain, path)
  }
}
