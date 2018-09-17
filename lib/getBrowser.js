const puppeteer = require('puppeteer')

let browser
let pBrowser
let calls = 0

module.exports = async function getBrowser (opts) {
  if (!pBrowser) pBrowser = puppeteer.launch(opts)
  if (!browser) browser = await pBrowser

  calls++
  const close = browser.close

  browser.close = (...params) => {
    if (--calls === 0) return close.apply(browser)
  }

  return browser
}
