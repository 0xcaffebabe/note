import { test, expect, pathnameOf, waitForPath, DOC, DOC_NO_SUFFIX } from './fixtures'

// 路径自愈: Latin-1 双重编码乱码修复 + 非法路径不卡死
// 合成可复现 不依赖真实 CDN 308 故确定性、可进门禁(不打 @prod)
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

  // 注: recoverDocPath 的「decodeURIComponent 抛错 -> 直接进 404」分支(如 /%ZZ/bad)更适合放在
  // 针对路由守卫的组件级单测里覆盖 —— 非法 % 路径在本地 vite preview 会被静态服务器先行拒掉、根本到不了 SPA
})
