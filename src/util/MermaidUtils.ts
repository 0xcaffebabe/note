import mermaid from "mermaid"
import svgPanZoom from 'svg-pan-zoom'
import { SysUtils } from "./SysUtils"

function initWithDark() {
  mermaid.initialize({theme: 'dark', startOnLoad: false})
}

function initWithNormal() {
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

function initAllNode() {
  if (SysUtils.isDarkMode()) {
    initWithDark()
  } else {
    initWithNormal()
  }
  const nodeList = document.querySelectorAll('[id^=mermaid-]')
  nodeList.forEach(
    v => {
      mermaid.render(v.id + '-svg', v.textContent!)
        .then(data => {
          v.innerHTML = data.svg
        })
      }
    )
}

export default {
  initWithDark,
  initWithNormal,
  initAllNode
}

