import mermaid from "mermaid"

function initWithDark() {
  mermaid.mermaidAPI.initialize({theme: 'dark', startOnLoad: true})
}

function initWithNormal() {
  mermaid.mermaidAPI.initialize({theme: 'default', startOnLoad: true})
}

function initAllNode() {
  mermaid.init(document.querySelectorAll('[id^=mermaid-]'))
}

export default {
  initWithDark,
  initWithNormal,
  initAllNode
}

