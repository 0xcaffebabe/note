import { test, expect, goto, collectPageProblems, BENIGN_CONSOLE } from './fixtures'
import type { Page } from '@playwright/test'

const WORDS: [string, number][] = [
  ['系统', 4899], ['知识', 3200], ['模型', 2100],
  ['网络', 1500], ['学习', 900], ['数据', 600],
]

async function startReading(page: Page) {
  await page.getByRole('button', { name: '开始阅读', exact: true }).click()
  await expect(page.locator('.main.markdown-section')).toBeVisible()
  await expect(page.locator('#wordcloud')).toHaveCount(0)
}

async function hoverWord(page: Page) {
  const canvas = page.locator('#wordcloud')
  await canvas.scrollIntoViewIfNeeded()
  const box = (await canvas.boundingBox())!
  // 通过真实指针寻找可见词，不依赖组件内部布局数据。
  for (let row = 1; row < 20; row++) {
    for (let col = 1; col < 20; col++) {
      const x = box.x + box.width * col / 20
      const y = box.y + box.height * row / 20
      await page.mouse.move(x, y)
      if (await page.locator('#wordcloud-tooltip').isVisible()) return { box, x, y }
    }
  }
  throw new Error('词云没有显示词频提示')
}

test('词云加载与 resize 重叠时只保留最新初始化，阅读页没有残留提示', async ({ page }) => {
  const problems = collectPageProblems(page, BENIGN_CONSOLE)
  let release!: () => void
  const pending = new Promise<void>(resolve => { release = resolve })
  let requests = 0
  await page.route('**/wordcloud.json', async route => {
    requests++
    await pending
    await route.fulfill({ json: WORDS })
  })
  await goto(page, '/home.html')
  await expect.poll(() => requests).toBeGreaterThanOrEqual(1)
  // 初次 ResizeObserver 通知与视口变化都可在首个请求结束前触发重排。
  await page.setViewportSize({ width: 1500, height: 900 })
  await expect.poll(() => requests).toBeGreaterThanOrEqual(2)
  release()
  await page.waitForLoadState('networkidle')
  await expect(page.locator('#wordcloud-tooltip')).toHaveCount(1)

  await startReading(page)
  await page.mouse.move(640, 280)
  await page.mouse.move(800, 420)
  await expect(page.locator('#wordcloud-tooltip')).toHaveCount(0)
  expect(problems).toEqual([])
})

test('词云数据在离开首页后返回时，不创建提示层或抛出异常', async ({ page }) => {
  const problems = collectPageProblems(page, BENIGN_CONSOLE)
  let release!: () => void
  const pending = new Promise<void>(resolve => { release = resolve })
  let requested = false
  await page.route('**/wordcloud.json', async route => {
    requested = true
    await pending
    await route.fulfill({ json: WORDS })
  })
  await goto(page, '/home.html')
  await expect.poll(() => requested).toBe(true)
  await startReading(page)
  release()
  await page.waitForLoadState('networkidle')
  await page.mouse.move(640, 280)
  await expect(page.locator('#wordcloud-tooltip')).toHaveCount(0)
  expect(problems).toEqual([])
})

test('词云提示跟随滚动后的位置，移出画布后消失，切换模式不累积监听', async ({ page }) => {
  await page.route('**/wordcloud.json', route => route.fulfill({ json: WORDS }))
  await goto(page, '/home.html')
  const tooltip = page.locator('#wordcloud-tooltip')
  const modes = page.getByRole('radiogroup', { name: '词云维度切换' })
  await expect(tooltip).toHaveCount(1)
  await modes.getByText('2D', { exact: true }).click()
  const { box, x, y } = await hoverWord(page)
  await expect(tooltip).toBeVisible()
  await expect(tooltip).toHaveText(/.+: \d+/)
  const tipBox = (await tooltip.boundingBox())!
  expect(Math.abs(tipBox.x - x - 10)).toBeLessThan(2)
  expect(Math.abs(tipBox.y - y - 10)).toBeLessThan(2)
  await page.mouse.move(box.x - 10, y)
  await expect(tooltip).toBeHidden()

  // 反复切换后，拖拽监听仍必须能在离开首页时完整清理。
  for (let i = 0; i < 3; i++) {
    await modes.getByText('3D', { exact: true }).click()
    await modes.getByText('2D', { exact: true }).click()
  }
  await modes.getByText('3D', { exact: true }).click()
  const projection = await hoverWord(page)
  await expect(tooltip).toBeVisible()
  await page.mouse.move(projection.box.x - 10, projection.y)
  await expect(tooltip).toBeHidden()
  // 悬停仅限画布，但拖拽移出画布后仍应继续旋转并能正常结束。
  const canvas = page.locator('#wordcloud')
  const beforeDrag = await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL())
  await page.mouse.move(projection.x, projection.y)
  await page.mouse.down()
  await expect(tooltip).toBeHidden()
  await page.mouse.move(projection.box.x - 10, projection.y + 30, { steps: 4 })
  await page.mouse.up()
  const afterDrag = await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL())
  expect(afterDrag !== beforeDrag).toBe(true)
  await startReading(page)
  await page.mouse.move(640, 280)
  await expect(tooltip).toHaveCount(0)
})
