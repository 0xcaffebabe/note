import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readLinkPreviewState, saveLinkPreviewState, readPinnedLinkPreviews, savePinnedLinkPreviews, readRestorableLinkPreviews, saveRestorableLinkPreviews } from '@/platform/web/pages/doc/LinkPreviewState'

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

describe('LinkPopover 固定及隐藏状态恢复列表', () => {
  const key = 'link-preview:restorable-documents'
  const visible = { docId: 'java-集合', pinned: true, minimized: false }
  const hidden = { docId: 'os-内存', pinned: false, minimized: true }

  beforeEach(() => {
    savePinnedLinkPreviews([])
    saveRestorableLinkPreviews([])
  })

  it('保存部分隐藏、固定状态和层叠顺序，跳过显示中的临时卡片', () => {
    saveRestorableLinkPreviews([hidden, visible, { docId: 'temp', pinned: false, minimized: false }])
    expect(readRestorableLinkPreviews()).toEqual([hidden, visible])
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual([hidden, visible])
    saveRestorableLinkPreviews([visible, { ...hidden, pinned: true }])
    expect(readRestorableLinkPreviews()).toEqual([visible, { ...hidden, pinned: true }])
  })

  it('全部隐藏可以恢复，显示临时卡片或关闭后删除对应记录', () => {
    saveRestorableLinkPreviews([{ ...visible, minimized: true }, hidden])
    expect(readRestorableLinkPreviews()).toEqual([{ ...visible, minimized: true }, hidden])
    saveRestorableLinkPreviews([visible, { ...hidden, minimized: false }])
    expect(readRestorableLinkPreviews()).toEqual([visible])
    saveRestorableLinkPreviews([])
    expect(readRestorableLinkPreviews()).toEqual([])
  })

  it('首次升级迁移原固定列表，清空后的新记录不重新读取旧卡片', () => {
    savePinnedLinkPreviews(['java-集合', 'os-内存'])
    localStorage.removeItem(key)
    expect(readRestorableLinkPreviews()).toEqual([visible, { ...hidden, pinned: true, minimized: false }])
    saveRestorableLinkPreviews([])
    expect(readRestorableLinkPreviews()).toEqual([])
  })

  it.each(['{broken', 'null', '{}', '"doc"'])('损坏的新记录返回空列表: %s', raw => {
    savePinnedLinkPreviews(['java-集合'])
    localStorage.setItem(key, raw)
    expect(readRestorableLinkPreviews()).toEqual([])
  })

  it('过滤无效条目和重复身份，不接受非布尔状态', () => {
    localStorage.setItem(key, JSON.stringify([
      null, [], 12, {}, { ...visible, docId: '/invalid' },
      { ...visible, pinned: 'true' }, { ...hidden, minimized: 1 },
      visible, { ...visible, minimized: true }, hidden,
    ]))
    expect(readRestorableLinkPreviews()).toEqual([visible, hidden])
    saveRestorableLinkPreviews(null as unknown as typeof visible[])
    expect(readRestorableLinkPreviews()).toEqual([visible, hidden])
  })

  it('配额耗尽时保留独立的会话快照，恢复存储后能保存及清空', () => {
    saveRestorableLinkPreviews([visible])
    const setter = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage full', 'QuotaExceededError')
    })
    const cards = [{ ...hidden }]
    saveRestorableLinkPreviews(cards)
    cards[0].minimized = false
    const restored = readRestorableLinkPreviews()
    restored[0].docId = 'changed'
    expect(readRestorableLinkPreviews()).toEqual([hidden])
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual([visible])
    setter.mockRestore()
    saveRestorableLinkPreviews([])
    expect(readRestorableLinkPreviews()).toEqual([])
  })

  it('完全禁用存储时仍可保存并恢复隐藏状态', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError')
    })
    expect(() => saveRestorableLinkPreviews([hidden])).not.toThrow()
    expect(readRestorableLinkPreviews()).toEqual([hidden])
    saveRestorableLinkPreviews([])
  })
})

describe('LinkPopover 固定卡片恢复列表', () => {
  const key = 'link-preview:pinned-documents'

  beforeEach(() => savePinnedLinkPreviews([]))

  it('按层叠顺序保存多篇文档, 重新置顶时更新顺序', () => {
    savePinnedLinkPreviews(['java-集合', 'os-内存'])
    expect(readPinnedLinkPreviews()).toEqual(['java-集合', 'os-内存'])
    savePinnedLinkPreviews(['os-内存', 'java-集合'])
    expect(readPinnedLinkPreviews()).toEqual(['os-内存', 'java-集合'])
    expect(readLinkPreviewState('java-集合')).toBeNull()
  })

  it('取消固定或关闭后删除文档, 清空列表不会恢复旧卡片', () => {
    savePinnedLinkPreviews(['java-集合', 'os-内存'])
    savePinnedLinkPreviews(['os-内存'])
    expect(readPinnedLinkPreviews()).toEqual(['os-内存'])
    savePinnedLinkPreviews([])
    expect(readPinnedLinkPreviews()).toEqual([])
  })

  it('列表命名空间与名为 pinned 的文档布局互不覆盖', () => {
    saveLinkPreviewState('pinned', first)
    savePinnedLinkPreviews(['pinned', 'os-内存'])
    expect(readPinnedLinkPreviews()).toEqual(['pinned', 'os-内存'])
    expect(readLinkPreviewState('pinned')).toEqual(first)
  })

  it.each(['{broken', 'null', '{}', '"java-集合"', '12'])('损坏的列表返回空数组: %s', raw => {
    localStorage.setItem(key, raw)
    expect(readPinnedLinkPreviews()).toEqual([])
  })

  it('读取时跳过无效身份, 去重并保留合法文档顺序', () => {
    localStorage.setItem(key, JSON.stringify([
      'java-集合', null, '', 12, {}, 'java-集合', ' ', '/doc/one', 'a?query', 'b#heading', 'c\\file', 'os-内存',
    ]))
    expect(readPinnedLinkPreviews()).toEqual(['java-集合', 'os-内存'])
  })

  it('写入时清理重复及无效条目, 非数组不覆盖已有列表', () => {
    savePinnedLinkPreviews(['java-集合', '', 'java-集合', 'os-内存'])
    savePinnedLinkPreviews(null as unknown as string[])
    expect(readPinnedLinkPreviews()).toEqual(['java-集合', 'os-内存'])
  })

  it('读取被禁用时返回空列表', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError')
    })
    expect(readPinnedLinkPreviews()).toEqual([])
  })

  it('配额耗尽时保留会话内的顺序及清空操作, 存储恢复后解除降级', () => {
    savePinnedLinkPreviews(['java-集合'])
    const setter = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage full', 'QuotaExceededError')
    })
    savePinnedLinkPreviews(['os-内存', 'java-集合'])
    expect(readPinnedLinkPreviews()).toEqual(['os-内存', 'java-集合'])
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual(['java-集合'])
    savePinnedLinkPreviews([])
    expect(readPinnedLinkPreviews()).toEqual([])
    setter.mockRestore()
    savePinnedLinkPreviews(['os-内存'])
    localStorage.clear()
    expect(readPinnedLinkPreviews()).toEqual([])
  })

  it('完全禁用存储时读写不抛错, 外部修改不会改变会话快照', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError')
    })
    const docIds = ['java-集合', 'os-内存']
    expect(() => savePinnedLinkPreviews(docIds)).not.toThrow()
    docIds.reverse()
    const restored = readPinnedLinkPreviews()
    restored.pop()
    expect(readPinnedLinkPreviews()).toEqual(['java-集合', 'os-内存'])
  })
})
