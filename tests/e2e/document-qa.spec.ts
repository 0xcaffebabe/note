import { test, expect, goto, openNavigationTools, DOC } from './fixtures'
import type { Page } from '@playwright/test'
import { persistentBridge, bridgeAuth } from './ai-bridge-fixture'

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

const authResponse = bridgeAuth

const modelKey = (providerId: string, model: string) => JSON.stringify([providerId, model])

async function openAssistant(page: Page) {
  const tools = await openNavigationTools(page)
  const assistant = tools.getByRole('button', { name: /^知识助手/ })
  // The popover moves focus after entering; a click waits for a stable target without racing that focus change.
  await assistant.click()
  const dialog = page.getByRole('dialog', { name: '知识助手', exact: true })
  await expect(dialog).toBeVisible()
  return dialog
}

test('全库问答只发送引用，关闭后后台完成，清除浏览器存储后仍能读取 bridge 聊天', async ({ page }) => {
  test.setTimeout(60000)
  const bridge = await persistentBridge(page, { automatic: false, sourceUrl: DOC })
  await goto(page, '/home.html')
  await pairBridge(page)
  let dialog = await openAssistant(page)
  await expect(dialog.locator('.el-dialog.knowledge-assistant-dialog')).toBeVisible()
  await dialog.getByRole('combobox', { name: '模型', exact: true }).selectOption(modelKey('reasoner', 'gateway/reasoning-pro'))
  await dialog.getByRole('combobox', { name: '思考强度', exact: true }).selectOption('high')
  const question = '请综合知识库解释缓存设计。' + '继续分析。'.repeat(1100)
  await dialog.getByRole('textbox', { name: '你的问题', exact: true }).fill(question)
  await dialog.getByRole('button', { name: '发送问题', exact: true }).click()
  await expect(dialog.getByRole('button', { name: '停止生成', exact: true })).toBeVisible()
  await expect.poll(() => bridge.frames.filter(frame => frame.method === 'messages.send').length).toBe(1)
  const start = bridge.frames.find(frame => frame.method === 'messages.send')
  expect(start.params).toEqual({ sessionId: expect.any(String), clientRequestId: expect.any(String), text: question, providerId: 'reasoner', model: 'gateway/reasoning-pro', effort: 'high' })
  expect(bridge.frames.some(frame => frame.type === 'tool.result' || frame.type === 'chat.start')).toBe(false)
  await dialog.locator('details.qa-tool-call summary').click()
  await expect(dialog.locator('.qa-tool-overview')).toContainText('已找到 2 篇文档')
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect.poll(() => bridge.frames.filter(frame => frame.method === 'session.unsubscribe').length).toBe(1)
  expect(bridge.frames.filter(frame => frame.method === 'runs.cancel')).toHaveLength(0)
  bridge.finish()
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('status', { name: 'Note Bridge 已连接', exact: true })).toBeVisible()
  dialog = await openAssistant(page)
  await expect(dialog.locator('.ai-markdown h2')).toHaveText('知识库的综合结论')
  await expect(dialog.locator('.ai-markdown table td')).toHaveCount(2)
  await expect(dialog.locator('.ai-markdown pre code')).toHaveText('if context:\n    answer(context)')
  await expect(dialog.getByRole('navigation', { name: '回答来源' }).getByRole('link')).toHaveCount(1)
  await dialog.locator('details.qa-tool-call summary').click()
  await expect(dialog.locator('.qa-tool-overview')).toContainText('站点版本 site-release-1')
  await expect(dialog.getByRole('combobox', { name: '思考强度', exact: true })).toHaveValue('high')
  const sidebar = await dialog.locator('.qa-sidebar').boundingBox()
  const main = await dialog.locator('.qa-main').boundingBox()
  expect(sidebar!.x + sidebar!.width).toBeLessThanOrEqual(main!.x + 1)
  const image = test.info().outputPath('assistant-persistent-desktop.png')
  await dialog.screenshot({ path: image }); await test.info().attach('assistant-persistent-desktop', { path: image, contentType: 'image/png' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'domcontentloaded' })
  await pairBridge(page)
  dialog = await openAssistant(page)
  await expect(dialog.locator('.ai-markdown h2')).toHaveText('知识库的综合结论')
  expect(bridge.frames.filter(frame => frame.method === 'messages.send')).toHaveLength(1)
  await dialog.locator('.qa-session').hover()
  await dialog.getByRole('button', { name: /^归档聊天：/ }).click()
  await expect(dialog.locator('.qa-session-select')).toHaveCount(0)
})

test('当前文档附件经 bridge 读取元数据，刷新和切换只订阅，停止按钮明确取消', async ({ page }) => {
  const bridge = await persistentBridge(page, { automatic: false, sourceUrl: DOC })
  await goto(page, DOC)
  await pairBridge(page)
  let dialog = await openAssistant(page)
  await dialog.getByRole('button', { name: '文档上下文', exact: true }).click()
  await dialog.getByRole('checkbox', { name: '附加当前文档目录', exact: true }).check()
  await dialog.getByRole('listbox', { name: '选择当前文档章节' }).selectOption('site-heading')
  await dialog.getByRole('button', { name: '关闭文档上下文', exact: true }).click()
  await dialog.getByRole('textbox', { name: '你的问题', exact: true }).fill('附加章节，分析知识库中的关联')
  await dialog.getByRole('button', { name: '发送问题', exact: true }).click()
  await expect(dialog.getByRole('button', { name: '停止生成', exact: true })).toBeVisible()
  await expect.poll(() => bridge.frames.filter(frame => frame.method === 'messages.send').length).toBe(1)
  const sent = bridge.frames.find(frame => frame.method === 'messages.send').params
  expect(sent.attachments).toEqual([{ docId: expect.any(String), headingIds: ['site-heading'], contentHash: 'published-revision-hash' }])
  expect(sent).not.toHaveProperty('context')
  await dialog.getByRole('button', { name: '新聊天', exact: false }).click()
  await expect(dialog.getByRole('heading', { name: '从一个好问题开始' })).toBeVisible()
  await dialog.locator('.qa-session-select').click()
  await expect(dialog.getByRole('button', { name: '停止生成', exact: true })).toBeVisible()
  expect(bridge.frames.filter(frame => frame.method === 'runs.cancel')).toHaveLength(0)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('status', { name: 'Note Bridge 已连接', exact: true })).toBeVisible()
  dialog = await openAssistant(page)
  await expect(dialog.getByRole('button', { name: '停止生成', exact: true })).toBeVisible()
  expect(bridge.frames.filter(frame => frame.method === 'messages.send')).toHaveLength(1)
  await dialog.getByRole('button', { name: '停止生成', exact: true }).click()
  await expect(dialog.getByText('回答已停止', { exact: true })).toBeVisible()
  expect(bridge.frames.filter(frame => frame.method === 'runs.cancel')).toHaveLength(1)
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
  expect(frames.filter(frame => frame.type === 'auth')).toEqual([{ v: 2, type: 'auth', token: authResponse.token }])

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
