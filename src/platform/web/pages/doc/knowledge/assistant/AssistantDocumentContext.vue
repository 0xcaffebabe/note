<template>
  <div class="qa-context-control" @keydown.esc="closeContextOnEscape">
    <button
      type="button"
      class="qa-context-button"
      aria-label="文档上下文"
      :aria-expanded="showContext"
      aria-controls="assistant-context"
      @click="showContext = !showContext"
    >
      <Document aria-hidden="true" />
      <span>文档上下文</span>
      <span v-if="includeCurrent" class="qa-context-count">{{ 1 }}</span>
    </button>
    <div
      v-if="showContext"
      id="assistant-context"
      class="qa-context-panel"
      @keydown.esc.stop="showContext = false"
    >
      <div class="qa-context-title">
        <strong>文档上下文</strong>
        <button
          class="qa-icon-button"
          type="button"
          aria-label="关闭文档上下文"
          @click="showContext = false"
        >
          <Close />
        </button>
      </div>
      <p class="qa-muted">默认面向整个知识库，AI 可按需查找和读取文档、目录及知识网络。</p>
      <p class="qa-muted">
        当前上下文预算 {{ limits.contextWindowTokens.toLocaleString() }} tokens，单次输出预算
        {{ limits.maxOutputTokens.toLocaleString() }} tokens；可在 Note Bridge 的模型设置中调整。
      </p>
      <p v-if="loading" class="qa-muted" role="status">正在读取文档…</p>
      <template v-else-if="error">
        <p class="qa-error" role="status">{{ error }}</p>
        <button class="qa-clear-context" type="button" @click="emit('retry')">
          重试读取当前文档
        </button>
      </template>
      <template v-else-if="document">
        <label class="qa-check">
          <input
            v-model="includeCurrent"
            type="checkbox"
            aria-label="附加当前文档目录"
            :disabled="busy"
          />
          附加当前文档目录：{{ document.title }}
        </label>
        <template v-if="includeCurrent">
          <label class="qa-field">
            附加当前文档章节
            <select v-model="headingIds" multiple aria-label="选择当前文档章节" :disabled="busy">
              <option v-for="heading in document.headings" :key="heading.id" :value="heading.id">
                {{ heading.title }}
              </option>
            </select>
          </label>
          <p class="qa-muted">未选择章节时，仅附加目录与元信息，正文由 AI 按需读取。</p>
          <p class="qa-muted">文档由 Note Bridge 从知识站点读取，并保存本次回答使用的来源版本。</p>
          <button class="qa-clear-context" type="button" :disabled="busy" @click="emit('clear')">
            取消附加文档
          </button>
        </template>
      </template>
      <p v-else class="qa-muted">
        当前页面没有可附加的文档。可以直接向知识库提问，也可以在阅读文档时选择附加内容。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Close, Document } from '@element-plus/icons-vue'
import type { AiDocumentMetadata } from '@/core/ports/AiBridgePort'
import type { resolveAiModelLimits } from '@/core/domain/AiLimits'

defineProps<{
  document?: AiDocumentMetadata
  loading: boolean
  error: string
  busy: boolean
  limits: ReturnType<typeof resolveAiModelLimits>
}>()
const showContext = defineModel<boolean>('visible', { required: true })
const includeCurrent = defineModel<boolean>('included', { required: true })
const headingIds = defineModel<string[]>('headingIds', { required: true })
const emit = defineEmits<{
  retry: []
  clear: []
}>()

/** 先关闭文档弹层并消费 Escape，避免同时关闭外层知识助手。 */
function closeContextOnEscape(event: KeyboardEvent) {
  if (showContext.value) {
    event.stopPropagation()
    showContext.value = false
  }
}
</script>

<style scoped lang="less">
@import './assistantShared.less';

.qa-context-control {
  position: relative;
}
.qa-context-button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 0;
  border-radius: var(--radius-lg);
  background: transparent;
  color: var(--secondary-text-color);
  font-size: var(--font-size-xs);
}
.qa-context-button:hover,
.qa-context-button[aria-expanded='true'] {
  background: var(--hover-bg-color);
  color: var(--main-text-color);
}
.qa-context-button svg {
  width: var(--font-size-lg);
  height: var(--font-size-lg);
}
.qa-context-count {
  font-size: var(--font-size-xs);
  color: var(--primary-color);
}
.qa-context-panel {
  position: absolute;
  z-index: 1;
  bottom: calc(100% + var(--spacing-sm));
  left: 0;
  width: min(360px, 76vw);
  max-height: 50dvh;
  overflow-y: auto;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--elevated-bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}
.qa-context-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.qa-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
}
.qa-field select {
  width: 100%;
  min-height: calc(var(--site-control-size) * 2);
  padding: var(--spacing-sm);
  background: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}
fieldset {
  margin: 0;
  padding: var(--spacing-sm);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}
.qa-check {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin-block: var(--spacing-sm);
  overflow-wrap: anywhere;
}
.qa-check input {
  accent-color: var(--primary-color);
}
.qa-clear-context {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--hover-bg-color);
}
@media (max-width: @bp-mobile) {
  .qa-context-button {
    padding-inline: var(--spacing-xs);
  }
  .qa-context-button > span:not(.qa-context-count) {
    display: none;
  }
}
</style>
