import puppeteer from 'puppeteer';

const keywords = process.argv.slice(2);

const query = keywords.map(keyword => encodeURIComponent(keyword)).join('+');
const url = `https://www.baidu.com/s?ie=utf-8&f=8&rsv_bp=1&rsv_idx=1&tn=baidu&wd=${query}`;

const browser = await puppeteer.launch({
  args: ['--no-sandbox']
});
const page = await browser.newPage();
page.setUserAgent({
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36"
})

// Navigate the page to a URL.
await page.goto(url, { timeout: 60000, waitUntil: 'domcontentloaded' });
await page.setViewport({width: 1080, height: 1024});


const results = await page.$$('#content_left .result');

const parsedResults = [];
for (const item of results) {
  const titleEl = await item.$('.tts-b-hl');
  const titleLinkEl = await item.$('.sc-link')
  const descEl = await item.$('.cos-row');

  const title = await titleEl.evaluate(el => el.textContent);
  const href = await titleLinkEl.evaluate(el => el.href);
  const desc = descEl ? await descEl.evaluate(el => el.textContent) : '';

  parsedResults.push({ title, href, desc });
}

console.log(JSON.stringify(parsedResults, null, 2));

await browser.close();