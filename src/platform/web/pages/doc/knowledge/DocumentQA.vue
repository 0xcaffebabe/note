<template>
  <section class="qa-workspace" :class="{ 'history-open': historyOpen }" aria-label="知识库问答">
    <AssistantSessionSidebar
      ref="sidebarEl"
      :sessions="sessions"
      :active-session-id="activeSessionId"
      :connected="state === 'ready'"
      :has-more="!!sessionCursor"
      :loading="loadingSessions"
      @hide="hideHistory"
      @create="sessionState.newChat"
      @select="selectSession"
      @archive="sessionState.archive"
      @load-more="sessionState.catalog.refresh(true)"
    />
    <div class="qa-main">
      <header class="qa-topbar">
        <button
          class="qa-icon-button qa-show-history"
          type="button"
          aria-label="显示聊天记录"
          :aria-expanded="historyOpen"
          @click="showHistory"
        >
          <Memo />
        </button>
        <div class="qa-current-document">
          <span>知识助手</span>
          <strong>整个知识库</strong>
        </div>
        <span
          class="qa-connection"
          :class="{ connected: state === 'ready' }"
          role="status"
          :title="statusText"
        >
          <span aria-hidden="true"></span>
          {{ connectionLabel }}
        </span>
      </header>
      <AssistantTranscript
        ref="transcriptEl"
        :turns="turns"
        :has-more="!!turnCursor"
        :loading="loadingTurns"
        @load-more="sessionState.history.load(true)"
        @suggest="useSuggestion"
      />
      <AssistantComposer
        ref="composerEl"
        v-model="question"
        :state="state"
        :running="activeSession?.status === 'running'"
        :error="error"
        :has-providers="!!providers.length"
        :busy="busy"
        :sending="sending"
        :can-send="canSend"
        @send="submission.send"
        @cancel="sessionState.cancel"
        @open-connection="openBridge"
      >
        <template #context>
          <AssistantDocumentContext
            v-model:visible="showContext"
            v-model:included="includeCurrent"
            v-model:heading-ids="headingIds"
            :document="document"
            :loading="loadingDocument"
            :error="attachmentError"
            :busy="busy"
            :limits="modelLimits"
            @retry="attachment.load"
            @clear="attachment.clear"
          />
        </template>
        <template #models>
          <AssistantModelControls
            v-model:model-key="modelKey"
            v-model:effort="effort"
            :groups="modelGroups"
            :has-models="!!modelOptions.length"
            :has-providers="!!providers.length"
            :efforts="availableEfforts"
            :busy="busy"
            @select-model="models.selectModel"
            @select-effort="models.savePreference"
          />
        </template>
      </AssistantComposer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { Memo } from '@element-plus/icons-vue'
import { useAiBridgeConnection } from '@/platform/web/components/navigation/useAiBridgeConnection'
import EventBus from '@/platform/web/components/EventBus'
import AssistantSessionSidebar from './assistant/AssistantSessionSidebar.vue'
import AssistantTranscript from './assistant/AssistantTranscript.vue'
import AssistantComposer from './assistant/AssistantComposer.vue'
import AssistantDocumentContext from './assistant/AssistantDocumentContext.vue'
import AssistantModelControls from './assistant/AssistantModelControls.vue'
import { useAssistantModels } from './assistant/useAssistantModels'
import { useAssistantAttachment } from './assistant/useAssistantAttachment'
import { useAssistantSessions } from './assistant/useAssistantSessions'
import { useAssistantSubmission } from './assistant/useAssistantSubmission'

const props = defineProps<{ doc?: string }>()
const emit = defineEmits<{ 'open-connection': [] }>()
const { bridge, state, providers, statusText } = useAiBridgeConnection()
const historyOpen = ref(false)
const sidebarEl = ref<InstanceType<typeof AssistantSessionSidebar>>()
const transcriptEl = ref<InstanceType<typeof AssistantTranscript>>()
const composerEl = ref<InstanceType<typeof AssistantComposer>>()
const models = useAssistantModels(providers)
const attachment = useAssistantAttachment(bridge, state, () => props.doc)

// 此组件只组装会话、输入和界面；各 composable 分别管理自己的异步生命周期。
const sessionState = useAssistantSessions(bridge, state, {
  selected(session) {
    submission.reset()
    historyOpen.value = false
    if (session) {
      models.restorePreference(session)
    } else {
      nextTick(focusQuestion)
    }
  },
  ready() {
    nextTick(() => {
      transcriptEl.value?.scrollToBottom()
      focusQuestion()
    })
  },
  beforePrepend() {
    return transcriptEl.value?.beforePrepend() || (() => {})
  },
})
const submission = useAssistantSubmission(bridge, state, sessionState, models, attachment, () =>
  transcriptEl.value?.follow(),
)
const { activeId: activeSessionId, active: activeSession, error } = sessionState
const { sessions, cursor: sessionCursor, loading: loadingSessions } = sessionState.catalog
const { turns, cursor: turnCursor, loading: loadingTurns } = sessionState.history
const { question, busy, sending, canSend } = submission
const {
  modelKey,
  effort,
  groups: modelGroups,
  options: modelOptions,
  availableEfforts,
  limits: modelLimits,
} = models
const {
  document,
  includeCurrent,
  headingIds,
  loading: loadingDocument,
  error: attachmentError,
  visible: showContext,
} = attachment
const connectionLabel = computed(
  () =>
    ({
      ready: '已连接',
      connecting: '连接中',
      disconnected: '未连接',
    })[state.value],
)

function focusQuestion() {
  composerEl.value?.focus()
}

function showHistory() {
  historyOpen.value = true
  nextTick(() => sidebarEl.value?.focus())
}

function hideHistory() {
  historyOpen.value = false
  nextTick(focusQuestion)
}

async function selectSession(id: string) {
  if (id === activeSessionId.value) {
    hideHistory()
    return
  }
  await sessionState.select(id)
}

function useSuggestion(suggestion: string) {
  question.value = suggestion
  nextTick(focusQuestion)
}

function openBridge() {
  emit('open-connection')
  EventBus.emit('show-note-bridge', null)
}
</script>

<style scoped lang="less">
@import './assistant/assistantShared.less';

.qa-workspace {
  display: flex;
  height: 100%;
  min-height: 0;
  color: var(--main-text-color);
  font-family: var(--font-sans);
  font-size: var(--font-size-base);
}
.qa-main {
  min-width: 0;
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--card-bg-color);
}
.qa-topbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-height: calc(var(--site-control-size) + var(--spacing-md));
  padding: var(--spacing-sm) var(--spacing-lg);
  flex-shrink: 0;
}
.qa-current-document {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
}
.qa-current-document > span {
  flex-shrink: 0;
  color: var(--secondary-text-color);
  font-size: var(--font-size-sm);
}
.qa-current-document strong {
  font-size: var(--font-size-base);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.qa-connection {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--secondary-text-color);
}
.qa-connection.connected {
  color: var(--success-color);
}
.qa-connection > span {
  width: var(--spacing-sm);
  height: var(--spacing-sm);
  border-radius: 50%;
  background: currentColor;
}
@media (max-width: @bp-mobile) {
  .qa-workspace {
    position: relative;
  }
  .history-open .qa-main {
    display: none;
  }
  .qa-topbar {
    padding: var(--spacing-xs) var(--spacing-sm);
  }
  .qa-current-document {
    display: block;
  }
  .qa-current-document > span {
    display: none;
  }
  .qa-current-document strong {
    display: block;
  }
}
</style>
