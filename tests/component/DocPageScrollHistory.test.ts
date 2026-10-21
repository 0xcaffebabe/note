import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { saveReadRecord } = vi.hoisted(() => ({ saveReadRecord: vi.fn() }))
vi.mock('@/platform/web/service/DocService', () => ({
  default: { setDocReadRecrod: saveReadRecord },
}))
vi.mock('@/platform/web/util/MermaidUtils', () => ({ default: {} }))
vi.mock('@/platform/web/render/DocPostRender', () => ({ default: {} }))
vi.mock('element-plus', () => ({ ElMessage: {} }))
vi.mock('element-plus/es/components/message/style/css', () => ({}))

import DocPageEventManager from '@/platform/web/pages/doc/DocPageEventManager'

// 用真实 scroll 事件与虚拟时钟验证离开正文前后的保存边界，不挂载页面或渲染重型面板。
describe('DocPage 阅读位置滚动保存', () => {
  const originalScrollY = Object.getOwnPropertyDescriptor(window, 'scrollY')!
  let manager: DocPageEventManager
  let page: {
    doc: string
    loading: boolean
    loadError: boolean
    $route: { params: Record<string, string> }
    $refs: Record<string, unknown>
  }

  const scrollTo = (position: number) => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: position })
    document.dispatchEvent(new Event('scroll'))
  }

  beforeEach(() => {
    vi.useFakeTimers()
    saveReadRecord.mockReset()
    page = {
      doc: 'notes-a',
      loading: false,
      loadError: false,
      $route: { params: { docPath: 'notes/a.html' } },
      $refs: {},
    }
    manager = new DocPageEventManager(page as unknown as ConstructorParameters<typeof DocPageEventManager>[0])
    manager.registerScrollListener()
  })

  afterEach(() => {
    manager.removeAllScrollListener()
    vi.useRealTimers()
    Object.defineProperty(window, 'scrollY', originalScrollY)
  })

  it('成功加载的当前文档在停止滚动后保存最新位置', () => {
    scrollTo(120)
    vi.advanceTimersByTime(600)
    scrollTo(360)
    vi.advanceTimersByTime(999)
    expect(saveReadRecord).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(saveReadRecord).toHaveBeenCalledExactlyOnceWith('notes-a', 360)
  })

  it.each(['loading', 'loadError'] as const)('%s 状态的滚动不排队保存', state => {
    page[state] = true
    scrollTo(240)
    page[state] = false
    vi.advanceTimersByTime(1000)
    expect(saveReadRecord).not.toHaveBeenCalled()
  })

  it.each(['loading', 'loadError'] as const)('等待保存期间进入 %s 状态时不写记录', state => {
    scrollTo(240)
    page[state] = true
    vi.advanceTimersByTime(1000)
    expect(saveReadRecord).not.toHaveBeenCalled()
  })

  it('等待保存期间切换文档，不把新页的位置存给旧文档', () => {
    scrollTo(240)
    page.doc = 'notes-b'
    page.$route.params = { docPath: 'notes/b.html' }
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
    vi.advanceTimersByTime(1000)
    expect(saveReadRecord).not.toHaveBeenCalled()
    scrollTo(80)
    vi.advanceTimersByTime(1000)
    expect(saveReadRecord).toHaveBeenCalledExactlyOnceWith('notes-b', 80)
  })

  it('路由已离开正文时的滚动不排队保存', () => {
    page.$route.params = {}
    scrollTo(240)
    page.$route.params = { docPath: 'notes/a.html' }
    vi.advanceTimersByTime(1000)
    expect(saveReadRecord).not.toHaveBeenCalled()
  })

  it('路由在等待保存期间离开，旧页面尚未卸载也不写记录', () => {
    scrollTo(240)
    page.$route.params = {}
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
    vi.advanceTimersByTime(1000)
    expect(saveReadRecord).not.toHaveBeenCalled()
  })

  it('清理监听时取消待保存任务，并停止响应后续滚动', () => {
    scrollTo(240)
    manager.removeAllScrollListener()
    vi.advanceTimersByTime(1000)
    scrollTo(480)
    vi.advanceTimersByTime(1000)
    expect(saveReadRecord).not.toHaveBeenCalled()
  })
})
