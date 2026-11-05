//! Codex profile 合并与候选枚举；不读取凭据文件。

use super::super::candidate::failure;
use super::super::contracts::{CodexAuth, DiscoveredProvider};
use super::codex_candidate;
use crate::model::Protocol;

pub(super) const MAX_PROFILE_FILES: usize = 64;

/// Profile 中同名 provider 整表替换，避免将新端点与旧表凭据按字段拼接。
pub(in crate::discovery) fn merge_profile(
    base: &toml::Value,
    profile: &toml::Value,
) -> toml::Value {
    let mut merged = base.clone();
    let (Some(target), Some(profile)) = (merged.as_table_mut(), profile.as_table()) else {
        return merged;
    };
    for key in [
        "model",
        "model_provider",
        "model_catalog_json",
        "model_reasoning_effort",
    ] {
        if let Some(value) = profile.get(key) {
            target.insert(key.into(), value.clone());
        }
    }
    if let Some(overrides) = profile
        .get("model_providers")
        .and_then(toml::Value::as_table)
    {
        let providers = target
            .entry("model_providers")
            .or_insert_with(|| toml::Value::Table(Default::default()));
        if let Some(providers) = providers.as_table_mut() {
            for (name, provider) in overrides {
                providers.insert(name.clone(), provider.clone());
            }
        }
    }
    merged
}

/// 解析活动 profile 和所有内联 profile；每个候选保留独立来源标识。
pub(in crate::discovery) fn parse_codex_candidates(
    config: &toml::Value,
    auth: &CodexAuth,
    source: &str,
    raw: &str,
    env: &dyn Fn(&str) -> Option<String>,
    include_profiles: bool,
) -> Vec<DiscoveredProvider> {
    let active = config
        .get("profile")
        .and_then(toml::Value::as_str)
        .and_then(|name| config.get("profiles")?.get(name))
        .map(|profile| merge_profile(config, profile));
    let mut results = vec![codex_candidate(
        active.as_ref().unwrap_or(config),
        auth,
        source,
        raw,
        env,
        "默认",
    )];
    if include_profiles {
        if let Some(profiles) = config.get("profiles").and_then(toml::Value::as_table) {
            if profiles.len() > MAX_PROFILE_FILES {
                results.push(failure(
                    "Codex profiles",
                    Protocol::Responses,
                    source,
                    "内联 profile 超过 64 个",
                    raw,
                ));
            } else {
                for (name, profile) in profiles {
                    let source = format!("{source}#profiles.{name}");
                    results.push(codex_candidate(
                        &merge_profile(config, profile),
                        auth,
                        &source,
                        raw,
                        env,
                        name,
                    ));
                }
            }
        }
    }
    results
}
