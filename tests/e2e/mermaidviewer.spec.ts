import { test, expect } from './fixtures'
import { openMermaidViewer, viewBox, diagramPoint, screenPoint, expectPoint, expectViewBox } from './mermaidviewer'

test.use({ serviceWorkers: 'block' })

test('留白处滚轮和双击保持指向位置，拖出画布松开后停止平移', async ({ page }) => {
  const { viewer, svg } = await openMermaidViewer(page)
  const initial = await viewBox(svg)
  const bounds = (await svg.boundingBox())!
  const contentTop = await screenPoint(svg, initial)
  expect(contentTop.y - bounds.y).toBeGreaterThan(20)
  const cursor = { x: bounds.x + bounds.width * 0.7, y: (bounds.y + contentTop.y) / 2 }
  const anchor = await diagramPoint(svg, cursor)
  await page.mouse.move(cursor.x, cursor.y)
  await page.mouse.wheel(0, -300)
  await expect.poll(async () => (await viewBox(svg)).width).toBeLessThan(initial.width)
  await expectPoint(svg, anchor, cursor)

  const beforeDoubleClick = await viewBox(svg)
  await page.mouse.dblclick(cursor.x, cursor.y)
  await expect.poll(async () => (await viewBox(svg)).width).toBeLessThan(beforeDoubleClick.width)
  await expectPoint(svg, anchor, cursor)
  await page.keyboard.down('Shift')
  await page.mouse.dblclick(cursor.x, cursor.y)
  await page.keyboard.up('Shift')
  await expectViewBox(svg, beforeDoubleClick)

  const start = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
  const end = { x: Math.min(page.viewportSize()!.width - 2, bounds.x + bounds.width + 12), y: start.y + 35 }
  expect(end.x).toBeGreaterThan(bounds.x + bounds.width)
  const draggedPoint = await diagramPoint(svg, start)
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(end.x, end.y, { steps: 6 })
  await expectPoint(svg, draggedPoint, end)
  await page.mouse.up()
  const released = await viewBox(svg)
  await page.mouse.move(start.x, start.y, { steps: 4 })
  await expectViewBox(svg, released)
  await viewer.getByRole('button', { name: '重置图表', exact: true }).click()
  await expectViewBox(svg, initial)
})

test('键盘可缩放和复位，视口改变后滚轮仍保持指向位置', async ({ page }, testInfo) => {
  const { viewer, svg } = await openMermaidViewer(page)
  const initial = await viewBox(svg)
  const enlarge = viewer.getByRole('button', { name: '放大图表', exact: true })
  const shrink = viewer.getByRole('button', { name: '缩小图表', exact: true })
  const reset = viewer.getByRole('button', { name: '重置图表', exact: true })
  await enlarge.focus()
  await page.keyboard.press('Enter')
  await expect.poll(async () => (await viewBox(svg)).width).toBeLessThan(initial.width)
  await shrink.focus()
  await page.keyboard.press('Space')
  await expectViewBox(svg, initial)
  await testInfo.attach('mermaid-viewer-desktop', { body: await viewer.screenshot(), contentType: 'image/png' })

  await enlarge.focus()
  await page.keyboard.press('Space')
  const zoomed = await viewBox(svg)
  await page.setViewportSize({ width: 1000, height: 700 })
  await expect(viewer).toBeInViewport({ ratio: 1 })
  await expectViewBox(svg, zoomed)
  const resized = (await svg.boundingBox())!
  const cursor = { x: resized.x + resized.width * 0.65, y: resized.y + resized.height * 0.3 }
  const anchor = await diagramPoint(svg, cursor)
  await page.mouse.move(cursor.x, cursor.y)
  await page.mouse.wheel(0, -100)
  await expect.poll(async () => (await viewBox(svg)).width).toBeLessThan(zoomed.width)
  await expectPoint(svg, anchor, cursor)
  await reset.focus()
  await page.keyboard.press('Enter')
  await expectViewBox(svg, initial)
})
