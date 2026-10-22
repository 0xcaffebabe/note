import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import EventBus from '@/platform/web/components/EventBus'
import { showLinkPreview } from '@/platform/web/pages/doc/LinkPreview'

const onPreview = vi.fn()
const originalPath = window.location.pathname + window.location.search + window.location.hash

beforeEach(() => {
  window.history.replaceState(null, '', '/current/nested/document.html?headingId=old')
  onPreview.mockClear()
  EventBus.on('show-link-preview', onPreview)
})

afterEach(() => {
  EventBus.off('show-link-preview', onPreview)
  window.history.replaceState(null, '', originalPath)
})

describe('showLinkPreview', () => {
  it.each([
    './%E5%89%8D%E7%AB%AF/Vue-router.md',
    '前端/Vue-router.md',
    '/前端/Vue-router.md',
    './doc/前端/Vue-router.md',
    '/doc/前端/Vue-router.md',
    '/前端/Vue-router.html',
    '/%E5%89%8D%E7%AB%AF/Vue-router.html?headingId=one#two',
  ])('使用统一文档身份发送预览请求：%s', link => {
    showLinkPreview(link, 120, 240)

    expect(onPreview).toHaveBeenCalledExactlyOnceWith({
      docId: '前端-Vue@@router',
      docLink: '/前端/Vue-router.md',
      x: 120,
      y: 240,
    })
  })

  it('同源绝对地址使用相同身份，剥离查询参数和锚点', () => {
    showLinkPreview(window.location.origin + '/java/集合.md?view=preview#HashMap', 0, 0)

    expect(onPreview).toHaveBeenCalledExactlyOnceWith({
      docId: 'java-集合',
      docLink: '/java/集合.md',
      x: 0,
      y: 0,
    })
  })

  it.each([
    'https://other.example/java/集合.html',
    '//other.example/java/集合.md',
    'javascript:alert(1)',
    'data:text/html,preview.html',
    '/image.svg?file=preview.md',
    '#only-a-heading',
    '',
    'http://[invalid',
  ])('忽略非站内文档和损坏的链接：%s', link => {
    expect(() => showLinkPreview(link, 10, 20)).not.toThrow()
    expect(onPreview).not.toHaveBeenCalled()
  })
})
