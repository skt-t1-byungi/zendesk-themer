const puppeteer = require('puppeteer-core')
const findChrome = require('chrome-finder')

let pBrowser
let calls = 0

module.exports = function getBrowser (opts) {
    calls++
    if (!pBrowser) {
        pBrowser = puppeteer.launch({ ...opts, executablePath: findChrome() })
            .then(browser => {
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
            })
    }
    return pBrowser
}
