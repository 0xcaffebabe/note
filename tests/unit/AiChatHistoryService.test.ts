import { describe, it, expect } from 'vitest'
import { AI_CHAT_HISTORY_KEY, AiChatHistoryService, type AiChatSession } from '@/core/service/AiChatHistoryService'
import { AI_EFFORTS } from '@/core/ports/AiBridgePort'
import type { StoragePort } from '@/core/ports/StoragePort'

class MemoryStorage implements StoragePort {
  values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}
function session(id = 'chat-1', docId?: string): AiChatSession {
  return { id, scope: 'knowledge_base', ...(docId ? { docId, docTitle: '测试文档' } : {}), title: '知识库有哪些主题', providerId: 'provider-1', model: 'model', effort: 'high', createdAt: 1, updatedAt: 2,
    turns: [{ id: 'turn-1', question: '问题', answer: '**回答** [D1S1]', status: 'complete', context: { scope: 'knowledge_base', documents: [] },
      sources: [{ sourceId: 'D1S1', title: '来源', url: '/doc/one.html?headingId=section' }], toolCalls: [{ callId: 'call-1', name: 'get_document', status: 'complete' }] }] }
}

describe('AiChatHistoryService', () => {
  it('刷新恢复多个会话、模型effort和来源，按更新顺序排列并可删除', () => {
    const storage = new MemoryStorage()
    const history = new AiChatHistoryService(storage)
    history.save(session())
    history.save({ ...session('chat-2', 'another-doc'), updatedAt: 4 })
    const refreshed = new AiChatHistoryService(storage)
    expect(refreshed.list().map(item => item.id)).toEqual(['chat-2', 'chat-1'])
    expect(refreshed.list()[1]).toEqual(session())
    refreshed.remove('chat-2')
    expect(refreshed.list()).toEqual([session()])
  })

  it('旧文档会话迁移为全局范围，保留历史、来源和原始文档信息，读取不改写存储', () => {
    const storage = new MemoryStorage()
    const { scope: _, ...legacy } = session('old-chat', 'old-doc')
    const original = JSON.stringify({ version: 1, sessions: [legacy] })
    storage.setItem(AI_CHAT_HISTORY_KEY, original)
    const history = new AiChatHistoryService(storage)
    expect(history.list()).toEqual([{ ...legacy, scope: 'knowledge_base' }])
    expect(storage.getItem(AI_CHAT_HISTORY_KEY)).toBe(original)
    history.save(history.list()[0])
    expect(JSON.parse(storage.getItem(AI_CHAT_HISTORY_KEY)!).sessions[0]).toMatchObject({ scope: 'knowledge_base', docId: 'old-doc', docTitle: '测试文档' })
    history.save(session())
    expect(history.list().find(item => item.id === 'chat-1')).not.toHaveProperty('docId')
  })

  it('拒绝未知会话和上下文范围，兼容旧的无范围文档上下文', () => {
    const storage = new MemoryStorage()
    const history = new AiChatHistoryService(storage)
    for (const unsafe of [{ ...session(), scope: 'outside' }, { ...session(), turns: [{ ...session().turns[0], context: { scope: 'outside', documents: [] } }] }]) {
      storage.setItem(AI_CHAT_HISTORY_KEY, JSON.stringify({ version: 1, sessions: [unsafe] }))
      expect(history.list()).toEqual([])
    }
    const compatible = session()
    compatible.turns[0].context = { documents: [] }
    storage.setItem(AI_CHAT_HISTORY_KEY, JSON.stringify({ version: 1, sessions: [compatible] }))
    expect(history.list()).toEqual([compatible])
  })

  it('兼容原有单模型记录并保存同一服务商的实际模型及扩展强度', () => {
    const storage = new MemoryStorage()
    storage.setItem(AI_CHAT_HISTORY_KEY, JSON.stringify({ version: 1, sessions: [session()] }))
    const history = new AiChatHistoryService(storage)
    expect(history.list()).toEqual([session()])
    for (const effort of AI_EFFORTS) {
      const saved = { ...session(), model: 'custom/gateway-model', effort }
      history.save(saved)
      expect(new AiChatHistoryService(storage).list()[0]).toEqual(saved)
    }
  })

  it('流式中刷新将部分回答标记中断，工具不会永久显示读取中', () => {
    const history = new AiChatHistoryService(new MemoryStorage())
    const partial = session()
    partial.turns[0].status = 'running'
    partial.turns[0].toolCalls[0].status = 'running'
    history.save(partial)
    expect(history.list()[0].turns[0]).toMatchObject({ answer: '**回答** [D1S1]', status: 'cancelled', cancelled: true,
      toolCalls: [{ status: 'error', message: '上次读取已中断' }] })
  })

  it('不持久化意外连接token，不加载带可执行或外站来源的历史', () => {
    const storage = new MemoryStorage()
    const history = new AiChatHistoryService(storage)
    history.save({ ...session(), token: 'must-never-store-bridge-token' } as AiChatSession)
    expect(storage.getItem(AI_CHAT_HISTORY_KEY)).not.toContain('must-never-store')
    for (const url of ['javascript:alert(1)', '//outside.test/doc.html', '/\\outside.test/doc.html', 'https://outside.test/doc.html']) {
      const unsafe = session()
      unsafe.turns[0].sources[0].url = url
      storage.setItem(AI_CHAT_HISTORY_KEY, JSON.stringify({ version: 1, sessions: [unsafe] }))
      expect(history.list()).toEqual([])
    }
  })

  it('工具概览在刷新后恢复并剔除额外字段，旧记录继续保持无概览', () => {
    const storage = new MemoryStorage()
    const history = new AiChatHistoryService(storage)
    const saved = session()
    const overview = { input: [{ label: '文档', value: '数据库事务' }], summary: '本次返回 1 / 5 个章节。', items: ['第 1 节：隔离级别'], note: '仍有章节未返回。' }
    saved.turns[0].toolCalls[0].overview = overview
    const unsafe = structuredClone(saved)
    Object.assign(unsafe.turns[0].toolCalls[0], { rawResult: 'private-result' })
    Object.assign(unsafe.turns[0].toolCalls[0].overview!, { text: 'private-text' })
    Object.assign(unsafe.turns[0].toolCalls[0].overview!.input[0], { token: 'private-token' })
    history.save(unsafe)
    expect(storage.getItem(AI_CHAT_HISTORY_KEY)).not.toContain('private-')
    expect(new AiChatHistoryService(storage).list()).toEqual([saved])
    // A modified persisted object also passes through field copying before reaching the UI or a later save.
    storage.setItem(AI_CHAT_HISTORY_KEY, JSON.stringify({ version: 1, sessions: [unsafe, session('legacy')] }))
    expect(history.list()).toEqual([saved, session('legacy')])
    history.save(history.list()[0])
    expect(storage.getItem(AI_CHAT_HISTORY_KEY)).not.toContain('private-')
    saved.turns[0].status = 'running'
    saved.turns[0].toolCalls[0].status = 'running'
    history.save(saved)
    expect(history.list()[0].turns[0].toolCalls[0]).toEqual({ callId: 'call-1', name: 'get_document', status: 'error', message: '上次读取已中断', overview })
  })

  it('概览字段超限或类型不符时拒绝保存且不会清空有效历史', () => {
    const storage = new MemoryStorage()
    const history = new AiChatHistoryService(storage)
    history.save(session())
    const original = storage.getItem(AI_CHAT_HISTORY_KEY)
    for (const overview of [{ input: [], items: Array(9).fill('title') }, { input: [], summary: 'a'.repeat(321) }, { input: [{ label: '文档', value: 123 }] }]) {
      const invalid = session('invalid')
      Object.assign(invalid.turns[0].toolCalls[0], { overview })
      expect(() => history.save(invalid)).toThrow('聊天记录格式无效')
      expect(storage.getItem(AI_CHAT_HISTORY_KEY)).toBe(original)
      storage.setItem(AI_CHAT_HISTORY_KEY, JSON.stringify({ version: 1, sessions: [session(), invalid] }))
      expect(history.list()).toEqual([session()])
      storage.setItem(AI_CHAT_HISTORY_KEY, original!)
    }
  })

  it('配额失败或记录过多时保留以前记录，明确报错而不清空', () => {
    const storage = new MemoryStorage()
    const history = new AiChatHistoryService(storage)
    history.save(session())
    const original = storage.getItem(AI_CHAT_HISTORY_KEY)
    const tooMany = session()
    tooMany.turns = Array.from({ length: 41 }, () => session().turns[0])
    expect(() => history.save(tooMany)).toThrow('40 轮')
    expect(storage.getItem(AI_CHAT_HISTORY_KEY)).toBe(original)
    const unavailable = new AiChatHistoryService({ getItem: () => original, setItem: () => {}, removeItem: () => {} })
    expect(() => unavailable.save(session('new'))).toThrow('无法保存')
    storage.setItem(AI_CHAT_HISTORY_KEY, '{broken')
    expect(() => history.save(session())).toThrow('格式损坏')
    expect(storage.getItem(AI_CHAT_HISTORY_KEY)).toBe('{broken')
  })
})
