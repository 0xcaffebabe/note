import prism from 'prismjs'
import 'katex/dist/katex.css'
import { runInIdleBatches } from '@/util/IdleTaskUtils'

/**
 * 渲染管线的DOM后处理：代码高亮和公式渲染不阻塞markdown主体上屏，
 * 在内容渲染完成后利用空闲帧分片执行
 */

// 常见语言别名归一: 避免别名未命中而错误回退clike
const LANG_ALIAS: Record<string, string> = {
  sh: 'bash', shell: 'bash', zsh: 'bash', 'shell-session': 'bash',
  yml: 'yaml',
  dockerfile: 'docker',
  js: 'javascript', mjs: 'javascript', cjs: 'javascript', node: 'javascript',
  ts: 'typescript',
  html: 'markup', xml: 'markup', svg: 'markup', vue: 'markup',
  py: 'python',
  golang: 'go',
  conf: 'nginx',
}

function highlightCode(rootEl: HTMLElement): () => void {
  const codeList = Array.from(rootEl.querySelectorAll('pre code[class*="language-"]')) as HTMLElement[]
  return runInIdleBatches(codeList, el => {
    let lang = Array.from(el.classList)
      .find(c => c.startsWith('language-'))
      ?.substring('language-'.length) || 'clike'
    lang = LANG_ALIAS[lang] || lang
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
            // 给未转义的`%`(含字符串开头、连续`%%`)补`\`后再渲染; 已是`\%`的保持不变。
            // 用`\\?%`+回调判断而非后顾断言, 兼容不支持 lookbehind 的旧浏览器(Safari<16.4)
            element.getAttribute("raw")!.replace(/\\?%/g, m => m === '%' ? '\\%' : m),
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
