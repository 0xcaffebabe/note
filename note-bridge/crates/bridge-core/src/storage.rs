use crate::model::{
    validate_id, validate_secret, AuthKind, Provider, ProviderInput, MAX_MODELS_TOTAL,
};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::fs::{self, File, OpenOptions};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

const MAX_CONFIG_BYTES: u64 = 1_048_576;
const MAX_PROVIDERS: usize = 200;

pub trait SecretStore: Send + Sync {
    fn get(&self, id: &str) -> Result<Option<String>, String>;
    fn set(&self, id: &str, secret: &str) -> Result<(), String>;
    fn delete(&self, id: &str) -> Result<(), String>;
}

#[derive(Default)]
pub struct MemorySecretStore {
    values: Mutex<HashMap<String, String>>,
}

impl MemorySecretStore {
    pub fn new() -> Self {
        Self::default()
    }
}

impl SecretStore for MemorySecretStore {
    fn get(&self, id: &str) -> Result<Option<String>, String> {
        validate_id(id)?;
        Ok(self
            .values
            .lock()
            .map_err(|_| "凭据存储不可用")?
            .get(id)
            .cloned())
    }
    fn set(&self, id: &str, secret: &str) -> Result<(), String> {
        validate_id(id)?;
        validate_secret(secret)?;
        self.values
            .lock()
            .map_err(|_| "凭据存储不可用")?
            .insert(id.into(), secret.into());
        Ok(())
    }
    fn delete(&self, id: &str) -> Result<(), String> {
        validate_id(id)?;
        self.values.lock().map_err(|_| "凭据存储不可用")?.remove(id);
        Ok(())
    }
}

pub struct NativeSecretStore;

#[cfg(any(target_os = "macos", target_os = "windows"))]
impl NativeSecretStore {
    fn entry(id: &str) -> Result<keyring::Entry, String> {
        validate_id(id)?;
        keyring::Entry::new("com.0xcaffebabe.note-bridge", id)
            .map_err(|_| "无法访问系统凭据库；未保存明文凭据".into())
    }
}

#[cfg(any(target_os = "macos", target_os = "windows"))]
impl SecretStore for NativeSecretStore {
    fn get(&self, id: &str) -> Result<Option<String>, String> {
        match Self::entry(id)?.get_password() {
            Ok(value) => Ok(Some(value)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(_) => Err("读取系统凭据库失败；请检查凭据库权限".into()),
        }
    }
    fn set(&self, id: &str, secret: &str) -> Result<(), String> {
        validate_secret(secret)?;
        Self::entry(id)?
            .set_password(secret)
            .map_err(|_| "写入系统凭据库失败；未保存明文凭据".into())
    }
    fn delete(&self, id: &str) -> Result<(), String> {
        match Self::entry(id)?.delete_credential() {
            Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(_) => Err("删除系统凭据失败；请检查凭据库权限".into()),
        }
    }
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
impl SecretStore for NativeSecretStore {
    fn get(&self, id: &str) -> Result<Option<String>, String> {
        validate_id(id)?;
        Err("当前平台不支持系统凭据库；不会使用明文存储".into())
    }
    fn set(&self, id: &str, _secret: &str) -> Result<(), String> {
        validate_id(id)?;
        Err("当前平台不支持系统凭据库；不会使用明文存储".into())
    }
    fn delete(&self, id: &str) -> Result<(), String> {
        validate_id(id)?;
        Err("当前平台不支持系统凭据库；不会使用明文存储".into())
    }
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct ConfigFile {
    version: u32,
    providers: Vec<Provider>,
    #[serde(default)]
    credential_refs: HashMap<String, String>,
}

pub struct Storage {
    data_dir: PathBuf,
    config: Mutex<ConfigFile>,
    secrets: Arc<dyn SecretStore>,
}

impl Storage {
    pub fn new(data_dir: PathBuf) -> Result<Self, String> {
        Self::with_secrets(data_dir, Arc::new(NativeSecretStore))
    }

    pub fn with_secrets(data_dir: PathBuf, secrets: Arc<dyn SecretStore>) -> Result<Self, String> {
        fs::create_dir_all(&data_dir).map_err(|_| "无法创建应用配置目录".to_string())?;
        let path = data_dir.join("providers.json");
        let config = match File::open(&path) {
            Ok(file) => {
                let mut bytes = Vec::new();
                file.take(MAX_CONFIG_BYTES + 1)
                    .read_to_end(&mut bytes)
                    .map_err(|_| "无法读取应用配置".to_string())?;
                if bytes.len() as u64 > MAX_CONFIG_BYTES {
                    return Err("应用配置过大".into());
                }
                let config: ConfigFile = serde_json::from_slice(&bytes)
                    .map_err(|_| "应用配置格式无效；请保留原文件后修复".to_string())?;
                if config.version != 1 || config.providers.len() > MAX_PROVIDERS {
                    return Err("应用配置版本或配置数量不受支持".into());
                }
                validate_total_models(&config.providers)?;
                let mut ids = HashSet::new();
                let mut credential_ids = HashSet::new();
                for provider in &config.providers {
                    provider.validate()?;
                    if !ids.insert(provider.id.clone()) {
                        return Err("应用配置包含重复 ID".into());
                    }
                    match (provider.auth_kind, config.credential_refs.get(&provider.id)) {
                        (AuthKind::None, None) => {}
                        (AuthKind::None, Some(_)) | (_, None) => {
                            return Err("应用配置的凭据引用无效".into())
                        }
                        (_, Some(reference)) => {
                            validate_id(reference)?;
                            if !credential_ids.insert(reference.clone()) {
                                return Err("应用配置包含重复凭据引用".into());
                            }
                        }
                    }
                }
                if config.credential_refs.keys().any(|id| !ids.contains(id)) {
                    return Err("应用配置包含未知凭据引用".into());
                }
                config
            }
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => ConfigFile {
                version: 1,
                providers: Vec::new(),
                credential_refs: HashMap::new(),
            },
            Err(_) => return Err("无法读取应用配置".into()),
        };
        Ok(Self {
            data_dir,
            config: Mutex::new(config),
            secrets,
        })
    }

    pub fn providers(&self) -> Vec<Provider> {
        self.config
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
            .providers
            .clone()
    }

    pub fn save(&self, input: ProviderInput) -> Result<Provider, String> {
        input.validate()?;
        let mut config = self.config.lock().map_err(|_| "配置存储不可用")?;
        let id = input
            .id
            .clone()
            .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
        let existing = config
            .providers
            .iter()
            .position(|provider| provider.id == id);
        if input.id.is_some() && existing.is_none() {
            return Err("待更新的配置不存在".into());
        }
        if existing.is_none() && config.providers.len() >= MAX_PROVIDERS {
            return Err("已达到配置数量上限".into());
        }
        let old_reference = config.credential_refs.get(&id).cloned();
        let old_secret = match &old_reference {
            Some(reference) => self.secrets.get(reference)?,
            None => None,
        };
        let new_secret = match input.auth_kind {
            AuthKind::None => None,
            _ => Some(
                input
                    .api_key
                    .or_else(|| old_secret.clone())
                    .ok_or("请填写 API 凭据")?,
            ),
        };
        if let Some(secret) = &new_secret {
            validate_secret(secret)?;
        }
        let provider = Provider {
            id: id.clone(),
            name: input.name,
            protocol: input.protocol,
            base_url: input.base_url,
            model: input.model,
            models: input.models,
            auth_kind: input.auth_kind,
            enabled: input.enabled,
            source: input.source,
        };
        let mut next = config.clone();
        match existing {
            Some(index) => next.providers[index] = provider.clone(),
            None => next.providers.push(provider.clone()),
        }
        validate_total_models(&next.providers)?;
        // Every changed credential gets a new keyring entry. The atomic JSON
        // replacement commits the endpoint and its reference together, so even a
        // process crash cannot pair an old URL with a newly replaced credential.
        let mut staged_reference = None;
        if new_secret.is_none() {
            next.credential_refs.remove(&id);
        } else if old_secret != new_secret {
            match new_secret {
                Some(secret) => {
                    let reference = uuid::Uuid::new_v4().to_string();
                    self.secrets.set(&reference, &secret)?;
                    next.credential_refs.insert(id.clone(), reference.clone());
                    staged_reference = Some(reference);
                }
                None => {
                    next.credential_refs.remove(&id);
                }
            }
        }
        if let Err(error) = write_config(&self.data_dir, &next) {
            if let Some(reference) = staged_reference {
                if self.secrets.delete(&reference).is_err() {
                    return Err(format!("{error}；临时凭据清理失败，原配置和原凭据已保留"));
                }
            }
            return Err(error);
        }
        let obsolete =
            old_reference.filter(|reference| next.credential_refs.get(&id) != Some(reference));
        *config = next;
        // An obsolete entry is no longer reachable by any provider. Cleanup is
        // best effort after commit; a locked keyring must not undo the new pair.
        if let Some(reference) = obsolete {
            let _ = self.secrets.delete(&reference);
        }
        Ok(provider)
    }

    pub fn remove(&self, id: &str) -> Result<(), String> {
        validate_id(id)?;
        let mut config = self.config.lock().map_err(|_| "配置存储不可用")?;
        if !config.providers.iter().any(|provider| provider.id == id) {
            return Err("配置不存在".into());
        }
        let mut next = config.clone();
        next.providers.retain(|provider| provider.id != id);
        let reference = next.credential_refs.remove(id);
        write_config(&self.data_dir, &next)?;
        if let Some(reference) = reference {
            if let Err(error) = self.secrets.delete(&reference) {
                if write_config(&self.data_dir, &config).is_err() {
                    *config = next;
                    return Err("配置已删除，但凭据库清理失败；请在系统凭据库中清理对应条目".into());
                }
                return Err(error);
            }
        }
        *config = next;
        Ok(())
    }

    pub fn secret(&self, id: &str) -> Result<Option<String>, String> {
        self.provider_with_secret(id).map(|(_, secret)| secret)
    }

    /// Endpoint metadata and credentials must be fetched under one lock. Joining
    /// providers() and secret() across an edit could otherwise mismatch them.
    pub fn provider_with_secret(&self, id: &str) -> Result<(Provider, Option<String>), String> {
        validate_id(id)?;
        let config = self.config.lock().map_err(|_| "配置存储不可用")?;
        let provider = config
            .providers
            .iter()
            .find(|provider| provider.id == id)
            .ok_or("配置不存在")?;
        let secret = match config.credential_refs.get(id) {
            Some(reference) => self.secrets.get(reference)?,
            None => None,
        };
        Ok((provider.clone(), secret))
    }
}

fn validate_total_models(providers: &[Provider]) -> Result<(), String> {
    if providers
        .iter()
        .map(|provider| provider.models.len().max(1))
        .sum::<usize>()
        > MAX_MODELS_TOTAL
    {
        return Err("所有服务合计最多配置 400 个模型".into());
    }
    Ok(())
}

fn write_config(data_dir: &Path, config: &ConfigFile) -> Result<(), String> {
    let bytes = serde_json::to_vec_pretty(config).map_err(|_| "无法序列化配置".to_string())?;
    if bytes.len() as u64 > MAX_CONFIG_BYTES {
        return Err("应用配置过大".into());
    }
    let temporary = data_dir.join(format!(".providers-{}.tmp", uuid::Uuid::new_v4()));
    let result = (|| {
        let mut options = OpenOptions::new();
        options.write(true).create_new(true);
        #[cfg(unix)]
        {
            use std::os::unix::fs::OpenOptionsExt;
            options.mode(0o600);
        }
        let mut file = options
            .open(&temporary)
            .map_err(|_| "无法创建临时配置文件".to_string())?;
        file.write_all(&bytes)
            .and_then(|_| file.sync_all())
            .map_err(|_| "无法写入应用配置".to_string())?;
        drop(file);
        fs::rename(&temporary, data_dir.join("providers.json"))
            .map_err(|_| "无法原子替换应用配置".to_string())?;
        // Rename commits the pair. Never roll it back after a directory fsync
        // failure because the new configuration may already be durable.
        #[cfg(unix)]
        {
            if let Ok(directory) = File::open(data_dir) {
                let _ = directory.sync_all();
            }
        }
        Ok(())
    })();
    if result.is_err() {
        let _ = fs::remove_file(temporary);
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::Protocol;

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
        assert!(secrets.values.lock().unwrap().is_empty());
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
        assert_eq!(secrets.values.lock().unwrap().len(), 1);
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
    fn disabling_auth_removes_even_an_already_missing_credential_reference() {
        let dir = tempfile::tempdir().unwrap();
        let secrets = Arc::new(MemorySecretStore::new());
        let store = Storage::with_secrets(dir.path().into(), secrets.clone()).unwrap();
        let provider = store.save(input(Some("fixture-key"))).unwrap();
        secrets.values.lock().unwrap().clear();
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
        assert!(
            Storage::with_secrets(dir.path().into(), Arc::new(MemorySecretStore::new())).is_err()
        );
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
}
