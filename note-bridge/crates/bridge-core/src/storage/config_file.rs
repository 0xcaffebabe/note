//! 非秘密配置文档的边界：严格校验、有限读取与原子替换。

use crate::model::{validate_id, AuthKind, Provider, MAX_MODELS_TOTAL};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::fs::{self, File, OpenOptions};
use std::io::{Read, Write};
use std::path::Path;

const MAX_CONFIG_BYTES: u64 = 1_048_576;
pub(super) const MAX_PROVIDERS: usize = 200;

/// 磁盘配置只包含服务元数据和随机凭据引用，不序列化秘密值。
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(super) struct ConfigFile {
    version: u32,
    pub providers: Vec<Provider>,
    #[serde(default)]
    pub credential_refs: HashMap<String, String>,
}

impl Default for ConfigFile {
    fn default() -> Self {
        Self {
            version: 1,
            providers: Vec::new(),
            credential_refs: HashMap::new(),
        }
    }
}

impl ConfigFile {
    /// 首次运行返回空配置；损坏、超限或版本不兼容时保留原文件并返回错误。
    pub fn load(data_dir: &Path) -> Result<Self, String> {
        fs::create_dir_all(data_dir).map_err(|_| "无法创建应用配置目录".to_string())?;
        let file = match File::open(data_dir.join("providers.json")) {
            Ok(file) => file,
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                return Ok(Self::default());
            }
            Err(_) => return Err("无法读取应用配置".into()),
        };
        let mut bytes = Vec::new();
        file.take(MAX_CONFIG_BYTES + 1)
            .read_to_end(&mut bytes)
            .map_err(|_| "无法读取应用配置".to_string())?;
        if bytes.len() as u64 > MAX_CONFIG_BYTES {
            return Err("应用配置过大".into());
        }
        let config: Self = serde_json::from_slice(&bytes)
            .map_err(|_| "应用配置格式无效；请保留原文件后修复".to_string())?;
        config.validate()?;
        Ok(config)
    }

    /// 所有服务与凭据引用必须一一对应；同一凭据不能由多个服务共享。
    fn validate(&self) -> Result<(), String> {
        if self.version != 1 || self.providers.len() > MAX_PROVIDERS {
            return Err("应用配置版本或配置数量不受支持".into());
        }
        validate_total_models(&self.providers)?;
        let mut ids = HashSet::new();
        let mut credential_ids = HashSet::new();
        for provider in &self.providers {
            provider.validate()?;
            if !ids.insert(provider.id.clone()) {
                return Err("应用配置包含重复 ID".into());
            }
            match (provider.auth_kind, self.credential_refs.get(&provider.id)) {
                (AuthKind::None, None) => {}
                (AuthKind::None, Some(_)) | (_, None) => {
                    return Err("应用配置的凭据引用无效".into());
                }
                (_, Some(reference)) => {
                    validate_id(reference)?;
                    if !credential_ids.insert(reference.clone()) {
                        return Err("应用配置包含重复凭据引用".into());
                    }
                }
            }
        }
        if self.credential_refs.keys().any(|id| !ids.contains(id)) {
            return Err("应用配置包含未知凭据引用".into());
        }
        Ok(())
    }

    /// 写入私有临时文件并原子替换 JSON；返回成功表示端点与凭据引用已一起提交。
    ///
    /// rename 之后即使目录 fsync 失败也不回滚，因为新配置此时可能已经持久化。
    pub fn write(&self, data_dir: &Path) -> Result<(), String> {
        let bytes = serde_json::to_vec_pretty(self).map_err(|_| "无法序列化配置".to_string())?;
        if bytes.len() as u64 > MAX_CONFIG_BYTES {
            return Err("应用配置过大".into());
        }
        let temporary = data_dir.join(format!(".providers-{}.tmp", uuid::Uuid::new_v4()));
        let result = write_and_replace(data_dir, &temporary, &bytes);
        if result.is_err() {
            let _ = fs::remove_file(temporary);
        }
        result
    }
}

/// 所有服务合计的模型数量有界；未提供列表的服务计作一个模型。
pub(super) fn validate_total_models(providers: &[Provider]) -> Result<(), String> {
    let count = providers
        .iter()
        .map(|provider| provider.models.len().max(1))
        .sum::<usize>();
    if count > MAX_MODELS_TOTAL {
        return Err("所有服务合计最多配置 400 个模型".into());
    }
    Ok(())
}

fn write_and_replace(data_dir: &Path, temporary: &Path, bytes: &[u8]) -> Result<(), String> {
    let mut options = OpenOptions::new();
    options.write(true).create_new(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    let mut file = options
        .open(temporary)
        .map_err(|_| "无法创建临时配置文件".to_string())?;
    file.write_all(bytes)
        .and_then(|_| file.sync_all())
        .map_err(|_| "无法写入应用配置".to_string())?;
    drop(file);
    fs::rename(temporary, data_dir.join("providers.json"))
        .map_err(|_| "无法原子替换应用配置".to_string())?;
    #[cfg(unix)]
    {
        if let Ok(directory) = File::open(data_dir) {
            let _ = directory.sync_all();
        }
    }
    Ok(())
}
