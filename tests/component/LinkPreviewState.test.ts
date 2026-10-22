import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readLinkPreviewState, saveLinkPreviewState } from '@/platform/web/pages/doc/LinkPreviewState'

const first = { left: 120, top: 80, width: 400, height: 560, scrollTop: 230 }
const second = { left: 650, top: 110, width: 480, height: 420, scrollTop: 65 }

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('LinkPopover 文档状态持久化', () => {
  it('不同文档独立保存, 更新一个文档不覆盖其他文档', () => {
    saveLinkPreviewState('java-集合', first)
    saveLinkPreviewState('os-内存', second)
    expect(readLinkPreviewState('java-集合')).toEqual(first)
    expect(readLinkPreviewState('os-内存')).toEqual(second)

    saveLinkPreviewState('java-集合', { ...first, scrollTop: 720 })
    expect(readLinkPreviewState('java-集合')).toEqual({ ...first, scrollTop: 720 })
    expect(readLinkPreviewState('os-内存')).toEqual(second)
    expect(readLinkPreviewState('missing')).toBeNull()
  })

  it('保留负坐标和小数, 由显示层按当前视口夹紧', () => {
    const state = { ...first, left: -10.5, top: -2, scrollTop: 0 }
    saveLinkPreviewState('doc', state)
    expect(readLinkPreviewState('doc')).toEqual(state)
  })

  it.each([
    '{broken json',
    'null',
    '[]',
    JSON.stringify({ ...first, width: 0 }),
    JSON.stringify({ ...first, height: -1 }),
    JSON.stringify({ ...first, scrollTop: -1 }),
    JSON.stringify({ ...first, top: '80' }),
    JSON.stringify({ ...first, left: null }),
    JSON.stringify({ left: 1, top: 2, width: 300, height: 400 }),
    '{"left":1e400,"top":0,"width":300,"height":400,"scrollTop":0}',
  ])('损坏或无效状态降级为默认布局: %s', raw => {
    localStorage.setItem('link-preview::doc', raw)
    expect(readLinkPreviewState('doc')).toBeNull()
  })

  it('无效的写入不覆盖已保存的状态', () => {
    saveLinkPreviewState('doc', first)
    saveLinkPreviewState('doc', { ...second, width: Number.NaN })
    saveLinkPreviewState('doc', { ...second, scrollTop: Number.POSITIVE_INFINITY })
    expect(readLinkPreviewState('doc')).toEqual(first)
  })

  it('未解析出文档时不读写共享空键', () => {
    saveLinkPreviewState('', first)
    expect(readLinkPreviewState('')).toBeNull()
    expect(localStorage.length).toBe(0)
  })

  it('浏览器禁止读取存储时返回默认状态', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError')
    })
    expect(readLinkPreviewState('doc')).toBeNull()
  })

  it('配额耗尽时保留本次会话的新状态, 恢复后可再次持久化', () => {
    saveLinkPreviewState('quota-doc', first)
    const setter = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage full', 'QuotaExceededError')
    })
    expect(() => saveLinkPreviewState('quota-doc', second)).not.toThrow()
    expect(readLinkPreviewState('quota-doc')).toEqual(second)
    expect(JSON.parse(localStorage.getItem('link-preview::quota-doc')!)).toEqual(first)

    setter.mockRestore()
    saveLinkPreviewState('quota-doc', { ...second, scrollTop: 400 })
    expect(readLinkPreviewState('quota-doc')).toEqual({ ...second, scrollTop: 400 })
    localStorage.clear()
    expect(readLinkPreviewState('quota-doc')).toBeNull()
  })

  it('完全禁用存储时, 重新打开文档仍能恢复本次会话的状态', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError')
    })
    const state = { ...first }
    saveLinkPreviewState('blocked-doc', state)
    state.left = 999
    expect(readLinkPreviewState('blocked-doc')).toEqual(first)
    const restored = readLinkPreviewState('blocked-doc')!
    restored.scrollTop = 999
    expect(readLinkPreviewState('blocked-doc')).toEqual(first)
  })
})
