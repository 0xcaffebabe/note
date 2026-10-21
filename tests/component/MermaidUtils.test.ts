import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

const { render, parse, initialize, defaultConfig } = vi.hoisted(() => ({
  render: vi.fn(async (id: string, _source: string) => ({ svg: `<svg id="${id}"></svg>` })),
  parse: vi.fn(async (source: string) => ({ diagramType: source.startsWith('pie') ? 'pie' : 'flowchart-v2', config: {} })),
  initialize: vi.fn(),
  defaultConfig: Object.freeze({
    theme: 'default',
    look: 'classic',
    flowchart: Object.freeze({ theme: 'redux-color', look: 'neo' }),
    sequence: Object.freeze({ theme: 'redux-color', look: 'neo' }),
    pie: Object.freeze({ useMaxWidth: true }),
  }),
}))
vi.mock('mermaid', () => ({ default: { initialize, render, parse, mermaidAPI: { defaultConfig } } }))
vi.mock('@fontsource-variable/recursive/crsv.css', () => ({}))

import MermaidUtils from '@/platform/web/util/MermaidUtils'

beforeEach(() => {
  render.mockReset()
  render.mockImplementation(async (id: string, _source: string) => ({ svg: `<svg id="${id}"></svg>` }))
  initialize.mockClear()
  parse.mockReset()
  parse.mockImplementation(async (source: string) => ({ diagramType: source.startsWith('pie') ? 'pie' : 'flowchart-v2', config: {} }))
  document.documentElement.classList.remove('dark')
  localStorage.clear()
  vi.stubGlobal('IntersectionObserver', undefined)
  document.body.innerHTML = ''
})
afterEach(() => vi.unstubAllGlobals())

describe('Mermaid built-in themes', () => {
  it('lets Mermaid choose each diagram type default instead of pinning the legacy theme', async () => {
    document.body.innerHTML = '<div class="mermaid-source">graph TD; A-->B;</div>'
    await MermaidUtils.initAllNode()
    expect(initialize).toHaveBeenLastCalledWith({ theme: 'redux-color', startOnLoad: false })
  })

  it('maps diagram defaults to dark counterparts, including system dark mode without a saved preference', async () => {
    document.documentElement.classList.add('dark')
    document.body.innerHTML = '<div class="mermaid-source">graph TD; A-->B;</div>'
    await MermaidUtils.initAllNode()
    expect(localStorage.getItem('system::theme')).toBeNull()
    expect(initialize).toHaveBeenLastCalledWith({
      theme: 'redux-dark-color', startOnLoad: false,
    })
    expect(defaultConfig.flowchart).toEqual({ theme: 'redux-color', look: 'neo' })
  })

  it('restores the default theme after switching from dark to light', async () => {
    document.body.innerHTML = '<div class="mermaid-source">graph TD; A-->B;</div>'
    await MermaidUtils.initAllNode()
    document.documentElement.classList.add('dark')
    await MermaidUtils.refreshTheme()
    expect(initialize).toHaveBeenLastCalledWith({ theme: 'redux-dark-color', startOnLoad: false })
    document.documentElement.classList.remove('dark')
    await MermaidUtils.refreshTheme()
    expect(initialize).toHaveBeenLastCalledWith({ theme: 'redux-color', startOnLoad: false })
  })

  it('keeps per-diagram configuration and rendering together for mixed diagram types', async () => {
    const themes: string[] = []
    render.mockImplementation(async (id: string) => {
      themes.push(initialize.mock.lastCall![0].theme)
      return { svg: `<svg id="${id}"></svg>` }
    })
    await Promise.all([
      MermaidUtils.render('flow-svg', 'graph TD; A-->B;'),
      MermaidUtils.render('pie-svg', 'pie\n "A": 1'),
    ])
    expect(themes).toEqual(['redux-color', 'default'])
  })

  it('continues rendering after an invalid diagram rejects', async () => {
    parse.mockRejectedValueOnce(new Error('Invalid diagram'))
    await expect(MermaidUtils.render('bad', 'invalid')).rejects.toThrow('Invalid diagram')
    await expect(MermaidUtils.render('good', 'graph TD; A-->B;')).resolves.toEqual({ svg: '<svg id="good"></svg>' })
  })

  it('repaints the main document and preview from their original sources after a theme change', async () => {
    document.body.innerHTML = '<main><div class="mermaid-source">graph TD; A-->B;</div></main><aside><div class="mermaid-source">pie\n "A": 1</div></aside>'
    await MermaidUtils.initAllNode()
    const oldIds = Array.from(document.querySelectorAll('svg'), el => el.id)
    render.mockClear()
    document.documentElement.classList.add('dark')
    await MermaidUtils.refreshTheme()
    expect(render.mock.calls.map(call => call[1])).toEqual(['graph TD; A-->B;', 'pie\n "A": 1'])
    expect(Array.from(document.querySelectorAll('svg'), el => el.id)).not.toEqual(oldIds)
    expect(document.querySelectorAll('.mermaid-rendering')).toHaveLength(0)
  })

  it('ignores a late render result when the theme changed while it was rendering', async () => {
    let finishOld!: (value: { svg: string }) => void
    render.mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve }))
    document.body.innerHTML = '<div class="mermaid-source">graph TD; A-->B;</div>'
    const first = MermaidUtils.initAllNode()
    await vi.waitFor(() => expect(render).toHaveBeenCalledTimes(1))
    document.documentElement.classList.add('dark')
    const updated = MermaidUtils.refreshTheme()
    finishOld({ svg: '<svg id="stale-light-svg"></svg>' })
    await Promise.all([first, updated])
    expect(document.querySelector('svg')!.id).toBe(render.mock.calls[1][0])
    expect(document.getElementById('stale-light-svg')).toBeNull()
    expect(document.querySelectorAll('.mermaid-rendering')).toHaveLength(0)
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
