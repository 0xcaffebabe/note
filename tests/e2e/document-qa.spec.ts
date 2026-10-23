import { test, expect, goto, openNavigationTools, DOC } from './fixtures'

test('文档问答通过本机配对、流式回答与来源返回章节，断线不重发', async ({ page }) => {
  const requests: Record<string, unknown>[] = []
  let disconnect = () => {}
  await page.routeWebSocket('ws://127.0.0.1:19661/ws', socket => {
    disconnect = () => socket.close()
    socket.onMessage(raw => {
      const frame = JSON.parse(String(raw))
      requests.push(frame)
      if (frame.type === 'pair') {
        socket.send(JSON.stringify({ v: 1, type: 'pair.pending', pairingId: 'test-pair' }))
        socket.send(JSON.stringify({ v: 1, type: 'auth.ok', token: 'mock-memory-token', connectionId: 'test',
          providers: [{ id: 'mock', name: '本地测试模型', protocol: 'responses', model: 'mock-model' }] }))
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
  const tools = await openNavigationTools(page)
  await tools.getByRole('button', { name: /^知识助手/ }).click()
  const drawer = page.getByRole('dialog', { name: '模板生成问题', exact: true })
  await expect(drawer.getByRole('button', { name: '复制提问', exact: true })).toBeVisible()
  await drawer.getByRole('radiogroup', { name: '知识助手模式' }).getByText('文档问答', { exact: true }).click()
  await expect(drawer.getByRole('radio', { name: '文档问答', exact: true })).toBeChecked()
  await drawer.getByRole('textbox', { name: '配对码', exact: true }).fill('123456')
  await drawer.getByRole('button', { name: '连接 Note Bridge', exact: true }).click()
  await expect(drawer.getByText('已连接 Note Bridge', { exact: true })).toBeVisible()
  await drawer.getByRole('textbox', { name: '你的问题', exact: true }).fill('这篇文章讲了什么？')
  await drawer.getByRole('button', { name: '发送问题', exact: true }).click()
  await expect(drawer.getByText(/这是文档的关键结论/)).toBeVisible()
  const citation = drawer.getByRole('navigation', { name: '回答来源' }).getByRole('link').first()
  const url = await citation.getAttribute('href')
  expect(url).toContain('.html?headingId=')
  expect(requests.filter(frame => frame.type === 'chat.start')).toHaveLength(1)
  await test.info().attach('document-qa', { body: await drawer.screenshot(), contentType: 'image/png' })
  disconnect()
  await expect(drawer.getByRole('alert')).toContainText('重新配对')
  expect(requests.filter(frame => frame.type === 'chat.start')).toHaveLength(1)
  await citation.click()
  if (url?.includes('headingId=')) {
    const heading = new URL(url, 'http://localhost').searchParams.get('headingId')!
    await expect(page.locator('.main.markdown-section').locator(`[id=${JSON.stringify(heading)}]`)).toBeInViewport()
  }
})
