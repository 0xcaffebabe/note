//! Codex 配置发现适配器，编排 profile、模型目录和认证解析。

pub(super) mod auth;
mod catalog;
pub(super) mod profiles;

use super::bounded_file::read_bounded;
use super::candidate::{candidate, failure, finish};
use super::contracts::{CodexAuth, DiscoveredProvider, DiscoveryStatus};
use crate::model::Protocol;
use auth::{apply_credentials, parse_codex_auth};
use catalog::load_codex_catalog;
use profiles::{merge_profile, parse_codex_candidates, MAX_PROFILE_FILES};
use std::fs;
use std::path::Path;

/// 有界读取主配置、认证与独立 profile；只枚举普通文件，不执行配置命令。
pub(super) fn discover_codex(
    directory: &Path,
    env: &dyn Fn(&str) -> Option<String>,
) -> Vec<DiscoveredProvider> {
    let config_path = directory.join("config.toml");
    let source = config_path.to_string_lossy();
    let config_raw = match read_bounded(&config_path) {
        Ok(raw) => raw,
        Err(message) => return vec![failure("Codex", Protocol::Responses, &source, &message, "")],
    };
    let config: toml::Value = match toml::from_str(&config_raw) {
        Ok(value) => value,
        Err(_) => {
            return vec![failure(
                "Codex",
                Protocol::Responses,
                &source,
                "Codex config.toml 格式无效",
                &config_raw,
            )]
        }
    };
    let auth_path = directory.join("auth.json");
    let auth_raw = if auth_path.exists() {
        read_bounded(&auth_path).ok()
    } else {
        None
    };
    let auth = if auth_path.exists() && auth_raw.is_none() {
        CodexAuth::Invalid
    } else {
        parse_codex_auth(auth_raw.as_deref())
    };
    let raw = format!("{}\n{}", config_raw, auth_raw.as_deref().unwrap_or(""));
    let mut results = parse_codex_candidates(&config, &auth, &source, &raw, env, true);
    let Ok(entries) = fs::read_dir(directory) else {
        return results;
    };
    let mut profiles = Vec::new();
    for entry in entries {
        let Ok(entry) = entry else {
            continue;
        };
        if !entry.file_type().is_ok_and(|kind| kind.is_file()) {
            continue;
        }
        let name = entry.file_name();
        let name = name.to_string_lossy();
        if name.ends_with(".config.toml") {
            profiles.push(entry.path());
            if profiles.len() > MAX_PROFILE_FILES {
                results.push(failure(
                    "Codex profiles",
                    Protocol::Responses,
                    &source,
                    "独立 profile 文件超过 64 个；请缩小配置目录",
                    &raw,
                ));
                return results;
            }
        }
    }
    profiles.sort();
    for path in profiles {
        let profile_source = path.to_string_lossy();
        let profile_raw = match read_bounded(&path) {
            Ok(raw) => raw,
            Err(message) => {
                results.push(failure(
                    "Codex profile",
                    Protocol::Responses,
                    &profile_source,
                    &message,
                    "",
                ));
                continue;
            }
        };
        let profile: toml::Value = match toml::from_str(&profile_raw) {
            Ok(value) => value,
            Err(_) => {
                results.push(failure(
                    "Codex profile",
                    Protocol::Responses,
                    &profile_source,
                    "独立 profile TOML 格式无效",
                    &profile_raw,
                ));
                continue;
            }
        };
        let merged = merge_profile(&config, &profile);
        let all_raw = format!("{raw}\n{profile_raw}");
        let name = path
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("profile")
            .trim_end_matches(".config.toml");
        let mut result = codex_candidate(&merged, &auth, &profile_source, &all_raw, env, name);
        result.name = format!("Codex · {name}");
        results.push(result);
    }
    results
}

/// 组合模型目录、端点、协议和认证，再统一验证候选与指纹。
pub(super) fn codex_candidate(
    config: &toml::Value,
    auth: &CodexAuth,
    source: &str,
    raw: &str,
    env: &dyn Fn(&str) -> Option<String>,
    profile: &str,
) -> DiscoveredProvider {
    let mut result = candidate(
        &format!("Codex · {profile}"),
        Protocol::Responses,
        source,
        raw,
    );
    result.model = config
        .get("model")
        .and_then(toml::Value::as_str)
        .unwrap_or("")
        .into();
    if let Err(message) = load_codex_catalog(config, source, &mut result) {
        result.message = message;
        return finish(result, raw);
    }
    let provider_id = config
        .get("model_provider")
        .and_then(toml::Value::as_str)
        .unwrap_or("openai");
    let provider = config
        .get("model_providers")
        .and_then(|providers| providers.get(provider_id));
    let get = |key: &str| {
        provider
            .and_then(|provider| provider.get(key))
            .and_then(toml::Value::as_str)
    };
    if provider.is_none() && provider_id != "openai" {
        result.status = DiscoveryStatus::Unsupported;
        result.message = "选中的模型服务未在 model_providers 中定义".into();
        return finish(result, raw);
    }
    result.base_url = get("base_url")
        .unwrap_or(if provider_id == "openai" {
            "https://api.openai.com/v1"
        } else {
            ""
        })
        .into();
    result.protocol = match get("wire_api").unwrap_or("responses") {
        "responses" => Protocol::Responses,
        "chat" => Protocol::ChatCompletions,
        _ => {
            result.status = DiscoveryStatus::Unsupported;
            result.message = "此 wire_api 暂不支持；仅支持 responses 与 chat".into();
            return finish(result, raw);
        }
    };
    apply_credentials(provider_id, provider, auth, env, &mut result);
    if provider
        .and_then(|provider| provider.get("http_headers"))
        .is_some()
        || provider
            .and_then(|provider| provider.get("env_http_headers"))
            .is_some()
    {
        result.status = DiscoveryStatus::Unsupported;
        result.message = "该服务依赖额外认证或 HTTP headers；请手动创建受支持的配置".into();
    }
    finish(result, raw)
}
