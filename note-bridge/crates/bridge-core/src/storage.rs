//! 服务配置的事务协调及稳定公开入口。
//!
//! JSON 文档与秘密存储分别维护；本模块只协调跨两个存储的提交、回滚和一致读取。

mod config_file;
mod memory_secret_store;
mod native_secret_store;
mod secret_store;

pub use memory_secret_store::MemorySecretStore;
pub use native_secret_store::NativeSecretStore;
pub use secret_store::SecretStore;

use crate::model::{validate_id, validate_secret, AuthKind, Provider, ProviderInput};
use config_file::{validate_total_models, ConfigFile, MAX_PROVIDERS};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

/// 服务元数据与秘密存储的事务协调器。
///
/// 保存采用「新凭据 → 原子 JSON → 旧凭据清理」顺序；元数据提交失败时清理新条目。
/// 读写都持有同一配置锁，使并发请求观察到一致的端点和凭据引用。
pub struct Storage {
    data_dir: PathBuf,
    config: Mutex<ConfigFile>,
    secrets: Arc<dyn SecretStore>,
}

impl Storage {
    /// 使用当前平台的系统凭据库打开配置。
    pub fn new(data_dir: PathBuf) -> Result<Self, String> {
        Self::with_secrets(data_dir, Arc::new(NativeSecretStore))
    }

    /// 注入凭据端口，便于测试事务失败和平台实现，而不访问真实密钥。
    pub fn with_secrets(data_dir: PathBuf, secrets: Arc<dyn SecretStore>) -> Result<Self, String> {
        let config = ConfigFile::load(&data_dir)?;
        Ok(Self {
            data_dir,
            config: Mutex::new(config),
            secrets,
        })
    }

    /// 返回不含秘密值的配置副本。
    pub fn providers(&self) -> Vec<Provider> {
        self.config
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
            .providers
            .clone()
    }

    /// 校验并保存新建/编辑配置，省略 api_key 时保留现有凭据。
    ///
    /// 持有配置锁直至原子提交完成；暂存条目不改变正在使用的旧引用。
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
        // 先暂存全新凭据条目，再由 JSON 的原子替换一起提交端点与引用。
        // 即使中途崩溃，旧端点也不会错误地关联到轮换后的新密钥。
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
        if let Err(error) = next.write(&self.data_dir) {
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
        // 提交之后旧条目已经不可达。清理失败不能撤销已提交的端点/凭据组合。
        if let Some(reference) = obsolete {
            let _ = self.secrets.delete(&reference);
        }
        Ok(provider)
    }

    /// 删除元数据后清理对应凭据；清理失败时尝试恢复原配置。
    ///
    /// 如果恢复也失败，内存状态同步为已删除并返回明确提示，避免内存与磁盘分歧。
    pub fn remove(&self, id: &str) -> Result<(), String> {
        validate_id(id)?;
        let mut config = self.config.lock().map_err(|_| "配置存储不可用")?;
        if !config.providers.iter().any(|provider| provider.id == id) {
            return Err("配置不存在".into());
        }
        let mut next = config.clone();
        next.providers.retain(|provider| provider.id != id);
        let reference = next.credential_refs.remove(id);
        next.write(&self.data_dir)?;
        if let Some(reference) = reference {
            if let Err(error) = self.secrets.delete(&reference) {
                if config.write(&self.data_dir).is_err() {
                    *config = next;
                    return Err("配置已删除，但凭据库清理失败；请在系统凭据库中清理对应条目".into());
                }
                return Err(error);
            }
        }
        *config = next;
        Ok(())
    }

    /// 按服务 ID 读取对应秘密值，不允许直接传入任意凭据条目名称。
    pub fn secret(&self, id: &str) -> Result<Option<String>, String> {
        self.provider_with_secret(id).map(|(_, secret)| secret)
    }

    /// 在同一锁内读取端点与凭据，防止编辑期间分别查询而拼出不匹配的组合。
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

#[cfg(test)]
mod tests;
