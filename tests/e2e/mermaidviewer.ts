import { expect, goto, docWithMermaid } from './fixtures'
import type { Locator, Page } from '@playwright/test'

export type Point = { x: number; y: number }
export type ViewBox = Point & { width: number; height: number }

// 固定为横向长图，确保实际浏览器的 meet 布局在画布上下产生留白。
export async function openMermaidViewer(page: Page) {
  const path = docWithMermaid()
  if (!path) throw new Error('构建产物无含 Mermaid 的文档')
  const jsonPath = path.replace(/\.html$/, '.md.json')
  await page.route(url => decodeURI(url.pathname) === jsonPath, async route => {
    const response = await route.fetch()
    const file = await response.json()
    file.content = '## 查看图表回归\n\n```mermaid\nflowchart LR\n A[Read a document] --> B[Open the diagram] --> C[Explore the details] --> D[Continue reading]\n```'
    await route.fulfill({ response, json: file })
  })
  await goto(page, path)
  const source = page.locator('.main-content .mermaid-source')
  await source.scrollIntoViewIfNeeded()
  await expect(source).toHaveClass(/mermaid-rendered/, { timeout: 20_000 })
  const opener = page.locator('.main-content').getByRole('button', { name: '全屏查看图表' })
  await opener.click()
  const viewer = page.getByRole('dialog', { name: '查看图表', exact: true })
  const svg = viewer.locator('.mermaid-viewer-canvas > svg')
  await expect(svg).toBeVisible({ timeout: 20_000 })
  await expect(viewer.getByRole('button', { name: '放大图表', exact: true })).toBeEnabled()
  return { viewer, svg, opener }
}

export async function viewBox(svg: Locator): Promise<ViewBox> {
  return svg.evaluate(element => {
    const box = (element as SVGSVGElement).viewBox.baseVal
    return { x: box.x, y: box.y, width: box.width, height: box.height }
  })
}

export async function screenPoint(svg: Locator, point: Point): Promise<Point> {
  return svg.evaluate((element, value) => {
    const point = new DOMPoint(value.x, value.y).matrixTransform((element as SVGSVGElement).getScreenCTM()!)
    return { x: point.x, y: point.y }
  }, point)
}

export async function diagramPoint(svg: Locator, point: Point): Promise<Point> {
  return svg.evaluate((element, value) => {
    const point = new DOMPoint(value.x, value.y).matrixTransform((element as SVGSVGElement).getScreenCTM()!.inverse())
    return { x: point.x, y: point.y }
  }, point)
}

export async function expectPoint(svg: Locator, point: Point, expected: Point) {
  await expect.poll(async () => {
    const actual = await screenPoint(svg, point)
    return Math.hypot(actual.x - expected.x, actual.y - expected.y)
  }).toBeLessThan(2)
}

export async function expectViewBox(svg: Locator, expected: ViewBox) {
  await expect.poll(async () => {
    const actual = await viewBox(svg)
    return Math.max(...(['x', 'y', 'width', 'height'] as const).map(key => Math.abs(actual[key] - expected[key])))
  }).toBeLessThan(0.01)
}
