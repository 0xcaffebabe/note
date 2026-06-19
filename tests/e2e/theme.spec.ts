import { test, expect, goto, DOC } from './fixtures'

// 主题(暗色模式)持久化
// 组件链路: src/components/header/ThemeSwitcher.vue(el-switch + toggleDarkMode)
//   -> src/util/SysUtils.ts(enterDarkMode/enterLightMode: 写 body[theme] + html.dark + localStorage)
//   -> src/Main.vue created(): 刷新时读 localStorage['system::theme'] 重放主题
//
// 源码事实(读自上述文件, 用作断言基准):
// - 存储键名 = 'system::theme', 取值 'dark' / 'light'
// - 暗色: document.body.setAttribute('theme','dark') 且 documentElement.classList.add('dark')
// - 亮色: body[theme=light] 且移除 html.dark
// - 切换开关本身是 Element Plus 的 .el-switch(根节点挂 @click=toggleDarkMode)
// - ThemeSwitcher 仅在桌面头部直接渲染(class action-item), 本套件跑 desktop-chromium(1440x900) 故可见

const THEME_KEY = 'system::theme'

// 头部主题开关。Header 桌面态直接渲染 <theme-switcher class="action-item">,
// 其内是 el-switch; 点 .el-switch 根即触发 toggleDarkMode(@click 挂在根 el-switch 上)。
const SWITCH = '.action-item.el-switch'

const readTheme = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ({
    bodyTheme: document.body.getAttribute('theme'),
    htmlDark: document.documentElement.classList.contains('dark'),
    stored: localStorage.getItem('system::theme'),
  }))

test.describe('暗色模式切换与持久化', () => {
  // 用真实文档页(而非首页)做载体: 头部在任意路由都在; 同时顺带保证 el-switch 在正文页也可用
  const PAGE = DOC

  test.beforeEach(async ({ page }) => {
    // 清掉可能残留的主题键, 让初始为「跟随系统」的纯净态。注意 storage 是 origin 级,
    // 需先到同源页面再清, 然后重载使 Main.vue created() 在无键状态下初始化。
    await goto(page, PAGE)
    await page.evaluate((k) => localStorage.removeItem(k), THEME_KEY)
    await page.reload({ waitUntil: 'domcontentloaded' })
  })

  test('开关与头部就位: 初始无手动主题键(跟随系统), 开关可见', async ({ page }) => {
    const sw = page.locator(SWITCH)
    await expect(sw).toBeVisible({ timeout: 20_000 })

    // 清键并重载后, 不应存在手动主题键(Main.vue 走「跟随系统」分支, persist=false 不写键)
    const t = await readTheme(page)
    expect(t.stored).toBeNull()
    // body[theme] 与 html.dark 应保持一致(同步翻转): 要么都暗, 要么都不暗
    if (t.bodyTheme === 'dark') {
      expect(t.htmlDark).toBe(true)
    } else {
      expect(t.htmlDark).toBe(false)
    }
  })

  test('切到暗色: body[theme=dark] + html.dark + localStorage=dark', async ({ page }) => {
    const sw = page.locator(SWITCH)
    await expect(sw).toBeVisible({ timeout: 20_000 })

    // 确保从亮色出发(若系统恰好偏好暗色, 先点一次回到亮色), 这样下一次点击必定进入暗色
    if ((await readTheme(page)).bodyTheme === 'dark') {
      await sw.click()
      await expect(page.locator('body[theme="light"]')).toHaveCount(1)
    }

    await sw.click()

    // 三处状态应一致进入暗色
    await expect(page.locator('body[theme="dark"]')).toHaveCount(1)
    await expect(page.locator('html.dark')).toHaveCount(1)
    await expect.poll(() => page.evaluate((k) => localStorage.getItem(k), THEME_KEY)).toBe('dark')
  })

  test('刷新后暗色被重放(Main.vue created 读存储)', async ({ page }) => {
    const sw = page.locator(SWITCH)
    await expect(sw).toBeVisible({ timeout: 20_000 })

    if ((await readTheme(page)).bodyTheme === 'dark') {
      await sw.click()
      await expect(page.locator('body[theme="light"]')).toHaveCount(1)
    }
    await sw.click()
    await expect(page.locator('body[theme="dark"]')).toHaveCount(1)
    await expect.poll(() => page.evaluate((k) => localStorage.getItem(k), THEME_KEY)).toBe('dark')

    // 重载: Main.vue created() 读 localStorage 'dark' -> enterDarkMode(persist=false)
    await page.reload({ waitUntil: 'domcontentloaded' })

    await expect(page.locator('body[theme="dark"]')).toHaveCount(1)
    await expect(page.locator('html.dark')).toHaveCount(1)
    // persist=false: 重放不重写键, 但键本来就是 'dark', 仍应留存
    const after = await readTheme(page)
    expect(after.stored).toBe('dark')

    // 开关视觉态也应同步成「开」(组件 watch isDark -> showMode), aria-checked=true
    await expect(page.locator(`${SWITCH} [role="switch"]`)).toHaveAttribute('aria-checked', 'true', {
      timeout: 20_000,
    })
  })

  test('暗色再切回亮色: body[theme=light] + 移除 html.dark + localStorage=light, 且刷新后维持亮色', async ({
    page,
  }) => {
    const sw = page.locator(SWITCH)
    await expect(sw).toBeVisible({ timeout: 20_000 })

    // 先确保进入暗色
    if ((await readTheme(page)).bodyTheme !== 'dark') {
      await sw.click()
    }
    await expect(page.locator('body[theme="dark"]')).toHaveCount(1)

    // 切回亮色
    await sw.click()
    await expect(page.locator('body[theme="light"]')).toHaveCount(1)
    await expect(page.locator('html.dark')).toHaveCount(0)
    await expect.poll(() => page.evaluate((k) => localStorage.getItem(k), THEME_KEY)).toBe('light')

    // 刷新: Main.vue created() 见 'light' -> 不进 enterDarkMode 分支, 保持亮色(html 无 dark, body 也无 dark)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.locator('html.dark')).toHaveCount(0)
    await expect(page.locator('body[theme="dark"]')).toHaveCount(0)
    // 键应仍为 'light'(手动选择被尊重)
    await expect.poll(() => page.evaluate((k) => localStorage.getItem(k), THEME_KEY)).toBe('light')
  })

  test('主题为同源全局态: 切暗后导航到另一文档仍保持暗色(无需重新点)', async ({ page }) => {
    const sw = page.locator(SWITCH)
    await expect(sw).toBeVisible({ timeout: 20_000 })

    if ((await readTheme(page)).bodyTheme === 'dark') {
      await sw.click()
      await expect(page.locator('body[theme="light"]')).toHaveCount(1)
    }
    await sw.click()
    await expect(page.locator('body[theme="dark"]')).toHaveCount(1)

    // 直接导航(整页加载)到首页: Main.vue created() 用持久化键重放暗色
    await goto(page, '/home.html')
    await expect(page.locator('body[theme="dark"]')).toHaveCount(1)
    await expect(page.locator('html.dark')).toHaveCount(1)
  })
})
