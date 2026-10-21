import IdGenUtils from "@/core/util/IdGenUtils"
import type { MermaidConfig } from "mermaid"

type Mermaid = typeof import("mermaid").default

// mermaid 体积大（约800KB），延迟到页面真正出现图表时才加载
let mermaidPromise: Promise<Mermaid> | null = null
let loadedMermaid: Mermaid | null = null
let renderQueue: Promise<unknown> = Promise.resolve()
const sources = new WeakMap<Element, string>()
const renderVersions = new WeakMap<Element, number>()
let renderVersion = 0

function load(): Promise<Mermaid> {
  if (!mermaidPromise) {
    mermaidPromise = Promise.all([
      import("mermaid"),
      import("@fontsource-variable/recursive/crsv.css"),
    ]).then(async ([m]) => {
      // 与 mermaid.live 使用相同字体，先等字体就绪再测量 SVG 文本，加载失败时使用内置回退字体。
      await document.fonts?.load('14px "Recursive Variable"').catch(() => {})
      loadedMermaid = m.default
      loadedMermaid.initialize({startOnLoad: false})
      return loadedMermaid
    }).catch(err => {
      mermaidPromise = null
      throw err
    })
  }
  return mermaidPromise
}

function defaultTheme(mermaid: Mermaid, diagramType: string): NonNullable<MermaidConfig['theme']> {
  // 与 mermaid.live 一致：解析器 ID 与配置分支名称并非总是相同。
  const aliases: Record<string, string> = {
    'flowchart-v2': 'flowchart', 'flowchart-elk': 'flowchart',
    classDiagram: 'class', stateDiagram: 'state', xychart: 'xyChart',
    railroadAbnf: 'railroad', railroadEbnf: 'railroad', railroadPeg: 'railroad',
  }
  const defaults = mermaid.mermaidAPI.defaultConfig
  const section = defaults[(aliases[diagramType] ?? diagramType) as keyof MermaidConfig]
  return (section && typeof section === 'object' && 'theme' in section && typeof section.theme === 'string'
    ? section.theme : defaults.theme || 'default') as NonNullable<MermaidConfig['theme']>
}

function darkVariant(theme: string): NonNullable<MermaidConfig['theme']> {
  return (theme.includes('dark') ? theme : theme.startsWith('redux') ? theme.replace('redux', 'redux-dark') : 'dark') as NonNullable<MermaidConfig['theme']>
}

function render(id: string, source: string) {
  // Mermaid 的初始化配置是共享状态；识别图种、配置主题和渲染必须作为同一项排队。
  const task = renderQueue.then(async () => {
    const mermaid = await load()
    mermaid.initialize({startOnLoad: false})
    const parsed = await mermaid.parse(source)
    const theme = defaultTheme(mermaid, parsed ? parsed.diagramType : '')
    mermaid.initialize({
      startOnLoad: false,
      theme: document.documentElement.classList.contains('dark') ? darkVariant(theme) : theme,
    })
    // render 会重新应用图表源码中的 frontmatter/directive，保留作者显式设置。
    return mermaid.render(id, source)
  })
  renderQueue = task.catch(() => {})
  return task
}

function renderNode(v: Element) {
  const raw = sources.get(v) ?? v.textContent ?? ''
  sources.set(v, raw)
  const version = ++renderVersion
  renderVersions.set(v, version)
  v.classList.add('mermaid-rendering')
  // 正文与预览可能复用缓存的 HTML，为每次渲染分配独立 ID，避免覆盖已有 SVG。
  v.id = 'mermaid-' + IdGenUtils.uuid()
  const id = v.id + '-svg'
  return render(id, raw)
    .then(data => {
      if (renderVersions.get(v) !== version) return
      v.innerHTML = data.svg
      v.classList.add('mermaid-rendered')
    })
    .catch(err => {
      // 语法错误兜底: 渲染失败时回退展示原始代码并给出提示 不残留mermaid错误SVG
      document.getElementById('d' + id)?.remove()
      if (renderVersions.get(v) !== version) return
      v.classList.add('mermaid-render-error')
      const msg = document.createElement('div')
      msg.className = 'mermaid-error-msg'
      msg.textContent = 'Mermaid 图表渲染失败: ' + ((err as Error)?.message || String(err))
      const pre = document.createElement('pre')
      pre.textContent = raw
      v.replaceChildren(msg, pre)
    })
    .finally(() => {
      if (renderVersions.get(v) === version) v.classList.remove('mermaid-rendering')
    })
}

// 已显示和渲染中的图表也需更新；未加载时仍保持懒加载。
async function refreshTheme() {
  if (!loadedMermaid) return
  const nodes = document.querySelectorAll('.mermaid-source.mermaid-rendered, .mermaid-source.mermaid-rendering')
  await Promise.all(Array.from(nodes, renderNode))
}

async function initAllNode(root: ParentNode = document) {
  const nodeList = root.querySelectorAll('.mermaid-source:not(.mermaid-rendered):not(.mermaid-render-error):not(.mermaid-rendering)')
  if (nodeList.length === 0) {
    return
  }
  await load()
  // 仅渲染进入视口的图表 多图长文不再一次性渲染
  if (typeof IntersectionObserver === 'undefined') {
    await Promise.all(Array.from(nodeList, renderNode))
    return
  }
  const io = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        io.unobserve(entry.target)
        renderNode(entry.target)
      }
    }
  }, {rootMargin: '300px'})
  nodeList.forEach(v => io.observe(v))
}

export default {
  render,
  refreshTheme,
  initAllNode
}
