import puppeteer from 'puppeteer';

const keywords = process.argv.slice(2);

const query = keywords.map(keyword => encodeURIComponent(keyword)).join('+');
const url = `https://www.sogou.com/web?query=${query}`;

const browser = await puppeteer.launch({
  args: ['--no-sandbox']
});
const page = await browser.newPage();
await page.setUserAgent({
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36"
})

// Navigate the page to a URL.
await page.goto(url, { timeout: 60000, waitUntil: 'domcontentloaded' });
await page.setViewport({width: 1080, height: 1024});

const results = await page.$$('.vrwrap');

const parsedResults = [];
for (const item of results) {
  const titleEl = await item.$('h3');
  const titleLinkEl = await item.$('h3 a')
  const descEl = await item.$('.fz-mid');
  if (!titleEl || !titleLinkEl) {
    continue;
  }
  const title = await titleEl.evaluate(el => el.textContent);
  const href = await titleLinkEl.evaluate(el => el.href);
  const desc = descEl ? await descEl.evaluate(el => el.textContent) : '';

  parsedResults.push({ title, href, desc });
}

console.log(JSON.stringify(parsedResults, null, 2));

await browser.close();