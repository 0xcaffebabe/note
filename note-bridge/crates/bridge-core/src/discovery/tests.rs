//! 保留原发现行为与凭据隔离 fixture 的回归测试。

use super::bounded_file::{read_bounded, MAX_FILE_BYTES};
use super::claude_models::{
    claude_allowed, claude_models, resolve_claude_model, strip_context_marker,
};
use super::codex::auth::parse_codex_auth;
use super::codex::codex_candidate;
use super::codex::profiles::{merge_profile, parse_codex_candidates};
use super::contracts::CodexAuth;
use super::*;
use crate::model::AuthKind;
use std::fs;

const CLAUDE: &str = include_str!("../../tests/fixtures/claude-settings.json");
const CODEX: &str = include_str!("../../tests/fixtures/codex-config.toml");
const API_AUTH: &str = include_str!("../../tests/fixtures/codex-api-auth.json");
const OAUTH: &str = include_str!("../../tests/fixtures/codex-oauth-auth.json");

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
        toml::from_str("[model_providers.custom]\nbase_url='https://new.example.test'").unwrap();
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
    let config: toml::Value = toml::from_str(
        "model='fixture-model'\n[model_providers.openai]\nbase_url='https://other.example.test/v1'",
    )
    .unwrap();
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

#[test]
fn claude_reads_cc_switch_mappings_and_resolves_only_explicit_aliases() {
    let raw = serde_json::json!({"model":"sonnet[1m]", "env": {
        "ANTHROPIC_API_KEY":"fixture-only-key",
        "ANTHROPIC_BASE_URL":"https://gateway.example.test/anthropic",
        "ANTHROPIC_DEFAULT_SONNET_MODEL":"vendor/custom-sonnet[1M]",
        "ANTHROPIC_DEFAULT_SONNET_MODEL_NAME":"Custom Sonnet",
        "ANTHROPIC_DEFAULT_OPUS_MODEL":"vendor/reasoner",
        "ANTHROPIC_DEFAULT_HAIKU_MODEL":"vendor/fast",
        "ANTHROPIC_DEFAULT_FABLE_MODEL":"vendor/reasoner",
        "ANTHROPIC_SMALL_FAST_MODEL":"legacy-small",
        "CLAUDE_CODE_SUBAGENT_MODEL":"vendor/subagent",
        "ANTHROPIC_CUSTOM_MODEL_OPTION":"my-deployment",
        "ANTHROPIC_CUSTOM_MODEL_OPTION_NAME":"My deployment"
    }})
    .to_string();
    let found = parse_claude_settings(&raw, "fixture/settings.json");
    assert_eq!(found.status, DiscoveryStatus::Ready);
    assert_eq!(found.model, "vendor/custom-sonnet");
    assert_eq!(found.models.len(), 6);
    assert_eq!(found.models[0].name, "Custom Sonnet");
    assert!(found
        .models
        .iter()
        .all(|model| model.efforts == vec![crate::protocol::Effort::Default]));
    assert!(found.input().validate().is_ok());
    let unresolved = parse_claude_settings(
        r#"{"model":"sonnet","env":{"ANTHROPIC_API_KEY":"fixture"}}"#,
        "fixture",
    );
    assert_eq!(unresolved.status, DiscoveryStatus::Unsupported);
    assert!(unresolved.message.contains("别名"));
}

#[test]
fn claude_picker_replaces_options_and_allowlist_is_not_a_catalog() {
    let value = serde_json::json!({"env": {
        "ANTHROPIC_DEFAULT_SONNET_MODEL":"excluded",
        "ANTHROPIC_CUSTOM_MODEL_OPTION":"also-excluded"
    }, "modelPicker": {"replaceBuiltInOptions": true, "options": [
        {"model":"vendor/primary", "label":"Primary"},
        {"model":"vendor/secondary"}, {"model":"sonnet"}
    ]}, "availableModels":["vendor/primary", "unconfigured"]});
    let (selected, models) = claude_models(&value, "").unwrap();
    assert_eq!(selected, "vendor/primary");
    assert_eq!(models.len(), 1);
    assert_eq!(models[0].name, "Primary");
    assert!(claude_models(&value, "vendor/blocked").is_err());
    assert!(claude_allowed("sonnet", "anthropic/claude-sonnet-4-6"));
    assert!(claude_allowed("claude-opus-4", "claude-opus-4-6"));
    assert!(!claude_allowed("claude-opus-4", "claude-opus-40"));
    assert_eq!(strip_context_marker("模型"), "模型");
    let overrides = serde_json::json!({
        "modelOverrides":{"claude-sonnet-fixture":"gateway/deployment"},
        "env":{"ANTHROPIC_DEFAULT_SONNET_MODEL":"claude-sonnet-fixture"}
    });
    assert_eq!(
        resolve_claude_model("claude-sonnet-fixture", &overrides).as_deref(),
        Some("gateway/deployment")
    );
    assert_eq!(
        resolve_claude_model("sonnet", &overrides).as_deref(),
        Some("gateway/deployment")
    );
}

#[test]
fn codex_catalog_reads_names_efforts_and_keeps_explicit_current_model() {
    let dir = tempfile::tempdir().unwrap();
    fs::write(dir.path().join("models.json"), serde_json::json!({"models":[
        {"slug":"vendor/fast", "display_name":"Fast model", "visibility":"list", "supported_in_api":true,
         "supported_reasoning_levels":[{"effort":"low"},{"effort":"xhigh"},{"effort":"unknown"}],"default_reasoning_level":"xhigh",
         "context_window":400_000,"max_output_tokens":32_768},
        {"slug":"hidden", "visibility":"hide"}, {"slug":"non-api", "supported_in_api":false}
    ]}).to_string()).unwrap();
    let source = dir
        .path()
        .join("config.toml")
        .to_string_lossy()
        .into_owned();
    let config: toml::Value = toml::from_str("model_catalog_json='models.json'").unwrap();
    let first = codex_candidate(
        &config,
        &CodexAuth::Key("fixture".into()),
        &source,
        "raw",
        &|_| None,
        "default",
    );
    assert_eq!(first.status, DiscoveryStatus::Ready);
    assert_eq!(first.model, "vendor/fast");
    assert_eq!(first.models.len(), 1);
    assert_eq!(first.models[0].name, "Fast model");
    assert_eq!(first.models[0].context_window_tokens, Some(400_000));
    assert_eq!(first.models[0].max_output_tokens, Some(32_768));
    assert_eq!(
        first.models[0].default_effort,
        Some(crate::protocol::Effort::Xhigh)
    );
    assert_eq!(
        first.models[0].efforts,
        vec![
            crate::protocol::Effort::Default,
            crate::protocol::Effort::Low,
            crate::protocol::Effort::Xhigh
        ]
    );
    let config: toml::Value =
        toml::from_str("model='vendor/not-in-list'\nmodel_catalog_json='models.json'").unwrap();
    let retained = codex_candidate(
        &config,
        &CodexAuth::Key("fixture".into()),
        &source,
        "raw",
        &|_| None,
        "default",
    );
    assert_eq!(retained.model, "vendor/not-in-list");
    assert_eq!(retained.models.len(), 2);
    let config: toml::Value =
        toml::from_str("model='non-api'\nmodel_catalog_json='models.json'").unwrap();
    let blocked = codex_candidate(
        &config,
        &CodexAuth::Key("fixture".into()),
        &source,
        "raw",
        &|_| None,
        "default",
    );
    assert_eq!(blocked.status, DiscoveryStatus::Invalid);
    assert!(blocked.models.is_empty());
    assert!(blocked.message.contains("不支持 API"));
}

#[test]
fn codex_profiles_use_their_catalog_and_catalog_changes_invalidate_import() {
    let dir = tempfile::tempdir().unwrap();
    let claude = dir.path().join("claude");
    let codex = dir.path().join("codex");
    fs::create_dir(&claude).unwrap();
    fs::create_dir(&codex).unwrap();
    fs::write(claude.join("settings.json"), CLAUDE).unwrap();
    fs::write(codex.join("auth.json"), API_AUTH).unwrap();
    fs::write(codex.join("base.json"), r#"{"models":[{"slug":"base"}]}"#).unwrap();
    fs::write(
        codex.join("custom.json"),
        r#"{"models":[{"slug":"custom"}]}"#,
    )
    .unwrap();
    fs::write(codex.join("config.toml"), "profile='custom'\nmodel_catalog_json='base.json'\n[profiles.custom]\nmodel_catalog_json='custom.json'").unwrap();
    fs::write(
        codex.join("standalone.config.toml"),
        "model_catalog_json='custom.json'",
    )
    .unwrap();
    let paths = DiscoveryPaths {
        claude_dir: Some(claude.to_string_lossy().into()),
        codex_dir: Some(codex.to_string_lossy().into()),
    };
    let found = discover(paths.clone());
    let selected = found
        .iter()
        .find(|candidate| candidate.name == "Codex · 默认")
        .unwrap();
    assert_eq!(selected.model, "custom");
    assert!(found
        .iter()
        .filter(|candidate| candidate.name.starts_with("Codex"))
        .all(|candidate| candidate.models[0].id == "custom"));
    assert!(import_candidate(paths.clone(), &selected.id, &selected.fingerprint).is_ok());
    // Even semantically irrelevant catalogue content is part of the snapshot.
    fs::write(
        codex.join("custom.json"),
        r#"{"models":[{"slug":"custom"}],"revision":2}"#,
    )
    .unwrap();
    assert!(import_candidate(paths, &selected.id, &selected.fingerprint).is_err());
}

#[test]
fn invalid_explicit_catalog_is_reported_and_global_cache_is_never_imported() {
    let dir = tempfile::tempdir().unwrap();
    let source = dir
        .path()
        .join("config.toml")
        .to_string_lossy()
        .into_owned();
    fs::write(
        dir.path().join("models_cache.json"),
        r#"{"models":[{"slug":"wrong-provider-model"}]}"#,
    )
    .unwrap();
    let config: toml::Value = toml::from_str("model='selected-only'").unwrap();
    let candidate = codex_candidate(
        &config,
        &CodexAuth::Key("fixture".into()),
        &source,
        "raw",
        &|_| None,
        "default",
    );
    assert_eq!(candidate.models.len(), 1);
    assert_eq!(candidate.models[0].id, "selected-only");
    let config: toml::Value =
        toml::from_str("model='selected-only'\nmodel_catalog_json='bad.json'").unwrap();
    for raw in ["{fixture-secret-broken", r#"{"models":"invalid"}"#] {
        fs::write(dir.path().join("bad.json"), raw).unwrap();
        let candidate = codex_candidate(
            &config,
            &CodexAuth::Key("fixture".into()),
            &source,
            "raw",
            &|_| None,
            "default",
        );
        assert_eq!(candidate.status, DiscoveryStatus::Invalid);
        assert!(!candidate.message.contains("fixture-secret"));
    }
    fs::write(
        dir.path().join("bad.json"),
        vec![b'x'; MAX_FILE_BYTES as usize + 1],
    )
    .unwrap();
    let candidate = codex_candidate(
        &config,
        &CodexAuth::Key("fixture".into()),
        &source,
        "raw",
        &|_| None,
        "default",
    );
    assert_eq!(candidate.status, DiscoveryStatus::Invalid);
    assert!(candidate.message.contains("1 MiB"));
}

#[test]
fn cc_switch_proxy_bearer_is_paired_with_its_exact_provider_endpoint() {
    let raw = "model='ccs-custom-model'\nmodel_provider='custom'\n[model_providers.custom]\nbase_url='http://127.0.0.1:15721/v1'\nrequires_openai_auth=false\nexperimental_bearer_token='PROXY_MANAGED'";
    let config: toml::Value = toml::from_str(raw).unwrap();
    let candidate = codex_candidate(
        &config,
        &CodexAuth::Key("unrelated-openai-key".into()),
        "fixture",
        raw,
        &|_| None,
        "proxy",
    );
    assert_eq!(candidate.status, DiscoveryStatus::Ready);
    assert_eq!(candidate.base_url, "http://127.0.0.1:15721/v1");
    assert_eq!(candidate.api_key.as_deref(), Some("PROXY_MANAGED"));
    assert_eq!(candidate.auth_kind, AuthKind::Bearer);
    let serialized = serde_json::to_string(&candidate).unwrap();
    assert!(!serialized.contains("PROXY_MANAGED"));
    assert!(!serialized.contains("unrelated-openai-key"));
    for conflict in [
        raw.replace("requires_openai_auth=false", "requires_openai_auth=true"),
        format!("{raw}\nenv_key='FIXTURE_KEY'"),
    ] {
        let config: toml::Value = toml::from_str(&conflict).unwrap();
        let candidate = codex_candidate(
            &config,
            &CodexAuth::Key("unrelated-openai-key".into()),
            "fixture",
            &conflict,
            &|_| Some("unrelated-env-key".into()),
            "proxy",
        );
        assert_eq!(candidate.status, DiscoveryStatus::Unsupported);
        assert!(candidate.api_key.is_none());
        assert!(!candidate.message.contains("PROXY_MANAGED"));
    }
}
