//! 模型服务领域的稳定公开入口。
//!
//! 服务契约、模型能力、字段校验和远端地址规则分别维护；序列化格式与公开路径不变。

mod endpoint;
mod limits;
mod option;
mod provider;
mod validation;

pub use endpoint::validate_base_url;
pub use limits::{
    DEFAULT_CONTEXT_WINDOW_TOKENS, DEFAULT_MAX_OUTPUT_TOKENS, MAX_CONTEXT_WINDOW_TOKENS,
    MAX_MODELS_PER_PROVIDER, MAX_MODELS_TOTAL, MAX_OUTPUT_TOKENS, MIN_CONTEXT_WINDOW_TOKENS,
    MIN_OUTPUT_TOKENS,
};
pub use option::ModelOption;
pub use provider::{AuthKind, Protocol, Provider, ProviderInput};
pub use validation::{validate_id, validate_models, validate_secret};

#[cfg(test)]
mod tests;
