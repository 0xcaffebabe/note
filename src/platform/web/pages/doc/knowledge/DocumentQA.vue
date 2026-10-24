<template>
  <section class="qa-workspace" :class="{ 'history-open': historyOpen }" aria-label="知识库问答">
    <aside class="qa-sidebar" aria-label="聊天记录">
      <div class="qa-sidebar-heading"><span>聊天记录</span><button class="qa-icon-button qa-hide-history" type="button" aria-label="收起聊天记录" @click="hideHistory"><Close /></button></div>
      <button ref="newChatEl" class="qa-new-chat" type="button" @click="newChat"><EditPen /><span>新聊天</span><span aria-hidden="true">＋</span></button>
      <p class="qa-sidebar-label">最近</p>
      <div class="qa-session-list">
        <p v-if="!sessions.length" class="qa-muted qa-history-empty">还没有聊天，从一个问题开始。</p>
        <div v-for="session in sessions" :key="session.id" class="qa-session" :class="{ active: session.id === activeSessionId }">
          <button type="button" class="qa-session-select" :aria-current="session.id === activeSessionId ? 'true' : undefined" :title="session.title" @click="selectSession(session.id)">
            <span>{{ session.title }}</span><small>{{ session.status === 'running' ? '正在生成…' : '整个知识库' }}</small>
          </button>
          <button class="qa-icon-button qa-delete-chat" type="button" :aria-label="`归档聊天：${session.title}`" :disabled="session.status === 'running' || state !== 'ready'" @click="removeSession(session.id)"><Delete /></button>
        </div>
        <button v-if="sessionCursor" class="qa-load-more" type="button" :disabled="loadingSessions" @click="refreshSessions(true)">加载更多聊天</button>
      </div>
      <p class="qa-sidebar-footnote">聊天记录保存在本机 Note Bridge</p>
    </aside>

    <div class="qa-main">
      <header class="qa-topbar">
        <button class="qa-icon-button qa-show-history" type="button" aria-label="显示聊天记录" :aria-expanded="historyOpen" @click="showHistory"><Memo /></button>
        <div class="qa-current-document"><span>知识助手</span><strong>整个知识库</strong></div>
        <span class="qa-connection" :class="{ connected: state === 'ready' }" role="status" :title="statusText"><span aria-hidden="true"></span>{{ state === 'ready' ? '已连接' : state === 'connecting' ? '连接中' : '未连接' }}</span>
      </header>

      <div ref="transcriptEl" class="qa-transcript" role="log" aria-label="问答记录" aria-live="polite" aria-relevant="additions text" @scroll="onTranscriptScroll">
        <button v-if="turnCursor" class="qa-load-more" type="button" :disabled="loadingTurns" @click="loadTurns(true)">加载更早的消息</button>
        <p v-if="loadingTurns && !turns.length" class="qa-muted" role="status">正在读取聊天…</p>
        <div v-else-if="!turns.length" class="qa-empty">
          <div class="qa-empty-mark" aria-hidden="true"><ChatDotRound /></div>
          <h2>从一个好问题开始</h2>
          <p>搜索整个知识库，串联不同文档，带着来源一起探索。</p>
          <div class="qa-suggestions">
            <button v-for="suggestion in suggestions" :key="suggestion" type="button" @click="useSuggestion(suggestion)">{{ suggestion }}<Top aria-hidden="true" /></button>
          </div>
        </div>
        <div v-else class="qa-messages">
          <article v-for="turn in turns" :key="turn.id" class="qa-turn">
            <div class="qa-user-message"><span class="qa-sr-only">你：</span><p>{{ turn.question }}</p></div>
            <div class="qa-assistant-message">
              <div class="qa-assistant-label"><ChatDotRound aria-hidden="true" /><span>知识助手</span></div>
              <p v-if="turn.contextNotice" class="qa-muted qa-context-notice">{{ turn.contextNotice }}</p>
              <ul v-if="turn.toolCalls.length" class="qa-tool-calls" aria-label="工具调用">
                <li v-for="call in turn.toolCalls" :key="call.callId" :class="call.status">
                  <details class="qa-tool-call">
                    <summary>
                      <ArrowRight class="qa-tool-chevron" aria-hidden="true" />
                      <span class="qa-tool-dot" aria-hidden="true"></span>
                      <span class="qa-tool-name">{{ toolLabel(call.name) }}</span>
                      <span class="qa-tool-status">{{ call.status === 'running' ? '读取中…' : call.status === 'error' ? '未完成' : '已读取' }}</span>
                    </summary>
                    <div class="qa-tool-overview">
                      <template v-if="call.overview">
                        <dl v-if="call.overview.input.length" class="qa-tool-input">
                          <div v-for="(field, index) in call.overview.input" :key="index"><dt>{{ field.label }}</dt><dd>{{ field.value }}</dd></div>
                        </dl>
                        <p v-if="call.overview.summary" class="qa-tool-result">{{ call.overview.summary }}</p>
                        <ul v-if="call.overview.items?.length" class="qa-tool-items"><li v-for="(item, index) in call.overview.items" :key="index">{{ item }}</li></ul>
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
              <AiMarkdown v-if="turn.answer" :content="turn.answer" :sources="turnSources(turn)" />
              <p v-else class="qa-muted qa-answer-placeholder">{{ turn.status === 'running' ? '正在思考…' : turn.status === 'cancelled' ? '回答已停止' : turn.error ? '未能生成回答' : '未收到回答' }}</p>
              <p v-if="turn.status === 'cancelled' && turn.answer" class="qa-muted qa-turn-status">已停止生成</p>
              <p v-if="turn.error" class="qa-error qa-turn-status">{{ turn.error }}</p>
              <nav v-if="citations(turn).length" aria-label="回答来源" class="qa-sources"><a v-for="source in citations(turn)" :key="source.sourceId" :href="source.url">{{ source.title }}</a></nav>
            </div>
          </article>
        </div>
      </div>

      <div class="qa-compose-area">
        <p v-if="state !== 'ready' && activeSession?.status === 'running'" class="qa-muted" role="status">连接已断开，回答仍在 Note Bridge 中继续；重连后会恢复显示。</p>
        <p v-if="error" class="qa-error" role="alert">{{ error }}</p>
        <div v-if="state !== 'ready' || !providers.length" class="qa-connection-prompt">
          <span>{{ state === 'ready' ? '桌面端尚无可用模型，请先配置模型。' : '连接本机 Note Bridge，开始知识库问答。' }}</span>
          <button type="button" @click="openBridge">打开 Note Bridge 连接设置</button>
        </div>
        <form class="qa-composer" @submit.prevent="send">
          <label class="qa-sr-only" for="assistant-question">你的问题</label>
          <textarea id="assistant-question" ref="questionEl" v-model="question" aria-label="你的问题" rows="3" :maxlength="AI_MAX_QUESTION_CHARS" placeholder="向整个知识库提问，查找、比较或串联知识…" @keydown="onQuestionKeydown" />
          <div class="qa-composer-toolbar">
            <div class="qa-context-control" @keydown.esc="closeContextOnEscape">
              <button type="button" class="qa-context-button" aria-label="文档上下文" :aria-expanded="showContext" aria-controls="assistant-context" @click="showContext = !showContext"><Document aria-hidden="true" /><span>文档上下文</span><span v-if="includeCurrent" class="qa-context-count">{{ 1 }}</span></button>
              <div v-if="showContext" id="assistant-context" class="qa-context-panel" @keydown.esc.stop="showContext = false">
                <div class="qa-context-title"><strong>文档上下文</strong><button class="qa-icon-button" type="button" aria-label="关闭文档上下文" @click="showContext = false"><Close /></button></div>
                <p class="qa-muted">默认面向整个知识库，AI 可按需查找和读取文档、目录及知识网络。</p>
                <p class="qa-muted">当前上下文预算 {{ modelLimits.contextWindowTokens.toLocaleString() }} tokens，单次输出预算 {{ modelLimits.maxOutputTokens.toLocaleString() }} tokens；可在 Note Bridge 的模型设置中调整。</p>
                <p v-if="loading" class="qa-muted" role="status">正在读取文档…</p>
                <template v-else-if="attachmentError"><p class="qa-error" role="status">{{ attachmentError }}</p><button class="qa-clear-context" type="button" @click="loadDocument(props.doc)">重试读取当前文档</button></template>
                <template v-else-if="document">
                  <label class="qa-check"><input v-model="includeCurrent" type="checkbox" aria-label="附加当前文档目录" :disabled="busy" />附加当前文档目录：{{ document.title }}</label>
                  <template v-if="includeCurrent">
                    <label class="qa-field">附加当前文档章节<select v-model="headingIds" multiple aria-label="选择当前文档章节" :disabled="busy"><option v-for="heading in document.headings" :key="heading.id" :value="heading.id">{{ heading.title }}</option></select></label>
                    <p class="qa-muted">未选择章节时，仅附加目录与元信息，正文由 AI 按需读取。</p>
                    <p class="qa-muted">文档由 Note Bridge 从知识站点读取，并保存本次回答使用的来源版本。</p>
                    <button class="qa-clear-context" type="button" :disabled="busy" @click="clearAttachment">取消附加文档</button>
                  </template>
                </template>
                <p v-else class="qa-muted">当前页面没有可附加的文档。可以直接向知识库提问，也可以在阅读文档时选择附加内容。</p>
              </div>
            </div>
            <div class="qa-model-controls">
              <label class="qa-select-field"><span class="qa-sr-only">模型</span><select v-model="modelKey" aria-label="模型" :disabled="busy || !modelOptions.length" @change="selectModel"><option v-if="!modelOptions.length" value="">选择模型</option><optgroup v-for="group in modelGroups" :key="group.id" :label="group.name"><option v-for="item in group.models" :key="item.key" :value="item.key">{{ item.name === item.id ? item.id : `${item.name} · ${item.id}` }}</option></optgroup></select></label>
              <label class="qa-select-field qa-effort"><span class="qa-sr-only">思考强度</span><select v-model="effort" aria-label="思考强度" @change="selectEffort" :disabled="busy || !providers.length || availableEfforts.length <= 1"><option v-for="value in availableEfforts" :key="value" :value="value">{{ effortLabels[value] }}</option></select></label>
              <button v-if="busy" :disabled="state !== 'ready' || sending" class="qa-send-button qa-stop-button" type="button" aria-label="停止生成" title="停止生成" @click="cancel"><span aria-hidden="true"></span></button>
              <button v-else class="qa-send-button" type="submit" aria-label="发送问题" title="发送问题" :disabled="!canSend"><Top /></button>
            </div>
          </div>
        </form>
        <p class="qa-muted qa-background-hint" v-if="busy">关闭窗口或切换聊天后，回答会在 Note Bridge 中继续。</p>
        <p class="qa-composer-hint">Enter 发送 · Shift + Enter 换行<span>AI 回答可能有误，请核对文档来源</span></p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { ArrowRight, ChatDotRound, Close, Delete, Document, EditPen, Memo, Top } from '@element-plus/icons-vue'
import type { AiBridgeEvent, AiDocumentMetadata, AiEffort, AiModel, AiSessionSummary, AiSessionTurn, AiMessageInput } from '@/core/ports/AiBridgePort'
import type { AiCitation } from '@/core/domain/AiDocumentTools'
import { AI_MAX_QUESTION_CHARS, resolveAiModelLimits } from '@/core/domain/AiLimits'
import { useAiBridgeConnection } from '@/platform/web/components/navigation/useAiBridgeConnection'
import EventBus from '@/platform/web/components/EventBus'
import AiMarkdown from './AiMarkdown.vue'

const props = defineProps<{ doc?: string }>()
const emit = defineEmits<{ 'open-connection': [] }>()
const { bridge, state, providers, statusText } = useAiBridgeConnection()
const modelKey = ref('')
const effort = ref<AiEffort>('default')
const document = ref<AiDocumentMetadata>()
const includeCurrent = ref(false)
const headingIds = ref<string[]>([])
const loading = ref(false)
const attachmentError = ref('')
const sending = ref(false)
const question = ref('')
const error = ref('')
const sessions = ref<AiSessionSummary[]>([])
const turns = ref<AiSessionTurn[]>([])
const sessionCursor = ref<string>()
const turnCursor = ref<string>()
const loadingSessions = ref(false)
const loadingTurns = ref(false)
const activeSessionId = ref('')
const historyOpen = ref(false)
const showContext = ref(false)
const transcriptEl = ref<HTMLElement>()
const questionEl = ref<HTMLTextAreaElement>()
const newChatEl = ref<HTMLButtonElement>()
const suggestions = ['知识库有哪些主题？', '帮我查找缓存相关的知识并比较不同方案', '串联相关文档，为我制定一条学习路线']
const effortLabels: Record<AiEffort, string> = { default: '默认强度', none: '不思考', minimal: '最低强度', low: '低强度', medium: '中等强度', high: '高强度', xhigh: '更高强度', max: '最高强度', ultra: '超高强度' }
let selectionEpoch = 0
let loadEpoch = 0
let connectionEpoch = 0
let disposed = false
let followBottom = true
let draftSelected = false
let subscribedId = ''
let refreshQueued = false
let reloadTurnsQueued = false
let preferredProviderId = ''
let preferredModel = ''
let preferredEffort: AiEffort = 'default'
// A retry after a lost acknowledgement reuses the same submission key in this open UI.
let pendingSubmission: { fingerprint: string; id: string } | undefined
const turnRevisions = new Map<string, number>()
const activeSession = computed(() => sessions.value.find(item => item.id === activeSessionId.value))
const busy = computed(() => sending.value || activeSession.value?.status === 'running')
const modelGroups = computed(() => providers.value.map(provider => ({ id: provider.id, name: provider.name,
  models: (provider.models?.length ? provider.models : [{ id: provider.model, name: provider.model, efforts: provider.efforts?.length ? provider.efforts : ['default'] } as AiModel])
    .map(model => ({ ...model, providerId: provider.id, key: JSON.stringify([provider.id, model.id]) })),
})))
const modelOptions = computed(() => modelGroups.value.flatMap(group => group.models))
const selectedModel = computed(() => modelOptions.value.find(item => item.key === modelKey.value))
const modelLimits = computed(() => resolveAiModelLimits(selectedModel.value))
const providerId = computed(() => selectedModel.value?.providerId || '')
const model = computed(() => selectedModel.value?.id || '')
const availableEfforts = computed<AiEffort[]>(() => selectedModel.value?.efforts.length ? selectedModel.value.efforts : ['default'])
const canSend = computed(() => state.value === 'ready' && !!providerId.value && !!model.value && !busy.value && !loadingTurns.value && !!question.value.trim())

const sourceCache = new WeakMap<AiSessionTurn, AiCitation[]>()
function turnSources(turn: AiSessionTurn): AiCitation[] {
  const cached = sourceCache.get(turn)
  if (cached) return cached
  const sources = turn.sources.filter(source => /^D\d+S\d+$/.test(source.sourceId) && source.url.startsWith('/') && !source.url.startsWith('//')
    && !/[\u0000-\u0020\u007f\\]/.test(source.url) && /^[^?#]*\.html(?:[?#]|$)/.test(source.url))
  sourceCache.set(turn, sources)
  return sources
}
function citations(turn: AiSessionTurn) {
  const used = new Set(Array.from(turn.answer.matchAll(/\[(D\d+S\d+)\]/g), match => match[1]))
  return turnSources(turn).filter(source => used.has(source.sourceId))
}
function toolLabel(name: string) {
  return ({ get_document: '读取文档', get_toc: '读取文档目录', get_knowledge_network: '读取知识网络', get_related_documents: '读取关联文档', search_documents: '查找文档', get_knowledge_overview: '读取知识库概览' } as Record<string, string>)[name] || name
}
function mergeSession(session: AiSessionSummary) {
  const index = sessions.value.findIndex(item => item.id === session.id)
  if (index < 0) sessions.value.push(session)
  else if (sessions.value[index].revision <= session.revision) sessions.value[index] = session
  sessions.value.sort((a, b) => b.updatedAt - a.updatedAt || b.id.localeCompare(a.id))
}
function mergeTurns(incoming: AiSessionTurn[], revision: number) {
  for (const turn of incoming) {
    if ((turnRevisions.get(turn.id) ?? -1) > revision) continue
    const index = turns.value.findIndex(item => item.id === turn.id)
    if (index >= 0) turns.value[index] = turn
    else turns.value.push(turn)
    turnRevisions.set(turn.id, revision)
  }
  turns.value.sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))
}
function report(cause: unknown) { error.value = cause instanceof Error ? cause.message : '读取聊天失败，请重试' }
async function refreshSessions(append = false) {
  if (state.value !== 'ready' || loadingSessions.value) { if (!append) refreshQueued = true; return }
  const epoch = connectionEpoch
  loadingSessions.value = true
  try {
    const page = await bridge.listSessions(append ? sessionCursor.value : undefined)
    if (disposed || epoch !== connectionEpoch) return
    if (!append) {
      const current = activeSession.value
      const known = new Map(sessions.value.map(session => [session.id, session]))
      sessions.value = page.sessions.map(session => (known.get(session.id)?.revision ?? -1) > session.revision ? known.get(session.id)! : session)
      if (current && !sessions.value.some(session => session.id === current.id)) sessions.value.push(current)
    } else page.sessions.forEach(mergeSession)
    sessionCursor.value = page.nextCursor
    if (!activeSessionId.value && !draftSelected && sessions.value.length) await selectSession(sessions.value[0].id)
  } catch (cause) { if (!disposed && epoch === connectionEpoch) report(cause) }
  finally {
    loadingSessions.value = false
    if (refreshQueued && !disposed && state.value === 'ready') { refreshQueued = false; void refreshSessions() }
  }
}
async function loadTurns(earlier = false) {
  const sessionId = activeSessionId.value
  if (!sessionId || state.value !== 'ready') return
  if (loadingTurns.value) { if (!earlier) reloadTurnsQueued = true; return }
  const epoch = selectionEpoch
  loadingTurns.value = true
  if (earlier) followBottom = false
  const oldHeight = transcriptEl.value?.scrollHeight || 0
  const oldTop = transcriptEl.value?.scrollTop || 0
  try {
    const page = await bridge.getSession(sessionId, earlier ? turnCursor.value : undefined)
    if (disposed || epoch !== selectionEpoch) return
    mergeSession(page.session)
    mergeTurns(page.turns, page.session.revision)
    turnCursor.value = page.nextCursor
    if (earlier) await nextTick(() => { if (transcriptEl.value) transcriptEl.value.scrollTop = oldTop + transcriptEl.value.scrollHeight - oldHeight })
  } catch (cause) { if (!disposed && epoch === selectionEpoch) report(cause) }
  finally {
    if (epoch === selectionEpoch) {
      loadingTurns.value = false
      if (reloadTurnsQueued && !disposed) { reloadTurnsQueued = false; void loadTurns() }
    }
  }
}
async function observeActive() {
  const id = activeSessionId.value
  if (!id || state.value !== 'ready') return
  const epoch = selectionEpoch
  try {
    subscribedId = id
    await bridge.subscribeSession(id)
    if (disposed || epoch !== selectionEpoch) return
    await loadTurns()
  } catch (cause) { if (!disposed && epoch === selectionEpoch) report(cause) }
}
function detach() {
  const id = subscribedId
  subscribedId = ''
  if (id) void bridge.unsubscribeSession(id).catch(() => {})
}
function onEvent(event: AiBridgeEvent) {
  if (event.type === 'sessions.changed') { void refreshSessions(); return }
  if (event.type !== 'session.updated') return
  const previousRevision = sessions.value.find(session => session.id === event.sessionId)?.revision ?? -1
  if (event.revision < previousRevision) return
  mergeSession(event.session)
  if (event.sessionId === activeSessionId.value) {
    if (event.turn) mergeTurns([event.turn], event.revision)
    // Throttled pushes can skip revisions; reload to discover any complete intervening turns.
    if (previousRevision >= 0 && event.revision > previousRevision + 1) void loadTurns()
  }
}
const unsubscribe = bridge.subscribe(onEvent)
function syncEffortPreference() {
  effort.value = availableEfforts.value.includes(preferredEffort) ? preferredEffort : selectedModel.value?.defaultEffort || availableEfforts.value[0] || 'default'
}
function syncModelPreference() {
  const available = modelOptions.value
  const preferredProvider = providers.value.find(provider => provider.id === preferredProviderId)
  const firstProvider = providers.value[0]
  modelKey.value = (available.find(item => item.providerId === preferredProviderId && item.id === preferredModel)
    || available.find(item => item.providerId === preferredProviderId && item.id === preferredProvider?.model)
    || available.find(item => item.key === modelKey.value)
    || available.find(item => item.providerId === firstProvider?.id && item.id === firstProvider.model) || available[0])?.key || ''
  syncEffortPreference()
}
function restoreModelPreference() {
  const session = activeSession.value
  if (session) { preferredProviderId = session.providerId; preferredModel = session.model; preferredEffort = session.effort }
  syncModelPreference()
}
function saveModelPreference() { preferredProviderId = providerId.value; preferredModel = model.value; preferredEffort = effort.value }
function selectModel() { syncEffortPreference(); saveModelPreference() }
function selectEffort() { saveModelPreference() }
watch(providers, syncModelPreference, { immediate: true })
watch(state, value => {
  connectionEpoch++; selectionEpoch++; loadingTurns.value = false; reloadTurnsQueued = false; subscribedId = ''
  if (value === 'ready') {
    error.value = ''; void refreshSessions()
    if (activeSessionId.value) void observeActive()
    if (showContext.value && props.doc) void loadDocument(props.doc)
  } else { loadEpoch++; loading.value = false }
}, { immediate: true })
function openBridge() { emit('open-connection'); EventBus.emit('show-note-bridge', null) }
async function cancel() {
  if (!activeSessionId.value || state.value !== 'ready') return
  const id = activeSessionId.value
  try { await bridge.cancelRun(id); if (id === activeSessionId.value) await loadTurns() }
  catch (cause) { if (!disposed) report(cause) }
}
function clearAttachment() { includeCurrent.value = false; headingIds.value = [] }
function resetComposer() { clearAttachment(); question.value = ''; error.value = ''; showContext.value = false; historyOpen.value = false; followBottom = true }
function showHistory() { historyOpen.value = true; nextTick(() => newChatEl.value?.focus()) }
function hideHistory() { historyOpen.value = false; nextTick(() => questionEl.value?.focus()) }
function closeContextOnEscape(event: KeyboardEvent) { if (showContext.value) { event.stopPropagation(); showContext.value = false } }
async function selectSession(id: string) {
  if (id === activeSessionId.value) { hideHistory(); return }
  selectionEpoch++; detach(); activeSessionId.value = id; turns.value = []; turnRevisions.clear(); turnCursor.value = undefined; loadingTurns.value = false; reloadTurnsQueued = false
  draftSelected = false; resetComposer(); restoreModelPreference()
  await observeActive()
  if (!disposed && id === activeSessionId.value) nextTick(() => { scrollToBottom(); questionEl.value?.focus() })
}
function newChat() {
  selectionEpoch++; detach(); activeSessionId.value = ''; turns.value = []; turnRevisions.clear(); turnCursor.value = undefined; loadingTurns.value = false; reloadTurnsQueued = false
  draftSelected = true; resetComposer(); nextTick(() => questionEl.value?.focus())
}
async function removeSession(id: string) {
  try {
    await bridge.archiveSession(id)
    if (disposed) return
    if (id === activeSessionId.value) newChat()
    sessions.value = sessions.value.filter(session => session.id !== id)
  } catch (cause) { if (!disposed) report(cause) }
}
function useSuggestion(suggestion: string) { question.value = suggestion; nextTick(() => questionEl.value?.focus()) }
function onQuestionKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); if (canSend.value) void send() }
}
function onTranscriptScroll() { const el = transcriptEl.value; if (el) followBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80 }
function scrollToBottom() { const el = transcriptEl.value; if (el && followBottom) el.scrollTop = el.scrollHeight }
watch(() => turns.value.map(turn => `${turn.answer.length}:${turn.toolCalls.length}:${turn.status}`).join('|'), () => nextTick(scrollToBottom))
async function send() {
  if (!canSend.value) return
  const epoch = selectionEpoch
  const text = question.value.trim()
  const selection = { providerId: providerId.value, model: model.value, effort: effort.value }
  const attachments = includeCurrent.value && document.value ? [{ docId: document.value.docId, contentHash: document.value.contentHash, ...(headingIds.value.length ? { headingIds: [...headingIds.value] } : {}) }] : undefined
  sending.value = true; error.value = ''; showContext.value = false; followBottom = true
  try {
    let sessionId = activeSessionId.value
    if (!sessionId) {
      const session = await bridge.createSession(selection)
      if (disposed || epoch !== selectionEpoch) return
      mergeSession(session); sessionId = session.id; activeSessionId.value = sessionId; draftSelected = false
      await observeActive()
      if (disposed || epoch !== selectionEpoch) return
    }
    const payload = { sessionId, text, ...selection, ...(attachments ? { attachments } : {}) }
    const fingerprint = JSON.stringify(payload)
    if (pendingSubmission?.fingerprint !== fingerprint) pendingSubmission = { fingerprint, id: crypto.randomUUID() }
    const input: AiMessageInput = { ...payload, clientRequestId: pendingSubmission.id }
    await bridge.sendMessage(input)
    pendingSubmission = undefined
    if (disposed || epoch !== selectionEpoch) return
    if (question.value.trim() === text) question.value = ''
    clearAttachment(); saveModelPreference()
    await loadTurns()
  } catch (cause) {
    if (!disposed && epoch === selectionEpoch) { report(cause); if (state.value === 'ready') void loadTurns() }
  } finally { sending.value = false }
}
async function loadDocument(docId?: string) {
  if (!docId || state.value !== 'ready') return
  const epoch = ++loadEpoch
  document.value = undefined; loading.value = true; attachmentError.value = ''
  try { const loaded = await bridge.document(docId); if (epoch === loadEpoch && !disposed) document.value = loaded }
  catch { if (epoch === loadEpoch && !disposed) attachmentError.value = '当前文档目录读取失败，仍可向整个知识库提问。' }
  finally { if (epoch === loadEpoch && !disposed) loading.value = false }
}
watch(includeCurrent, included => { if (!included) headingIds.value = [] })
watch(showContext, shown => { if (shown && props.doc && !document.value && !loading.value) void loadDocument(props.doc) })
watch(() => props.doc, docId => {
  loadEpoch++; document.value = undefined; loading.value = false; attachmentError.value = ''; clearAttachment()
  if (showContext.value && docId) void loadDocument(docId)
})
onBeforeUnmount(() => { disposed = true; selectionEpoch++; loadEpoch++; connectionEpoch++; detach(); unsubscribe() })
</script>

<style scoped lang="less">
.qa-workspace { display: flex; height: 100%; min-height: 0; color: var(--main-text-color); font-family: var(--font-sans); font-size: var(--font-size-base); }
p, h2 { margin: 0; }
button, select, textarea { font: inherit; color: inherit; }
button { cursor: pointer; }
button:disabled, select:disabled { cursor: default; opacity: .5; }
button, select { min-height: var(--site-control-size); }
button svg { width: var(--font-size-xl); height: var(--font-size-xl); flex-shrink: 0; }
.qa-icon-button { display: inline-flex; flex-shrink: 0; align-items: center; justify-content: center; width: var(--site-control-size); padding: var(--spacing-sm); color: var(--secondary-text-color); background: transparent; border: 0; border-radius: var(--radius-lg); }
.qa-icon-button:hover { background: var(--hover-bg-color); color: var(--main-text-color); }
.qa-sidebar { width: var(--assistant-sidebar-width, 240px); flex-shrink: 0; display: flex; flex-direction: column; gap: var(--spacing-md); padding: var(--spacing-md) var(--spacing-sm); background: var(--hover-bg-color); border-right: 1px solid var(--border-color); box-sizing: border-box; min-height: 0; }
.qa-sidebar-heading { display: flex; justify-content: space-between; align-items: center; padding-inline: var(--spacing-sm); font-weight: 600; }
.qa-hide-history, .qa-show-history { display: none; }
.qa-new-chat { display: flex; align-items: center; gap: var(--spacing-sm); padding: var(--spacing-sm) var(--spacing-md); background: var(--card-bg-color); border: 1px solid var(--border-color); border-radius: var(--radius-lg); text-align: left; }
.qa-new-chat > span:last-child { margin-left: auto; color: var(--secondary-text-color); }
.qa-new-chat:hover { border-color: var(--primary-color); }
.qa-sidebar-label { color: var(--secondary-text-color); font-size: var(--font-size-xs); padding-inline: var(--spacing-sm); }
.qa-session-list { min-height: 0; flex: 1; overflow-y: auto; }
.qa-history-empty { padding: var(--spacing-sm); }
.qa-session { display: flex; align-items: center; border-radius: var(--radius-lg); margin-bottom: var(--spacing-xs); }
.qa-session.active, .qa-session:hover { background: var(--card-bg-color); }
.qa-session.active { box-shadow: var(--shadow-sm); }
.qa-session-select { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: var(--spacing-xs); padding: var(--spacing-sm); background: transparent; border: 0; border-radius: var(--radius-lg); text-align: left; }
.qa-session-select span, .qa-session-select small { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qa-session-select small { color: var(--secondary-text-color); font-size: var(--font-size-xs); }
.qa-delete-chat { opacity: 0; }
.qa-session:hover .qa-delete-chat, .qa-session:focus-within .qa-delete-chat { opacity: 1; }
.qa-sidebar-footnote { padding: var(--spacing-sm); color: var(--secondary-text-color); font-size: var(--font-size-xs); }
.qa-main { min-width: 0; min-height: 0; flex: 1; display: flex; flex-direction: column; background: var(--card-bg-color); }
.qa-topbar { display: flex; align-items: center; gap: var(--spacing-sm); min-height: calc(var(--site-control-size) + var(--spacing-md)); padding: var(--spacing-sm) var(--spacing-lg); flex-shrink: 0; }
.qa-current-document { min-width: 0; flex: 1; display: flex; align-items: baseline; gap: var(--spacing-sm); }
.qa-current-document > span { flex-shrink: 0; color: var(--secondary-text-color); font-size: var(--font-size-sm); }
.qa-current-document strong { font-size: var(--font-size-base); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qa-connection { display: inline-flex; flex-shrink: 0; align-items: center; gap: var(--spacing-xs); font-size: var(--font-size-xs); color: var(--secondary-text-color); }
.qa-connection.connected { color: var(--success-color); }
.qa-connection > span { width: var(--spacing-sm); height: var(--spacing-sm); border-radius: 50%; background: currentColor; }
.qa-transcript { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: var(--spacing-md) var(--content-pad); }
.qa-empty { max-width: var(--assistant-message-width, 760px); min-height: 100%; margin-inline: auto; padding: var(--spacing-xl) var(--spacing-md); box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--spacing-md); text-align: center; }
.qa-empty-mark { display: grid; place-items: center; width: var(--spacing-2xl); height: var(--spacing-2xl); background: var(--hover-bg-color); border: 1px solid var(--border-color); border-radius: var(--radius-xl); }
.qa-empty-mark svg { width: var(--spacing-lg); height: var(--spacing-lg); }
.qa-empty h2 { font-size: var(--font-size-2xl); font-weight: 600; }
.qa-empty > p { color: var(--secondary-text-color); line-height: var(--leading-normal); }
.qa-suggestions { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--spacing-sm); margin-top: var(--spacing-sm); }
.qa-suggestions button { display: flex; align-items: center; gap: var(--spacing-md); text-align: left; border: 1px solid var(--border-color); background: var(--card-bg-color); border-radius: var(--radius-lg); padding: var(--spacing-sm) var(--spacing-md); font-size: var(--font-size-sm); }
.qa-suggestions button:hover { background: var(--hover-bg-color); }
.qa-suggestions svg { width: var(--font-size-base); color: var(--secondary-text-color); transform: rotate(45deg); }
.qa-messages { max-width: var(--assistant-message-width, 760px); margin-inline: auto; }
.qa-turn + .qa-turn { margin-top: var(--spacing-2xl); }
.qa-user-message { display: flex; justify-content: flex-end; margin-bottom: var(--spacing-xl); }
.qa-user-message p { max-width: 86%; padding: var(--spacing-md); border-radius: var(--radius-xl); background: var(--hover-bg-color); line-height: var(--leading-normal); white-space: pre-wrap; overflow-wrap: anywhere; }
.qa-assistant-message { min-width: 0; padding-bottom: var(--spacing-lg); }
.qa-assistant-label { display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-md); font-size: var(--font-size-sm); font-weight: 600; }
.qa-assistant-label svg { width: var(--font-size-xl); height: var(--font-size-xl); }
.qa-answer-placeholder { padding-block: var(--spacing-sm); }
.qa-muted { color: var(--secondary-text-color); font-size: var(--font-size-sm); line-height: var(--leading-normal); }
.qa-context-notice { margin-bottom: var(--spacing-md); }
.qa-turn-status { margin-top: var(--spacing-md); font-size: var(--font-size-sm); }
.qa-error { color: var(--danger-color); font-size: var(--font-size-sm); overflow-wrap: anywhere; line-height: var(--leading-normal); }
.qa-tool-calls { margin: 0 0 var(--spacing-md); padding: 0; list-style: none; color: var(--secondary-text-color); font-size: var(--font-size-sm); }
.qa-tool-calls > li + li { margin-top: var(--spacing-xs); }
.qa-tool-call { min-width: 0; border-radius: var(--radius-md); }
.qa-tool-call summary { display: flex; align-items: center; gap: var(--spacing-sm); min-height: var(--site-control-size); padding: var(--spacing-xs) var(--spacing-sm); box-sizing: border-box; border-radius: var(--radius-md); cursor: pointer; list-style: none; }
.qa-tool-call summary::-webkit-details-marker { display: none; }
.qa-tool-call summary:hover { background: var(--hover-bg-color); color: var(--main-text-color); }
.qa-tool-call summary:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
.qa-tool-chevron { width: var(--font-size-xs); height: var(--font-size-xs); flex-shrink: 0; }
.qa-tool-call[open] .qa-tool-chevron { transform: rotate(90deg); }
.qa-tool-name { min-width: 0; overflow-wrap: anywhere; }
.qa-tool-status { margin-left: auto; flex-shrink: 0; font-size: var(--font-size-xs); }
.qa-tool-dot { width: var(--spacing-xs); height: var(--spacing-xs); flex-shrink: 0; border-radius: 50%; background: currentColor; }
.qa-tool-calls > .complete .qa-tool-dot { color: var(--success-color); }
.qa-tool-calls > .error summary, .qa-tool-error { color: var(--danger-color); }
.qa-tool-overview { margin: var(--spacing-xs) var(--spacing-sm) var(--spacing-sm); padding: var(--spacing-md); display: flex; flex-direction: column; gap: var(--spacing-sm); border: 1px solid var(--border-color); border-radius: var(--radius-lg); background: var(--hover-bg-color); line-height: var(--leading-normal); overflow-wrap: anywhere; }
.qa-tool-input { margin: 0; display: grid; gap: var(--spacing-xs); }
.qa-tool-input > div { display: flex; flex-wrap: wrap; column-gap: var(--spacing-md); }
.qa-tool-input dt { flex-shrink: 0; }
.qa-tool-input dd { margin: 0; min-width: 0; color: var(--main-text-color); }
.qa-tool-result { color: var(--main-text-color); }
.qa-tool-items { margin: 0; padding-left: var(--spacing-md); color: var(--main-text-color); }
.qa-tool-items li + li { margin-top: var(--spacing-xs); }
.qa-tool-note { font-size: var(--font-size-xs); }
.qa-sources { display: flex; flex-wrap: wrap; gap: var(--spacing-sm); margin-top: var(--spacing-md); }
.qa-sources a { color: var(--secondary-text-color); text-decoration: none; font-size: var(--font-size-xs); border: 1px solid var(--border-color); border-radius: 999px; padding: var(--spacing-xs) var(--spacing-sm); overflow-wrap: anywhere; }
.qa-sources a:hover { color: var(--primary-color); border-color: var(--primary-color); }
.qa-compose-area { flex-shrink: 0; width: 100%; max-width: calc(var(--assistant-message-width, 760px) + var(--content-pad) * 2); margin-inline: auto; padding: var(--spacing-md) var(--content-pad); box-sizing: border-box; display: flex; flex-direction: column; gap: var(--spacing-sm); }
.qa-load-more { display: block; margin: var(--spacing-sm) auto; padding: var(--spacing-xs) var(--spacing-md); border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--card-bg-color); font-size: var(--font-size-xs); }
.qa-background-hint { font-size: var(--font-size-xs); }
.qa-connection-prompt { display: flex; flex-wrap: wrap; align-items: center; gap: var(--spacing-sm); color: var(--secondary-text-color); font-size: var(--font-size-sm); }
.qa-connection-prompt button { padding: 0; min-height: auto; background: transparent; color: var(--primary-color); border: 0; text-align: left; }
.qa-composer { border: 1px solid var(--border-color); border-radius: var(--radius-xl); padding: var(--spacing-md); box-shadow: var(--shadow-sm); background: var(--card-bg-color); }
.qa-composer:focus-within { border-color: color-mix(in srgb, var(--primary-color) 50%, var(--border-color)); }
.qa-composer textarea { display: block; width: 100%; resize: vertical; min-height: var(--spacing-2xl); max-height: 25dvh; box-sizing: border-box; border: 0; background: transparent; padding: var(--spacing-xs); line-height: var(--leading-normal); border-radius: var(--radius-sm); }
.qa-composer textarea::placeholder { color: var(--secondary-text-color); }
.qa-composer-toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--spacing-sm); margin-top: var(--spacing-sm); }
.qa-context-control { position: relative; }
.qa-context-button { display: inline-flex; align-items: center; gap: var(--spacing-xs); padding: var(--spacing-xs) var(--spacing-sm); border: 0; border-radius: var(--radius-lg); background: transparent; color: var(--secondary-text-color); font-size: var(--font-size-xs); }
.qa-context-button:hover, .qa-context-button[aria-expanded='true'] { background: var(--hover-bg-color); color: var(--main-text-color); }
.qa-context-button svg { width: var(--font-size-lg); height: var(--font-size-lg); }
.qa-context-count { font-size: var(--font-size-xs); color: var(--primary-color); }
.qa-context-panel { position: absolute; z-index: 1; bottom: calc(100% + var(--spacing-sm)); left: 0; width: min(360px, 76vw); max-height: 50dvh; overflow-y: auto; box-sizing: border-box; display: flex; flex-direction: column; gap: var(--spacing-md); padding: var(--spacing-md); background: var(--elevated-bg-color); border: 1px solid var(--border-color); border-radius: var(--radius-xl); box-shadow: var(--shadow-md); }
.qa-context-title { display: flex; align-items: center; justify-content: space-between; }
.qa-field { display: flex; flex-direction: column; gap: var(--spacing-sm); font-size: var(--font-size-sm); }
.qa-field select { width: 100%; min-height: calc(var(--site-control-size) * 2); padding: var(--spacing-sm); background: var(--card-bg-color); border: 1px solid var(--border-color); border-radius: var(--radius-md); }
fieldset { margin: 0; padding: var(--spacing-sm); border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: var(--font-size-sm); }
.qa-check { display: flex; align-items: flex-start; gap: var(--spacing-sm); margin-block: var(--spacing-sm); overflow-wrap: anywhere; }
.qa-check input { accent-color: var(--primary-color); }
.qa-clear-context { border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--hover-bg-color); }
.qa-model-controls { display: flex; min-width: 0; margin-left: auto; align-items: center; gap: var(--spacing-xs); }
.qa-select-field { min-width: 0; }
.qa-select-field select { max-width: 220px; width: 100%; padding: var(--spacing-xs); font-size: var(--font-size-xs); border: 0; border-radius: var(--radius-md); background: var(--card-bg-color); text-overflow: ellipsis; }
.qa-effort select { color: var(--secondary-text-color); max-width: 100px; }
.qa-send-button { display: grid; place-items: center; flex-shrink: 0; width: var(--site-control-size); height: var(--site-control-size); min-height: var(--site-control-size); padding: var(--spacing-sm); border: 0; border-radius: 50%; color: var(--card-bg-color); background: var(--main-text-color); }
.qa-send-button:disabled { opacity: .25; }
.qa-stop-button > span { width: var(--font-size-xs); height: var(--font-size-xs); border-radius: var(--radius-sm); background: currentColor; }
.qa-composer-hint { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--spacing-xs); color: var(--secondary-text-color); font-size: var(--font-size-xs); }
.qa-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media (max-width: @bp-mobile) {
  .qa-workspace { position: relative; }
  .qa-sidebar { display: none; }
  .history-open .qa-sidebar { display: flex; width: 100%; border: 0; }
  .history-open .qa-main { display: none; }
  .qa-hide-history, .qa-show-history { display: inline-flex; }
  .qa-topbar { padding: var(--spacing-xs) var(--spacing-sm); }
  .qa-current-document { display: block; }
  .qa-current-document > span { display: none; }
  .qa-current-document strong { display: block; }
  .qa-transcript { padding: var(--spacing-md); }
  .qa-compose-area { padding: var(--spacing-sm); }
  .qa-composer { padding: var(--spacing-sm); }
  .qa-composer-toolbar { gap: var(--spacing-xs); }
  .qa-model-controls { max-width: 100%; }
  .qa-select-field select { max-width: 160px; }
  .qa-effort select { max-width: 82px; }
  .qa-context-button { padding-inline: var(--spacing-xs); }
  .qa-context-button > span:not(.qa-context-count) { display: none; }
  .qa-composer-hint { justify-content: center; }
  .qa-composer-hint > span { display: none; }
  .qa-delete-chat { opacity: 1; }
  .qa-empty { padding: var(--spacing-md) 0; }
  .qa-empty h2 { font-size: var(--font-size-xl); }
  .qa-empty > p { font-size: var(--font-size-sm); }
  .qa-suggestions { flex-direction: column; align-items: stretch; width: 100%; }
  .qa-suggestions button { justify-content: space-between; }
  .qa-turn + .qa-turn { margin-top: var(--spacing-lg); }
  .qa-user-message p { max-width: 94%; }
}
</style>
