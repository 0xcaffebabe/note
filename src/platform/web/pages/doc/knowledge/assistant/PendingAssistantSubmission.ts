/** 尚未收到 Bridge 确认的提交；相同载荷重试时复用请求 ID，避免重复生成。 */
export interface PendingAssistantSubmission {
  fingerprint: string
  id: string
}
