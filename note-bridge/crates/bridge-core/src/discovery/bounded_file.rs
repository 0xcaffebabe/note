//! 发现适配器共享的只读文件边界；不会执行配置中的脚本或 helper。

use std::fs::{self, File};
use std::io::Read;
use std::path::{Path, PathBuf};

pub(super) const MAX_FILE_BYTES: u64 = 1_048_576;

/// 按显式路径、环境目录、默认路径的顺序解析；仅展开用户主目录前缀。
pub(super) fn resolve_dir(
    explicit: Option<String>,
    variable: &str,
    fallback: &str,
    home: Option<&Path>,
) -> Option<PathBuf> {
    match explicit.or_else(|| std::env::var(variable).ok()) {
        Some(value) if value == "~" => home.map(Path::to_path_buf),
        Some(value) if value.starts_with("~/") => home.map(|home| home.join(&value[2..])),
        Some(value) if !value.trim().is_empty() => Some(PathBuf::from(value)),
        _ => home.map(|home| home.join(fallback)),
    }
}

/// 只读取最大 1 MiB 的普通 UTF-8 文件；打开后再次限制实际读取量。
pub(super) fn read_bounded(path: &Path) -> Result<String, String> {
    let metadata =
        fs::metadata(path).map_err(|_| "无法读取配置文件；文件可能不存在或权限不足".to_string())?;
    if !metadata.is_file() || metadata.len() > MAX_FILE_BYTES {
        return Err("配置必须是大小不超过 1 MiB 的普通文件".into());
    }
    let mut text = String::new();
    File::open(path)
        .map_err(|_| "无法打开配置文件")?
        .take(MAX_FILE_BYTES + 1)
        .read_to_string(&mut text)
        .map_err(|_| "无法读取 UTF-8 配置文件")?;
    if text.len() as u64 > MAX_FILE_BYTES {
        return Err("配置文件超过 1 MiB".into());
    }
    Ok(text)
}
