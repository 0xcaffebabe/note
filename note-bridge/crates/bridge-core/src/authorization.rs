use rand::RngCore;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::HashSet,
    fs::{self, File, OpenOptions},
    io::{Read, Write},
    path::Path,
};

pub(crate) const MAX_AUTHORIZATIONS: usize = 32;
const MAX_FILE_BYTES: u64 = 64 * 1024;

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct Authorization {
    pub id: String,
    #[serde(rename = "exactOrigin")]
    pub origin: String,
    pub token_hash: String,
    pub created_at: u64,
    pub last_connected_at: u64,
}

#[derive(Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct AuthorizationFile {
    version: u8,
    authorizations: Vec<Authorization>,
}

pub(crate) fn new_token() -> String {
    let mut bytes = [0u8; 32];
    rand::rngs::OsRng.fill_bytes(&mut bytes);
    bytes.iter().map(|byte| format!("{byte:02x}")).collect()
}

pub(crate) fn hash_token(token: &str) -> Option<String> {
    if token.len() != 64 || !token.bytes().all(|byte| byte.is_ascii_hexdigit()) {
        return None;
    }
    Some(format!("{:x}", Sha256::digest(token.as_bytes())))
}

pub(crate) fn load(dir: &Path) -> Result<Vec<Authorization>, String> {
    let file = match File::open(dir.join("authorizations.json")) {
        Ok(file) => file,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(Vec::new()),
        Err(_) => return Err("无法读取网站授权".into()),
    };
    let mut bytes = Vec::new();
    file.take(MAX_FILE_BYTES + 1)
        .read_to_end(&mut bytes)
        .map_err(|_| "无法读取网站授权")?;
    if bytes.len() as u64 > MAX_FILE_BYTES {
        return Err("网站授权文件过大".into());
    }
    let saved: AuthorizationFile =
        serde_json::from_slice(&bytes).map_err(|_| "网站授权文件格式无效；请保留原文件后修复")?;
    if saved.version != 1 || saved.authorizations.len() > MAX_AUTHORIZATIONS {
        return Err("网站授权版本或数量不受支持".into());
    }
    let mut ids = HashSet::new();
    let mut hashes = HashSet::new();
    for grant in &saved.authorizations {
        if uuid::Uuid::parse_str(&grant.id).is_err()
            || !ids.insert(&grant.id)
            || !hashes.insert(&grant.token_hash)
            || hash_token(&grant.token_hash).is_none()
            || grant.created_at == 0
            || grant.last_connected_at < grant.created_at
            || super::validate_settings(19661, std::slice::from_ref(&grant.origin)).is_err()
        {
            return Err("网站授权记录无效；请保留原文件后修复".into());
        }
    }
    Ok(saved.authorizations)
}

/// Called while the runtime lock is held: disk and in-memory grants commit together.
pub(crate) fn save(dir: &Path, authorizations: &[Authorization]) -> Result<(), String> {
    let bytes = serde_json::to_vec_pretty(&AuthorizationFile {
        version: 1,
        authorizations: authorizations.to_vec(),
    })
    .map_err(|_| "无法序列化网站授权")?;
    if authorizations.len() > MAX_AUTHORIZATIONS || bytes.len() as u64 > MAX_FILE_BYTES {
        return Err("网站授权数量或大小达到上限".into());
    }
    let temporary = dir.join(format!(".authorizations-{}.tmp", uuid::Uuid::new_v4()));
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
            .map_err(|_| "无法创建网站授权文件")?;
        file.write_all(&bytes)
            .and_then(|_| file.sync_all())
            .map_err(|_| "无法保存网站授权")?;
        drop(file);
        fs::rename(&temporary, dir.join("authorizations.json")).map_err(|_| "无法更新网站授权")?;
        // Rename is the commit point. Never report a later fsync failure as a rollback.
        #[cfg(unix)]
        if let Ok(directory) = File::open(dir) {
            let _ = directory.sync_all();
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

    fn grant() -> Authorization {
        Authorization {
            id: uuid::Uuid::new_v4().to_string(),
            origin: "http://localhost:4391".into(),
            token_hash: hash_token(&new_token()).unwrap(),
            created_at: 1,
            last_connected_at: 1,
        }
    }

    #[test]
    fn committed_authorizations_have_private_permissions_and_survive_reopening() {
        let dir = tempfile::tempdir().unwrap();
        let original = grant();
        save(dir.path(), std::slice::from_ref(&original)).unwrap();
        let reopened = load(dir.path()).unwrap();
        assert_eq!(reopened[0].id, original.id);
        assert_eq!(reopened[0].token_hash, original.token_hash);
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let metadata = fs::metadata(dir.path().join("authorizations.json")).unwrap();
            assert_eq!(metadata.permissions().mode() & 0o777, 0o600);
        }
        save(dir.path(), &[]).unwrap();
        assert!(load(dir.path()).unwrap().is_empty());
    }

    #[test]
    fn corrupt_unknown_version_duplicate_and_invalid_origin_grants_fail_closed() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("authorizations.json");
        let original = grant();
        for bytes in [
            b"{invalid".to_vec(),
            serde_json::to_vec(&serde_json::json!({"version":2,"authorizations":[]})).unwrap(),
            serde_json::to_vec(&AuthorizationFile {
                version: 1,
                authorizations: vec![original.clone(), original.clone()],
            })
            .unwrap(),
            serde_json::to_vec(&AuthorizationFile {
                version: 1,
                authorizations: vec![Authorization {
                    origin: "http://localhost:4391/".into(),
                    ..original.clone()
                }],
            })
            .unwrap(),
        ] {
            fs::write(&path, &bytes).unwrap();
            assert!(load(dir.path()).is_err());
            assert_eq!(fs::read(&path).unwrap(), bytes);
        }
    }

    #[test]
    fn too_many_grants_are_rejected_on_save_and_load() {
        let dir = tempfile::tempdir().unwrap();
        let grants = (0..=MAX_AUTHORIZATIONS)
            .map(|_| grant())
            .collect::<Vec<_>>();
        assert!(save(dir.path(), &grants).is_err());
        assert!(!dir.path().join("authorizations.json").exists());
        fs::write(
            dir.path().join("authorizations.json"),
            serde_json::to_vec(&AuthorizationFile {
                version: 1,
                authorizations: grants,
            })
            .unwrap(),
        )
        .unwrap();
        assert!(load(dir.path()).is_err());
    }
}
