import { test, expect } from './fixtures'
import { openMermaidViewer, viewBox, diagramPoint, expectPoint, expectViewBox } from './mermaidviewer'

test.use({ serviceWorkers: 'block' })

test('单指拖动不滚动正文，触摸按钮和双击可缩放图表', async ({ page }, testInfo) => {
  const { viewer, svg } = await openMermaidViewer(page)
  const initial = await viewBox(svg)
  await viewer.getByRole('button', { name: '放大图表', exact: true }).tap()
  await expect.poll(async () => (await viewBox(svg)).width).toBeLessThan(initial.width)
  const beforeScroll = await page.evaluate(() => window.scrollY)
  const bounds = (await svg.boundingBox())!
  const start = { x: bounds.x + bounds.width * 0.35, y: bounds.y + bounds.height * 0.4 }
  const end = { x: start.x + 65, y: start.y + 80 }
  const draggedPoint = await diagramPoint(svg, start)
  // CDP 的真实触摸输入会经过浏览器的 touch-action 和指针取消逻辑。
  await expect.poll(() => svg.evaluate((element, point) => element.contains(document.elementFromPoint(point.x, point.y)), start)).toBe(true)
  await page.evaluate(() => new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  }))
  const client = await page.context().newCDPSession(page)
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...start, id: 1 }] })
  for (let step = 1; step <= 6; step++) {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: start.x + (end.x - start.x) * step / 6, y: start.y + (end.y - start.y) * step / 6, id: 1 }],
    })
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expectPoint(svg, draggedPoint, end)
  expect(await page.evaluate(() => window.scrollY)).toBe(beforeScroll)
  await expect(viewer).toBeVisible()
  await expect(page.locator('.mobile-category-drawer')).toBeHidden()
  await viewer.getByRole('button', { name: '重置图表', exact: true }).tap()
  await expectViewBox(svg, initial)
  await testInfo.attach('mermaid-viewer-mobile', { body: await viewer.screenshot(), contentType: 'image/png' })
  await viewer.getByRole('button', { name: '缩小图表', exact: true }).tap()
  await expect.poll(async () => (await viewBox(svg)).width).toBeGreaterThan(initial.width)
  const beforeDoubleTap = await viewBox(svg)
  const tapPoint = { x: bounds.x + bounds.width * 0.6, y: bounds.y + bounds.height * 0.3 }
  await page.touchscreen.tap(tapPoint.x, tapPoint.y)
  await page.touchscreen.tap(tapPoint.x, tapPoint.y)
  // 连续真实触摸同时走兼容鼠标事件；缩放只能执行一次，不能变成 2.2²。
  await page.evaluate(() => new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  }))
  expect(beforeDoubleTap.width / (await viewBox(svg)).width).toBeCloseTo(2.2, 4)
  await client.detach()
})
