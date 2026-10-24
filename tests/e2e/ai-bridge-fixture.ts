import type { Page, WebSocketRoute } from '@playwright/test'
import type { AiSessionSummary, AiSessionTurn } from '../../src/core/ports/AiBridgePort'

export const bridgeAuth = { v: 2, type: 'auth.ok', token: 'mock-persistent-grant-token', connectionId: 'test', authorizationId: 'grant-test', capabilities: ['persistent_sessions', 'knowledge_tools'], providers: [
  { id: 'mock', name: '本地测试模型', protocol: 'responses', model: 'mock-model', efforts: ['default', 'low', 'medium', 'high'] },
  { id: 'reasoner', name: '推理测试模型', protocol: 'chatCompletions', model: 'reasoning-model', models: [
    { id: 'reasoning-model', name: '默认推理模型', efforts: ['default', 'low'] },
    { id: 'gateway/reasoning-pro', name: '自定义推理模型', efforts: ['default', 'low', 'medium', 'high'] },
  ] },
] }

/** Simulates the desktop process outside the page so sessions survive reloads and closed sockets. */
export async function persistentBridge(page: Page, options: { automatic?: boolean; answer?: string; sourceUrl?: string } = {}) {
  const frames: any[] = []
  const sessions: { session: AiSessionSummary; turns: AiSessionTurn[] }[] = []
  const sockets = new Map<WebSocketRoute, Set<string>>()
  let sequence = 0
  let newestSocket: WebSocketRoute | undefined
  const sourceUrl = options.sourceUrl || '/home.html'
  const answer = options.answer || '## 知识库的综合结论\n\n- 通过全库检索发现相关文档\n- 跨文档读取原文作为依据\n\n| 内容 | 来源 |\n|---|---|\n| 关键概念 | 文档 |\n\n```python\nif context:\n    answer(context)\n```\n\n这段说明来自知识站点。[D1S1]'
  function push(entry: typeof sessions[number], turn?: AiSessionTurn) {
    for (const [socket, subscribed] of sockets) if (subscribed.has(entry.session.id)) {
      socket.send(JSON.stringify({ v: 2, type: 'session.updated', sessionId: entry.session.id, revision: entry.session.revision, session: entry.session, ...(turn ? { turn } : {}) }))
    }
  }
  function changed() { for (const socket of sockets.keys()) socket.send(JSON.stringify({ v: 2, type: 'sessions.changed' })) }
  function finish(sessionId = sessions[0]?.session.id, cancelled = false) {
    const entry = sessions.find(item => item.session.id === sessionId)
    if (!entry?.turns.length) return
    const turn = entry.turns.at(-1)!
    turn.status = cancelled ? 'cancelled' : 'complete'
    if (!cancelled) turn.answer = answer
    entry.session.status = 'idle'; entry.session.revision++; entry.session.updatedAt = Date.now()
    push(entry, turn); changed()
  }
  await page.routeWebSocket('ws://127.0.0.1:19661/ws', socket => {
    newestSocket = socket
    const subscriptions = new Set<string>(); sockets.set(socket, subscriptions)
    socket.onClose(() => { sockets.delete(socket) })
    socket.onMessage(raw => {
      const frame = JSON.parse(String(raw)); frames.push(frame)
      const reply = (result: unknown) => socket.send(JSON.stringify({ v: 2, type: 'response', id: frame.id, result }))
      const fail = (code: string, message: string) => socket.send(JSON.stringify({ v: 2, type: 'response', id: frame.id, error: { code, message } }))
      if (frame.type === 'pair' || frame.type === 'auth') { socket.send(JSON.stringify(bridgeAuth)); return }
      if (frame.type === 'ping') { socket.send(JSON.stringify({ v: 2, type: 'pong' })); return }
      if (frame.type !== 'request') return
      const params = frame.params
      const entry = sessions.find(item => item.session.id === params.sessionId)
      if (frame.method === 'sessions.list') { reply({ sessions: sessions.map(item => item.session).sort((a, b) => b.updatedAt - a.updatedAt) }); return }
      if (frame.method === 'sessions.create') {
        const now = Date.now()
        const created = { session: { id: `session-${++sequence}`, title: '新聊天', ...params, createdAt: now, updatedAt: now, status: 'idle', revision: 1 } as AiSessionSummary, turns: [] as AiSessionTurn[] }
        sessions.unshift(created); reply(created.session); return
      }
      if (frame.method === 'knowledge.document') { reply({ docId: params.docId, title: '站点发布的文档', url: sourceUrl, contentHash: 'published-revision-hash', headings: [{ id: 'site-heading', title: '站点章节' }] }); return }
      if (!entry) { fail('not_found', '聊天不存在'); return }
      if (frame.method === 'sessions.get') { reply(entry); return }
      if (frame.method === 'session.subscribe') { subscriptions.add(entry.session.id); reply({ ok: true }); return }
      if (frame.method === 'session.unsubscribe') { subscriptions.delete(entry.session.id); reply({ ok: true }); return }
      if (frame.method === 'sessions.archive') {
        if (entry.session.status === 'running') { fail('busy', '请先停止生成再归档'); return }
        sessions.splice(sessions.indexOf(entry), 1); reply({ ok: true }); changed(); return
      }
      if (frame.method === 'runs.cancel') { finish(entry.session.id, true); reply({ ok: true }); return }
      if (frame.method === 'messages.send') {
        const turn: AiSessionTurn = { id: `turn-${++sequence}`, question: params.text, answer: '', status: 'running', createdAt: Date.now(),
          sources: [{ sourceId: 'D1S1', title: '站点文档 · 章节', url: sourceUrl, contentHash: 'published-revision-hash', revision: 'site-release-1' }],
          toolCalls: [{ callId: `tool-${sequence}`, name: 'search_documents', status: 'complete', overview: { input: [{ label: '查询词', value: params.text.slice(0, 200) }, { label: '范围', value: '整个知识库' }], summary: '已找到 2 篇文档', items: ['缓存设计', '缓存一致性'], note: '站点版本 site-release-1' } }] }
        entry.turns.push(turn)
        Object.assign(entry.session, { title: params.text.slice(0, 80), providerId: params.providerId, model: params.model, effort: params.effort, status: 'running', revision: entry.session.revision + 1, updatedAt: Date.now() })
        reply({ runId: `run-${sequence}`, turnId: turn.id }); push(entry, turn); changed()
        if (options.automatic !== false) finish(entry.session.id)
      }
    })
  })
  return { frames, sessions, finish, disconnect: () => newestSocket?.close() }
}
