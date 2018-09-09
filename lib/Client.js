const getBrowser = require('./getBrowser')
const url = require('url')
const download = require('download')
const path = require('path')
const s3Upload = require('./s3Upload')

module.exports = class Client {
  constructor (browser, domain) {
    this._browser = browser
    this._domain = domain
    this._host = url.parse(domain).host
  }

  static async login ({domain, email, password}, browser) {
    if (!browser) browser = await getBrowser()

    const client = new this(browser, domain)

    if (!await client._attemptLogin(email, password)) {
      throw new Error('Login failed.')
    }

    return client
  }

  async _attemptLogin (email, password) {
    const page = await this._browser.newPage()

    // move login page
    await page.goto(this._url('/hc/signin'))
    if (await this._isLoggedIn(page)) return true

    const iframe = await (await page.$('iframe')).contentFrame()
    await iframe.waitFor('#login-form')

    // attempt login
    await iframe.type('#user_email', email)
    await iframe.type('#user_password', password)

    const p = new Promise(resolve => page.once('framenavigated', resolve))
    await iframe.$eval('form#login-form', form => form.submit())
    await p

    const result = await this._isLoggedIn(page)
    page.close()

    return result
  }

  async _isLoggedIn (page) {
    const cookies = await page.cookies()
    return cookies.some(cookie => cookie.name === '_zendesk_session')
  }

  _url (path) {
    return url.resolve(this._domain, path)
  }

  getThemeInfos () {
    return this._usingThemePage(async evaluate => {
      const themeInfos = await evaluate(() => workbench()) /* global workbench */
      return themeInfos
    })
  }

  downloadTheme (themeId, dest = path.join(process.cwd(), this._host)) {
    return this._usingThemePage(async evaluate => {
      const downloadUrl = await evaluate(themeId => exportTheme(themeId), themeId) /* global exportTheme */
      await download(downloadUrl, dest, { extract: true })
    })
  }

  async downloadLiveTheme (dest) {
    await this.downloadTheme(await this.getLiveThemeId(), dest)
  }

  async getLiveThemeId () {
    const theme = (await this.getThemeInfos()).find(info => info.live === true)
    if (!theme) throw new Error(`Not found live theme!`)
    return theme.id
  }

  async _usingThemePage (fn) {
    const page = await this._browser.newPage()
    await page.goto(this._url('/theming/workbench'))
    await page.waitFor('a[href^="/theming/theme"]')
    await page.addScriptTag({path: path.resolve(__dirname, 'zendesk-helpers.js')})

    const result = await fn(page.evaluate.bind(page), page)
    page.close()

    return result
  }

  uploadTheme (srcDir) {
    return this._usingThemePage(async evaluate => {
      const job = await evaluate(() => createImportThemeJob()) /* global createImportThemeJob */

      const trackingUrl = await s3Upload(job.uploadUrl, srcDir, job.uploadParams)
      await this._checkout(trackingUrl)

      await evaluate(jobId => waitJob(jobId), job.id) /* global waitJob */
      return job.themeId
    })
  }

  async _checkout (url) {
    const page = await this._browser.newPage()
    await page.goto(url)
    page.close()
  }

  deleteTheme (themeId) {
    return this._usingThemePage(evaluate => {
      return evaluate(themeId => archiveTheme(themeId), themeId) /* global archiveTheme */
    })
  }

  async updateLiveTheme (srcDir, opts) {
    opts = {deleteOld: true, ...opts}
    const newThemeId = await this.uploadTheme(srcDir)

    if (opts.deleteOld) {
      const oldThemeId = await this.getLiveThemeId()
      await this.setLiveTheme(newThemeId)
      await this.deleteTheme(oldThemeId)
    } else {
      await this.setLiveTheme(newThemeId)
    }

    return newThemeId
  }

  setLiveTheme (themeId) {
    return this._usingThemePage(evaluate => {
      return evaluate(themeId => publishTheme(themeId), themeId) /* global publishTheme */
    })
  }
}