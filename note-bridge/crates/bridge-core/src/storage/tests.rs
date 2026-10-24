use super::*;
use crate::model::Protocol;
use std::fs;

fn input(secret: Option<&str>) -> ProviderInput {
    ProviderInput {
        id: None,
        name: "Fixture provider".into(),
        protocol: Protocol::Responses,
        base_url: "https://api.example.test/v1".into(),
        model: "fixture-model".into(),
        models: Vec::new(),
        auth_kind: AuthKind::Bearer,
        enabled: true,
        api_key: secret.map(String::from),
        source: None,
    }
}

#[test]
fn model_catalog_round_trips_and_rejects_duplicate_missing_default_and_total_overflow() {
    use crate::model::ModelOption;
    let dir = tempfile::tempdir().unwrap();
    let secrets = Arc::new(MemorySecretStore::new());
    let store = Storage::with_secrets(dir.path().into(), secrets.clone()).unwrap();
    let mut provider = input(Some("fixture-key"));
    provider.models = vec![
        ModelOption::configured("fixture-model"),
        ModelOption::configured("vendor/alias"),
    ];
    provider.models[0].context_window_tokens = Some(200_000);
    provider.models[0].max_output_tokens = Some(32_768);
    let saved = store.save(provider.clone()).unwrap();
    let reopened = Storage::with_secrets(dir.path().into(), secrets).unwrap();
    assert_eq!(reopened.providers()[0].models, saved.models);
    provider
        .models
        .push(ModelOption::configured("fixture-model"));
    assert!(store.save(provider.clone()).unwrap_err().contains("重复"));
    provider.models = vec![ModelOption::configured("another")];
    assert!(store
        .save(provider.clone())
        .unwrap_err()
        .contains("默认模型"));
    provider.models = (0..200)
        .map(|n| ModelOption::configured(format!("vendor-{n}")))
        .collect();
    provider.model = "vendor-0".into();
    store.save(provider.clone()).unwrap();
    assert!(store.save(provider).unwrap_err().contains("400"));
    assert_eq!(store.providers().len(), 2);
}

#[test]
fn metadata_persists_without_secrets_and_updates_preserve_credentials() {
    let dir = tempfile::tempdir().unwrap();
    let secrets = Arc::new(MemorySecretStore::new());
    let store = Storage::with_secrets(dir.path().into(), secrets.clone()).unwrap();
    let provider = store.save(input(Some("fixture-key-never-real"))).unwrap();
    let mut update = input(None);
    update.id = Some(provider.id.clone());
    update.name = "Renamed".into();
    store.save(update).unwrap();
    assert_eq!(
        store.secret(&provider.id).unwrap().as_deref(),
        Some("fixture-key-never-real")
    );
    let serialized = fs::read_to_string(dir.path().join("providers.json")).unwrap();
    assert!(!serialized.contains("fixture-key"));
    assert!(!serialized.contains("apiKey"));
    let reopened = Storage::with_secrets(dir.path().into(), secrets.clone()).unwrap();
    assert_eq!(reopened.providers()[0].name, "Renamed");
    reopened.remove(&provider.id).unwrap();
    assert!(reopened.providers().is_empty());
    assert_eq!(secrets.entry_count(), 0);
}

#[test]
fn failed_metadata_write_rolls_credentials_back() {
    let dir = tempfile::tempdir().unwrap();
    let secrets = Arc::new(MemorySecretStore::new());
    let store = Storage::with_secrets(dir.path().into(), secrets.clone()).unwrap();
    let provider = store.save(input(Some("fixture-old-key"))).unwrap();
    fs::remove_file(dir.path().join("providers.json")).unwrap();
    fs::create_dir(dir.path().join("providers.json")).unwrap();
    let mut update = input(Some("fixture-new-key"));
    update.id = Some(provider.id.clone());
    assert!(store.save(update).is_err());
    assert_eq!(
        store.secret(&provider.id).unwrap().as_deref(),
        Some("fixture-old-key")
    );
    assert_eq!(store.providers(), vec![provider]);
    assert_eq!(secrets.entry_count(), 1);
}

#[test]
fn credential_rotation_commits_a_new_reference_with_its_endpoint() {
    let dir = tempfile::tempdir().unwrap();
    let secrets = Arc::new(MemorySecretStore::new());
    let store = Storage::with_secrets(dir.path().into(), secrets.clone()).unwrap();
    let provider = store.save(input(Some("fixture-old-key"))).unwrap();
    let before: ConfigFile =
        serde_json::from_slice(&fs::read(dir.path().join("providers.json")).unwrap()).unwrap();
    let old_reference = before.credential_refs[&provider.id].clone();
    assert_ne!(old_reference, provider.id);
    let mut update = input(Some("fixture-rotated-key"));
    update.id = Some(provider.id.clone());
    update.base_url = "https://replacement.example.test/v1".into();
    store.save(update).unwrap();
    let after: ConfigFile =
        serde_json::from_slice(&fs::read(dir.path().join("providers.json")).unwrap()).unwrap();
    assert_ne!(after.credential_refs[&provider.id], old_reference);
    assert!(secrets.get(&old_reference).unwrap().is_none());
    let reopened = Storage::with_secrets(dir.path().into(), secrets).unwrap();
    let (saved, credential) = reopened.provider_with_secret(&provider.id).unwrap();
    assert_eq!(saved.base_url, "https://replacement.example.test/v1");
    assert_eq!(credential.as_deref(), Some("fixture-rotated-key"));
}

#[test]
fn enabled_provider_snapshot_holds_the_config_lock_during_credential_reads() {
    use std::sync::mpsc;

    struct PausedReadStore {
        values: MemorySecretStore,
        pause: Mutex<Option<(mpsc::Sender<()>, mpsc::Receiver<()>)>>,
    }
    impl SecretStore for PausedReadStore {
        fn get(&self, id: &str) -> Result<Option<String>, String> {
            let pause = self.pause.lock().unwrap().take();
            if let Some((started, resume)) = pause {
                started.send(()).unwrap();
                resume
                    .recv_timeout(std::time::Duration::from_secs(5))
                    .unwrap();
            }
            self.values.get(id)
        }

        fn set(&self, id: &str, secret: &str) -> Result<(), String> {
            self.values.set(id, secret)
        }

        fn delete(&self, id: &str) -> Result<(), String> {
            self.values.delete(id)
        }
    }

    let dir = tempfile::tempdir().unwrap();
    let secrets = Arc::new(PausedReadStore {
        values: MemorySecretStore::new(),
        pause: Mutex::new(None),
    });
    let store = Arc::new(Storage::with_secrets(dir.path().into(), secrets.clone()).unwrap());
    let provider = store.save(input(Some("fixture-old-key"))).unwrap();
    let (started, reading) = mpsc::channel();
    let (resume, paused) = mpsc::channel();
    *secrets.pause.lock().unwrap() = Some((started, paused));
    let reader = {
        let store = store.clone();
        std::thread::spawn(move || store.enabled_providers_with_secrets().unwrap())
    };
    reading
        .recv_timeout(std::time::Duration::from_secs(5))
        .unwrap();
    assert!(store.config.try_lock().is_err());

    let mut update = input(Some("fixture-rotated-key"));
    update.id = Some(provider.id.clone());
    update.base_url = "https://replacement.example.test/v1".into();
    let writer = {
        let store = store.clone();
        std::thread::spawn(move || store.save(update).unwrap())
    };
    resume.send(()).unwrap();
    assert_eq!(
        reader.join().unwrap(),
        vec![(provider, Some("fixture-old-key".into()))]
    );
    let saved = writer.join().unwrap();
    assert_eq!(
        store.enabled_providers_with_secrets().unwrap(),
        vec![(saved, Some("fixture-rotated-key".into()))]
    );
}

#[test]
fn disabling_auth_removes_even_an_already_missing_credential_reference() {
    let dir = tempfile::tempdir().unwrap();
    let secrets = Arc::new(MemorySecretStore::new());
    let store = Storage::with_secrets(dir.path().into(), secrets.clone()).unwrap();
    let provider = store.save(input(Some("fixture-key"))).unwrap();
    secrets.clear();
    let mut update = input(None);
    update.id = Some(provider.id);
    update.auth_kind = AuthKind::None;
    store.save(update).unwrap();
    assert!(Storage::with_secrets(dir.path().into(), secrets).is_ok());
}

#[test]
fn failed_remove_retains_provider_and_credential() {
    let dir = tempfile::tempdir().unwrap();
    let secrets = Arc::new(MemorySecretStore::new());
    let store = Storage::with_secrets(dir.path().into(), secrets.clone()).unwrap();
    let provider = store.save(input(Some("fixture-retained-key"))).unwrap();
    fs::remove_file(dir.path().join("providers.json")).unwrap();
    fs::create_dir(dir.path().join("providers.json")).unwrap();
    assert!(store.remove(&provider.id).is_err());
    assert_eq!(store.providers(), vec![provider.clone()]);
    assert_eq!(
        store.secret(&provider.id).unwrap().as_deref(),
        Some("fixture-retained-key")
    );
}

#[test]
fn corrupt_config_is_not_silently_overwritten() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("providers.json");
    fs::write(&path, "{invalid fixture config").unwrap();
    assert!(Storage::with_secrets(dir.path().into(), Arc::new(MemorySecretStore::new())).is_err());
    assert_eq!(fs::read_to_string(path).unwrap(), "{invalid fixture config");
}

#[test]
fn secret_store_failure_does_not_write_metadata() {
    struct Unavailable;
    impl SecretStore for Unavailable {
        fn get(&self, _: &str) -> Result<Option<String>, String> {
            Err("unavailable".into())
        }
        fn set(&self, _: &str, _: &str) -> Result<(), String> {
            Err("unavailable".into())
        }
        fn delete(&self, _: &str) -> Result<(), String> {
            Err("unavailable".into())
        }
    }
    let dir = tempfile::tempdir().unwrap();
    let store = Storage::with_secrets(dir.path().into(), Arc::new(Unavailable)).unwrap();
    assert!(store.save(input(Some("fixture-key"))).is_err());
    assert!(store.providers().is_empty());
    assert!(!dir.path().join("providers.json").exists());
}

/// 模拟系统凭据库可读写但拒绝删除，覆盖跨 JSON/凭据库提交后的失败路径。
#[derive(Default)]
struct DeleteUnavailableStore {
    values: MemorySecretStore,
}

impl SecretStore for DeleteUnavailableStore {
    fn get(&self, id: &str) -> Result<Option<String>, String> {
        self.values.get(id)
    }

    fn set(&self, id: &str, secret: &str) -> Result<(), String> {
        self.values.set(id, secret)
    }

    fn delete(&self, _id: &str) -> Result<(), String> {
        Err("fixture credential deletion unavailable".into())
    }
}

#[test]
fn failed_credential_delete_restores_provider_on_disk_and_in_memory() {
    let dir = tempfile::tempdir().unwrap();
    let secrets = Arc::new(DeleteUnavailableStore::default());
    let store = Storage::with_secrets(dir.path().into(), secrets.clone()).unwrap();
    let provider = store.save(input(Some("fixture-retained-key"))).unwrap();
    let before = fs::read(dir.path().join("providers.json")).unwrap();

    assert!(store.remove(&provider.id).is_err());

    assert_eq!(store.providers(), vec![provider.clone()]);
    assert_eq!(fs::read(dir.path().join("providers.json")).unwrap(), before);
    let reopened = Storage::with_secrets(dir.path().into(), secrets).unwrap();
    assert_eq!(
        reopened.provider_with_secret(&provider.id).unwrap(),
        (provider, Some("fixture-retained-key".into()))
    );
}

#[test]
fn obsolete_credential_cleanup_failure_does_not_undo_committed_rotation() {
    let dir = tempfile::tempdir().unwrap();
    let secrets = Arc::new(DeleteUnavailableStore::default());
    let store = Storage::with_secrets(dir.path().into(), secrets.clone()).unwrap();
    let provider = store.save(input(Some("fixture-old-key"))).unwrap();
    let mut update = input(Some("fixture-rotated-key"));
    update.id = Some(provider.id.clone());
    update.base_url = "https://replacement.example.test/v1".into();

    let saved = store.save(update).unwrap();

    let reopened = Storage::with_secrets(dir.path().into(), secrets.clone()).unwrap();
    assert_eq!(
        reopened.provider_with_secret(&provider.id).unwrap(),
        (saved, Some("fixture-rotated-key".into()))
    );
    assert_eq!(secrets.values.entry_count(), 2);
}
