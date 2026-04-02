import process from 'process';
import { spawn } from 'child_process';
import puppeteer from 'puppeteer';

const url = process.argv[2];
if (!url) {
  console.error(JSON.stringify({ success: false, message: 'Usage: node script.js <url>', url: '', content: '' }));
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

// 建议加超时，避免某些站点一直卡住
await page.goto(url, {
  waitUntil: 'domcontentloaded',
  timeout: 30000,
});

try {
  await page.waitForNetworkIdle({
    idleTime: 800,
    timeout: 1000,
  });
} catch (e) {
  // 某些页面不会真正 idle，忽略即可
}

const text = await page.evaluate(() => document.body?.innerText || '');

try{
  await browser.close();
} catch (e) {
  // 忽略
}

const fetchDuration = Date.now() - fetchStartTime;
const claudeStartTime = Date.now();

if (true) {
  // console.log(JSON.stringify({ success: true, message: 'success', url, content: text, fetchDuration }));
  console.log(text);
  process.exit(0);
}

if (!text.trim()) {
  console.log(JSON.stringify({ success: false, message: 'page body is empty', url, content: '' }));
  process.exit(1);
}

// 任务说明只放“规则”，正文通过 stdin 喂给 claude
const prompt = `
请从我提供的网页文本中提取“正文内容”。

要求：
1. 删除页头、页脚、导航、版权声明、推荐阅读、广告、评论区、登录提示、面包屑、作者卡片、相关推荐等无关内容
2. 保留正文标题、小标题、段落、列表
3. 如果正文中夹杂少量无关内容，也请尽量清理
4. 输出纯正文，不要解释，不要加引号，不要加“以下是提取结果”
5. 如果内容明显不是文章，而是列表页/首页/搜索页，就尽量提取最核心的主体文本

下面是待提取文本：
`;

const claude = spawn(
  'claude',
  ['--bare', '-p', prompt],
  {
    stdio: ['pipe', 'pipe', 'pipe'],
  }
);

let stdout = '';
let stderr = '';

claude.stdout.on('data', (chunk) => {
  stdout += chunk.toString();
});

claude.stderr.on('data', (chunk) => {
  stderr += chunk.toString();
});

claude.on('close', (code) => {
  const claudeDuration = Date.now() - claudeStartTime;
  // Claude 有时 stderr 只是 warning，不一定代表失败
  if (code !== 0) {
    // 失败时回退输出原始文本
    console.log(JSON.stringify({ success: false, message: `claude exited with code ${code}`, url, content: text, fetchDuration, claudeDuration }));
    return;
  }

  if (stdout.trim()) {
    console.log(JSON.stringify({ success: true, message: 'success', url, content: stdout.trim(), fetchDuration, claudeDuration }));
  } else {
    console.log(JSON.stringify({ success: false, message: 'claude returned empty, falling back to original text', url, content: text, fetchDuration, claudeDuration }));
  }
});

// 关键：明确写入 stdin，再主动结束
claude.stdin.write(text);
claude.stdin.end();