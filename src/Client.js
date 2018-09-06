import puppeteer from 'puppeteer'
import url from 'url'
import download from 'download'
import path from 'path'

/** @type {puppeteer.Browser} */
let browser
let pBrowser

export default class Client {
  constructor (domain) {
    if (!browser) throw new Error('Invalid call.')
    this._domain = domain
    this._host = url.parse(domain).host
  }

  static async login ({domain, email, password}, opts) {
    if (!pBrowser) pBrowser = puppeteer.launch(opts)
    if (!browser) browser = await pBrowser

    const client = new this(domain)

    if (!await client._login(email, password)) {
      throw new Error('Login failed.')
    }

    return client
  }

  async _login (email, password) {
    const page = await browser.newPage()

    // move login page
    await page.goto(this._url('/hc/signin'))
    if (await this._isLogin(page)) return true

    const iframe = await (await page.$('iframe')).contentFrame()
    await iframe.waitFor('#login-form')

    // attempt login
    await iframe.type('#user_email', email)
    await iframe.type('#user_password', password)

    const p = new Promise(resolve => page.once('framenavigated', resolve))
    await iframe.$eval('form#login-form', form => form.submit())
    await p

    try {
      return this._isLogin(page)
    } finally {
      page.close()
    }
  }

  async _isLogin (page) {
    const cookies = await page.cookies()
    return cookies.some(cookie => cookie.name === '_zendesk_session')
  }

  _url (path) {
    return url.resolve(this._domain, path)
  }

  async downloadTheme (dest = path.join(process.cwd(), this._host)) {
    const page = await browser.newPage()
    await page.goto(this._url('/theming/workbench'))
    await page.waitFor('a[href^="/theming/theme"]')

    // inject helper
    const pAddScript = page.addScriptTag({content: graphQl.toString()})

    const [, themeId] = (await page.$eval('a[href^="/theming/theme"]', el => el.href)).match(/\/([^/]*?)$/)
    await pAddScript

    const downloadUrl = await page.evaluate(themeId => (
      graphQl(`
      mutation($input: CreateExportThemeJobInputType!) {
        createExportThemeJob(input: $input) {
          job_id,
          download_url
        }
      }`, { input: {theme_id: themeId} })
        .then(res => res.data.createExportThemeJob.download_url)
    ), themeId)

    page.close()
    await download(downloadUrl, dest, {extract: true})
  }
}

async function graphQl (query, variables = null) {
  const headers = new Headers()
  headers.append('X-CSRF-Token', window.THEMING.CSRFToken)

  const body = new FormData()
  body.append('graphql', JSON.stringify({ query, variables }))

  const res = await fetch('/theming/graphql', {
    method: 'post',
    credentials: 'same-origin',
    body,
    headers
  })

  return res.json()
}
