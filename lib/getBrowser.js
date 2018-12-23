const puppeteer = require('puppeteer-core')
const findChrome = require('chrome-finder')

let pBrowser
let calls = 0

module.exports = async function getBrowser (opts) {
    calls++
    if (!pBrowser) pBrowser = puppeteer.launch({ ...opts, executablePath: findChrome() })

    const browser = await pBrowser
    const close = browser.close.bind(browser)

    browser.close = () => {
        if (--calls === 0) {
            try {
                return close()
            } finally {
                pBrowser = null
            }
        }
    }

    return browser
}
