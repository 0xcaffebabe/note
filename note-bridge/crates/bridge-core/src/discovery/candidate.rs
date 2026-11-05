//! 候选投影、敏感信息边界与导入指纹。

use super::contracts::{DiscoveredProvider, DiscoveryStatus};
use crate::model::{AuthKind, ModelOption, Protocol, ProviderInput};
use sha2::{Digest, Sha256};

/// 只序列化通过校验的端点，避免非法 URL 中的 userinfo、查询串或片段泄露凭据。
/// 原始值仅保留在原生内存中，用于校验和指纹计算。
pub(super) fn serialize_discovered_base_url<S: serde::Serializer>(
    value: &str,
    serializer: S,
) -> Result<S::Ok, S::Error> {
    serializer.serialize_str(if crate::model::validate_base_url(value).is_ok() {
        value
    } else {
        ""
    })
}

impl DiscoveredProvider {
    /// 创建本地导入输入，调用者仍须执行 ProviderInput 校验。
    pub(super) fn input(&self) -> ProviderInput {
        ProviderInput {
            id: None,
            name: self.name.clone(),
            protocol: self.protocol,
            base_url: self.base_url.clone(),
            model: self.model.clone(),
            models: self.models.clone(),
            auth_kind: self.auth_kind,
            enabled: true,
            api_key: self.api_key.clone(),
            source: Some(self.source.clone()),
        }
    }
}

/// 使用带长度前缀的 SHA-256，避免不同来源片段拼接产生歧义。
pub(super) fn digest(parts: &[&str]) -> String {
    let mut hasher = Sha256::new();
    for part in parts {
        hasher.update((part.len() as u64).to_le_bytes());
        hasher.update(part.as_bytes());
    }
    format!("{:x}", hasher.finalize())
}

/// 创建尚未验证的候选，稳定 ID 仅由来源定位符决定。
pub(super) fn candidate(
    name: &str,
    protocol: Protocol,
    source: &str,
    raw: &str,
) -> DiscoveredProvider {
    DiscoveredProvider {
        id: digest(&[source]),
        name: name.into(),
        protocol,
        base_url: String::new(),
        model: String::new(),
        models: Vec::new(),
        auth_kind: AuthKind::Bearer,
        source: source.into(),
        status: DiscoveryStatus::Invalid,
        message: String::new(),
        fingerprint: digest(&[source, raw]),
        catalog_fingerprint: String::new(),
        api_key: None,
    }
}

/// 构造不泄露原始配置内容的失败候选。
pub(super) fn failure(
    name: &str,
    protocol: Protocol,
    source: &str,
    message: &str,
    raw: &str,
) -> DiscoveredProvider {
    let mut candidate = candidate(name, protocol, source, raw);
    candidate.message = message.into();
    candidate
}

/// 绑定源内容、凭据和模型目录指纹，再统一确定候选可导入状态。
pub(super) fn finish(mut candidate: DiscoveredProvider, raw: &str) -> DiscoveredProvider {
    candidate.fingerprint = digest(&[
        &candidate.source,
        raw,
        candidate.api_key.as_deref().unwrap_or(""),
        &candidate.catalog_fingerprint,
    ]);
    if candidate.models.is_empty() && !candidate.model.is_empty() && candidate.message.is_empty() {
        candidate
            .models
            .push(ModelOption::configured(candidate.model.clone()));
    }
    if candidate.status == DiscoveryStatus::Invalid && !candidate.message.is_empty() {
        return candidate;
    }
    if candidate.status == DiscoveryStatus::Unsupported {
        return candidate;
    }
    if candidate.api_key.is_none() && candidate.auth_kind != AuthKind::None {
        candidate.status = DiscoveryStatus::MissingCredential;
        candidate.message = "未找到与此配置对应的 API 凭据；可手动填写后创建配置".into();
        return candidate;
    }
    match candidate.input().validate() {
        Ok(()) => {
            candidate.status = DiscoveryStatus::Ready;
            candidate.message = "可导入；凭据将保存到系统凭据库".into();
        }
        Err(message) => {
            candidate.status = DiscoveryStatus::Invalid;
            candidate.message = message;
        }
    }
    candidate
}
