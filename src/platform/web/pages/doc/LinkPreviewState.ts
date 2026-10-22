import { browserStorage } from '@/adapters/browser/LocalStorageAdapter'

export interface LinkPreviewState {
  left: number
  top: number
  width: number
  height: number
  scrollTop: number
}

// 存储被禁用或配额耗尽时, 仍保留本次会话中最后一次调整。
const unsavedStates = new Map<string, LinkPreviewState>()
const pinnedPreviewsKey = 'link-preview:pinned-documents'
let unsavedPinnedPreviews: string[] | null = null

function pinnedDocIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((id): id is string =>
    typeof id === 'string' && id.trim().length > 0 && !/[\\/?#]/.test(id)
  ))]
}

// 固定列表仅保存文档身份和层叠顺序，布局与阅读位置仍由各文档独立保存。
export function readPinnedLinkPreviews(): string[] {
  if (unsavedPinnedPreviews !== null) return [...unsavedPinnedPreviews]
  try {
    const raw = browserStorage.getItem(pinnedPreviewsKey)
    return pinnedDocIds(raw ? JSON.parse(raw) : null)
  } catch {
    return []
  }
}

export function savePinnedLinkPreviews(docIds: string[]): void {
  if (!Array.isArray(docIds)) return
  const snapshot = pinnedDocIds(docIds)
  const value = JSON.stringify(snapshot)
  browserStorage.setItem(pinnedPreviewsKey, value)
  unsavedPinnedPreviews = browserStorage.getItem(pinnedPreviewsKey) === value ? null : snapshot
}

function isLinkPreviewState(value: unknown): value is LinkPreviewState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }
  const state = value as Record<string, unknown>
  return ['left', 'top', 'width', 'height', 'scrollTop'].every(key =>
    typeof state[key] === 'number' && Number.isFinite(state[key])
  ) && (state.width as number) > 0
    && (state.height as number) > 0
    && (state.scrollTop as number) >= 0
}

// 一张文档卡片一份状态, 关闭/重新打开其他文档不会覆盖其布局与阅读位置。
export function readLinkPreviewState(docId: string): LinkPreviewState | null {
  if (!docId) {
    return null
  }
  const unsaved = unsavedStates.get(docId)
  if (unsaved) {
    return { ...unsaved }
  }
  try {
    const raw = browserStorage.getItem('link-preview::' + docId)
    const state: unknown = raw ? JSON.parse(raw) : null
    return isLinkPreviewState(state) ? state : null
  } catch {
    return null
  }
}

export function saveLinkPreviewState(docId: string, state: LinkPreviewState): void {
  if (!docId || !isLinkPreviewState(state)) {
    return
  }
  const key = 'link-preview::' + docId
  const snapshot = {
    left: state.left, top: state.top, width: state.width, height: state.height, scrollTop: state.scrollTop,
  }
  const value = JSON.stringify(snapshot)
  browserStorage.setItem(key, value)
  if (browserStorage.getItem(key) === value) {
    unsavedStates.delete(docId)
  } else {
    unsavedStates.set(docId, snapshot)
  }
}
