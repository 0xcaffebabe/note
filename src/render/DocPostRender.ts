import prism from 'prismjs'
import 'katex/dist/katex.css'
import { runInIdleBatches } from '@/util/IdleTaskUtils'

/**
 * 渲染管线的DOM后处理：代码高亮和公式渲染不阻塞markdown主体上屏，
 * 在内容渲染完成后利用空闲帧分片执行
 */

function highlightCode(rootEl: HTMLElement): () => void {
  const codeList = Array.from(rootEl.querySelectorAll('pre code[class*="language-"]')) as HTMLElement[]
  return runInIdleBatches(codeList, el => {
    let lang = Array.from(el.classList)
      .find(c => c.startsWith('language-'))
      ?.substring('language-'.length) || 'clike'
    if (!prism.languages[lang]) {
      lang = 'clike'
    }
    el.innerHTML = prism.highlight(el.textContent || '', prism.languages[lang], lang)
  })
}

// katex体积较大 仅在文档确实包含公式时才加载
function renderLatex(rootEl: HTMLElement): () => void {
  const texList = Array.from(rootEl.querySelectorAll('.tex')) as HTMLElement[]
  if (texList.length === 0) {
    return () => {}
  }
  let cancelled = false
  let cancelBatch: (() => void) | null = null
  import('katex').then(m => {
    if (cancelled) {
      return
    }
    const katex = m.default
    cancelBatch = runInIdleBatches(texList, element => {
      try {
        katex.render(
            // 如果在`%`字符前没有`\`字符，则在`%`前添加`\`后再渲染
            element.getAttribute("raw")!.replace(/[^\\](%)/g, (match)=>{return match[0] + '\\' + '%'}),
            element,
            {
                // 取消对中文内容渲染的警告
                strict: false,
                throwOnError: true,
            }
        )
      } catch(e) {
        element.innerHTML = `<span style='color:red'>${(e as Error).message}</span>`
      }
    })
  })
  return () => {
    cancelled = true
    cancelBatch?.()
  }
}

export default {
  highlightCode,
  renderLatex
}
