import { SysUtils } from "./SysUtils"
import IdGenUtils from "@/core/util/IdGenUtils"

type Mermaid = typeof import("mermaid").default

// mermaid 体积大（约800KB），延迟到页面真正出现图表时才加载
let mermaidPromise: Promise<Mermaid> | null = null
let loadedMermaid: Mermaid | null = null

function load(): Promise<Mermaid> {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then(m => {
      loadedMermaid = m.default
      applyCurrentTheme(loadedMermaid)
      return loadedMermaid
    })
  }
  return mermaidPromise
}

function applyCurrentTheme(mermaid: Mermaid) {
  if (SysUtils.isDarkMode()) {
    applyDarkTheme(mermaid)
  } else {
    applyNormalTheme(mermaid)
  }
}

function applyDarkTheme(mermaid: Mermaid) {
  mermaid.initialize({theme: 'dark', startOnLoad: false})
}

function applyNormalTheme(mermaid: Mermaid) {
  mermaid.initialize({theme: 'default', startOnLoad: false})
}

// 主题切换时只需重配已加载的实例；未加载则等首次渲染时按当前主题初始化
function initWithDark() {
  if (loadedMermaid) {
    applyDarkTheme(loadedMermaid)
  }
}

function initWithNormal() {
  if (loadedMermaid) {
    applyNormalTheme(loadedMermaid)
  }
}

function renderNode(mermaid: Mermaid, v: Element) {
  const raw = v.textContent!
  // 正文与预览可能复用缓存的 HTML，为每次渲染分配独立 ID，避免覆盖已有 SVG。
  v.id = 'mermaid-' + IdGenUtils.uuid()
  mermaid.render(v.id + '-svg', raw)
    .then(data => {
      v.innerHTML = data.svg
      v.classList.add('mermaid-rendered')
    })
    .catch(err => {
      // 语法错误兜底: 渲染失败时回退展示原始代码并给出提示 不残留mermaid错误SVG
      document.getElementById('d' + v.id + '-svg')?.remove()
      v.classList.add('mermaid-render-error')
      const msg = document.createElement('div')
      msg.className = 'mermaid-error-msg'
      msg.textContent = 'Mermaid 图表渲染失败: ' + ((err as Error)?.message || String(err))
      const pre = document.createElement('pre')
      pre.textContent = raw
      v.replaceChildren(msg, pre)
    })
}

async function initAllNode(root: ParentNode = document) {
  const nodeList = root.querySelectorAll('.mermaid-source:not(.mermaid-rendered):not(.mermaid-render-error)')
  if (nodeList.length === 0) {
    return
  }
  const mermaid = await load()
  applyCurrentTheme(mermaid)
  // 仅渲染进入视口的图表 多图长文不再一次性渲染
  if (typeof IntersectionObserver === 'undefined') {
    nodeList.forEach(v => renderNode(mermaid, v))
    return
  }
  const io = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        io.unobserve(entry.target)
        renderNode(mermaid, entry.target)
      }
    }
  }, {rootMargin: '300px'})
  nodeList.forEach(v => io.observe(v))
}

export default {
  load,
  initWithDark,
  initWithNormal,
  initAllNode
}
