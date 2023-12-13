import mermaid from "mermaid"
import svgPanZoom from 'svg-pan-zoom'

function initWithDark() {
  mermaid.initialize({theme: 'dark', startOnLoad: false})
}

function initWithNormal() {
  mermaid.initialize({theme: 'default', startOnLoad: false})
}

function initAllNode() {
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

