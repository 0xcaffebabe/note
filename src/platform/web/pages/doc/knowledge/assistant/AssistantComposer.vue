<template>
  <div class="qa-compose-area">
    <p v-if="state !== 'ready' && running" class="qa-muted" role="status">
      连接已断开，回答仍在 Note Bridge 中继续；重连后会恢复显示。
    </p>
    <p v-if="error" class="qa-error" role="alert">{{ error }}</p>
    <div v-if="state !== 'ready' || !hasProviders" class="qa-connection-prompt">
      <span>
        {{
          state === 'ready'
            ? '桌面端尚无可用模型，请先配置模型。'
            : '连接本机 Note Bridge，开始知识库问答。'
        }}
      </span>
      <button type="button" @click="emit('openConnection')">打开 Note Bridge 连接设置</button>
    </div>
    <form class="qa-composer" @submit.prevent="emit('send')">
      <label class="qa-sr-only" for="assistant-question">你的问题</label>
      <textarea
        id="assistant-question"
        ref="questionEl"
        v-model="question"
        aria-label="你的问题"
        rows="3"
        :maxlength="AI_MAX_QUESTION_CHARS"
        placeholder="向整个知识库提问，查找、比较或串联知识…"
        @keydown="onQuestionKeydown"
      />
      <div class="qa-composer-toolbar">
        <slot name="context" />
        <div class="qa-model-controls">
          <slot name="models" />
          <button
            v-if="busy"
            :disabled="state !== 'ready' || sending"
            class="qa-send-button qa-stop-button"
            type="button"
            aria-label="停止生成"
            title="停止生成"
            @click="emit('cancel')"
          >
            <span aria-hidden="true"></span>
          </button>
          <button
            v-else
            class="qa-send-button"
            type="submit"
            aria-label="发送问题"
            title="发送问题"
            :disabled="!canSend"
          >
            <Top />
          </button>
        </div>
      </div>
    </form>
    <p class="qa-muted qa-background-hint" v-if="busy">
      关闭窗口或切换聊天后，回答会在 Note Bridge 中继续。
    </p>
    <p class="qa-composer-hint">
      Enter 发送 · Shift + Enter 换行
      <span>AI 回答可能有误，请核对文档来源</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Top } from '@element-plus/icons-vue'
import type { AiBridgeState } from '@/core/ports/AiBridgePort'
import { AI_MAX_QUESTION_CHARS } from '@/core/domain/AiLimits'

const props = defineProps<{
  state: AiBridgeState
  running: boolean
  error: string
  hasProviders: boolean
  busy: boolean
  sending: boolean
  canSend: boolean
}>()
const question = defineModel<string>({ required: true })
const emit = defineEmits<{
  send: []
  cancel: []
  openConnection: []
}>()
const questionEl = ref<HTMLTextAreaElement>()

function focus() {
  questionEl.value?.focus()
}

/** Enter 发送，Shift+Enter 换行；输入法合成阶段的 Enter 留给输入法处理。 */
function onQuestionKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    if (props.canSend) {
      emit('send')
    }
  }
}
defineExpose({ focus })
</script>

<style scoped lang="less">
@import './assistantShared.less';

.qa-compose-area {
  flex-shrink: 0;
  width: 100%;
  max-width: calc(var(--assistant-message-width, 760px) + var(--content-pad) * 2);
  margin-inline: auto;
  padding: var(--spacing-md) var(--content-pad);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.qa-background-hint {
  font-size: var(--font-size-xs);
}
.qa-connection-prompt {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--secondary-text-color);
  font-size: var(--font-size-sm);
}
.qa-connection-prompt button {
  padding: 0;
  min-height: auto;
  background: transparent;
  color: var(--primary-color);
  border: 0;
  text-align: left;
}
.qa-composer {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  background: var(--card-bg-color);
}
.qa-composer:focus-within {
  border-color: color-mix(in srgb, var(--primary-color) 50%, var(--border-color));
}
.qa-composer textarea {
  display: block;
  width: 100%;
  resize: vertical;
  min-height: var(--spacing-2xl);
  max-height: 25dvh;
  box-sizing: border-box;
  border: 0;
  background: transparent;
  padding: var(--spacing-xs);
  line-height: var(--leading-normal);
  border-radius: var(--radius-sm);
}
.qa-composer textarea::placeholder {
  color: var(--secondary-text-color);
}
.qa-composer-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
}
.qa-model-controls {
  display: flex;
  min-width: 0;
  margin-left: auto;
  align-items: center;
  gap: var(--spacing-xs);
}
.qa-send-button {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: var(--site-control-size);
  height: var(--site-control-size);
  min-height: var(--site-control-size);
  padding: var(--spacing-sm);
  border: 0;
  border-radius: 50%;
  color: var(--card-bg-color);
  background: var(--main-text-color);
}
.qa-send-button:disabled {
  opacity: 0.25;
}
.qa-stop-button > span {
  width: var(--font-size-xs);
  height: var(--font-size-xs);
  border-radius: var(--radius-sm);
  background: currentColor;
}
.qa-composer-hint {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--spacing-xs);
  color: var(--secondary-text-color);
  font-size: var(--font-size-xs);
}
@media (max-width: @bp-mobile) {
  .qa-compose-area {
    padding: var(--spacing-sm);
  }
  .qa-composer {
    padding: var(--spacing-sm);
  }
  .qa-composer-toolbar {
    gap: var(--spacing-xs);
  }
  .qa-model-controls {
    max-width: 100%;
  }
  .qa-composer-hint {
    justify-content: center;
  }
  .qa-composer-hint > span {
    display: none;
  }
}
</style>
