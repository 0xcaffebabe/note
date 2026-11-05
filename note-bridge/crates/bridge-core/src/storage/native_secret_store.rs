use super::secret_store::SecretStore;
use crate::model::validate_id;
#[cfg(any(target_os = "macos", target_os = "windows"))]
use crate::model::validate_secret;

/// 系统凭据库适配器：macOS 使用 Keychain，Windows 使用系统凭据管理器。
///
/// 其他平台明确返回不支持；任何失败都不会降级为明文文件存储。
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
