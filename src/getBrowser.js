import puppeteer from 'puppeteer'

let browser
let pBrowser

export default async function (opts) {
  if (!pBrowser) pBrowser = puppeteer.launch(opts)
  if (!browser) browser = await pBrowser
  return browser
}
