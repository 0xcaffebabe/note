import process from 'process';
import puppeteer from 'puppeteer';

const url = process.argv[2];
if (!url) {
  console.error(JSON.stringify({ success: false, message: 'Usage: node tophub_fetch.js <url>', url: '', content: '' }));
  process.exit(1);
}

const args = ['--no-sandbox'];

if (process.env.http_proxy) {
  args.push(`--proxy-server=${process.env.http_proxy}`);
}

const fetchStartTime = Date.now();
const browser = await puppeteer.launch({ args });
const page = await browser.newPage();

page.setUserAgent(
  {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36'
  }
);

await page.setViewport({ width: 1080, height: 1024 });

await page.goto(url, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});

try {
  await page.waitForNetworkIdle({
    idleTime: 800,
    timeout: 1000,
  });
} catch (e) {
  // 某些页面不会真正 idle，忽略即可
}

const items = await page.evaluate(() => {
  const rows = document.querySelectorAll('table.table tr');
  const result = [];
  rows.forEach((row) => {
    const link = row.querySelector('a');
    if (!link) {
      return;
    }
    const title = link.textContent.trim();
    const url = link.href;

    const item = { title, url };

    result.push(item);
  });

  return result;
});

try {
  await browser.close();
} catch (e) {
  // 忽略
}

const fetchDuration = Date.now() - fetchStartTime;

console.log(JSON.stringify({
  success: true,
  message: 'success',
  url,
  items,
  fetchDuration,
}, null, 0));

process.exit(0);