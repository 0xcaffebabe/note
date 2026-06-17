import { test, expect, goto, pathnameOf, waitForPath, waitForHtmlChange, seedLastRead, docWithInternalLink, DOC, DOC_ID, DOC_NO_SUFFIX } from './fixtures'

// 旧移动端 /m 无后缀地址(CDN 308 去 .html 后 SPA 实际收到的形态)
const M_DOC_NO_SUFFIX = '/m' + DOC_NO_SUFFIX

// 本文件是「路由不变量(URL 落点)」的唯一 owner: 静态化/重定向/去前缀/自愈/404/续读 全部在此。
// 其它套件(responsive-desktop / responsive.mobile)只测「路由完成后各断点的布局/渲染」, 不再重复断言 URL 落点。
// 原 recovery.spec.ts(Latin-1 自愈)已并入下方 self-healing 段; 原 mobile.spec.ts 是 responsive.mobile 的子集已删。

// P0 关键路径冒烟: .html 静态化路由 + 自愈 + 404 + 桌面分流
// 全部确定性、无密钥、可在 fork PR 上跑 —— 这是真正卡合并的门禁
test.describe('routing (P0)', () => {
  test('直接访问 .html 入口渲染文档且 URL 不变', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.markdown-section h2')
    expect(pathnameOf(page)).toBe(DOC)
    // 不耦合具体文档内容: 只断言渲染出非空标题 且 document.title 是「文档名 - 站名」形态
    const h2 = ((await page.locator('.markdown-section h2').first().textContent()) ?? '').trim()
    expect(h2.length).toBeGreaterThan(0)
    const title = await page.title()
    expect(title).toContain('知识体系') // SysUtils.setDocTitle: `${docTitle} - 知识体系`
    expect(title.length).toBeGreaterThan('知识体系'.length + 2)
  })

  // 正文渲染出指向其他文档的 .html 内链(站内跳转的前提)
  // 注: SPA 路由跳转本身由 P0-5 侧边栏菜单覆盖;正文里被 DocRender 标 origin-link 的链接走 router.push
  // 未被识别为站内文档的 .html 链接按「真实静态入口」处理(可能新标签打开) 故此处只断言内链已渲染
  test('正文渲染出指向其他文档的 .html 内链', async ({ page }) => {
    // 不压在 DOC 上(叶子文档正文可能无内链或被抽进关联面板剥离): 挑一篇正文确有内链的文档, 都没有才跳过
    const docWithLink = docWithInternalLink()
    test.skip(!docWithLink, '构建产物中未发现正文含站内 .html 内链的文档')
    await goto(page, docWithLink!)
    await page.waitForSelector('.markdown-section h2') // 等 SPA 把正文渲染进来 内链才存在
    await expect
      .poll(() => page.locator('.markdown-section a[href*=".html"]').count(), { timeout: 20_000 })
      .toBeGreaterThan(0)
  })

  test('旧 hash 链接 /#/doc/:id 改写为 .html', async ({ page }) => {
    await page.goto('/#/doc/' + encodeURIComponent(DOC_ID), { waitUntil: 'domcontentloaded' })
    await waitForPath(page, DOC)
    expect(pathnameOf(page)).toBe(DOC)
  })

  test('旧 /doc/:doc 地址重定向到 .html', async ({ page }) => {
    await goto(page, '/doc/' + DOC_ID)
    await waitForPath(page, DOC)
    expect(pathnameOf(page)).toBe(DOC)
  })

  test('侧边栏菜单点击跳转到 .html(以信号同步 不用 sleep)', async ({ page }) => {
    await goto(page, DOC)
    const item = page.locator('.el-menu .el-menu-item').first()
    await item.waitFor({ state: 'visible', timeout: 20_000 })
    const before = pathnameOf(page)
    await Promise.all([waitForHtmlChange(page, before), item.click()])
    expect(pathnameOf(page)).toMatch(/\.html$/)
  })

  test('根路径 / 续读上次阅读文档', async ({ page }) => {
    await seedLastRead(page, DOC_ID)
    await goto(page, '/')
    await waitForPath(page, DOC)
    expect(pathnameOf(page)).toBe(DOC)
  })

  test('根路径 / 新访客落到首页', async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('doc-service:last-read'))
    await goto(page, '/')
    await waitForPath(page, '/home.html')
    expect(pathnameOf(page)).toBe('/home.html')
  })

  test('/home.html 应用入口标题正确', async ({ page }) => {
    await goto(page, '/home.html')
    await page.waitForFunction(() => document.title.includes('首页'), undefined, { timeout: 20_000 })
    expect(pathnameOf(page)).toBe('/home.html')
  })

  test('/home 无后缀重定向到 /home.html', async ({ page }) => {
    await goto(page, '/home')
    await waitForPath(page, '/home.html')
    expect(pathnameOf(page)).toBe('/home.html')
  })

  test('/tag?tag=Java 重定向且保留 query', async ({ page }) => {
    await goto(page, '/tag?tag=Java')
    await waitForPath(page, '/tag.html')
    expect(page.url()).toMatch(/\/tag\.html\?tag=Java$/)
  })

  test('/catalog 无后缀重定向到 /catalog.html', async ({ page }) => {
    await goto(page, '/catalog')
    await waitForPath(page, '/catalog.html')
    expect(pathnameOf(page)).toBe('/catalog.html')
  })

  test('/cluster 无后缀重定向到 /cluster.html', async ({ page }) => {
    await goto(page, '/cluster')
    await waitForPath(page, '/cluster.html')
    expect(pathnameOf(page)).toBe('/cluster.html')
  })

  test('/index.html 重定向回根路径(再分流到首页/续读)', async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('doc-service:last-read'))
    await goto(page, '/index.html')
    // /index.html -> / -> 新访客落 /home.html
    await waitForPath(page, '/home.html')
    expect(pathnameOf(page)).toBe('/home.html')
  })

  test('无后缀文档路径自动补回 .html(CDN 308 去后缀场景)', async ({ page }) => {
    await goto(page, DOC_NO_SUFFIX)
    await waitForPath(page, DOC)
    expect(pathnameOf(page)).toBe(DOC)
  })

  test('真正不存在的路径展示 404 不被自愈误伤', async ({ page }) => {
    await goto(page, '/this-doc-does-not-exist')
    await page.waitForSelector('.not-found')
    expect(pathnameOf(page)).not.toMatch(/\.html$/)
  })

  test('桌面视口渲染桌面布局(单一路由树 无 /m 分流)', async ({ page }) => {
    await goto(page, DOC)
    await page.waitForSelector('.main-layout')
    expect(pathnameOf(page)).toBe(DOC)
    expect(pathnameOf(page)).not.toMatch(/^\/m\//)
    await expect(page.locator('.mobile-bottom-bar')).toHaveCount(0)
  })

  test('历史 /m 前缀地址兼容重定向到无前缀(P5 合流)', async ({ page }) => {
    // /m/<doc>(无后缀, CDN 去 .html) -> /<doc> -> catch-all 自愈补回 .html
    await goto(page, M_DOC_NO_SUFFIX)
    await waitForPath(page, DOC)
    expect(pathnameOf(page)).toBe(DOC)
    expect(pathnameOf(page)).not.toMatch(/^\/m\//)
    // /m/home -> /home -> /home.html
    await goto(page, '/m/home')
    await waitForPath(page, '/home.html')
    expect(pathnameOf(page)).toBe('/home.html')
  })

  test('/m 去前缀时保留 query 与 hash', async ({ page }) => {
    // 精确匹配的 waitForPath 才能这么写: /m/<doc>.html 在去前缀前 pathname 不等于 DOC 不会提前命中
    await goto(page, '/m' + DOC + '?kw=k&headingId=h#frag')
    await waitForPath(page, DOC)
    expect(pathnameOf(page)).toBe(DOC)
    const u = new URL(page.url())
    expect(u.searchParams.get('kw')).toBe('k')
    expect(u.searchParams.get('headingId')).toBe('h')
    expect(u.hash).toBe('#frag')
  })

  test('裸 /m 落到首页(新访客)', async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('doc-service:last-read'))
    await goto(page, '/m')
    await waitForPath(page, '/home.html')
    expect(pathnameOf(page)).toBe('/home.html')
  })
})

// 路径自愈: Latin-1 双重编码乱码修复(原 recovery.spec.ts 并入此处——它本质是路由不变量, 归 routing 这个 owner)。
// 合成可复现 不依赖真实 CDN 308 故确定性、可进门禁(不打 @prod)。
test.describe('url self-healing (P0)', () => {
  test('Latin-1 乱码路径自愈到正确 .html', async ({ page }) => {
    // 复现 CDN 把 UTF-8 字节按 Latin-1 误读后的形态(UrlUtils.repairLatin1Mojibake 的逆过程)
    const mojibake = Buffer.from(DOC_NO_SUFFIX, 'utf8').toString('latin1')
    await page.goto(encodeURI(mojibake), { waitUntil: 'domcontentloaded' })
    await waitForPath(page, DOC)
    expect(pathnameOf(page)).toBe(DOC)
  })

  test('乱码路径上的 query 值一并修复', async ({ page }) => {
    const mojibakePath = Buffer.from(DOC_NO_SUFFIX, 'utf8').toString('latin1')
    const mojibakeHeading = Buffer.from('依赖关系', 'utf8').toString('latin1')
    await page.goto(encodeURI(mojibakePath) + '?headingId=' + encodeURIComponent(mojibakeHeading), {
      waitUntil: 'domcontentloaded',
    })
    await waitForPath(page, DOC)
    expect(pathnameOf(page)).toBe(DOC)
    // query 里的乱码 headingId 应被还原成「依赖关系」
    expect(decodeURIComponent(new URL(page.url()).searchParams.get('headingId') ?? '')).toBe('依赖关系')
  })

  test('乱码 path + query + hash 同时修复(此前各文件分散覆盖的合并用例)', async ({ page }) => {
    const mojibakePath = Buffer.from(DOC_NO_SUFFIX, 'utf8').toString('latin1')
    const mojibakeHeading = Buffer.from('依赖关系', 'utf8').toString('latin1')
    await page.goto(encodeURI(mojibakePath) + '?headingId=' + encodeURIComponent(mojibakeHeading) + '#section-1', {
      waitUntil: 'domcontentloaded',
    })
    await waitForPath(page, DOC)
    expect(pathnameOf(page)).toBe(DOC)
    expect(decodeURIComponent(new URL(page.url()).searchParams.get('headingId') ?? '')).toBe('依赖关系')
    expect(new URL(page.url()).hash).toBe('#section-1')
  })

  // 注: recoverDocPath 的「decodeURIComponent 抛错 -> 直接进 404」分支(如 /%ZZ/bad)更适合放在
  // 针对路由守卫的组件级单测里覆盖 —— 非法 % 路径在本地 vite preview 会被静态服务器先行拒掉、根本到不了 SPA
})
