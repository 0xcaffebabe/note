import type { AiModelLimits } from './ai/AiModel'

export type { AiModelLimits } from './ai/AiModel'

/** 站点协议和模型预算边界，与独立发布的桌面端保持一致。 */
export const AI_MAX_FRAME_BYTES = 16 * 1024 * 1024
export const AI_MAX_QUESTION_CHARS = 20_000
export const AI_DEFAULT_CONTEXT_WINDOW_TOKENS = 1_000_000
export const AI_DEFAULT_MAX_OUTPUT_TOKENS = 16_384
export const AI_MIN_CONTEXT_WINDOW_TOKENS = 16_384
export const AI_MAX_CONTEXT_WINDOW_TOKENS = 2_000_000
export const AI_MIN_OUTPUT_TOKENS = 256
export const AI_MAX_OUTPUT_TOKENS = 65_536

/**
 * 校验模型预算并补齐缺省值。
 * 较小的上下文窗口会同步降低默认输出预留，输出最多占窗口的一半。
 */
export function resolveAiModelLimits(model: AiModelLimits = {}): Required<AiModelLimits> {
  const contextWindowTokens = model.contextWindowTokens ?? AI_DEFAULT_CONTEXT_WINDOW_TOKENS
  if (
    !Number.isSafeInteger(contextWindowTokens)
    || contextWindowTokens < AI_MIN_CONTEXT_WINDOW_TOKENS
    || contextWindowTokens > AI_MAX_CONTEXT_WINDOW_TOKENS
  ) {
    throw new Error('模型上下文窗口须为 16,384 至 2,000,000 tokens 的整数。')
  }
  const outputReservationLimit = Math.floor(contextWindowTokens / 2)
  const defaultOutputTokens = Math.min(AI_DEFAULT_MAX_OUTPUT_TOKENS, outputReservationLimit)
  const maxOutputTokens = model.maxOutputTokens ?? defaultOutputTokens
  if (
    !Number.isSafeInteger(maxOutputTokens)
    || maxOutputTokens < AI_MIN_OUTPUT_TOKENS
    || maxOutputTokens > AI_MAX_OUTPUT_TOKENS
    || maxOutputTokens > outputReservationLimit
  ) {
    throw new Error('模型输出预算须为 256 至 65,536 tokens 的整数，且不超过上下文窗口的一半。')
  }
  return { contextWindowTokens, maxOutputTokens }
}
