<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue'
import { renderAiMarkdown } from '@/adapters/browser/AiMarkdownRenderer'
import type { AiCitation } from '@/core/domain/AiDocumentTools'

const props = withDefaults(defineProps<{ content: string; sources?: AiCitation[] }>(), { sources: () => [] })
const html = computed(() => renderAiMarkdown(props.content, props.sources))
let copied: HTMLButtonElement | undefined
let resetTimer: ReturnType<typeof setTimeout> | undefined

async function copyCode(event: MouseEvent) {
  const button = (event.target as Element)?.closest<HTMLButtonElement>('button[data-copy-code]')
  const text = button?.closest('.ai-code-block')?.querySelector('pre code')?.textContent
  if (!button || text === undefined || text === null) return
  if (resetTimer) clearTimeout(resetTimer)
  if (copied) copied.textContent = '复制代码'
  copied = button
  try {
    await navigator.clipboard.writeText(text)
    button.textContent = '已复制'
  } catch {
    button.textContent = '复制失败'
  }
  resetTimer = setTimeout(() => { button.textContent = '复制代码'; copied = undefined }, 1600)
}
onBeforeUnmount(() => { if (resetTimer) clearTimeout(resetTimer) })
</script>

<template>
  <!-- Only the isolated allowlist renderer above can supply this HTML. -->
  <div class="ai-markdown" @click="copyCode" v-html="html" />
</template>

<style scoped lang="less">
.ai-markdown {
  color: var(--main-text-color);
  font-size: var(--font-size-base);
  line-height: var(--leading-relaxed);
  overflow-wrap: anywhere;
  min-width: 0;
  :deep(> :first-child) { margin-top: 0; }
  :deep(> :last-child) { margin-bottom: 0; }
  :deep(p), :deep(ul), :deep(ol), :deep(blockquote) { margin: 0.8em 0; }
  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) { font-size: 1.1em; line-height: 1.5; margin: 1.3em 0 0.6em; font-weight: 650; }
  :deep(h1) { font-size: 1.35em; }
  :deep(h2) { font-size: 1.2em; }
  :deep(ul), :deep(ol) { padding-left: 1.6em; }
  :deep(li + li) { margin-top: 0.35em; }
  :deep(blockquote) { border-left: var(--spacing-xs) solid var(--border-color); padding: 0.2em 1em; color: var(--secondary-text-color); }
  :deep(a) { color: var(--primary-color); text-decoration: underline; text-underline-offset: 0.18em; }
  :deep(.ai-citation) { display: inline-block; font-size: var(--font-size-xs); line-height: var(--leading-tight); text-decoration: none; padding: 0.1em var(--spacing-xs); margin: 0 0.15em; border-radius: var(--radius-md); background: var(--hover-bg-color); vertical-align: 0.1em; }
  :deep(code) { font-family: var(--font-mono); font-size: 0.88em; padding: 0.1em var(--spacing-xs); background: var(--hover-bg-color); border-radius: var(--radius-sm); }
  :deep(.ai-code-block) { margin: 1em 0; border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; background: var(--hover-bg-color); }
  :deep(.ai-code-toolbar) { display: flex; align-items: center; justify-content: space-between; padding: var(--spacing-xs) var(--spacing-sm); font-size: var(--font-size-xs); color: var(--secondary-text-color); border-bottom: 1px solid var(--border-color); }
  :deep(.ai-code-toolbar button) { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; padding: var(--spacing-xs) var(--spacing-sm); border-radius: var(--radius-md); }
  :deep(.ai-code-toolbar button:hover) { color: var(--main-text-color); background: var(--card-bg-color); }
  :deep(pre) { margin: 0; padding: var(--spacing-md); overflow-x: auto; line-height: var(--leading-normal); white-space: pre; }
  :deep(pre code) { padding: 0; border-radius: 0; background: transparent; font-size: var(--font-size-xs); overflow-wrap: normal; }
  :deep(table) { display: block; width: max-content; max-width: 100%; overflow-x: auto; border-collapse: collapse; margin: 1em 0; font-size: var(--font-size-sm); }
  :deep(th), :deep(td) { border: 1px solid var(--border-color); padding: var(--spacing-sm) var(--spacing-md); text-align: left; }
  :deep(th) { background: var(--table-header-bg); font-weight: 600; }
  :deep(hr) { border: 0; border-top: 1px solid var(--border-color); margin: 1.5em 0; }
  :deep(.ai-image-alt) { color: var(--secondary-text-color); font-size: 0.9em; }
}
</style>
