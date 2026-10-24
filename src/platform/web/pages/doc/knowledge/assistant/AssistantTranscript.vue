<template>
  <div
    ref="element"
    class="qa-transcript"
    role="log"
    aria-label="问答记录"
    aria-live="polite"
    aria-relevant="additions text"
    @scroll="onScroll"
  >
    <button
      v-if="hasMore"
      class="qa-load-more"
      type="button"
      :disabled="loading"
      @click="emit('loadMore')"
    >
      加载更早的消息
    </button>
    <p v-if="loading && !turns.length" class="qa-muted" role="status">正在读取聊天…</p>
    <div v-else-if="!turns.length" class="qa-empty">
      <div class="qa-empty-mark" aria-hidden="true"><ChatDotRound /></div>
      <h2>从一个好问题开始</h2>
      <p>搜索整个知识库，串联不同文档，带着来源一起探索。</p>
      <div class="qa-suggestions">
        <button
          v-for="suggestion in suggestions"
          :key="suggestion"
          type="button"
          @click="emit('suggest', suggestion)"
        >
          {{ suggestion }}
          <Top aria-hidden="true" />
        </button>
      </div>
    </div>
    <div v-else class="qa-messages">
      <article v-for="turn in turns" :key="turn.id" class="qa-turn">
        <div class="qa-user-message">
          <span class="qa-sr-only">你：</span>
          <p>{{ turn.question }}</p>
        </div>
        <div class="qa-assistant-message">
          <div class="qa-assistant-label">
            <ChatDotRound aria-hidden="true" />
            <span>知识助手</span>
          </div>
          <p v-if="turn.contextNotice" class="qa-muted qa-context-notice">
            {{ turn.contextNotice }}
          </p>
          <AssistantToolCalls :calls="turn.toolCalls" />
          <AiMarkdown v-if="turn.answer" :content="turn.answer" :sources="turnSources(turn)" />
          <p v-else class="qa-muted qa-answer-placeholder">{{ answerPlaceholder(turn) }}</p>
          <p v-if="turn.status === 'cancelled' && turn.answer" class="qa-muted qa-turn-status">
            已停止生成
          </p>
          <p v-if="turn.error" class="qa-error qa-turn-status">{{ turn.error }}</p>
          <nav v-if="citations(turn).length" aria-label="回答来源" class="qa-sources">
            <a v-for="source in citations(turn)" :key="source.sourceId" :href="source.url">
              {{ source.title }}
            </a>
          </nav>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import { ChatDotRound, Top } from '@element-plus/icons-vue'
import type { AiSessionTurn } from '@/core/ports/AiBridgePort'
import AiMarkdown from '../AiMarkdown.vue'
import AssistantToolCalls from './AssistantToolCalls.vue'
import { answerPlaceholder, citations, turnSources } from './AssistantTurnPresentation'
import { useAssistantScroll } from './useAssistantScroll'

const props = defineProps<{
  turns: AiSessionTurn[]
  hasMore: boolean
  loading: boolean
}>()
const emit = defineEmits<{
  loadMore: []
  suggest: [question: string]
}>()
const suggestions = [
  '知识库有哪些主题？',
  '帮我查找缓存相关的知识并比较不同方案',
  '串联相关文档，为我制定一条学习路线',
]
const { element, onScroll, scrollToBottom, follow, beforePrepend } = useAssistantScroll(
  toRef(props, 'turns'),
)
defineExpose({ scrollToBottom, follow, beforePrepend })
</script>

<style scoped lang="less">
@import './assistantShared.less';

.qa-transcript {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: var(--spacing-md) var(--content-pad);
}
.qa-empty {
  max-width: var(--assistant-message-width, 760px);
  min-height: 100%;
  margin-inline: auto;
  padding: var(--spacing-xl) var(--spacing-md);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  text-align: center;
}
.qa-empty-mark {
  display: grid;
  place-items: center;
  width: var(--spacing-2xl);
  height: var(--spacing-2xl);
  background: var(--hover-bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
}
.qa-empty-mark svg {
  width: var(--spacing-lg);
  height: var(--spacing-lg);
}
.qa-empty h2 {
  font-size: var(--font-size-2xl);
  font-weight: 600;
}
.qa-empty > p {
  color: var(--secondary-text-color);
  line-height: var(--leading-normal);
}
.qa-suggestions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}
.qa-suggestions button {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  text-align: left;
  border: 1px solid var(--border-color);
  background: var(--card-bg-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
}
.qa-suggestions button:hover {
  background: var(--hover-bg-color);
}
.qa-suggestions svg {
  width: var(--font-size-base);
  color: var(--secondary-text-color);
  transform: rotate(45deg);
}
.qa-messages {
  max-width: var(--assistant-message-width, 760px);
  margin-inline: auto;
}
.qa-turn + .qa-turn {
  margin-top: var(--spacing-2xl);
}
.qa-user-message {
  display: flex;
  justify-content: flex-end;
  margin-bottom: var(--spacing-xl);
}
.qa-user-message p {
  max-width: 86%;
  padding: var(--spacing-md);
  border-radius: var(--radius-xl);
  background: var(--hover-bg-color);
  line-height: var(--leading-normal);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.qa-assistant-message {
  min-width: 0;
  padding-bottom: var(--spacing-lg);
}
.qa-assistant-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
}
.qa-assistant-label svg {
  width: var(--font-size-xl);
  height: var(--font-size-xl);
}
.qa-answer-placeholder {
  padding-block: var(--spacing-sm);
}
.qa-context-notice {
  margin-bottom: var(--spacing-md);
}
.qa-turn-status {
  margin-top: var(--spacing-md);
  font-size: var(--font-size-sm);
}
.qa-sources {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}
.qa-sources a {
  color: var(--secondary-text-color);
  text-decoration: none;
  font-size: var(--font-size-xs);
  border: 1px solid var(--border-color);
  border-radius: 999px;
  padding: var(--spacing-xs) var(--spacing-sm);
  overflow-wrap: anywhere;
}
.qa-sources a:hover {
  color: var(--primary-color);
  border-color: var(--primary-color);
}
@media (max-width: @bp-mobile) {
  .qa-transcript {
    padding: var(--spacing-md);
  }
  .qa-empty {
    padding: var(--spacing-md) 0;
  }
  .qa-empty h2 {
    font-size: var(--font-size-xl);
  }
  .qa-empty > p {
    font-size: var(--font-size-sm);
  }
  .qa-suggestions {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }
  .qa-suggestions button {
    justify-content: space-between;
  }
  .qa-turn + .qa-turn {
    margin-top: var(--spacing-lg);
  }
  .qa-user-message p {
    max-width: 94%;
  }
}
</style>
