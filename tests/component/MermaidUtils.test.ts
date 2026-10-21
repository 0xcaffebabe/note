import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

const { render, initialize, isDarkMode } = vi.hoisted(() => ({
  render: vi.fn(async (id: string, _source: string) => ({ svg: `<svg id="${id}"></svg>` })),
  initialize: vi.fn(),
  isDarkMode: vi.fn(() => false),
}))
vi.mock('mermaid', () => ({ default: { initialize, render } }))
vi.mock('@/platform/web/util/SysUtils', () => ({ SysUtils: { isDarkMode } }))

import MermaidUtils from '@/platform/web/util/MermaidUtils'

beforeEach(() => {
  render.mockClear()
  initialize.mockClear()
  isDarkMode.mockReturnValue(false)
  vi.stubGlobal('IntersectionObserver', undefined)
  document.body.innerHTML = ''
})
afterEach(() => vi.unstubAllGlobals())

describe('Mermaid built-in themes', () => {
  it('uses the default theme for light documents without custom styling', async () => {
    document.body.innerHTML = '<div class="mermaid-source">graph TD; A-->B;</div>'
    await MermaidUtils.initAllNode()
    expect(initialize).toHaveBeenLastCalledWith({ theme: 'default', startOnLoad: false })
  })

  it('uses the built-in dark theme when rendering in dark mode', async () => {
    isDarkMode.mockReturnValue(true)
    document.body.innerHTML = '<div class="mermaid-source">graph TD; A-->B;</div>'
    await MermaidUtils.initAllNode()
    expect(initialize).toHaveBeenLastCalledWith({ theme: 'dark', startOnLoad: false })
  })

  it('restores the default theme after switching from dark to light', async () => {
    await MermaidUtils.load()
    MermaidUtils.initWithDark()
    expect(initialize).toHaveBeenLastCalledWith({ theme: 'dark', startOnLoad: false })
    MermaidUtils.initWithNormal()
    expect(initialize).toHaveBeenLastCalledWith({ theme: 'default', startOnLoad: false })
  })
})

describe('Mermaid rendering containers', () => {
  it('renders only the requested preview and leaves the main document untouched', async () => {
    document.body.innerHTML = `
      <main><div id="mermaid-main" class="mermaid-source">graph TD; A-->B;</div></main>
      <aside><div id="mermaid-preview" class="mermaid-source">graph TD; C-->D;</div></aside>`
    await MermaidUtils.initAllNode(document.querySelector('aside')!)
    expect(render).toHaveBeenCalledTimes(1)
    expect(render.mock.calls[0][1]).toBe('graph TD; C-->D;')
    expect(document.querySelector('main svg')).toBeNull()
    expect(document.querySelector('aside svg')).not.toBeNull()
  })

  it('uses distinct SVG IDs when the main document and preview share cached HTML', async () => {
    const cached = '<div id="mermaid-cached" class="mermaid-source">graph TD; A-->B;</div>'
    document.body.innerHTML = `<main>${cached}</main><aside>${cached}</aside>`
    await MermaidUtils.initAllNode(document.querySelector('main')!)
    await MermaidUtils.initAllNode(document.querySelector('aside')!)
    expect(render).toHaveBeenCalledTimes(2)
    expect(render.mock.calls[0][0]).not.toBe(render.mock.calls[1][0])
    const ids = Array.from(document.querySelectorAll('[id]'), el => el.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('keeps existing SVGs intact when initializing the document again', async () => {
    document.body.innerHTML = '<div id="mermaid-cached" class="mermaid-source">graph TD; A-->B;</div>'
    await MermaidUtils.initAllNode()
    const svg = document.querySelector('svg')
    await MermaidUtils.initAllNode()
    expect(render).toHaveBeenCalledTimes(1)
    expect(document.querySelector('svg')).toBe(svg)
  })
})
