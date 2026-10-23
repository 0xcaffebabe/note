use crate::model::{AuthKind, Protocol, ProviderInput};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs::{self, File};
use std::io::Read;
use std::path::{Path, PathBuf};

const MAX_FILE_BYTES: u64 = 1_048_576;
const MAX_PROFILE_FILES: usize = 64;

#[derive(Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveryPaths {
    pub claude_dir: Option<String>,
    pub codex_dir: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum DiscoveryStatus {
    Ready,
    MissingCredential,
    Unsupported,
    Invalid,
}

// Deliberately not Debug. The secret can be imported locally, but never serialized
// to a webview or printed alongside discovery diagnostics.
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveredProvider {
    pub id: String,
    pub name: String,
    pub protocol: Protocol,
    #[serde(serialize_with = "serialize_discovered_base_url")]
    pub base_url: String,
    pub model: String,
    pub auth_kind: AuthKind,
    pub source: String,
    pub status: DiscoveryStatus,
    pub message: String,
    #[serde(skip)]
    pub fingerprint: String,
    #[serde(skip)]
    pub api_key: Option<String>,
}

// Invalid source URLs can contain credentials in userinfo, query parameters or
// fragments. Keep the original only in native memory for validation and hashing;
// do not expose it in discovery results even when the candidate is not importable.
fn serialize_discovered_base_url<S: serde::Serializer>(
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
    fn input(&self) -> ProviderInput {
        ProviderInput {
            id: None,
            name: self.name.clone(),
            protocol: self.protocol,
            base_url: self.base_url.clone(),
            model: self.model.clone(),
            auth_kind: self.auth_kind,
            enabled: true,
            api_key: self.api_key.clone(),
            source: Some(self.source.clone()),
        }
    }
}

/// Discovery is explicit and read-only. It never executes helpers, hooks or shell commands.
pub fn discover(paths: DiscoveryPaths) -> Vec<DiscoveredProvider> {
    let home = dirs::home_dir();
    let claude = resolve_dir(
        paths.claude_dir,
        "CLAUDE_CONFIG_DIR",
        ".claude",
        home.as_deref(),
    );
    let codex = resolve_dir(paths.codex_dir, "CODEX_HOME", ".codex", home.as_deref());
    let mut candidates = Vec::new();
    if let Some(directory) = claude {
        let path = directory.join("settings.json");
        let source = path.to_string_lossy();
        match read_bounded(&path) {
            Ok(settings) => candidates.push(parse_claude_settings(&settings, &source)),
            Err(message) => candidates.push(failure(
                "Claude Code",
                Protocol::Anthropic,
                &source,
                &message,
                "",
            )),
        }
    }
    if let Some(directory) = codex {
        candidates.extend(discover_codex(&directory, &|key| std::env::var(key).ok()));
    }
    candidates
}

/// Re-read all source files and environment values immediately before importing.
/// An old UI selection cannot silently import a changed endpoint or credential.
pub fn import_candidate(
    paths: DiscoveryPaths,
    id: &str,
    fingerprint: &str,
) -> Result<ProviderInput, String> {
    let candidate = discover(paths)
        .into_iter()
        .find(|candidate| candidate.id == id)
        .ok_or("配置来源已消失，请重新扫描")?;
    if candidate.fingerprint != fingerprint {
        return Err("配置来源已变化，请重新扫描并确认后导入".into());
    }
    if candidate.status != DiscoveryStatus::Ready {
        return Err("该配置当前不能导入，请检查扫描结果".into());
    }
    let input = candidate.input();
    input.validate()?;
    Ok(input)
}

fn resolve_dir(
    explicit: Option<String>,
    variable: &str,
    fallback: &str,
    home: Option<&Path>,
) -> Option<PathBuf> {
    match explicit.or_else(|| std::env::var(variable).ok()) {
        Some(value) if value == "~" => home.map(Path::to_path_buf),
        Some(value) if value.starts_with("~/") => home.map(|home| home.join(&value[2..])),
        Some(value) if !value.trim().is_empty() => Some(PathBuf::from(value)),
        _ => home.map(|home| home.join(fallback)),
    }
}

fn read_bounded(path: &Path) -> Result<String, String> {
    let metadata =
        fs::metadata(path).map_err(|_| "无法读取配置文件；文件可能不存在或权限不足".to_string())?;
    if !metadata.is_file() || metadata.len() > MAX_FILE_BYTES {
        return Err("配置必须是大小不超过 1 MiB 的普通文件".into());
    }
    let mut text = String::new();
    File::open(path)
        .map_err(|_| "无法打开配置文件")?
        .take(MAX_FILE_BYTES + 1)
        .read_to_string(&mut text)
        .map_err(|_| "无法读取 UTF-8 配置文件")?;
    if text.len() as u64 > MAX_FILE_BYTES {
        return Err("配置文件超过 1 MiB".into());
    }
    Ok(text)
}

fn digest(parts: &[&str]) -> String {
    let mut hasher = Sha256::new();
    for part in parts {
        hasher.update((part.len() as u64).to_le_bytes());
        hasher.update(part.as_bytes());
    }
    format!("{:x}", hasher.finalize())
}

fn candidate(name: &str, protocol: Protocol, source: &str, raw: &str) -> DiscoveredProvider {
    DiscoveredProvider {
        id: digest(&[source]),
        name: name.into(),
        protocol,
        base_url: String::new(),
        model: String::new(),
        auth_kind: AuthKind::Bearer,
        source: source.into(),
        status: DiscoveryStatus::Invalid,
        message: String::new(),
        fingerprint: digest(&[source, raw]),
        api_key: None,
    }
}

fn failure(
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

fn finish(mut candidate: DiscoveredProvider, raw: &str) -> DiscoveredProvider {
    candidate.fingerprint = digest(&[
        &candidate.source,
        raw,
        candidate.api_key.as_deref().unwrap_or(""),
    ]);
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

/// Pure parser. Claude credentials are paired only with the endpoint in this same
/// settings.env object, never an unrelated process environment or another file.
pub fn parse_claude_settings(raw: &str, source: &str) -> DiscoveredProvider {
    let value: serde_json::Value = match serde_json::from_str(raw) {
        Ok(value) => value,
        Err(_) => {
            return failure(
                "Claude Code",
                Protocol::Anthropic,
                source,
                "Claude settings.json 格式无效",
                raw,
            )
        }
    };
    if !value.is_object() {
        return failure(
            "Claude Code",
            Protocol::Anthropic,
            source,
            "Claude 配置必须为 JSON 对象",
            raw,
        );
    }
    let mut result = candidate("Claude Code", Protocol::Anthropic, source, raw);
    let env = value.get("env").and_then(serde_json::Value::as_object);
    let env_str = |key: &str| {
        env.and_then(|env| env.get(key))
            .and_then(serde_json::Value::as_str)
            .filter(|s| !s.is_empty())
    };
    result.base_url = env_str("ANTHROPIC_BASE_URL")
        .unwrap_or("https://api.anthropic.com")
        .into();
    result.model = env_str("ANTHROPIC_MODEL")
        .or_else(|| value.get("model").and_then(serde_json::Value::as_str))
        .unwrap_or("")
        .into();
    let api_key = env_str("ANTHROPIC_API_KEY");
    let auth_token = env_str("ANTHROPIC_AUTH_TOKEN");
    if api_key.is_some() && auth_token.is_some() {
        result.message =
            "同时存在 API_KEY 与 AUTH_TOKEN，无法确定有效认证方式；请手动创建配置".into();
        return finish(result, raw);
    }
    result.auth_kind = if auth_token.is_some() {
        AuthKind::Bearer
    } else {
        AuthKind::ApiKey
    };
    result.api_key = api_key.or(auth_token).map(String::from);
    if result.api_key.is_none() && value.get("apiKeyHelper").is_some() {
        result.status = DiscoveryStatus::Unsupported;
        result.message = "检测到 apiKeyHelper；为避免执行本地命令，请手动填写 API 凭据".into();
    }
    // Claude model aliases such as "sonnet" depend on CLI version and account.
    // Do not send aliases directly to an upstream API or guess a concrete model.
    if matches!(
        result.model.as_str(),
        "sonnet" | "opus" | "haiku" | "default" | "opusplan"
    ) {
        result.status = DiscoveryStatus::Unsupported;
        result.message = "Claude 模型别名需要 CLI 解析；请手动填写服务支持的完整模型 ID".into();
    }
    finish(result, raw)
}

#[derive(Clone)]
enum CodexAuth {
    Key(String),
    Missing,
    OAuth,
    Invalid,
}

fn parse_codex_auth(raw: Option<&str>) -> CodexAuth {
    let Some(raw) = raw else {
        return CodexAuth::Missing;
    };
    let Ok(value) = serde_json::from_str::<serde_json::Value>(raw) else {
        return CodexAuth::Invalid;
    };
    let mode = value.get("auth_mode").and_then(serde_json::Value::as_str);
    if matches!(mode, Some("chatgpt" | "chatgptAuthTokens"))
        || value.get("tokens").is_some_and(|tokens| !tokens.is_null())
    {
        return CodexAuth::OAuth;
    }
    if mode.is_some() && mode != Some("apikey") {
        return CodexAuth::Invalid;
    }
    match value
        .get("OPENAI_API_KEY")
        .and_then(serde_json::Value::as_str)
        .filter(|key| !key.trim().is_empty())
    {
        Some(key) => CodexAuth::Key(key.into()),
        None => CodexAuth::Missing,
    }
}

fn discover_codex(
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

// Profile provider definitions replace the entire same-named provider table.
// Field-wise merging could pair a new endpoint with a credential from the old one.
fn merge_profile(base: &toml::Value, profile: &toml::Value) -> toml::Value {
    let mut merged = base.clone();
    let (Some(target), Some(profile)) = (merged.as_table_mut(), profile.as_table()) else {
        return merged;
    };
    for key in ["model", "model_provider"] {
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

fn parse_codex_candidates(
    config: &toml::Value,
    auth: &CodexAuth,
    source: &str,
    raw: &str,
    env: &dyn Fn(&str) -> Option<String>,
    include_profiles: bool,
) -> Vec<DiscoveredProvider> {
    let mut results = vec![codex_candidate(config, auth, source, raw, env, "默认")];
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

fn codex_candidate(
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
    let default_openai_endpoint = provider_id == "openai"
        && result.base_url.trim_end_matches('/') == "https://api.openai.com/v1";
    let requires_openai_auth = provider
        .and_then(|provider| provider.get("requires_openai_auth"))
        .and_then(toml::Value::as_bool)
        .unwrap_or(default_openai_endpoint);
    if let Some(env_key) = get("env_key") {
        if env_key.is_empty()
            || env_key.len() > 256
            || !env_key
                .chars()
                .all(|c| c.is_ascii_alphanumeric() || c == '_')
        {
            result.message = "env_key 不是有效的环境变量名".into();
        } else {
            result.api_key = env(env_key).filter(|key| !key.trim().is_empty());
        }
    } else if requires_openai_auth {
        // A custom endpoint may only use auth.json when it explicitly opts into
        // requires_openai_auth. Do not borrow OpenAI credentials by default.
        match auth {
            CodexAuth::Key(key) => result.api_key = Some(key.clone()),
            CodexAuth::Missing if provider_id == "openai" => {
                result.api_key = env("OPENAI_API_KEY").filter(|key| !key.trim().is_empty())
            }
            CodexAuth::Missing => {}
            CodexAuth::OAuth => {
                result.status = DiscoveryStatus::Unsupported;
                result.message =
                    "检测到 Codex ChatGPT/OAuth 登录；不会提取或复用登录令牌，请配置 API key"
                        .into();
            }
            CodexAuth::Invalid => result.message = "auth.json 无效或认证模式无法安全识别".into(),
        }
    } else {
        // No credential is intentional only for a loopback endpoint. A remote
        // custom provider without env_key is reported for manual setup.
        if result.base_url.starts_with("http://")
            && crate::model::validate_base_url(&result.base_url).is_ok()
        {
            result.auth_kind = AuthKind::None;
        }
    }
    if get("experimental_bearer_token").is_some()
        || provider
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

#[cfg(test)]
mod tests {
    use super::*;

    const CLAUDE: &str = include_str!("../tests/fixtures/claude-settings.json");
    const CODEX: &str = include_str!("../tests/fixtures/codex-config.toml");
    const API_AUTH: &str = include_str!("../tests/fixtures/codex-api-auth.json");
    const OAUTH: &str = include_str!("../tests/fixtures/codex-oauth-auth.json");

    #[test]
    fn claude_pairs_own_endpoint_and_key_without_serializing_credentials() {
        let found = parse_claude_settings(CLAUDE, "fixture/settings.json");
        assert_eq!(found.status, DiscoveryStatus::Ready);
        assert_eq!(found.base_url, "https://claude.example.test/v1");
        assert_eq!(found.auth_kind, AuthKind::ApiKey);
        assert_eq!(
            found.api_key.as_deref(),
            Some("fixture-claude-key-not-real")
        );
        let serialized = serde_json::to_string(&found).unwrap();
        assert!(!serialized.contains("fixture-claude-key"));
        assert!(!serialized.contains("\"apiKey\":"));
        let missing = parse_claude_settings(
            r#"{"env":{"ANTHROPIC_BASE_URL":"https://other.example.test","ANTHROPIC_MODEL":"fixture-model"}}"#,
            "missing",
        );
        assert_eq!(missing.status, DiscoveryStatus::MissingCredential);
    }

    #[test]
    fn invalid_discovery_urls_never_serialize_embedded_credentials() {
        for base_url in [
            "https://fixture-url-secret:fixture-password@api.example.test/v1",
            "https://api.example.test/v1?api_key=fixture-url-secret",
            "https://api.example.test/v1#fixture-url-secret",
            "fixture-url-secret [invalid URL]",
        ] {
            let raw = serde_json::json!({"env": {
                "ANTHROPIC_BASE_URL": base_url,
                "ANTHROPIC_API_KEY": "fixture-auth-key",
                "ANTHROPIC_MODEL": "fixture-model",
            }})
            .to_string();
            let found = parse_claude_settings(&raw, "fixture/settings.json");
            assert_eq!(found.base_url, base_url);
            assert_eq!(found.status, DiscoveryStatus::Invalid);
            let serialized = serde_json::to_string(&found).unwrap();
            assert!(!serialized.contains("fixture-url-secret"));
            assert!(!serialized.contains("fixture-password"));
            assert!(!serialized.contains("fixture-auth-key"));
            assert_eq!(
                serde_json::from_str::<serde_json::Value>(&serialized).unwrap()["baseUrl"],
                ""
            );
        }
    }

    #[test]
    fn claude_helper_is_not_executed_and_parse_errors_do_not_echo_secrets() {
        let helper = parse_claude_settings(
            r#"{"apiKeyHelper":"touch /must-not-run","model":"fixture-model"}"#,
            "helper",
        );
        assert_eq!(helper.status, DiscoveryStatus::Unsupported);
        let malformed = parse_claude_settings("{broken: fixture-secret", "malformed");
        assert_eq!(malformed.status, DiscoveryStatus::Invalid);
        assert!(!malformed.message.contains("fixture-secret"));
        let conflict = parse_claude_settings(
            r#"{"env":{"ANTHROPIC_API_KEY":"fixture-one","ANTHROPIC_AUTH_TOKEN":"fixture-two"}}"#,
            "conflict",
        );
        assert_eq!(conflict.status, DiscoveryStatus::Invalid);
    }

    #[test]
    fn codex_profiles_resolve_only_their_selected_env_key() {
        let config = toml::from_str(CODEX).unwrap();
        let env = |key: &str| match key {
            "FIXTURE_CUSTOM_KEY" => Some("fixture-custom-key".into()),
            _ => None,
        };
        let found = parse_codex_candidates(
            &config,
            &parse_codex_auth(Some(API_AUTH)),
            "config.toml",
            CODEX,
            &env,
            true,
        );
        assert_eq!(found.len(), 3);
        let default = &found[0];
        assert_eq!(default.status, DiscoveryStatus::Ready);
        assert_eq!(
            default.api_key.as_deref(),
            Some("fixture-openai-key-not-real")
        );
        let custom = found
            .iter()
            .find(|candidate| candidate.name.ends_with("custom"))
            .unwrap();
        assert_eq!(custom.protocol, Protocol::ChatCompletions);
        assert_eq!(custom.base_url, "https://custom.example.test/v1");
        assert_eq!(custom.api_key.as_deref(), Some("fixture-custom-key"));
        let missing = found
            .iter()
            .find(|candidate| candidate.name.ends_with("missing"))
            .unwrap();
        assert_eq!(missing.status, DiscoveryStatus::MissingCredential);
        assert!(missing.api_key.is_none());
    }

    #[test]
    fn oauth_is_not_reused_but_independent_env_provider_still_works() {
        let config = toml::from_str(CODEX).unwrap();
        let found = parse_codex_candidates(
            &config,
            &parse_codex_auth(Some(OAUTH)),
            "config.toml",
            CODEX,
            &|key| (key == "FIXTURE_CUSTOM_KEY").then(|| "fixture-custom-key".into()),
            true,
        );
        assert_eq!(found[0].status, DiscoveryStatus::Unsupported);
        assert!(found[0].api_key.is_none());
        assert_eq!(
            found
                .iter()
                .find(|candidate| candidate.name.ends_with("custom"))
                .unwrap()
                .status,
            DiscoveryStatus::Ready
        );
    }

    #[test]
    fn profile_endpoint_override_does_not_inherit_a_key() {
        let base: toml::Value = toml::from_str("model='fixture-model'\nmodel_provider='custom'\n[model_providers.custom]\nbase_url='https://old.example.test'\nenv_key='FIXTURE_OLD_KEY'").unwrap();
        let profile: toml::Value =
            toml::from_str("[model_providers.custom]\nbase_url='https://new.example.test'")
                .unwrap();
        let merged = merge_profile(&base, &profile);
        let found = codex_candidate(
            &merged,
            &CodexAuth::Key("fixture-openai-key".into()),
            "profile",
            "raw",
            &|_| Some("fixture-old-key".into()),
            "override",
        );
        assert_eq!(found.status, DiscoveryStatus::MissingCredential);
        assert!(found.api_key.is_none());
    }

    #[test]
    fn standalone_profiles_and_changed_source_are_checked_at_import() {
        let dir = tempfile::tempdir().unwrap();
        let claude = dir.path().join("claude");
        let codex = dir.path().join("codex");
        fs::create_dir(&claude).unwrap();
        fs::create_dir(&codex).unwrap();
        fs::write(claude.join("settings.json"), CLAUDE).unwrap();
        fs::write(codex.join("config.toml"), "model='fixture-default-model'").unwrap();
        fs::write(codex.join("auth.json"), API_AUTH).unwrap();
        fs::write(
            codex.join("review.config.toml"),
            "model='fixture-review-model'",
        )
        .unwrap();
        let paths = DiscoveryPaths {
            claude_dir: Some(claude.to_string_lossy().into()),
            codex_dir: Some(codex.to_string_lossy().into()),
        };
        let found = discover(paths.clone());
        assert_eq!(
            found
                .iter()
                .find(|candidate| candidate.name == "Codex · review")
                .unwrap()
                .model,
            "fixture-review-model"
        );
        let selected = found
            .iter()
            .find(|candidate| candidate.name == "Claude Code")
            .unwrap();
        assert!(import_candidate(paths.clone(), &selected.id, &selected.fingerprint).is_ok());
        fs::write(
            claude.join("settings.json"),
            CLAUDE.replace("fixture-claude-key-not-real", "fixture-changed-key"),
        )
        .unwrap();
        assert!(import_candidate(paths, &selected.id, &selected.fingerprint).is_err());
    }

    #[test]
    fn changed_environment_key_invalidates_fingerprint() {
        let config: toml::Value = toml::from_str("model='fixture-model'\nmodel_provider='custom'\n[model_providers.custom]\nbase_url='https://custom.example.test'\nenv_key='FIXTURE_KEY'").unwrap();
        let first = codex_candidate(
            &config,
            &CodexAuth::Missing,
            "fixture",
            "unchanged",
            &|_| Some("fixture-first-key".into()),
            "test",
        );
        let second = codex_candidate(
            &config,
            &CodexAuth::Missing,
            "fixture",
            "unchanged",
            &|_| Some("fixture-second-key".into()),
            "test",
        );
        assert_eq!(first.id, second.id);
        assert_ne!(first.fingerprint, second.fingerprint);
    }

    #[test]
    fn overriding_openai_endpoint_requires_explicit_credential_mapping() {
        let config: toml::Value = toml::from_str("model='fixture-model'\n[model_providers.openai]\nbase_url='https://other.example.test/v1'").unwrap();
        let found = codex_candidate(
            &config,
            &CodexAuth::Key("fixture-openai-key".into()),
            "fixture",
            "raw",
            &|_| Some("fixture-environment-key".into()),
            "test",
        );
        assert_eq!(found.status, DiscoveryStatus::MissingCredential);
        assert!(found.api_key.is_none());
    }

    #[test]
    fn bounded_reads_reject_oversized_and_invalid_input() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("large.json");
        fs::write(&path, vec![b'x'; MAX_FILE_BYTES as usize + 1]).unwrap();
        assert!(read_bounded(&path).is_err());
        assert!(read_bounded(dir.path()).is_err());
    }
}
