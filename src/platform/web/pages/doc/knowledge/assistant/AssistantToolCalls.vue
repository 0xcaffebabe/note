<template>
  <ul v-if="calls.length" class="qa-tool-calls" aria-label="工具调用">
    <li v-for="call in calls" :key="call.callId" :class="call.status">
      <details class="qa-tool-call">
        <summary>
          <ArrowRight class="qa-tool-chevron" aria-hidden="true" />
          <span class="qa-tool-dot" aria-hidden="true"></span>
          <span class="qa-tool-name">{{ toolLabel(call.name) }}</span>
          <span class="qa-tool-status">
            {{
              call.status === 'running' ? '读取中…' : call.status === 'error' ? '未完成' : '已读取'
            }}
          </span>
        </summary>
        <div class="qa-tool-overview">
          <template v-if="call.overview">
            <dl v-if="call.overview.input.length" class="qa-tool-input">
              <div v-for="(field, index) in call.overview.input" :key="index">
                <dt>{{ field.label }}</dt>
                <dd>{{ field.value }}</dd>
              </div>
            </dl>
            <p v-if="call.overview.summary" class="qa-tool-result">{{ call.overview.summary }}</p>
            <ul v-if="call.overview.items?.length" class="qa-tool-items">
              <li v-for="(item, index) in call.overview.items" :key="index">{{ item }}</li>
            </ul>
            <p v-if="call.overview.note" class="qa-tool-note">{{ call.overview.note }}</p>
          </template>
          <p v-else-if="call.status === 'complete'">此条历史调用未保存概览。</p>
          <p v-if="call.status === 'running'">正在读取，完成后将在这里显示结果概览。</p>
          <p v-if="call.message" class="qa-tool-error">{{ call.message }}</p>
          <p v-else-if="call.status === 'error'" class="qa-tool-error">此次读取未完成。</p>
        </div>
      </details>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { ArrowRight } from '@element-plus/icons-vue'
import type { AiToolCallRecord } from '@/core/ports/AiBridgePort'
import { toolLabel } from './AssistantTurnPresentation'

defineProps<{ calls: AiToolCallRecord[] }>()
</script>

<style scoped lang="less">
@import './assistantShared.less';

.qa-tool-calls {
  margin: 0 0 var(--spacing-md);
  padding: 0;
  list-style: none;
  color: var(--secondary-text-color);
  font-size: var(--font-size-sm);
}
.qa-tool-calls > li + li {
  margin-top: var(--spacing-xs);
}
.qa-tool-call {
  min-width: 0;
  border-radius: var(--radius-md);
}
.qa-tool-call summary {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-height: var(--site-control-size);
  padding: var(--spacing-xs) var(--spacing-sm);
  box-sizing: border-box;
  border-radius: var(--radius-md);
  cursor: pointer;
  list-style: none;
}
.qa-tool-call summary::-webkit-details-marker {
  display: none;
}
.qa-tool-call summary:hover {
  background: var(--hover-bg-color);
  color: var(--main-text-color);
}
.qa-tool-call summary:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}
.qa-tool-chevron {
  width: var(--font-size-xs);
  height: var(--font-size-xs);
  flex-shrink: 0;
}
.qa-tool-call[open] .qa-tool-chevron {
  transform: rotate(90deg);
}
.qa-tool-name {
  min-width: 0;
  overflow-wrap: anywhere;
}
.qa-tool-status {
  margin-left: auto;
  flex-shrink: 0;
  font-size: var(--font-size-xs);
}
.qa-tool-dot {
  width: var(--spacing-xs);
  height: var(--spacing-xs);
  flex-shrink: 0;
  border-radius: 50%;
  background: currentColor;
}
.qa-tool-calls > .complete .qa-tool-dot {
  color: var(--success-color);
}
.qa-tool-calls > .error summary,
.qa-tool-error {
  color: var(--danger-color);
}
.qa-tool-overview {
  margin: var(--spacing-xs) var(--spacing-sm) var(--spacing-sm);
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--hover-bg-color);
  line-height: var(--leading-normal);
  overflow-wrap: anywhere;
}
.qa-tool-input {
  margin: 0;
  display: grid;
  gap: var(--spacing-xs);
}
.qa-tool-input > div {
  display: flex;
  flex-wrap: wrap;
  column-gap: var(--spacing-md);
}
.qa-tool-input dt {
  flex-shrink: 0;
}
.qa-tool-input dd {
  margin: 0;
  min-width: 0;
  color: var(--main-text-color);
}
.qa-tool-result {
  color: var(--main-text-color);
}
.qa-tool-items {
  margin: 0;
  padding-left: var(--spacing-md);
  color: var(--main-text-color);
}
.qa-tool-items li + li {
  margin-top: var(--spacing-xs);
}
.qa-tool-note {
  font-size: var(--font-size-xs);
}
</style>
