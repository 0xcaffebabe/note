<template>
  <section class="document-qa" aria-label="文档问答">
    <p class="qa-hint">通过本机 Note Bridge 使用已配置的模型。发送时会把问题和下方选中的文档内容交给所选服务商；密钥只在桌面端管理。</p>
    <div class="qa-card">
      <p role="status">{{ statusText }}</p>
      <form v-if="state !== 'ready'" class="qa-fields" @submit.prevent="pair">
        <label>配对码<input v-model="code" aria-label="配对码" inputmode="numeric" autocomplete="off" maxlength="6" placeholder="桌面端的 6 位配对码" /></label>
        <label>本地端口<input v-model.number="port" aria-label="本地端口" type="number" min="1024" max="65535" /></label>
        <button type="submit" :disabled="state === 'connecting' || state === 'pending'">连接 Note Bridge</button>
      </form>
      <div v-else class="qa-fields">
        <label>服务商<select v-model="providerId" aria-label="服务商" :disabled="busy" @change="selectProvider">
          <option v-for="provider in providers" :key="provider.id" :value="provider.id">{{ provider.name }}</option>
        </select></label>
        <label>模型<input :value="model" aria-label="模型" readonly /></label>
        <p class="qa-hint">模型由桌面端配置；更换模型后请重新配对。</p>
        <button type="button" @click="disconnect">断开连接</button>
      </div>
      <p v-if="state === 'ready' && !providers.length" class="qa-hint">桌面端尚无可用服务商，请先配置模型并重新配对。</p>
    </div>

    <div class="qa-card">
      <h3>发送范围</h3>
      <p v-if="loading" role="status">正在读取文档…</p>
      <template v-else-if="document">
        <p>当前文档：{{ document.title }}</p>
        <label>选择当前文档章节（不选表示全部）
          <select v-model="headingIds" multiple aria-label="选择当前文档章节" :disabled="busy">
            <option v-for="heading in document.headings" :key="heading.id" :value="heading.id">{{ heading.title }}</option>
          </select>
        </label>
        <fieldset v-if="relatedOptions.length" :disabled="busy">
          <legend>关联文档（可选，最多 2 篇）</legend>
          <label v-for="related in relatedOptions" :key="related.docId" class="qa-check">
            <input v-model="relatedIds" type="checkbox" :value="related.docId" :disabled="relatedIds.length >= 2 && !relatedIds.includes(related.docId)" />{{ related.title }}
          </label>
        </fieldset>
        <p v-else class="qa-hint">此文档暂无关联文档。</p>
        <p class="qa-hint">上下文上限 {{ budget.toLocaleString() }} 字符，按所选文档均分预算；超出时按章节顺序截断。选择具体章节可优先发送需要的内容。</p>
        <p v-if="lastContext" class="qa-hint">上次发送 {{ JSON.stringify(lastContext).length.toLocaleString() }} 字符，{{ lastContext.documents.length }} 篇文档<span v-if="lastContext.documents.some(item => item.truncated)">；部分内容已截断</span>。</p>
      </template>
    </div>

    <p v-if="error" class="qa-error" role="alert">{{ error }}</p>
    <div class="qa-transcript" role="log" aria-label="问答记录" aria-live="polite" aria-relevant="additions text">
      <p v-if="!turns.length" class="qa-hint">可以询问当前文档的概念、示例或关联知识。回答中的来源链接可返回原文章节。</p>
      <article v-for="(turn, index) in turns" :key="index" class="qa-card">
        <h3>问题</h3><p class="qa-text">{{ turn.question }}</p>
        <h3>回答</h3><p class="qa-text">{{ turn.answer || (busy && index === turns.length - 1 ? '正在等待回答…' : '未收到回答') }}</p>
        <p v-if="turn.cancelled" class="qa-hint">已停止生成</p>
        <p v-if="turn.error" class="qa-error">{{ turn.error }}</p>
        <nav v-if="citations(turn).length" aria-label="回答来源" class="qa-sources">
          <a v-for="source in citations(turn)" :key="source.sourceId" :href="source.url">[{{ source.sourceId }}] {{ source.title }}</a>
        </nav>
      </article>
    </div>
    <form class="qa-fields" @submit.prevent="send">
      <label>你的问题<textarea v-model="question" aria-label="你的问题" rows="3" maxlength="4000" :disabled="busy" placeholder="例如：这一节的关键结论是什么？" /></label>
      <div class="qa-actions">
        <button type="submit" :disabled="state !== 'ready' || !providerId || !model.trim() || busy || loading || !document || !question.trim()">发送问题</button>
        <button v-if="busy" type="button" @click="cancel">停止生成</button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { AiBridgeEvent, AiContext, AiContextDocument, AiProvider } from '@/core/ports/AiBridgePort'
import { AI_CONTEXT_BUDGET, aiCitationLinks } from '@/core/service/AiContextService'
import DocUtils from '@/core/util/DocUtils'
import { safeTextPrefix } from '@/core/util/StringUtils'
import { useServices } from '@/platform/web/app/useServices'

const props = defineProps<{ doc: string }>()
const { aiContextService, createAiBridge } = useServices()
const bridge = createAiBridge()
const budget = AI_CONTEXT_BUDGET
const state = ref('disconnected')
const code = ref('')
const port = ref(19661)
const providers = ref<AiProvider[]>([])
const providerId = ref('')
const model = ref('')
const document = ref<AiContextDocument>()
const headingIds = ref<string[]>([])
const relatedIds = ref<string[]>([])
const loading = ref(false)
const busy = ref(false)
const question = ref('')
const error = ref('')
const lastContext = ref<AiContext>()
interface Turn { question: string; answer: string; context: AiContext; cancelled?: boolean; error?: string }
const turns = ref<Turn[]>([])
let activeId = ''
let epoch = 0
let loadEpoch = 0
let pairingEpoch = 0
let disposed = false
const statusText = computed(() => ({ disconnected: '未连接 Note Bridge', connecting: '正在连接本机…', pending: '请在桌面端确认此次配对', ready: '已连接 Note Bridge' })[state.value])
const relatedOptions = computed(() => (document.value?.relatedLinks || [])
  .filter(link => link.url.startsWith('/') && !link.url.startsWith('//') && /\.html(?:[?#]|$)/.test(link.url))
  .map(link => ({ docId: DocUtils.htmlUrl2Id(link.url), title: DocUtils.pathLeafName(link.title) }))
  .filter((link, index, all) => link.docId !== props.doc && all.findIndex(other => other.docId === link.docId) === index))
const citations = (turn: Turn) => aiCitationLinks(turn.answer, turn.context)

function onEvent(event: AiBridgeEvent) {
  if (event.type === 'state') {
    state.value = event.state
    if (event.state === 'disconnected') {
      // Invalidate context preparation as well as an active stream: reconnect never replays a question.
      epoch++
      activeId = ''
      busy.value = false
    }
    if (event.message) error.value = event.message
    return
  }
  if (event.requestId !== activeId) return
  const turn = turns.value[turns.value.length - 1]
  if (!turn) return
  if (event.type === 'delta') {
    // Bound memory even if a malfunctioning desktop client streams indefinitely.
    const remaining = Math.max(0, 100000 - turn.answer.length)
    turn.answer += safeTextPrefix(event.delta, remaining)
    if (event.delta.length > remaining || turn.answer.length >= 100000) cancel()
  } else {
    busy.value = false
    activeId = ''
    if (event.type === 'error') turn.error = event.message
    else turn.cancelled = event.cancelled
  }
}
const unsubscribe = bridge.subscribe(onEvent)

function selectProvider() { model.value = providers.value.find(provider => provider.id === providerId.value)?.model || '' }

async function pair() {
  cancel()
  const pairing = ++pairingEpoch
  error.value = ''
  try {
    const available = await bridge.pair(code.value, port.value)
    if (disposed || pairing !== pairingEpoch) return
    providers.value = available
    providerId.value = providers.value[0]?.id || ''
    selectProvider()
    code.value = ''
  } catch (cause) {
    if (!disposed && pairing === pairingEpoch) error.value = cause instanceof Error ? cause.message : '配对失败'
  }
}

function cancel() {
  epoch++
  bridge.cancel()
  activeId = ''
  busy.value = false
}

function disconnect() { pairingEpoch++; cancel(); bridge.disconnect() }

async function send() {
  if (busy.value || state.value !== 'ready' || !document.value || !question.value.trim()) return
  const generation = ++epoch
  busy.value = true
  error.value = ''
  try {
    const context = await aiContextService.build([{ docId: props.doc, headingIds: headingIds.value }, ...relatedIds.value.map(docId => ({ docId }))])
    if (generation !== epoch || disposed) return
    if (!context.documents.some(item => item.sources.length)) throw new Error('所选范围没有可发送的正文，请选择其他章节')
    const content = question.value.trim()
    // Keep only complete recent turns; budget history independently from source context.
    const history = turns.value.filter(turn => !turn.error && !turn.cancelled && turn.answer
      && JSON.stringify(turn.context) === JSON.stringify(context)).slice(-2)
      .flatMap(turn => [{ role: 'user' as const, content: turn.question }, { role: 'assistant' as const, content: safeTextPrefix(turn.answer, 4000) }])
    const requestId = bridge.start({ providerId: providerId.value, model: model.value.trim(), context,
      messages: [...history, { role: 'user', content }], maxOutputTokens: 2048 })
    turns.value.push({ question: content, answer: '', context })
    lastContext.value = context
    activeId = requestId
    question.value = ''
  } catch (cause) {
    if (generation === epoch && !disposed) {
      error.value = cause instanceof Error ? cause.message : '发送失败，请重试'
      busy.value = false
    }
  }
}

watch(() => props.doc, async docId => {
  cancel()
  const generation = ++loadEpoch
  turns.value = []
  document.value = undefined
  headingIds.value = []
  relatedIds.value = []
  lastContext.value = undefined
  question.value = ''
  error.value = ''
  loading.value = true
  try {
    const loaded = await aiContextService.load(docId)
    if (generation === loadEpoch && !disposed) document.value = loaded
  } catch { if (generation === loadEpoch && !disposed) error.value = '文档读取失败，请关闭助手后重试' }
  finally { if (generation === loadEpoch && !disposed) loading.value = false }
}, { immediate: true })

onBeforeUnmount(() => { disposed = true; epoch++; loadEpoch++; pairingEpoch++; unsubscribe(); bridge.disconnect() })
</script>

<style scoped lang="less">
.document-qa, .qa-fields, .qa-transcript, .qa-sources {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
.document-qa { padding-block: var(--spacing-md); color: var(--main-text-color); }
.qa-card { padding: var(--spacing-md); border: 1px solid var(--border-color); border-radius: var(--radius-xl); background: var(--card-bg-color); box-shadow: var(--shadow-sm); }
h3 { font-size: var(--font-size-lg); margin: 0 0 var(--spacing-sm); }
p { margin: 0 0 var(--spacing-sm); }
.qa-hint { color: var(--secondary-text-color); font-size: var(--font-size-sm); line-height: var(--leading-normal); }
.qa-error { color: var(--danger-color); overflow-wrap: anywhere; }
.qa-text { white-space: pre-wrap; overflow-wrap: anywhere; line-height: var(--leading-normal); }
label { display: flex; flex-direction: column; gap: var(--spacing-xs); font-size: var(--font-size-base); }
input, select, textarea, button { box-sizing: border-box; max-width: 100%; font: inherit; color: var(--main-text-color); background: var(--card-bg-color); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: var(--spacing-sm); }
input:focus-visible, select:focus-visible, textarea:focus-visible, button:focus-visible, a:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
textarea { resize: vertical; }
button { cursor: pointer; background: var(--hover-bg-color); }
button:disabled { cursor: default; opacity: .6; }
fieldset { margin: var(--spacing-md) 0; border: 1px solid var(--border-color); border-radius: var(--radius-md); }
.qa-check { flex-direction: row; align-items: baseline; margin-block: var(--spacing-sm); overflow-wrap: anywhere; }
.qa-actions { display: flex; flex-wrap: wrap; gap: var(--spacing-sm); }
.qa-sources a { color: var(--primary-color); overflow-wrap: anywhere; }
</style>
