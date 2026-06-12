// .html静态化端到端验证: 直接访问.html入口、站内导航、旧hash链接兼容
// 运行: npx tsx src/test/HtmlEntryE2E.test.ts [baseUrl]
import puppeteer from 'puppeteer'

const base = process.argv[2] || 'http://localhost:4391'

async function main() {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  // SPA渲染是异步的 等待条件满足而非网络空闲(dev下HMR长连接导致networkidle永不触发)
  const waitFor = (fn: string) => page.waitForFunction(fn, { timeout: 20000 }).catch(() => null)

  // 1. 直接访问.html入口 URL应保持不变 且渲染出对应文档
  await page.goto(base + encodeURI('/运维/Docker.html'), { waitUntil: 'domcontentloaded' })
  // SPA渲染的标题深度+1(# -> h2) 用渲染后的首个标题断言
  await waitFor("document.querySelector('.markdown-section h2')")
  const url1 = decodeURI(page.url())
  const h1 = await page.evaluate(() => document.querySelector('.markdown-section h2')?.textContent || '')
  const title1 = await page.title()
  console.log('[1] 直接访问 /运维/Docker.html')
  console.log('    url =', url1, url1.endsWith('/运维/Docker.html') ? 'PASS' : 'FAIL')
  console.log('    渲染标题 =', JSON.stringify(h1), h1.includes('Docker') ? 'PASS' : 'FAIL')
  console.log('    document.title =', JSON.stringify(title1), title1.includes('Docker') ? 'PASS' : 'FAIL')

  // 2. 点击正文内文档链接 应SPA路由跳转到目标.html
  const linkInfo = await page.evaluate(() => {
    const a = document.querySelector('.markdown-section a[origin-link]') as HTMLAnchorElement | null
    return a ? { href: a.getAttribute('href'), text: a.textContent } : null
  })
  console.log('[2] 正文链接 =', JSON.stringify(linkInfo))
  if (linkInfo?.href) {
    await page.click('.markdown-section a[origin-link]')
    await waitFor(`decodeURI(location.pathname) == ${JSON.stringify(linkInfo.href.split('?')[0])}`)
    const url2 = decodeURI(page.url())
    console.log('    点击后 url =', url2, url2.includes('.html') ? 'PASS' : 'FAIL')
  }

  // 3. 旧hash链接兼容 /#/doc/xxx 应被改写为.html地址
  await page.goto(base + '/#/doc/' + encodeURI('运维-K8s'), { waitUntil: 'domcontentloaded' })
  await waitFor("location.pathname.endsWith('.html')")
  const url3 = decodeURI(page.url())
  console.log('[3] 旧hash链接 /#/doc/运维-K8s')
  console.log('    url =', url3, url3.endsWith('/运维/K8s.html') ? 'PASS' : 'FAIL')

  // 4. 旧/doc/:doc地址 应重定向到.html
  await page.goto(base + encodeURI('/doc/运维-Docker'), { waitUntil: 'domcontentloaded' })
  await waitFor("location.pathname.endsWith('.html')")
  const url4 = decodeURI(page.url())
  console.log('[4] 旧路径 /doc/运维-Docker')
  console.log('    url =', url4, url4.endsWith('/运维/Docker.html') ? 'PASS' : 'FAIL')

  // 5. 侧边栏菜单点击 应跳转到.html地址
  const menuItem = await page.$('.el-menu .el-menu-item')
  if (menuItem) {
    await menuItem.click()
    await new Promise(r => setTimeout(r, 1500))
    const url5 = decodeURI(page.url())
    console.log('[5] 菜单点击后 url =', url5, url5.includes('.html') ? 'PASS' : 'FAIL')
  } else {
    console.log('[5] 未找到菜单项 SKIP')
  }

  // 6. 根路径 / 应重定向到上次阅读文档的.html
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' })
  await waitFor("location.pathname.endsWith('.html')")
  const url6 = decodeURI(page.url())
  console.log('[6] 根路径 / => url =', url6, url6.endsWith('.html') ? 'PASS' : 'FAIL')

  // 7. 应用页面.html入口: /home.html直接进入 /home与/tag?tag=重定向且保留query
  await page.goto(base + '/home.html', { waitUntil: 'domcontentloaded' })
  await waitFor("document.title.includes('首页')")
  console.log('[7] /home.html => url =', page.url(), 'title =', await page.title(),
    page.url().endsWith('/home.html') && (await page.title()).includes('首页') ? 'PASS' : 'FAIL')
  await page.goto(base + '/home', { waitUntil: 'domcontentloaded' })
  await waitFor("location.pathname.endsWith('/home.html')")
  console.log('    /home => url =', page.url(), page.url().endsWith('/home.html') ? 'PASS' : 'FAIL')
  await page.goto(base + '/tag?tag=Java', { waitUntil: 'domcontentloaded' })
  await waitFor("location.pathname.endsWith('/tag.html')")
  const url7 = page.url()
  console.log('    /tag?tag=Java => url =', url7, url7.endsWith('/tag.html?tag=Java') ? 'PASS' : 'FAIL')

  // 8. service worker接管后 .html导航仍应拿到真实静态文件而非app shell
  //    (真实文件含隐藏的静态正文div.content app shell没有; dev下无SW则跳过)
  await page.goto(base + encodeURI('/运维/Docker.html'), { waitUntil: 'domcontentloaded' })
  const swReady = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false
    const reg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>(r => setTimeout(() => r(null), 8000)),
    ])
    return !!reg
  })
  if (swReady) {
    await waitFor('navigator.serviceWorker.controller')
    await page.goto(base + encodeURI('/运维/Docker.html'), { waitUntil: 'domcontentloaded' })
    const hasStatic = await page.evaluate(() => !!document.querySelector("body > div.content"))
    const controlled = await page.evaluate(() => !!navigator.serviceWorker.controller)
    console.log('[8] SW接管后导航 .html: controller =', controlled, '收到真实静态文件 =', hasStatic, hasStatic ? 'PASS' : 'FAIL')
  } else {
    console.log('[8] 无service worker(dev) SKIP')
  }

  // 9. 无后缀文档路径 应自动补回.html并渲染文档(CDN对.html做308去后缀的场景)
  await page.goto(base + encodeURI('/运维/Docker'), { waitUntil: 'domcontentloaded' })
  await waitFor("location.pathname.endsWith('.html')")
  const url9 = decodeURI(page.url())
  console.log('[9] 无后缀路径 /运维/Docker')
  console.log('    url =', url9, url9.endsWith('/运维/Docker.html') ? 'PASS' : 'FAIL')

  // 10. Latin-1双重编码乱码路径自愈: CDN 308的Location头未按RFC-3986编码中文路径
  //     浏览器将原始UTF-8字节按Latin-1误读后重编码 形如/%C3%A8%C2%BF...且丢失.html
  const mojibakePath = encodeURI(Buffer.from('/运维/Docker', 'utf8').toString('latin1'))
  await page.goto(base + mojibakePath, { waitUntil: 'domcontentloaded' })
  await waitFor("decodeURI(location.pathname).endsWith('/Docker.html')")
  const url10 = decodeURI(page.url())
  console.log('[10] 乱码路径 ' + mojibakePath)
  console.log('    url =', url10, url10.endsWith('/运维/Docker.html') ? 'PASS' : 'FAIL')

  // 11. 真正不存在的路径 自愈不应误伤 仍展示404页
  await page.goto(base + '/this-doc-does-not-exist', { waitUntil: 'domcontentloaded' })
  await waitFor("document.querySelector('.not-found')")
  const has404 = await page.evaluate(() => !!document.querySelector('.not-found'))
  console.log('[11] 不存在路径 /this-doc-does-not-exist 展示404 =', has404, has404 ? 'PASS' : 'FAIL')

  await browser.close()
}

main().catch(e => { console.error(e); process.exit(1) })
