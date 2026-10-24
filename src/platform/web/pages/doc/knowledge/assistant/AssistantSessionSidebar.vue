<template>
  <aside class="qa-sidebar" aria-label="聊天记录">
    <div class="qa-sidebar-heading">
      <span>聊天记录</span>
      <button
        class="qa-icon-button qa-hide-history"
        type="button"
        aria-label="收起聊天记录"
        @click="emit('hide')"
      >
        <Close />
      </button>
    </div>
    <button ref="newChatEl" class="qa-new-chat" type="button" @click="emit('create')">
      <EditPen />
      <span>新聊天</span>
      <span aria-hidden="true">＋</span>
    </button>
    <p class="qa-sidebar-label">最近</p>
    <div class="qa-session-list">
      <p v-if="!sessions.length" class="qa-muted qa-history-empty">还没有聊天，从一个问题开始。</p>
      <div
        v-for="session in sessions"
        :key="session.id"
        class="qa-session"
        :class="{ active: session.id === activeSessionId }"
      >
        <button
          type="button"
          class="qa-session-select"
          :aria-current="session.id === activeSessionId ? 'true' : undefined"
          :title="session.title"
          @click="emit('select', session.id)"
        >
          <span>{{ session.title }}</span>
          <small>{{ session.status === 'running' ? '正在生成…' : '整个知识库' }}</small>
        </button>
        <button
          class="qa-icon-button qa-delete-chat"
          type="button"
          :aria-label="`归档聊天：${session.title}`"
          :disabled="session.status === 'running' || !connected"
          @click="emit('archive', session.id)"
        >
          <Delete />
        </button>
      </div>
      <button
        v-if="hasMore"
        class="qa-load-more"
        type="button"
        :disabled="loading"
        @click="emit('loadMore')"
      >
        加载更多聊天
      </button>
    </div>
    <p class="qa-sidebar-footnote">聊天记录保存在本机 Note Bridge</p>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Close, Delete, EditPen } from '@element-plus/icons-vue'
import type { AiSessionSummary } from '@/core/ports/AiBridgePort'

defineProps<{
  sessions: AiSessionSummary[]
  activeSessionId: string
  connected: boolean
  hasMore: boolean
  loading: boolean
}>()
const emit = defineEmits<{
  hide: []
  create: []
  select: [id: string]
  archive: [id: string]
  loadMore: []
}>()
const newChatEl = ref<HTMLButtonElement>()

/** 移动端展开历史后，将焦点放入可见面板，避免焦点留在隐藏的聊天区域。 */
function focus() {
  newChatEl.value?.focus()
}
defineExpose({ focus })
</script>

<style scoped lang="less">
@import './assistantShared.less';

.qa-sidebar {
  width: var(--assistant-sidebar-width, 240px);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-sm);
  background: var(--hover-bg-color);
  border-right: 1px solid var(--border-color);
  box-sizing: border-box;
  min-height: 0;
}
.qa-sidebar-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-inline: var(--spacing-sm);
  font-weight: 600;
}
.qa-new-chat {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  text-align: left;
}
.qa-new-chat > span:last-child {
  margin-left: auto;
  color: var(--secondary-text-color);
}
.qa-new-chat:hover {
  border-color: var(--primary-color);
}
.qa-sidebar-label {
  color: var(--secondary-text-color);
  font-size: var(--font-size-xs);
  padding-inline: var(--spacing-sm);
}
.qa-session-list {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
}
.qa-history-empty {
  padding: var(--spacing-sm);
}
.qa-session {
  display: flex;
  align-items: center;
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-xs);
}
.qa-session.active,
.qa-session:hover {
  background: var(--card-bg-color);
}
.qa-session.active {
  box-shadow: var(--shadow-sm);
}
.qa-session-select {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: transparent;
  border: 0;
  border-radius: var(--radius-lg);
  text-align: left;
}
.qa-session-select span,
.qa-session-select small {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.qa-session-select small {
  color: var(--secondary-text-color);
  font-size: var(--font-size-xs);
}
.qa-delete-chat {
  opacity: 0;
}
.qa-session:hover .qa-delete-chat,
.qa-session:focus-within .qa-delete-chat {
  opacity: 1;
}
.qa-sidebar-footnote {
  padding: var(--spacing-sm);
  color: var(--secondary-text-color);
  font-size: var(--font-size-xs);
}
@media (max-width: @bp-mobile) {
  .qa-sidebar {
    display: none;
  }
  .history-open .qa-sidebar {
    display: flex;
    width: 100%;
    border: 0;
  }
  .qa-delete-chat {
    opacity: 1;
  }
}
</style>
