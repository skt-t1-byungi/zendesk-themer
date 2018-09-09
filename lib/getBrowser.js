const puppeteer = require('puppeteer')

let browser
let pBrowser

module.exports = async function getBrowser (opts) {
  if (!pBrowser) pBrowser = puppeteer.launch(opts)
  if (!browser) browser = await pBrowser
  return browser
}
