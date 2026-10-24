/** Shared website protocol limits; mirrored by the independently packaged bridge. */
export const AI_MAX_FRAME_BYTES = 16 * 1024 * 1024
export const AI_MAX_QUESTION_CHARS = 20_000
export const AI_DEFAULT_CONTEXT_WINDOW_TOKENS = 1_000_000
export const AI_DEFAULT_MAX_OUTPUT_TOKENS = 16_384
export const AI_MIN_CONTEXT_WINDOW_TOKENS = 16_384
export const AI_MAX_CONTEXT_WINDOW_TOKENS = 2_000_000
export const AI_MIN_OUTPUT_TOKENS = 256
export const AI_MAX_OUTPUT_TOKENS = 65_536

export interface AiModelLimits {
  contextWindowTokens?: number
  maxOutputTokens?: number
}

/** A smaller configured model window also reduces the default output reservation. */
export function resolveAiModelLimits(model: AiModelLimits = {}): Required<AiModelLimits> {
  const contextWindowTokens = model.contextWindowTokens ?? AI_DEFAULT_CONTEXT_WINDOW_TOKENS
  if (!Number.isSafeInteger(contextWindowTokens) || contextWindowTokens < AI_MIN_CONTEXT_WINDOW_TOKENS || contextWindowTokens > AI_MAX_CONTEXT_WINDOW_TOKENS) {
    throw new Error('模型上下文窗口须为 16,384 至 2,000,000 tokens 的整数。')
  }
  const maxOutputTokens = model.maxOutputTokens ?? Math.min(AI_DEFAULT_MAX_OUTPUT_TOKENS, Math.floor(contextWindowTokens / 2))
  if (!Number.isSafeInteger(maxOutputTokens) || maxOutputTokens < AI_MIN_OUTPUT_TOKENS || maxOutputTokens > AI_MAX_OUTPUT_TOKENS || maxOutputTokens > Math.floor(contextWindowTokens / 2)) {
    throw new Error('模型输出预算须为 256 至 65,536 tokens 的整数，且不超过上下文窗口的一半。')
  }
  return { contextWindowTokens, maxOutputTokens }
}
