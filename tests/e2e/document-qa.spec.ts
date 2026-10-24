import { test, expect, goto, openNavigationTools, DOC } from './fixtures'
import type { Page } from '@playwright/test'

async function openBridge(page: Page) {
  const launcher = page.locator('.navigation-launcher')
  if (await launcher.getAttribute('aria-expanded') === 'false') {
    await launcher.focus()
    await page.keyboard.press('Enter')
  }
  await page.getByRole('button', { name: /^Note Bridge：/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Note Bridge 连接', exact: true })
  await expect(dialog).toBeVisible()
  return dialog
}

async function pairBridge(page: Page) {
  const dialog = await openBridge(page)
  await dialog.getByRole('textbox', { name: '配对码', exact: true }).fill('123456')
  await dialog.getByRole('button', { name: '连接 Note Bridge', exact: true }).click()
  await expect(dialog.getByText('已连接 Note Bridge', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
}

const authResponse = { v: 1, type: 'auth.ok', token: 'mock-persistent-grant-token', connectionId: 'test', authorizationId: 'grant-test',
  providers: [{ id: 'mock', name: '本地测试模型', protocol: 'responses', model: 'mock-model' }] }

test('文档问答通过本机配对、流式回答与来源返回章节，断线不重发', async ({ page }) => {
  const requests: Record<string, unknown>[] = []
  let disconnect = () => {}
  await page.routeWebSocket('ws://127.0.0.1:19661/ws', socket => {
    disconnect = () => socket.close()
    socket.onMessage(raw => {
      const frame = JSON.parse(String(raw))
      requests.push(frame)
      if (frame.type === 'pair' || frame.type === 'auth') {
        socket.send(JSON.stringify(authResponse))
      }
      if (frame.type === 'chat.start') {
        const sourceId = frame.context.documents[0].sources.find((source: { headingId: string }) => source.headingId).sourceId
        socket.send(JSON.stringify({ v: 1, type: 'chat.delta', requestId: frame.requestId, seq: 1, delta: '这是文档的关键结论。' }))
        socket.send(JSON.stringify({ v: 1, type: 'chat.delta', requestId: frame.requestId, seq: 2, delta: ` [${sourceId}]` }))
        socket.send(JSON.stringify({ v: 1, type: 'chat.done', requestId: frame.requestId, seq: 3, finishReason: 'stop' }))
      }
    })
  })
  await goto(page, DOC)
  await expect(page.locator('.markdown-section h2').first()).toBeVisible()
  await pairBridge(page)
  const tools = await openNavigationTools(page)
  await tools.getByRole('button', { name: /^知识助手/ }).click()
  const drawer = page.getByRole('dialog', { name: '模板生成问题', exact: true })
  await expect(drawer.getByRole('button', { name: '复制提问', exact: true })).toBeVisible()
  await drawer.getByRole('radiogroup', { name: '知识助手模式' }).getByText('文档问答', { exact: true }).click()
  await expect(drawer.getByRole('radio', { name: '文档问答', exact: true })).toBeChecked()
  await expect(drawer.getByText('已连接 Note Bridge', { exact: true })).toBeVisible()
  await expect(drawer.getByRole('textbox', { name: '配对码', exact: true })).toHaveCount(0)
  await drawer.getByRole('textbox', { name: '你的问题', exact: true }).fill('这篇文章讲了什么？')
  await drawer.getByRole('button', { name: '发送问题', exact: true }).click()
  await expect(drawer.getByText(/这是文档的关键结论/)).toBeVisible()
  const citation = drawer.getByRole('navigation', { name: '回答来源' }).getByRole('link').first()
  const url = await citation.getAttribute('href')
  expect(url).toContain('.html?headingId=')
  expect(requests.filter(frame => frame.type === 'chat.start')).toHaveLength(1)
  await test.info().attach('document-qa', { body: await drawer.screenshot(), contentType: 'image/png' })
  disconnect()
  await expect.poll(() => requests.filter(frame => frame.type === 'auth').length).toBe(1)
  await expect(drawer.getByText('已连接 Note Bridge', { exact: true })).toBeVisible()
  expect(requests.filter(frame => frame.type === 'chat.start')).toHaveLength(1)
  await citation.click()
  if (url?.includes('headingId=')) {
    const heading = new URL(url, 'http://localhost').searchParams.get('headingId')!
    await expect(page.locator('.main.markdown-section').locator(`[id=${JSON.stringify(heading)}]`)).toBeInViewport()
  }
})

test('导航记住连接：刷新自动认证，切页共享连接，忘记后不再重连', async ({ page }) => {
  const frames: Record<string, unknown>[] = []
  let sockets = 0
  await page.routeWebSocket('ws://127.0.0.1:19661/ws', socket => {
    sockets++
    socket.onMessage(raw => {
      const frame = JSON.parse(String(raw))
      frames.push(frame)
      if (frame.type === 'pair' || frame.type === 'auth') socket.send(JSON.stringify(authResponse))
    })
  })
  await goto(page, DOC)
  await expect(page.locator('.markdown-section h2').first()).toBeVisible()
  await pairBridge(page)
  const status = page.getByRole('status', { name: 'Note Bridge 已连接', exact: true })
  await expect(status).toBeVisible()
  await expect(page.locator('.navigation-launcher')).toHaveAttribute('aria-expanded', 'false')
  expect(await status.evaluate(element => {
    const probe = document.createElement('span')
    probe.style.color = 'var(--success-color)'
    element.append(probe)
    const same = getComputedStyle(element).color === getComputedStyle(probe).color
    probe.remove()
    return same
  })).toBe(true)
  await page.locator('.navigation-launcher').focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Note Bridge：已连接 Note Bridge', exact: true })).toBeVisible()
  const navigationImage = test.info().outputPath('note-bridge-desktop-navigation.png')
  await page.getByRole('navigation', { name: '站内导航', exact: true }).screenshot({ path: navigationImage })
  await test.info().attach('note-bridge-desktop-navigation', { path: navigationImage, contentType: 'image/png' })
  await page.keyboard.press('Escape')

  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(status).toBeVisible()
  expect(frames.filter(frame => frame.type === 'pair')).toHaveLength(1)
  expect(frames.filter(frame => frame.type === 'auth')).toEqual([{ v: 1, type: 'auth', token: authResponse.token }])

  await page.locator('.navigation-launcher').focus()
  await page.keyboard.press('Enter')
  await page.getByRole('navigation', { name: '站内导航', exact: true }).getByRole('link', { name: '首页', exact: true }).click()
  await expect(page).toHaveURL(/\/home\.html$/)
  await expect(status).toBeVisible()
  expect(sockets).toBe(2)

  const dialog = await openBridge(page)
  await expect(dialog.getByText(/已记住此浏览器的连接凭证/)).toBeVisible()
  const settingsImage = test.info().outputPath('note-bridge-desktop-settings.png')
  await dialog.screenshot({ path: settingsImage })
  await test.info().attach('note-bridge-desktop-settings', { path: settingsImage, contentType: 'image/png' })
  await dialog.getByRole('button', { name: '断开连接', exact: true }).click()
  await expect(status).toHaveCount(0)
  await expect(dialog.getByText('未连接 Note Bridge', { exact: true })).toBeVisible()
  await dialog.getByRole('button', { name: '重新连接', exact: true }).click()
  await expect(dialog.getByText('已连接 Note Bridge', { exact: true })).toBeVisible()
  expect(frames.filter(frame => frame.type === 'pair')).toHaveLength(1)
  await dialog.getByRole('button', { name: '忘记连接', exact: true }).click()
  await expect(dialog.getByRole('textbox', { name: '配对码', exact: true })).toBeVisible()
  await expect(status).toHaveCount(0)
  await expect.poll(() => frames.filter(frame => frame.type === 'auth.forget').length).toBe(1)
  const count = sockets
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.locator('.navigation-launcher')).toBeVisible()
  await expect(status).toHaveCount(0)
  await openBridge(page)
  await expect(page.getByRole('textbox', { name: '配对码', exact: true })).toBeVisible()
  expect(sockets).toBe(count)
})
