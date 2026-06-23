import { SysUtils } from "./SysUtils"

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
  mermaid.initialize({
    theme: 'base', startOnLoad: false,
    themeVariables: {
        background: '#ffffff',
        primaryColor: '#ffffff',
        primaryTextColor: '#171717', // Neutral 900
        primaryBorderColor: '#e5e5e5', // Neutral 200
        lineColor: '#737373', // Neutral 500
        secondaryColor: '#fafafa',
        tertiaryColor: '#f5f5f5',
        fontFamily: '"Inter", "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '14px',
      },
    themeCSS: `
        .node rect, .node circle, .node polygon, .node path { stroke-width: 1.5px; }
        .edgePath .path { stroke-width: 1.5px; }
        .cluster rect { stroke-dasharray: 4 4; stroke: #d4d4d4; fill: #fafafa; }

        /* XYChart styles - Sophisticated muted tones */
        .line-plot-0 path { stroke: #5B7C99 !important; stroke-width: 3px !important; } /* Muted slate blue */
        .line-plot-1 path { stroke: #6B9080 !important; stroke-width: 3px !important; } /* Sage green */
        .line-plot-2 path { stroke: #C17C74 !important; stroke-width: 3px !important; } /* Dusty rose */
        .bar-plot-0 rect { fill: #A8C5DD !important; stroke: #5B7C99 !important; stroke-width: 1.5px !important; }
        .bar-plot-1 rect { fill: #B8CEC2 !important; stroke: #6B9080 !important; stroke-width: 1.5px !important; }
        .bar-plot-2 rect { fill: #E0BAB5 !important; stroke: #C17C74 !important; stroke-width: 1.5px !important; }
        .chart-title text { fill: #171717 !important; font-weight: 600 !important; font-size: 20px !important; }
        .left-axis .label text, .bottom-axis .label text { fill: #171717 !important; font-size: 14px !important; }
        .left-axis .title text { fill: #525252 !important; font-size: 16px !important; }
        .bottom-axis .title text { fill: #525252 !important; font-size: 16px !important; }
      `
  })
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

async function initAllNode() {
  const nodeList = document.querySelectorAll('[id^=mermaid-]:not(.mermaid-rendered):not(.mermaid-render-error)')
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
