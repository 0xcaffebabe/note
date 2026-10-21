import { test, expect, goto } from './fixtures'
import type { Page } from '@playwright/test'
import type { ClusterScatter } from '../../src/core/domain/ClusterScatterPoint'
import DocUtils from '../../src/core/util/DocUtils'

async function expectRendered(page: Page) {
  await expect(page.locator('.cluster-host')).toHaveAttribute('aria-busy', 'false', { timeout: 20_000 })
  await expect(page.locator('.cluster-host .chart-overlay')).toHaveCount(0)
  await expect(page.locator('.cluster-host canvas').first()).toBeVisible()
}

async function openCluster(page: Page): Promise<ClusterScatter> {
  const responsePromise = page.waitForResponse(response => new URL(response.url()).pathname === '/docClusterScatter.json')
  await goto(page, '/cluster.html')
  const response = await responsePromise
  expect(response.ok()).toBe(true)
  const data: ClusterScatter = await response.json()
  expect(data.points.length).toBeGreaterThan(0)
  // canvas 在初始化时已创建；有效坐标、加载完成且无错误/空态才证明图真正渲染。
  for (const point of data.points) {
    expect([point.x, point.y, point.x3, point.y3, point.z3, point.size].every(Number.isFinite)).toBe(true)
  }
  await expectRendered(page)
  return data
}

test.describe('cluster page interaction (P1)', () => {
  test('真实聚类数据可渲染，2D/3D 切换后仍无错误态', async ({ page }) => {
    await openCluster(page)
    await expect(page.locator('.cluster-tools .el-radio-button')).toHaveCount(2)
    await page.getByText('2D', { exact: true }).click()
    await expect(page.getByRole('radio', { name: '2D', exact: true })).toBeChecked()
    await expectRendered(page)
    const threeD = page.getByRole('radio', { name: '3D', exact: true })
    if (await threeD.isEnabled()) {
      await page.getByText('3D', { exact: true }).click()
      await expect(threeD).toBeChecked()
      await expectRendered(page)
    }
  })

  test('搜索真实标题能命中，不存在的关键词显示「无匹配」反馈', async ({ page }) => {
    const data = await openCluster(page)
    const search = page.getByRole('textbox', { name: '搜索高亮聚类节点' })
    await search.fill('zzz不存在的聚类关键词qqq')
    await expect(page.locator('.cluster-nomatch')).toBeVisible()
    await search.fill(DocUtils.pathLeafName(data.points[0].name))
    await expect(page.locator('.cluster-nomatch')).toHaveCount(0)
    await expectRendered(page)
  })

  test('数据请求失败后可在当前页面重新加载恢复点云', async ({ page }) => {
    let attempts = 0
    await page.route('**/docClusterScatter.json', route => {
      if (attempts++ === 0) {
        return route.fulfill({ status: 404, contentType: 'text/html', body: '<!DOCTYPE html><html><body>Not found</body></html>' })
      }
      return route.continue()
    })
    await goto(page, '/cluster.html')
    await expect(page.getByRole('status')).toContainText('聚类数据加载失败')
    await page.getByRole('button', { name: '重新加载', exact: true }).click()
    await expectRendered(page)
    expect(attempts).toBe(2)
  })

  test('合法的空数据展示空态', async ({ page }) => {
    await page.route('**/docClusterScatter.json', route => route.fulfill({ json: { points: [], clusters: [] } }))
    await goto(page, '/cluster.html')
    await expect(page.getByRole('status')).toContainText('暂无聚类数据')
    await expect(page.getByRole('button', { name: '重新加载', exact: true })).toHaveCount(0)
  })
})
