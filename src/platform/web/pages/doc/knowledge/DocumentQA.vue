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
            <span>{{ session.title }}</span><small>整个知识库</small>
          </button>
          <button class="qa-icon-button qa-delete-chat" type="button" :aria-label="`删除聊天：${session.title}`" @click="removeSession(session.id)"><Delete /></button>
        </div>
      </div>
      <p class="qa-sidebar-footnote">聊天记录保存在此浏览器</p>
    </aside>

    <div class="qa-main">
      <header class="qa-topbar">
        <button class="qa-icon-button qa-show-history" type="button" aria-label="显示聊天记录" :aria-expanded="historyOpen" @click="showHistory"><Memo /></button>
        <div class="qa-current-document"><span>知识助手</span><strong>整个知识库</strong></div>
        <span class="qa-connection" :class="{ connected: state === 'ready' }" role="status" :title="statusText"><span aria-hidden="true"></span>{{ state === 'ready' ? '已连接' : state === 'connecting' ? '连接中' : '未连接' }}</span>
      </header>

      <div ref="transcriptEl" class="qa-transcript" role="log" aria-label="问答记录" aria-live="polite" aria-relevant="additions text" @scroll="onTranscriptScroll">
        <div v-if="!turns.length" class="qa-empty">
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
              <p v-else class="qa-muted qa-answer-placeholder">{{ busy && turn.id === activeTurnId ? '正在思考…' : turn.cancelled ? '回答已停止' : turn.error ? '未能生成回答' : '未收到回答' }}</p>
              <p v-if="turn.cancelled && turn.answer" class="qa-muted qa-turn-status">已停止生成</p>
              <p v-if="turn.error" class="qa-error qa-turn-status">{{ turn.error }}</p>
              <nav v-if="citations(turn).length" aria-label="回答来源" class="qa-sources"><a v-for="source in citations(turn)" :key="source.sourceId" :href="source.url">{{ source.title }}</a></nav>
            </div>
          </article>
        </div>
      </div>

      <div class="qa-compose-area">
        <p v-if="storageError" class="qa-storage-error" role="status">{{ storageError }}</p>
        <p v-if="error" class="qa-error" role="alert">{{ error }}</p>
        <div v-if="state !== 'ready' || !providers.length" class="qa-connection-prompt">
          <span>{{ state === 'ready' ? '桌面端尚无可用模型，请先配置模型。' : '连接本机 Note Bridge，开始知识库问答。' }}</span>
          <button type="button" @click="openBridge">打开 Note Bridge 连接设置</button>
        </div>
        <form class="qa-composer" @submit.prevent="send">
          <label class="qa-sr-only" for="assistant-question">你的问题</label>
          <textarea id="assistant-question" ref="questionEl" v-model="question" aria-label="你的问题" rows="3" maxlength="4000" placeholder="向整个知识库提问，查找、比较或串联知识…" @keydown="onQuestionKeydown" />
          <div class="qa-composer-toolbar">
            <div class="qa-context-control" @keydown.esc="closeContextOnEscape">
              <button type="button" class="qa-context-button" aria-label="文档上下文" :aria-expanded="showContext" aria-controls="assistant-context" @click="showContext = !showContext"><Document aria-hidden="true" /><span>文档上下文</span><span v-if="includeCurrent" class="qa-context-count">{{ 1 + relatedIds.length }}</span></button>
              <div v-if="showContext" id="assistant-context" class="qa-context-panel" @keydown.esc.stop="showContext = false">
                <div class="qa-context-title"><strong>文档上下文</strong><button class="qa-icon-button" type="button" aria-label="关闭文档上下文" @click="showContext = false"><Close /></button></div>
                <p class="qa-muted">默认面向整个知识库，AI 可按需查找和读取文档、目录及知识网络。</p>
                <p v-if="loading" class="qa-muted" role="status">正在读取文档…</p>
                <template v-else-if="attachmentError"><p class="qa-error" role="status">{{ attachmentError }}</p><button class="qa-clear-context" type="button" @click="loadDocument(props.doc)">重试读取当前文档</button></template>
                <template v-else-if="document">
                  <label class="qa-check"><input v-model="includeCurrent" type="checkbox" aria-label="附加当前文档目录" :disabled="busy" />附加当前文档目录：{{ document.title }}</label>
                  <template v-if="includeCurrent">
                    <label class="qa-field">附加当前文档章节<select v-model="headingIds" multiple aria-label="选择当前文档章节" :disabled="busy"><option v-for="heading in document.headings" :key="heading.id" :value="heading.id">{{ heading.title }}</option></select></label>
                    <p class="qa-muted">未选择章节时，仅附加目录与元信息，正文由 AI 按需读取。</p>
                    <fieldset v-if="relatedOptions.length" :disabled="busy"><legend>附加关联文档（最多 2 篇）</legend><label v-for="related in relatedOptions" :key="related.docId" class="qa-check"><input v-model="relatedIds" type="checkbox" :value="related.docId" :disabled="relatedIds.length >= 2 && !relatedIds.includes(related.docId)" />{{ related.title }}</label></fieldset>
                    <p class="qa-muted">直接附加内容上限 {{ budget.toLocaleString() }} 字符，过长内容按章节截断。</p>
                    <button class="qa-clear-context" type="button" :disabled="busy" @click="clearAttachment">取消附加文档</button>
                  </template>
                </template>
                <p v-else class="qa-muted">当前页面没有可附加的文档。可以直接向知识库提问，也可以在阅读文档时选择附加内容。</p>
              </div>
            </div>
            <div class="qa-model-controls">
              <label class="qa-select-field"><span class="qa-sr-only">模型</span><select v-model="modelKey" aria-label="模型" :disabled="busy || !modelOptions.length" @change="selectModel"><option v-if="!modelOptions.length" value="">选择模型</option><optgroup v-for="group in modelGroups" :key="group.id" :label="group.name"><option v-for="item in group.models" :key="item.key" :value="item.key">{{ item.name === item.id ? item.id : `${item.name} · ${item.id}` }}</option></optgroup></select></label>
              <label class="qa-select-field qa-effort"><span class="qa-sr-only">思考强度</span><select v-model="effort" aria-label="思考强度" @change="selectEffort" :disabled="busy || !providers.length || availableEfforts.length <= 1"><option v-for="value in availableEfforts" :key="value" :value="value">{{ effortLabels[value] }}</option></select></label>
              <button v-if="busy" class="qa-send-button qa-stop-button" type="button" aria-label="停止生成" title="停止生成" @click="cancel"><span aria-hidden="true"></span></button>
              <button v-else class="qa-send-button" type="submit" aria-label="发送问题" title="发送问题" :disabled="!canSend"><Top /></button>
            </div>
          </div>
        </form>
        <p class="qa-composer-hint">Enter 发送 · Shift + Enter 换行<span>AI 回答可能有误，请核对文档来源</span></p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { ArrowRight, ChatDotRound, Close, Delete, Document, EditPen, Memo, Top } from '@element-plus/icons-vue'
import type { AiBridgeEvent, AiContext, AiContextDocument, AiEffort, AiModel } from '@/core/ports/AiBridgePort'
import type { AiCitation } from '@/core/domain/AiDocumentTools'
import type { AiChatSession, AiChatTurn } from '@/core/service/AiChatHistoryService'
import { AI_CONTEXT_BUDGET } from '@/core/service/AiContextService'
import DocUtils from '@/core/util/DocUtils'
import { safeTextPrefix } from '@/core/util/StringUtils'
import { useServices } from '@/platform/web/app/useServices'
import { useAiBridgeConnection } from '@/platform/web/components/navigation/useAiBridgeConnection'
import EventBus from '@/platform/web/components/EventBus'
import AiMarkdown from './AiMarkdown.vue'

const props = defineProps<{ doc?: string }>()
const emit = defineEmits<{ 'open-connection': [] }>()
const { aiContextService, aiChatHistory } = useServices()
const { bridge, state, providers, statusText } = useAiBridgeConnection()
const budget = AI_CONTEXT_BUDGET
const modelKey = ref('')
const effort = ref<AiEffort>('default')
const document = ref<AiContextDocument>()
const includeCurrent = ref(false)
const headingIds = ref<string[]>([])
const relatedIds = ref<string[]>([])
const loading = ref(false)
const attachmentError = ref('')
const busy = ref(false)
const question = ref('')
const error = ref('')
const storageError = ref('')
const sessions = ref<AiChatSession[]>([])
const activeSessionId = ref('')
const activeTurnId = ref('')
const historyOpen = ref(false)
const showContext = ref(false)
const transcriptEl = ref<HTMLElement>()
const questionEl = ref<HTMLTextAreaElement>()
const newChatEl = ref<HTMLButtonElement>()
const suggestions = ['知识库有哪些主题？', '帮我查找缓存相关的知识并比较不同方案', '串联相关文档，为我制定一条学习路线']
const effortLabels: Record<AiEffort, string> = { default: '默认强度', none: '不思考', minimal: '最低强度', low: '低强度', medium: '中等强度', high: '高强度', xhigh: '更高强度', max: '最高强度', ultra: '超高强度' }
let activeId = ''
let epoch = 0
let loadEpoch = 0
let disposed = false
let followBottom = true
let persistTimer: ReturnType<typeof setTimeout> | undefined
// Preserve the user's preference while connection metadata is unavailable or temporarily incomplete.
let preferredProviderId = ''
let preferredModel = ''
let preferredEffort: AiEffort = 'default'
const activeSession = computed(() => sessions.value.find(item => item.id === activeSessionId.value))
const turns = computed(() => activeSession.value?.turns || [])
const modelGroups = computed(() => providers.value.map(provider => ({ id: provider.id, name: provider.name,
  models: (provider.models?.length ? provider.models : [{ id: provider.model, name: provider.model, efforts: provider.efforts?.length ? provider.efforts : ['default'] } as AiModel])
    .map(model => ({ ...model, providerId: provider.id, key: JSON.stringify([provider.id, model.id]) })),
})))
const modelOptions = computed(() => modelGroups.value.flatMap(group => group.models))
const selectedModel = computed(() => modelOptions.value.find(item => item.key === modelKey.value))
const providerId = computed(() => selectedModel.value?.providerId || '')
const model = computed(() => selectedModel.value?.id || '')
const availableEfforts = computed<AiEffort[]>(() => selectedModel.value?.efforts.length ? selectedModel.value.efforts : ['default'])
const canSend = computed(() => state.value === 'ready' && !!providerId.value && !!model.value && !busy.value && !!question.value.trim())
const relatedOptions = computed(() => (document.value?.relatedLinks || [])
  .filter(link => link.url.startsWith('/') && !link.url.startsWith('//') && /\.html(?:[?#]|$)/.test(link.url))
  .map(link => ({ docId: DocUtils.htmlUrl2Id(link.url), title: DocUtils.pathLeafName(link.title) }))
  .filter((link, index, all) => link.docId !== props.doc && all.findIndex(other => other.docId === link.docId) === index))

function turnSources(turn: AiChatTurn): AiCitation[] {
  const sourceMap = new Map<string, AiCitation>()
  turn.context.documents.forEach(doc => doc.sources.forEach(source => sourceMap.set(source.sourceId, { sourceId: source.sourceId, title: `${doc.title} · ${source.title}`, url: doc.url + (source.headingId ? `?headingId=${encodeURIComponent(source.headingId)}` : '') })))
  turn.sources.forEach(source => sourceMap.set(source.sourceId, source))
  return [...sourceMap.values()].filter(safeCitation)
}
function safeCitation(source: AiCitation) {
  return /^D\d+S\d+$/.test(source.sourceId) && source.url.startsWith('/') && !source.url.startsWith('//') && !/[\u0000-\u0020\u007f\\]/.test(source.url) && /^[^?#]*\.html(?:[?#]|$)/.test(source.url)
}
function citations(turn: AiChatTurn) {
  const used = new Set(Array.from(turn.answer.matchAll(/\[(D\d+S\d+)\]/g), match => match[1]))
  return turnSources(turn).filter(source => used.has(source.sourceId))
}
function toolLabel(name: string) {
  return ({ get_document: '读取文档', get_toc: '读取文档目录', get_knowledge_network: '读取知识网络', get_related_documents: '读取关联文档', search_documents: '查找文档', get_knowledge_overview: '读取知识库概览' } as Record<string, string>)[name] || name
}
function persist(session = activeSession.value) {
  if (persistTimer) { clearTimeout(persistTimer); persistTimer = undefined }
  if (!session) return
  session.updatedAt = Date.now()
  try { aiChatHistory.save(session); storageError.value = '' }
  catch (cause) { storageError.value = cause instanceof Error ? cause.message : '聊天记录暂时无法保存，本次聊天仍可继续。' }
  sessions.value.sort((a, b) => b.updatedAt - a.updatedAt)
}
function finishTools(turn: AiChatTurn) {
  turn.toolCalls.filter(call => call.status === 'running').forEach(call => { call.status = 'error'; call.message = '读取已中断' })
}
function onEvent(event: AiBridgeEvent) {
  if (event.type === 'providers') return
  if (event.type === 'state') {
    if (event.state !== 'ready') {
      epoch++
      const turn = turns.value.find(item => item.id === activeTurnId.value)
      if (activeId && turn) { turn.status = 'error'; turn.error ||= event.message || '连接已断开，请重新发送问题'; finishTools(turn); persist() }
      activeId = ''; activeTurnId.value = ''; busy.value = false
    }
    error.value = event.message || ''
    return
  }
  if (event.requestId !== activeId) return
  const turn = turns.value.find(item => item.id === activeTurnId.value)
  if (!turn) return
  if (event.type === 'delta') {
    const remaining = Math.max(0, 100000 - turn.answer.length)
    turn.answer += safeTextPrefix(event.delta, remaining)
    if (!persistTimer) persistTimer = setTimeout(() => persist(), 1000)
    if (event.delta.length > remaining || turn.answer.length >= 100000) cancel()
  } else if (event.type === 'tool') {
    const existing = turn.toolCalls.find(call => call.callId === event.callId)
    const update = { callId: event.callId, name: event.name, status: event.status, message: event.message, ...(event.overview ? { overview: event.overview } : {}) }
    if (existing) Object.assign(existing, update)
    else turn.toolCalls.push(update)
    for (const source of event.sources || []) {
      if (!safeCitation(source)) continue
      const previous = turn.sources.findIndex(item => item.sourceId === source.sourceId)
      if (previous >= 0) turn.sources[previous] = source
      else if (turn.sources.length < 1600) turn.sources.push(source)
    }
    persist()
  } else {
    busy.value = false; activeId = ''; activeTurnId.value = ''
    if (event.type === 'error') { turn.status = 'error'; turn.error = event.message; finishTools(turn) }
    else { turn.status = event.cancelled ? 'cancelled' : 'complete'; turn.cancelled = event.cancelled; if (event.cancelled) finishTools(turn) }
    persist()
  }
}
const unsubscribe = bridge.subscribe(onEvent)

function syncEffortPreference() {
  effort.value = availableEfforts.value.includes(preferredEffort) ? preferredEffort
    : selectedModel.value?.defaultEffort || availableEfforts.value[0] || 'default'
}
function syncModelPreference() {
  const available = modelOptions.value
  const preferredProvider = providers.value.find(provider => provider.id === preferredProviderId)
  const firstProvider = providers.value[0]
  modelKey.value = (available.find(item => item.providerId === preferredProviderId && item.id === preferredModel)
    || available.find(item => item.providerId === preferredProviderId && item.id === preferredProvider?.model)
    || available.find(item => item.key === modelKey.value)
    || available.find(item => item.providerId === firstProvider?.id && item.id === firstProvider.model)
    || available[0])?.key || ''
  syncEffortPreference()
}
function restoreModelPreference() {
  const session = activeSession.value
  if (session) { preferredProviderId = session.providerId; preferredModel = session.model; preferredEffort = session.effort }
  syncModelPreference()
}
function saveModelPreference() {
  preferredProviderId = providerId.value; preferredModel = model.value; preferredEffort = effort.value
  if (activeSession.value) { activeSession.value.providerId = providerId.value; activeSession.value.model = model.value; activeSession.value.effort = effort.value; persist() }
}
function selectModel() { syncEffortPreference(); saveModelPreference() }
function selectEffort() { saveModelPreference() }
watch(providers, syncModelPreference, { immediate: true })
function openBridge() { emit('open-connection'); EventBus.emit('show-note-bridge', null) }
function cancel() {
  epoch++
  const turn = turns.value.find(item => item.id === activeTurnId.value)
  if (activeId) { bridge.cancel(activeId); if (turn) { turn.status = 'cancelled'; turn.cancelled = true; finishTools(turn); persist() } }
  activeId = ''; activeTurnId.value = ''; busy.value = false
}
function clearAttachment() { includeCurrent.value = false; headingIds.value = []; relatedIds.value = [] }
function resetComposer() { clearAttachment(); question.value = ''; error.value = ''; showContext.value = false; historyOpen.value = false; followBottom = true }
function showHistory() { historyOpen.value = true; nextTick(() => newChatEl.value?.focus()) }
function hideHistory() { historyOpen.value = false; nextTick(() => questionEl.value?.focus()) }
function closeContextOnEscape(event: KeyboardEvent) { if (showContext.value) { event.stopPropagation(); showContext.value = false } }
function selectSession(id: string) {
  if (id === activeSessionId.value) { hideHistory(); return }
  cancel(); activeSessionId.value = id; resetComposer()
  restoreModelPreference()
  nextTick(() => { scrollToBottom(); questionEl.value?.focus() })
}
function newChat() { cancel(); activeSessionId.value = ''; resetComposer(); nextTick(() => questionEl.value?.focus()) }
function removeSession(id: string) {
  if (id === activeSessionId.value) newChat()
  try { aiChatHistory.remove(id); sessions.value = sessions.value.filter(session => session.id !== id); storageError.value = '' }
  catch { storageError.value = '暂时无法删除已保存的聊天记录，请稍后重试。' }
}
function useSuggestion(suggestion: string) { question.value = suggestion; nextTick(() => questionEl.value?.focus()) }
function onQuestionKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { event.preventDefault(); if (canSend.value) void send() }
}
function onTranscriptScroll() {
  const element = transcriptEl.value
  if (element) followBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 80
}
function scrollToBottom() { const element = transcriptEl.value; if (element && followBottom) element.scrollTop = element.scrollHeight }
watch(() => turns.value.map(turn => `${turn.answer.length}:${turn.toolCalls.length}:${turn.error || ''}`).join('|'), () => nextTick(scrollToBottom))

async function prepareContext(): Promise<AiContext> {
  if (!includeCurrent.value || !document.value || !props.doc) return { scope: 'knowledge_base', documents: [] }
  const current = document.value
  const selected = []
  const includesSections = headingIds.value.length > 0
  if (includesSections) selected.push({ docId: props.doc, headingIds: [...headingIds.value] })
  selected.push(...relatedIds.value.map(docId => ({ docId, headingIds: [] as string[] })))
  const context = selected.length ? await aiContextService.build(selected) : { documents: [] }
  if (!includesSections) {
    context.documents.unshift({ ...current, metadata: JSON.stringify(current.metadata ?? {}).length > 2000 ? { omitted: '元数据过长，按需读取' } : (current.metadata ?? {}), headings: current.headings.slice(0, 100).map(heading => ({ ...heading, title: safeTextPrefix(heading.title, 200) })), relatedLinks: current.relatedLinks.slice(0, 10), sources: [] })
  }
  return { ...context, scope: 'knowledge_base' }
}
async function send() {
  if (!canSend.value) return
  const generation = ++epoch
  const submittedModel = { providerId: providerId.value, model: model.value, effort: effort.value }
  busy.value = true; error.value = ''; showContext.value = false; followBottom = true
  const content = question.value.trim()
  try {
    const context = await prepareContext()
    if (generation !== epoch || disposed) return
    const availableModel = modelOptions.value.find(item => item.providerId === submittedModel.providerId && item.id === submittedModel.model)
    if (!availableModel || !availableModel.efforts.includes(submittedModel.effort)) throw new Error('所选模型或思考强度已更新，请确认后重新发送问题。')
    modelKey.value = availableModel.key; effort.value = submittedModel.effort
    let session = activeSession.value
    const now = Date.now()
    if (!session) {
      session = { id: crypto.randomUUID(), scope: 'knowledge_base', title: safeTextPrefix(content, 80), ...submittedModel, turns: [], createdAt: now, updatedAt: now }
      sessions.value.unshift(session); activeSessionId.value = session.id
      session = activeSession.value!
    }
    const historyTurns = session.turns.filter(turn => (!turn.status || turn.status === 'complete') && !turn.error && !turn.cancelled && turn.answer).slice(-2)
    const history = historyTurns
      .flatMap(turn => [{ role: 'user' as const, content: turn.question }, { role: 'assistant' as const, content: safeTextPrefix(turn.answer, 4000) }])
    const requestId = bridge.start({ ...submittedModel, context, messages: [...history, { role: 'user', content }], maxOutputTokens: 4096 })
    // Legacy manual attachments used positional IDs; never let an old source replace a current attachment.
    const contextSourceIds = new Set(context.documents.flatMap(doc => doc.sources.map(source => source.sourceId)))
    const sources = [...new Map(historyTurns.flatMap(citations).filter(source => !contextSourceIds.has(source.sourceId)).map(source => [source.sourceId, source])).values()].slice(0, 1600)
    const turn: AiChatTurn = { id: crypto.randomUUID(), question: content, answer: '', context, sources, toolCalls: [], status: 'running' }
    session.turns.push(turn)
    session.providerId = submittedModel.providerId; session.model = submittedModel.model; session.effort = submittedModel.effort
    preferredProviderId = submittedModel.providerId; preferredModel = submittedModel.model; preferredEffort = submittedModel.effort
    activeId = requestId; activeTurnId.value = turn.id
    if (question.value.trim() === content) question.value = ''
    persist(session)
    nextTick(scrollToBottom)
  } catch (cause) {
    if (generation === epoch && !disposed) { error.value = cause instanceof Error ? cause.message : '发送失败，请重试'; busy.value = false }
  }
}

async function loadDocument(docId?: string) {
  if (!docId) return
  const generation = ++loadEpoch
  document.value = undefined; loading.value = true; attachmentError.value = ''
  try { const loaded = await aiContextService.load(docId); if (generation === loadEpoch && !disposed) document.value = loaded }
  catch { if (generation === loadEpoch && !disposed) attachmentError.value = '当前文档读取失败，仍可向整个知识库提问。' }
  finally { if (generation === loadEpoch && !disposed) loading.value = false }
}
try {
  sessions.value = aiChatHistory.list()
  for (const session of sessions.value) for (const turn of session.turns) {
    // A browser reload cannot resume the previous page's stream or tool execution.
    if (turn.status === 'running' || turn.toolCalls.some(call => call.status === 'running')) { finishTools(turn); turn.status = 'cancelled'; turn.cancelled = true }
    if (!turn.answer && !turn.error && turn.status !== 'complete') { turn.status = 'cancelled'; turn.cancelled = true }
  }
}
catch { storageError.value = '无法读取已保存的聊天记录，本次聊天仍可继续。' }
activeSessionId.value = sessions.value[0]?.id || ''
restoreModelPreference()
watch(includeCurrent, included => { if (!included) { headingIds.value = []; relatedIds.value = [] } })
watch(showContext, shown => { if (shown && props.doc && !document.value && !loading.value) void loadDocument(props.doc) })
watch(() => props.doc, docId => {
  // Navigation never switches the active global chat or interrupts its stream.
  // Only a not-yet-sent, explicitly attached context depends on this route.
  if (includeCurrent.value && busy.value && !activeId) cancel()
  loadEpoch++; document.value = undefined; loading.value = false; attachmentError.value = ''; clearAttachment()
  if (showContext.value && docId) void loadDocument(docId)
})
onBeforeUnmount(() => { disposed = true; loadEpoch++; cancel(); if (persistTimer) clearTimeout(persistTimer); unsubscribe() })
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
.qa-storage-error { color: var(--warning-color); font-size: var(--font-size-xs); }
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
