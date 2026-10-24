//! 模型目录容量和 token 预算的单一规则来源。

pub const MAX_MODELS_PER_PROVIDER: usize = 200;
pub const MAX_MODELS_TOTAL: usize = 400;
pub const DEFAULT_CONTEXT_WINDOW_TOKENS: u32 = 1_000_000;
pub const DEFAULT_MAX_OUTPUT_TOKENS: u32 = 16_384;
pub const MIN_CONTEXT_WINDOW_TOKENS: u32 = 16_384;
pub const MAX_CONTEXT_WINDOW_TOKENS: u32 = 2_000_000;
pub const MIN_OUTPUT_TOKENS: u32 = 256;
pub const MAX_OUTPUT_TOKENS: u32 = 65_536;

/// 校验输入和输出预算的相对关系，为提示词、历史和工具结果保留至少一半上下文。
pub(super) fn validate_token_budgets(context: u32, output: u32) -> Result<(), String> {
    if !(MIN_CONTEXT_WINDOW_TOKENS..=MAX_CONTEXT_WINDOW_TOKENS).contains(&context) {
        return Err("模型上下文预算须为 16,384 至 2,000,000 tokens".into());
    }
    if !(MIN_OUTPUT_TOKENS..=MAX_OUTPUT_TOKENS).contains(&output) {
        return Err("模型输出预算须为 256 至 65,536 tokens".into());
    }
    if output > context / 2 {
        return Err("模型输出预算不能超过上下文预算的一半；请同时调整两项预算".into());
    }
    Ok(())
}
