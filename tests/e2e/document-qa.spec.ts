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
    { id: 'reasoner', name: '推理测试模型', protocol: 'chatCompletions', model: 'reasoning-model', models: [
      { id: 'reasoning-model', name: '默认推理模型', efforts: ['default', 'low'] },
      { id: 'gateway/reasoning-pro', name: '自定义推理模型', efforts: ['default', 'low', 'medium', 'high'] },
    ] },
  ] }

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

test('首页面向知识库提问，工具概览可展开并记住，跨文档来源可导航，断线不重发', async ({ page }) => {
  test.setTimeout(60000)
  const requests: any[] = []
  const documents = new Map<string, string[]>()
  const citedSources = new Map<string, string[]>()
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
        // The page contributes no document: the model discovers context through the catalog.
        expect(frame.context).toMatchObject({ scope: 'knowledge_base', documents: [] })
        socket.send(JSON.stringify({ v: 1, type: 'tool.call', requestId: frame.requestId, seq: 1, callId: `${frame.requestId}-overview`, name: 'get_knowledge_overview', arguments: { limit: 30 } }))
      }
      if (frame.type === 'tool.result' && frame.callId.endsWith('-overview')) {
        expect(frame.isError, JSON.stringify(frame.result)).toBe(false)
        expect(frame.result.data.totalDocuments).toBeGreaterThan(1)
        const found = frame.result.data.documents.map((item: { docId: string }) => item.docId)
        expect(new Set(found).size).toBeGreaterThan(1)
        const selected = [...new Set<string>(found)].slice(0, 2)
        documents.set(frame.requestId, selected)
        citedSources.set(frame.requestId, [])
        socket.send(JSON.stringify({ v: 1, type: 'tool.call', requestId: frame.requestId, seq: 2, callId: `${frame.requestId}-search`, name: 'search_documents', arguments: { query: selected[0], scope: 'catalog', limit: 5 } }))
      }
      if (frame.type === 'tool.result' && frame.callId.endsWith('-search')) {
        expect(frame.isError, JSON.stringify(frame.result)).toBe(false)
        const first = documents.get(frame.requestId)![0]
        expect(frame.result.data.documents.map((item: { docId: string }) => item.docId)).toContain(first)
        socket.send(JSON.stringify({ v: 1, type: 'tool.call', requestId: frame.requestId, seq: 3, callId: `${frame.requestId}-toc-0`, name: 'get_toc', arguments: { docId: first } }))
      }
      if (frame.type === 'tool.result' && /-toc-[01]$/.test(frame.callId)) {
        expect(frame.isError, JSON.stringify(frame.result)).toBe(false)
        const index = Number(frame.callId.at(-1))
        const heading = frame.result.data.headings.find((item: { headingId: string }) => item.headingId) || frame.result.data.headings[0]
        socket.send(JSON.stringify({ v: 1, type: 'tool.call', requestId: frame.requestId, seq: 4 + index * 2, callId: `${frame.requestId}-document-${index}`, name: 'get_document', arguments: { docId: documents.get(frame.requestId)![index], section: heading.section } }))
      }
      if (frame.type === 'tool.result' && /-document-[01]$/.test(frame.callId)) {
        expect(frame.isError, JSON.stringify(frame.result)).toBe(false)
        const index = Number(frame.callId.at(-1))
        citedSources.get(frame.requestId)!.push(frame.result.sources[0].sourceId)
        if (index === 0) {
          socket.send(JSON.stringify({ v: 1, type: 'tool.call', requestId: frame.requestId, seq: 5, callId: `${frame.requestId}-toc-1`, name: 'get_toc', arguments: { docId: documents.get(frame.requestId)![1] } }))
          return
        }
        socket.send(JSON.stringify({ v: 1, type: 'chat.delta', requestId: frame.requestId, seq: 7, delta: '## 知识库的综合结论\n\n- 通过全库检索发现相关文档\n- 跨文档读取原文作为依据\n\n| 内容 | 来源 |\n|---|---|\n| 关键概念 | 多篇文档 |\n\n```python\nif context:\n    answer(context)' }))
        socket.send(JSON.stringify({ v: 1, type: 'chat.delta', requestId: frame.requestId, seq: 8, delta: `\n\`\`\`\n\n这段说明综合了两篇原文。${citedSources.get(frame.requestId)!.map(id => `[${id}]`).join(' ')}` }))
        socket.send(JSON.stringify({ v: 1, type: 'chat.done', requestId: frame.requestId, seq: 9, finishReason: 'stop' }))
      }
    })
  })
  await goto(page, '/home.html')
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
  await dialog.getByRole('combobox', { name: '模型', exact: true }).selectOption(modelKey('reasoner', 'gateway/reasoning-pro'))
  await dialog.getByRole('combobox', { name: '思考强度', exact: true }).selectOption('high')
  await dialog.getByRole('textbox', { name: '你的问题', exact: true }).fill('请综合知识库中相关文档，解释它们的关键概念和联系。')
  await dialog.getByRole('button', { name: '发送问题', exact: true }).click()
  await expect(dialog.locator('.ai-markdown h2')).toHaveText('知识库的综合结论')
  await expect(dialog.locator('.ai-markdown li')).toHaveCount(2)
  await expect(dialog.locator('.ai-markdown table td')).toHaveCount(2)
  await expect(dialog.locator('.ai-markdown pre code')).toHaveText('if context:\n    answer(context)')
  await expect(dialog.getByRole('button', { name: '复制代码', exact: true })).toBeVisible()
  await expect(dialog.locator('.qa-tool-calls .complete')).toHaveCount(6)
  await expect(dialog.getByRole('button', { name: '停止生成', exact: true })).toHaveCount(0)
  const start = requests.find(frame => frame.type === 'chat.start')
  expect(start.providerId).toBe('reasoner')
  expect(start.model).toBe('gateway/reasoning-pro')
  expect(start.effort).toBe('high')
  expect(start.tools.map((tool: { name: string }) => tool.name)).toEqual(['get_document', 'get_toc', 'get_knowledge_network', 'get_related_documents', 'search_documents', 'get_knowledge_overview'])
  expect(start.context).toMatchObject({ scope: 'knowledge_base', documents: [] })
  await expect(dialog.getByRole('navigation', { name: '回答来源' }).getByRole('link')).toHaveCount(2)
  expect(requests.filter(frame => frame.type === 'tool.result').every(frame => !frame.isError)).toBe(true)
  expect(requests.find(frame => frame.callId?.endsWith('-document-0')).result.data.text.length).toBeGreaterThan(0)

  const toolCalls = dialog.locator('details.qa-tool-call')
  await expect(toolCalls).toHaveCount(6)
  await expect(dialog.locator('.qa-tool-overview:visible')).toHaveCount(0)
  const overviewData = requests.find(frame => frame.callId?.endsWith('-overview')).result.data
  const overview = toolCalls.nth(0)
  const overviewToggle = overview.locator('summary')
  await overviewToggle.click()
  await expect(overview.locator('.qa-tool-overview')).toBeVisible()
  await expect(overview.locator('.qa-tool-overview')).toContainText(`${overviewData.totalDocuments} 篇文档`)
  await expect(overview.locator('.qa-tool-overview')).toContainText(overviewData.categories[0].category === '(root)' ? '根目录' : overviewData.categories[0].category)
  await expect(overview.locator('.qa-tool-overview')).toContainText('仍有文档未返回')
  // Native disclosure controls remain usable by both keyboard activation keys.
  await overviewToggle.press('Enter')
  await expect(overview.locator('.qa-tool-overview')).toBeHidden()
  await overviewToggle.press('Space')
  await expect(overview.locator('.qa-tool-overview')).toBeVisible()
  await overviewToggle.press('Space')
  await expect(overview.locator('.qa-tool-overview')).toBeHidden()
  const searchData = requests.find(frame => frame.callId?.endsWith('-search')).result.data
  const searchOverview = toolCalls.nth(1).locator('.qa-tool-overview')
  await toolCalls.nth(1).locator('summary').click()
  await expect(searchOverview).toContainText(documents.get(start.requestId)![0])
  await expect(searchOverview).toContainText('文档标题与路径')
  await expect(searchOverview).toContainText(`${searchData.total} 篇匹配文档`)
  await expect(searchOverview).toContainText(searchData.documents[0].title)
  await toolCalls.nth(1).locator('summary').click()
  await expect(searchOverview).toBeHidden()
  const tocData = requests.find(frame => frame.callId?.endsWith('-toc-0')).result.data
  await toolCalls.nth(2).locator('summary').click()
  await expect(toolCalls.nth(2).locator('.qa-tool-overview')).toContainText(tocData.headings[0].title)
  await toolCalls.nth(2).locator('summary').click()
  const documentData = requests.find(frame => frame.callId?.endsWith('-document-0')).result.data
  await toolCalls.nth(3).locator('summary').click()
  await expect(toolCalls.nth(3).locator('.qa-tool-overview')).toContainText(documentData.title)
  await expect(toolCalls.nth(3).locator('.qa-tool-overview')).toContainText(documentData.sectionTitle)
  await expect(toolCalls.nth(3).locator('.qa-tool-overview')).toContainText(`${Array.from(documentData.text).length} 个字符`)
  await toolCalls.nth(3).locator('summary').click()
  await overviewToggle.click()
  await overviewToggle.scrollIntoViewIfNeeded()
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
  const darkOverview = dialog.locator('details.qa-tool-call').first()
  if (await darkOverview.getAttribute('open') === null) await darkOverview.locator('summary').click()
  await darkOverview.locator('summary').scrollIntoViewIfNeeded()
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
  await expect(dialog.locator('.ai-markdown h2')).toHaveText('知识库的综合结论')
  await expect(dialog.getByRole('combobox', { name: '思考强度', exact: true })).toHaveValue('high')
  expect(requests.filter(frame => frame.type === 'chat.start')).toHaveLength(1)
  await citation.click()
  if (url?.includes('headingId=')) {
    const heading = new URL(url, 'http://localhost').searchParams.get('headingId')!
    await expect(page.locator('.main.markdown-section').locator(`[id=${JSON.stringify(heading)}]`)).toBeInViewport()
  }
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('status', { name: 'Note Bridge 已连接', exact: true })).toBeVisible()
  dialog = await openAssistant(page)
  await expect(dialog.locator('details.qa-tool-call')).toHaveCount(6)
  await expect(dialog.locator('.qa-tool-overview:visible')).toHaveCount(0)
  const restoredSearch = dialog.locator('details.qa-tool-call').nth(1)
  await restoredSearch.locator('summary').click()
  await expect(restoredSearch.locator('.qa-tool-overview')).toContainText(documents.get(start.requestId)![0])
  await expect(restoredSearch.locator('.qa-tool-overview')).toContainText(searchData.documents[0].title)
  await expect(restoredSearch.locator('.qa-tool-overview')).toContainText(`${searchData.total} 篇匹配文档`)
  expect(requests.filter(frame => frame.type === 'chat.start')).toHaveLength(1)
  expect(requests.filter(frame => frame.type === 'tool.result')).toHaveLength(6)
})

test('全局聊天跨路由保留，新建切换删除、模型实时更新及刷新恢复偏好', async ({ page }) => {
  const requests: any[] = []
  const liveAuth = JSON.parse(JSON.stringify(authResponse))
  await page.routeWebSocket('ws://127.0.0.1:19661/ws', socket => socket.onMessage(raw => {
    const frame = JSON.parse(String(raw))
    requests.push(frame)
    if (frame.type === 'pair' || frame.type === 'auth') socket.send(JSON.stringify(liveAuth))
    if (frame.type === 'chat.start') {
      if (frame.providerId === 'reasoner') {
        liveAuth.providers[1].models[1].efforts = ['default', 'medium']
        liveAuth.providers[1].models[1].defaultEffort = 'medium'
        liveAuth.providers[1].models.push({ id: 'new-live-model', name: '新增模型', efforts: ['default'] })
        socket.send(JSON.stringify({ v: 1, type: 'providers.updated', providers: liveAuth.providers }))
      }
      socket.send(JSON.stringify({ v: 1, type: 'chat.delta', requestId: frame.requestId, seq: 1, delta: `已回答：${frame.messages.at(-1).content}` }))
      socket.send(JSON.stringify({ v: 1, type: 'chat.done', requestId: frame.requestId, seq: 2, finishReason: 'stop' }))
    }
  }))
  await goto(page, DOC)
  await pairBridge(page)
  let dialog = await openAssistant(page)
  await dialog.getByRole('combobox', { name: '模型', exact: true }).selectOption(modelKey('reasoner', 'gateway/reasoning-pro'))
  await dialog.getByRole('combobox', { name: '思考强度', exact: true }).selectOption('high')
  await dialog.getByRole('textbox', { name: '你的问题', exact: true }).fill('第一段推导')
  await dialog.getByRole('textbox', { name: '你的问题', exact: true }).press('Enter')
  await expect(dialog.locator('.ai-markdown')).toContainText('已回答：第一段推导')
  await expect(dialog.getByRole('combobox', { name: '模型', exact: true }).getByRole('option', { name: '新增模型 · new-live-model', exact: true })).toHaveCount(1)
  await expect(dialog.getByRole('combobox', { name: '思考强度', exact: true })).toHaveValue('medium')
  expect(requests.find(frame => frame.type === 'chat.start')).toMatchObject({ providerId: 'reasoner', model: 'gateway/reasoning-pro', effort: 'high' })
  expect(requests.filter(frame => frame.type === 'chat.cancel')).toHaveLength(0)
  await dialog.getByRole('button', { name: '新聊天', exact: true }).click()
  await expect(dialog.locator('.qa-empty')).toBeVisible()
  await dialog.getByRole('combobox', { name: '模型', exact: true }).selectOption(modelKey('mock', 'mock-model'))
  await dialog.getByRole('combobox', { name: '思考强度', exact: true }).selectOption('low')
  await dialog.getByRole('textbox', { name: '你的问题', exact: true }).fill('第二段推导')
  await dialog.getByRole('button', { name: '发送问题', exact: true }).click()
  await expect(dialog.locator('.ai-markdown')).toContainText('已回答：第二段推导')
  await expect(dialog.locator('.qa-session-select')).toHaveCount(2)
  await dialog.locator('.qa-session-select').filter({ hasText: '第一段推导' }).click()
  await expect(dialog.locator('.qa-user-message')).toHaveText('你：第一段推导')
  await expect(dialog.getByRole('combobox', { name: '模型', exact: true })).toHaveValue(modelKey('reasoner', 'gateway/reasoning-pro'))
  await expect(dialog.getByRole('combobox', { name: '思考强度', exact: true })).toHaveValue('medium')
  await dialog.locator('.qa-session-select').filter({ hasText: '第二段推导' }).click()
  await expect(dialog.getByRole('combobox', { name: '模型', exact: true })).toHaveValue(modelKey('mock', 'mock-model'))
  await expect(dialog.getByRole('combobox', { name: '思考强度', exact: true })).toHaveValue('low')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('status', { name: 'Note Bridge 已连接', exact: true })).toBeVisible()
  await page.locator('.navigation-launcher').focus()
  await page.keyboard.press('Enter')
  await page.getByRole('navigation', { name: '站内导航', exact: true }).getByRole('link', { name: '首页', exact: true }).click()
  await expect(page).toHaveURL(/\/home\.html$/)
  dialog = await openAssistant(page)
  await expect(dialog.locator('.ai-markdown')).toContainText('已回答：第二段推导')
  // Browser navigation while the modal is open keeps the same global conversation visible.
  await page.goBack()
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.ai-markdown')).toContainText('已回答：第二段推导')
  await expect(dialog.locator('.qa-session-select')).toHaveCount(2)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('status', { name: 'Note Bridge 已连接', exact: true })).toBeVisible()
  dialog = await openAssistant(page)
  await expect(dialog.locator('.qa-session-select')).toHaveCount(2)
  await expect(dialog.locator('.ai-markdown')).toContainText('已回答：第二段推导')
  await expect(dialog.getByRole('combobox', { name: '模型', exact: true })).toHaveValue(modelKey('mock', 'mock-model'))
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
