const url = process.argv[2];
import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({
  args: ['--no-sandbox']
});
const page = await browser.newPage();
page.setUserAgent({
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36"
})

// Navigate the page to a URL.
await page.goto(url);
await page.setViewport({width: 1080, height: 1024});

const selector = await page.locator('body').waitHandle()
console.log(await selector.evaluate(el => el.innerText));

await browser.close();