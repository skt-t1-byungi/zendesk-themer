const puppeteer = require('puppeteer')

let browser
let pBrowser
let calls = 0

module.exports = async function getBrowser (opts) {
  calls++

  if (!pBrowser) pBrowser = puppeteer.launch(opts)
  if (!browser) {
    browser = await pBrowser

    const close = browser.close
    browser.close = () => {
      if (--calls === 0) {
        try {
          return close.apply(browser)
        } finally {
          browser = pBrowser = undefined
        }
      }
    }
  }

  return browser
}
