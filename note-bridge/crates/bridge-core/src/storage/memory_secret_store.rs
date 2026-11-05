use super::secret_store::SecretStore;
use crate::model::{validate_id, validate_secret};
use std::collections::HashMap;
use std::sync::Mutex;

/// 内存凭据实现，供测试和不接触系统凭据库的受控运行环境使用。
#[derive(Default)]
pub struct MemorySecretStore {
    values: Mutex<HashMap<String, String>>,
}

impl MemorySecretStore {
    /// 创建独立的空凭据库，不读取任何系统或环境凭据。
    pub fn new() -> Self {
        Self::default()
    }

    #[cfg(test)]
    pub(super) fn entry_count(&self) -> usize {
        self.values.lock().unwrap().len()
    }

    #[cfg(test)]
    pub(super) fn clear(&self) {
        self.values.lock().unwrap().clear();
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
