import { onBeforeUnmount } from 'vue'

/** 为净化后的代码块提供事件委托复制；仅复制文本，并清理当前复制提示定时器。 */
export function useAiCodeCopy() {
  let copied: HTMLButtonElement | undefined
  let resetTimer: ReturnType<typeof setTimeout> | undefined

  async function copyCode(event: MouseEvent): Promise<void> {
    const button = (event.target as Element)?.closest<HTMLButtonElement>('button[data-copy-code]')
    const text = button?.closest('.ai-code-block')?.querySelector('pre code')?.textContent
    if (!button || text === undefined || text === null) {
      return
    }
    if (resetTimer) {
      clearTimeout(resetTimer)
    }
    if (copied) {
      copied.textContent = '复制代码'
    }
    copied = button
    try {
      await navigator.clipboard.writeText(text)
      button.textContent = '已复制'
    } catch {
      button.textContent = '复制失败'
    }
    resetTimer = setTimeout(() => {
      button.textContent = '复制代码'
      copied = undefined
    }, 1600)
  }

  onBeforeUnmount(() => {
    if (resetTimer) {
      clearTimeout(resetTimer)
    }
  })

  return copyCode
}
