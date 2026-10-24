use super::*;
use crate::{model::MAX_MODELS_PER_PROVIDER, protocol::Effort};
use serde_json::json;

#[test]
fn parses_vendor_ids_without_inventing_effort_and_preserves_catalog_capabilities() {
    let ordinary = parse_models(&json!({
        "data": [
            { "id": "vendor/custom-alias", "display_name": "My model" },
            { "id": "vendor/custom-alias" },
        ],
    }))
    .unwrap();
    assert_eq!(ordinary.len(), 1);
    assert_eq!(ordinary[0].efforts, vec![Effort::Default]);
    let catalog = parse_models(&json!({
        "models": [
            { "slug": "hidden", "visibility": "hide" },
            {
                "slug": "relay/model",
                "display_name": "Relay",
                "visibility": "list",
                "supported_reasoning_levels": [
                    { "effort": "low" },
                    { "effort": "xhigh" },
                    { "effort": "nonsense" },
                ],
                "default_reasoning_level": "xhigh",
            },
        ],
    }))
    .unwrap();
    assert_eq!(catalog[0].id, "relay/model");
    assert_eq!(
        catalog[0].efforts,
        vec![Effort::Default, Effort::Low, Effort::Xhigh]
    );
    assert_eq!(catalog[0].default_effort, Some(Effort::Xhigh));
}

#[test]
fn imports_known_budget_metadata_without_inventing_or_trusting_invalid_limits() {
    let models = parse_models(&json!({
        "models": [
            { "slug": "large", "context_window": 1_000_000, "max_output_tokens": 32_768 },
            { "id": "small", "context_length": 16_384 },
            { "id": "inconsistent", "context_window": 32_768, "max_output_tokens": 65_536 },
            { "id": "invalid", "context_window": -1, "max_output_tokens": 1.5 },
            { "id": "oversize", "context_window": 4_294_967_296_u64, "max_output_tokens": 100_000 },
            { "id": "unknown" },
        ],
    }))
    .unwrap();
    assert_eq!(models.len(), 6);
    assert_eq!(models[0].context_window_tokens, Some(1_000_000));
    assert_eq!(models[0].max_output_tokens, Some(32_768));
    assert_eq!(models[1].context_window_tokens, Some(16_384));
    assert_eq!(models[1].max_output_tokens, None);
    assert_eq!(models[1].effective_max_output_tokens(), 8_192);
    assert_eq!(models[2].context_window_tokens, Some(32_768));
    assert_eq!(models[2].max_output_tokens, None);
    for model in &models[3..] {
        assert_eq!(model.context_window_tokens, None);
        assert_eq!(model.max_output_tokens, None);
    }
}

#[test]
fn bounds_and_validates_untrusted_catalog_rows() {
    let invalid = json!({ "data": [{ "id": "bad\nmodel" }, { "id": "" }] });
    assert!(parse_models(&invalid).is_err());
    let rows: Vec<_> = (0..1000)
        .map(|id| json!({"id":format!("vendor-{id}")}))
        .collect();
    assert_eq!(
        parse_models(&json!({"data":rows})).unwrap().len(),
        MAX_MODELS_PER_PROVIDER
    );
}
