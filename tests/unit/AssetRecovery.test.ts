import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'

const script = readFileSync(new URL('../../src/platform/web/assetRecovery.js', import.meta.url), 'utf8')
const currentUrl = 'https://note.test/current.html?source=history#saved-position'

function setup() {
  const window = new EventTarget()
  const replace = vi.fn()
  const timers: Array<() => void> = []
  runInNewContext(script, {
    window,
    location: { href: currentUrl, origin: new URL(currentUrl).origin, replace },
    navigator: { onLine: true },
    sessionStorage: { getItem: () => null, setItem() {} },
    URL,
    Date,
    setTimeout: (callback: () => void) => timers.push(callback),
  })
  const navigate = (path: string | null) => window.dispatchEvent(new CustomEvent('asset-recovery:navigation', { detail: path }))
  return { window, replace, timers, navigate }
}

describe('asset recovery destination', () => {
  it('recovers the pending route when its chunk fails before the address bar changes', () => {
    const { window, replace, timers, navigate } = setup()
    navigate('/tag.html?source=navigation#saved-tag')
    window.dispatchEvent(new Event('vite:preloadError'))
    // 路由错误结束导航，但浏览器地址仍是原文档；恢复必须保留失败时的目标。
    navigate(null)
    timers[0]()
    expect(replace).toHaveBeenCalledTimes(1)
    const target = new URL(replace.mock.calls[0][0])
    expect(target.pathname).toBe('/tag.html')
    expect(target.searchParams.get('source')).toBe('navigation')
    expect(target.searchParams.has('__asset_retry')).toBe(true)
    expect(target.hash).toBe('#saved-tag')
  })

  it.each([
    ['completed navigation', ['/tag.html', null]],
    ['external destination', ['https://other.test/tag.html']],
  ])('recovers the current page after %s', (_name, paths) => {
    const { window, replace, timers, navigate } = setup()
    for (const path of paths) navigate(path)
    window.dispatchEvent(new Event('vite:preloadError'))
    timers[0]()
    const target = new URL(replace.mock.calls[0][0])
    expect(target.origin + target.pathname).toBe('https://note.test/current.html')
    expect(target.searchParams.get('source')).toBe('history')
    expect(target.hash).toBe('#saved-position')
  })
})
