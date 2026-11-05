use super::*;
use crate::{
    model::{AuthKind, Protocol, ProviderInput},
    storage::{MemorySecretStore, SecretStore},
};

fn input(secret: Option<&str>) -> ProviderInput {
    ProviderInput {
        id: None,
        name: "Fixture provider".into(),
        protocol: Protocol::Responses,
        base_url: "https://api.example.test/v1".into(),
        model: "fixture-model".into(),
        models: Vec::new(),
        auth_kind: if secret.is_some() {
            AuthKind::Bearer
        } else {
            AuthKind::None
        },
        enabled: true,
        api_key: secret.map(String::from),
        source: None,
    }
}

#[tokio::test]
async fn configuration_preserves_other_providers_when_a_credential_is_unavailable() {
    #[derive(Default)]
    struct PartialReadStore(MemorySecretStore);

    impl SecretStore for PartialReadStore {
        fn get(&self, id: &str) -> Result<Option<String>, String> {
            match self.0.get(id)?.as_deref() {
                Some("fixture-missing-key") => Ok(None),
                Some("fixture-unavailable-key") => {
                    Err("fixture credential store unavailable".into())
                }
                _ => self.0.get(id),
            }
        }

        fn set(&self, id: &str, secret: &str) -> Result<(), String> {
            self.0.set(id, secret)
        }

        fn delete(&self, id: &str) -> Result<(), String> {
            self.0.delete(id)
        }
    }

    let dir = tempfile::tempdir().unwrap();
    let bridge =
        Bridge::with_secrets(dir.path().into(), Arc::new(PartialReadStore::default())).unwrap();
    for secret in [
        Some("fixture-missing-key"),
        Some("fixture-unavailable-key"),
        Some("fixture-good-key"),
        None,
    ] {
        bridge.inner.storage.save(input(secret)).unwrap();
    }

    let config = bridge.agent_configuration().await.unwrap();
    let providers = config["providers"].as_array().unwrap();
    assert_eq!(providers.len(), 4);
    assert!(providers[0].get("secret").is_none());
    assert!(providers[1].get("secret").is_none());
    assert_eq!(providers[2]["secret"], "fixture-good-key");
    assert!(providers[3].get("secret").is_none());
}

#[tokio::test]
async fn configuration_reflects_edits_disabling_and_deletion() {
    let dir = tempfile::tempdir().unwrap();
    let bridge =
        Bridge::with_secrets(dir.path().into(), Arc::new(MemorySecretStore::new())).unwrap();
    let provider = bridge
        .inner
        .storage
        .save(input(Some("fixture-old-key")))
        .unwrap();
    let mut edit = input(Some("fixture-rotated-key"));
    edit.id = Some(provider.id.clone());
    edit.base_url = "https://replacement.example.test/v1".into();
    bridge.inner.storage.save(edit.clone()).unwrap();

    let config = bridge.agent_configuration().await.unwrap();
    assert_eq!(config["providers"][0]["baseUrl"], edit.base_url);
    assert_eq!(config["providers"][0]["secret"], "fixture-rotated-key");

    edit.enabled = false;
    bridge.inner.storage.save(edit.clone()).unwrap();
    assert_eq!(
        bridge.agent_configuration().await.unwrap()["providers"],
        json!([])
    );

    edit.enabled = true;
    bridge.inner.storage.save(edit).unwrap();
    bridge.inner.storage.remove(&provider.id).unwrap();
    assert_eq!(
        bridge.agent_configuration().await.unwrap()["providers"],
        json!([])
    );
}
