use super::*;

#[test]
fn legacy_models_use_default_budgets_and_optional_budgets_roundtrip() {
    let mut model: ModelOption =
        serde_json::from_str(r#"{"id":"fixture","name":"Fixture","efforts":["default"]}"#).unwrap();
    assert_eq!(model.effective_context_window_tokens(), 1_000_000);
    assert_eq!(model.effective_max_output_tokens(), 16_384);
    assert!(model.validate().is_ok());
    assert!(serde_json::to_value(&model)
        .unwrap()
        .get("contextWindowTokens")
        .is_none());
    model.context_window_tokens = Some(200_000);
    model.max_output_tokens = Some(32_768);
    assert!(model.validate().is_ok());
    let saved = serde_json::to_value(&model).unwrap();
    assert_eq!(saved["contextWindowTokens"], 200_000);
    assert_eq!(saved["maxOutputTokens"], 32_768);
    assert_eq!(serde_json::from_value::<ModelOption>(saved).unwrap(), model);
}

#[test]
fn validates_budget_ranges_and_reserves_context_for_input() {
    let mut model = ModelOption::configured("fixture");
    for context in [0, 16_383, 2_000_001, u32::MAX] {
        model.context_window_tokens = Some(context);
        assert!(model.validate().is_err());
    }
    model.context_window_tokens = Some(1_000_000);
    for output in [0, 255, 65_537, u32::MAX] {
        model.max_output_tokens = Some(output);
        assert!(model.validate().is_err());
    }
    for (context, output) in [(16_384, 256), (16_384, 8_192), (2_000_000, 65_536)] {
        model.context_window_tokens = Some(context);
        model.max_output_tokens = Some(output);
        assert!(model.validate().is_ok());
    }
    model.context_window_tokens = Some(16_384);
    model.max_output_tokens = Some(8_193);
    assert!(model.validate().unwrap_err().contains("一半"));
    model.max_output_tokens = None;
    assert_eq!(model.effective_max_output_tokens(), 8_192);
    assert!(model.validate().is_ok());
}

#[test]
fn allows_https_and_loopback_http_only() {
    for url in [
        "https://api.example.com/v1",
        "http://127.0.0.1:1234/v1",
        "http://[::1]:1234",
        "http://localhost:8000",
    ] {
        assert!(validate_base_url(url).is_ok(), "{url}");
    }
    for url in [
        "http://example.com",
        "http://192.168.1.2",
        "ftp://localhost",
        "https://user:secret@example.com",
        "https://@example.com",
        "https://example.com?api_key=secret",
        "https://example.com#secret",
        " https://example.com",
        "https://example.com\n",
    ] {
        assert!(validate_base_url(url).is_err(), "{url}");
    }
}

#[test]
fn rejects_arbitrary_keyring_identifiers_and_control_characters() {
    assert!(validate_id("00000000-0000-4000-8000-000000000001").is_ok());
    assert!(validate_id("../../other-service").is_err());
    assert!(validate_secret("test-only-key\r\nHeader: value").is_err());
}
