import mermaid from "mermaid"

function initWithDark() {
  mermaid.initialize({theme: 'dark', startOnLoad: true})
}

function initWithNormal() {
  mermaid.initialize({theme: 'default', startOnLoad: true})
}

function initAllNode() {
  mermaid.run({
    querySelector: '[id^=mermaid-]'
  })
}

export default {
  initWithDark,
  initWithNormal,
  initAllNode
}

