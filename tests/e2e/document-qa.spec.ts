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
  providers: [
    { id: 'mock', name: '本地测试模型', protocol: 'responses', model: 'mock-model', efforts: ['default', 'low', 'medium', 'high'] },
    { id: 'reasoner', name: '推理测试模型', protocol: 'chatCompletions', model: 'reasoning-model', efforts: ['default', 'low', 'medium', 'high'] },
  ] }

async function openAssistant(page: Page) {
  const tools = await openNavigationTools(page)
  const assistant = tools.getByRole('button', { name: /^知识助手/ })
  await assistant.focus()
  await assistant.press('Enter')
  const dialog = page.getByRole('dialog', { name: '知识助手', exact: true })
  await expect(dialog).toBeVisible()
  return dialog
}

test('聊天弹窗调用真实文档工具，流式 Markdown 与可信来源可导航，断线不重发', async ({ page }) => {
  test.setTimeout(45000)
  const requests: any[] = []
  const documents = new Map<string, string>()
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
        documents.set(frame.requestId, frame.context.documents[0].docId)
        socket.send(JSON.stringify({ v: 1, type: 'tool.call', requestId: frame.requestId, seq: 1, callId: `${frame.requestId}-toc`, name: 'get_toc', arguments: { docId: documents.get(frame.requestId) } }))
      }
      if (frame.type === 'tool.result' && frame.callId.endsWith('-toc')) {
        expect(frame.isError, JSON.stringify(frame.result)).toBe(false)
        const heading = frame.result.data.headings.find((item: { headingId: string }) => item.headingId)
        socket.send(JSON.stringify({ v: 1, type: 'tool.call', requestId: frame.requestId, seq: 2, callId: `${frame.requestId}-document`, name: 'get_document', arguments: { docId: documents.get(frame.requestId), section: heading.section } }))
      }
      if (frame.type === 'tool.result' && frame.callId.endsWith('-document')) {
        expect(frame.isError, JSON.stringify(frame.result)).toBe(false)
        const sourceId = frame.result.sources[0].sourceId
        socket.send(JSON.stringify({ v: 1, type: 'chat.delta', requestId: frame.requestId, seq: 3, delta: '## 文档的关键结论\n\n- 通过目录找到实际章节\n- 按需读取原文作为依据\n\n| 内容 | 来源 |\n|---|---|\n| 关键概念 | 当前文档 |\n\n```python\nif context:\n    answer(context)' }))
        socket.send(JSON.stringify({ v: 1, type: 'chat.delta', requestId: frame.requestId, seq: 4, delta: `\n\`\`\`\n\n这段说明来自原文。[${sourceId}]` }))
        socket.send(JSON.stringify({ v: 1, type: 'chat.done', requestId: frame.requestId, seq: 5, finishReason: 'stop' }))
      }
    })
  })
  await goto(page, DOC)
  await expect(page.locator('.markdown-section h2').first()).toBeVisible()
  const unpairedAssistant = await openAssistant(page)
  await unpairedAssistant.getByRole('button', { name: '打开 Note Bridge 连接设置', exact: true }).click()
  await expect(unpairedAssistant).toBeHidden()
  const connection = page.getByRole('dialog', { name: 'Note Bridge 连接', exact: true })
  await expect(connection).toBeVisible()
  await expect.poll(() => connection.evaluate(element => element.contains(document.activeElement))).toBe(true)
  await connection.getByRole('textbox', { name: '配对码', exact: true }).fill('123456')
  await connection.getByRole('button', { name: '连接 Note Bridge', exact: true }).click()
  await expect(connection.getByText('已连接 Note Bridge', { exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(connection).toBeHidden()
  let dialog = await openAssistant(page)
  await expect(dialog.locator('.el-dialog.knowledge-assistant-dialog')).toBeVisible()
  await expect(dialog.getByRole('button', { name: '复制提问', exact: true })).toHaveCount(0)
  await expect(dialog.getByRole('radiogroup')).toHaveCount(0)
  await expect(dialog.getByRole('textbox', { name: '配对码', exact: true })).toHaveCount(0)
  await dialog.getByRole('combobox', { name: '模型', exact: true }).selectOption('reasoner')
  await dialog.getByRole('combobox', { name: '思考强度', exact: true }).selectOption('high')
  await dialog.getByRole('textbox', { name: '你的问题', exact: true }).fill('这篇文章讲了什么？')
  await dialog.getByRole('button', { name: '发送问题', exact: true }).click()
  await expect(dialog.locator('.ai-markdown h2')).toHaveText('文档的关键结论')
  await expect(dialog.locator('.ai-markdown li')).toHaveCount(2)
  await expect(dialog.locator('.ai-markdown table td')).toHaveCount(2)
  await expect(dialog.locator('.ai-markdown pre code')).toHaveText('if context:\n    answer(context)')
  await expect(dialog.getByRole('button', { name: '复制代码', exact: true })).toBeVisible()
  await expect(dialog.locator('.qa-tool-calls .complete')).toHaveCount(2)
  await expect(dialog.getByRole('button', { name: '停止生成', exact: true })).toHaveCount(0)
  const start = requests.find(frame => frame.type === 'chat.start')
  expect(start.providerId).toBe('reasoner')
  expect(start.effort).toBe('high')
  expect(start.tools.map((tool: { name: string }) => tool.name)).toEqual(['get_document', 'get_toc', 'get_knowledge_network', 'get_related_documents', 'search_documents'])
  expect(start.context.documents[0].sources).toEqual([])
  expect(requests.filter(frame => frame.type === 'tool.result').every(frame => !frame.isError)).toBe(true)
  expect(requests.find(frame => frame.callId?.endsWith('-document')).result.data.text.length).toBeGreaterThan(0)
  const sidebar = await dialog.locator('.qa-sidebar').boundingBox()
  const main = await dialog.locator('.qa-main').boundingBox()
  expect(sidebar!.x + sidebar!.width).toBeLessThanOrEqual(main!.x + 1)
  const panel = await dialog.locator('.knowledge-assistant-dialog').boundingBox()
  expect(Math.abs(panel!.x - (page.viewportSize()!.width - panel!.width) / 2)).toBeLessThan(2)
  expect(Math.abs(panel!.y - (page.viewportSize()!.height - panel!.height) / 2)).toBeLessThan(2)
  const light = test.info().outputPath('assistant-desktop-light.png')
  await dialog.screenshot({ path: light })
  await test.info().attach('assistant-desktop-light', { path: light, contentType: 'image/png' })

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  const tools = await openNavigationTools(page)
  await tools.locator('.theme-row .el-switch').click()
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark')
  await page.keyboard.press('Escape')
  await expect(tools).toBeHidden()
  dialog = await openAssistant(page)
  await expect(dialog.locator('.ai-markdown h2')).toBeVisible()
  const dark = test.info().outputPath('assistant-desktop-dark.png')
  await dialog.screenshot({ path: dark })
  await test.info().attach('assistant-desktop-dark', { path: dark, contentType: 'image/png' })
  const citation = dialog.getByRole('navigation', { name: '回答来源' }).getByRole('link').first()
  const url = await citation.getAttribute('href')
  expect(url).toContain('.html?headingId=')
  expect(requests.filter(frame => frame.type === 'chat.start')).toHaveLength(1)
  disconnect()
  await expect.poll(() => requests.filter(frame => frame.type === 'auth').length).toBe(1)
  await expect(dialog.locator('.qa-connection')).toHaveText('已连接')
  await expect(dialog.locator('.ai-markdown h2')).toHaveText('文档的关键结论')
  await expect(dialog.getByRole('combobox', { name: '思考强度', exact: true })).toHaveValue('high')
  expect(requests.filter(frame => frame.type === 'chat.start')).toHaveLength(1)
  await citation.click()
  if (url?.includes('headingId=')) {
    const heading = new URL(url, 'http://localhost').searchParams.get('headingId')!
    await expect(page.locator('.main.markdown-section').locator(`[id=${JSON.stringify(heading)}]`)).toBeInViewport()
  }
})

test('聊天记录可新建切换删除，关闭重开与刷新恢复会话和模型偏好', async ({ page }) => {
  const requests: any[] = []
  await page.routeWebSocket('ws://127.0.0.1:19661/ws', socket => socket.onMessage(raw => {
    const frame = JSON.parse(String(raw))
    requests.push(frame)
    if (frame.type === 'pair' || frame.type === 'auth') socket.send(JSON.stringify(authResponse))
    if (frame.type === 'chat.start') {
      socket.send(JSON.stringify({ v: 1, type: 'chat.delta', requestId: frame.requestId, seq: 1, delta: `已回答：${frame.messages.at(-1).content}` }))
      socket.send(JSON.stringify({ v: 1, type: 'chat.done', requestId: frame.requestId, seq: 2, finishReason: 'stop' }))
    }
  }))
  await goto(page, DOC)
  await pairBridge(page)
  let dialog = await openAssistant(page)
  await dialog.getByRole('combobox', { name: '模型', exact: true }).selectOption('reasoner')
  await dialog.getByRole('combobox', { name: '思考强度', exact: true }).selectOption('high')
  await dialog.getByRole('textbox', { name: '你的问题', exact: true }).fill('第一段推导')
  await dialog.getByRole('textbox', { name: '你的问题', exact: true }).press('Enter')
  await expect(dialog.locator('.ai-markdown')).toContainText('已回答：第一段推导')
  await dialog.getByRole('button', { name: '新聊天', exact: true }).click()
  await expect(dialog.locator('.qa-empty')).toBeVisible()
  await dialog.getByRole('combobox', { name: '模型', exact: true }).selectOption('mock')
  await dialog.getByRole('combobox', { name: '思考强度', exact: true }).selectOption('low')
  await dialog.getByRole('textbox', { name: '你的问题', exact: true }).fill('第二段推导')
  await dialog.getByRole('button', { name: '发送问题', exact: true }).click()
  await expect(dialog.locator('.ai-markdown')).toContainText('已回答：第二段推导')
  await expect(dialog.locator('.qa-session-select')).toHaveCount(2)
  await dialog.locator('.qa-session-select').filter({ hasText: '第一段推导' }).click()
  await expect(dialog.locator('.qa-user-message')).toHaveText('你：第一段推导')
  await expect(dialog.getByRole('combobox', { name: '模型', exact: true })).toHaveValue('reasoner')
  await expect(dialog.getByRole('combobox', { name: '思考强度', exact: true })).toHaveValue('high')
  await dialog.locator('.qa-session-select').filter({ hasText: '第二段推导' }).click()
  await expect(dialog.getByRole('combobox', { name: '模型', exact: true })).toHaveValue('mock')
  await expect(dialog.getByRole('combobox', { name: '思考强度', exact: true })).toHaveValue('low')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('status', { name: 'Note Bridge 已连接', exact: true })).toBeVisible()
  dialog = await openAssistant(page)
  await expect(dialog.locator('.ai-markdown')).toContainText('已回答：第二段推导')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('status', { name: 'Note Bridge 已连接', exact: true })).toBeVisible()
  dialog = await openAssistant(page)
  await expect(dialog.locator('.qa-session-select')).toHaveCount(2)
  await expect(dialog.locator('.ai-markdown')).toContainText('已回答：第二段推导')
  await expect(dialog.getByRole('combobox', { name: '模型', exact: true })).toHaveValue('mock')
  await expect(dialog.getByRole('combobox', { name: '思考强度', exact: true })).toHaveValue('low')
  await dialog.locator('.qa-session').filter({ hasText: '第一段推导' }).hover()
  await dialog.getByRole('button', { name: '删除聊天：第一段推导', exact: true }).click()
  await expect(dialog.locator('.qa-session-select')).toHaveCount(1)
  await expect(dialog.locator('.qa-user-message')).toHaveText('你：第二段推导')
  expect(requests.filter(frame => frame.type === 'chat.start')).toHaveLength(2)
  expect(requests.filter(frame => frame.type === 'chat.start')[1].messages).toEqual([{ role: 'user', content: '第二段推导' }])
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
