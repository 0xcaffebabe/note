import { onBeforeUnmount, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type {
  AiBridgePort,
  AiBridgeState,
  AiDocumentMetadata,
  AiMessageInput,
} from '@/core/ports/AiBridgePort'

/**
 * 按需加载当前文档目录，并生成仅含版本和章节 ID 的附件引用。
 * 切换文档、断线和卸载会使旧请求失效，不会清理 Bridge 已保存的来源。
 */
export function useAssistantAttachment(
  bridge: AiBridgePort,
  state: Readonly<Ref<AiBridgeState>>,
  currentDocument: () => string | undefined,
) {
  const document = ref<AiDocumentMetadata>()
  const includeCurrent = ref(false)
  const headingIds = ref<string[]>([])
  const loading = ref(false)
  const error = ref('')
  const visible = ref(false)
  let loadEpoch = 0
  let disposed = false

  function clear() {
    includeCurrent.value = false
    headingIds.value = []
  }

  async function load() {
    const docId = currentDocument()
    if (!docId || state.value !== 'ready') {
      return
    }
    const epoch = ++loadEpoch
    document.value = undefined
    loading.value = true
    error.value = ''
    try {
      const loaded = await bridge.document(docId)
      if (epoch === loadEpoch && !disposed) {
        document.value = loaded
      }
    } catch {
      if (epoch === loadEpoch && !disposed) {
        error.value = '当前文档目录读取失败，仍可向整个知识库提问。'
      }
    } finally {
      if (epoch === loadEpoch && !disposed) {
        loading.value = false
      }
    }
  }

  function references(): AiMessageInput['attachments'] {
    if (!includeCurrent.value || !document.value) {
      return undefined
    }
    return [
      {
        docId: document.value.docId,
        contentHash: document.value.contentHash,
        ...(headingIds.value.length ? { headingIds: [...headingIds.value] } : {}),
      },
    ]
  }

  watch(includeCurrent, (included) => {
    if (!included) {
      headingIds.value = []
    }
  })
  watch(visible, (shown) => {
    if (shown && !document.value && !loading.value) {
      void load()
    }
  })
  watch(currentDocument, () => {
    loadEpoch++
    document.value = undefined
    loading.value = false
    error.value = ''
    clear()
    if (visible.value) {
      void load()
    }
  })
  watch(state, (value) => {
    if (value === 'ready') {
      if (visible.value) {
        void load()
      }
    } else {
      loadEpoch++
      loading.value = false
    }
  })
  onBeforeUnmount(() => {
    disposed = true
    loadEpoch++
  })

  return { document, includeCurrent, headingIds, loading, error, visible, clear, load, references }
}
