import type { AiSessionSummary } from '@/core/ports/AiBridgePort'

/** 会话生命周期与界面的协作点，避免持久会话逻辑直接操作 DOM 或模型表单。 */
export interface AssistantSessionHooks {
  /** 进入已有会话或草稿时重置输入界面；已有会话同时恢复模型偏好。 */
  selected(session?: AiSessionSummary): void
  /** 初始快照就绪后恢复输入焦点；由界面确认是否仍是当前会话。 */
  ready(sessionId: string): void
  /** 向前分页前捕获视口，返回 DOM 更新后的恢复函数。 */
  beforePrepend(): () => void
}
