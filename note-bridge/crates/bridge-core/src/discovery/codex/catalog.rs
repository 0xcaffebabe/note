//! Codex 显式模型目录与当前模型的合并。

use super::super::bounded_file::read_bounded;
use super::super::candidate::digest;
use super::super::contracts::DiscoveredProvider;
use crate::model::{ModelOption, MAX_MODELS_PER_PROVIDER};
use std::path::{Path, PathBuf};

/// 只载入显式配置的模型目录，并把目录原文纳入导入指纹。
/// 全局 models_cache.json 无法证明服务来源，因此不参与发现。
pub(super) fn load_codex_catalog(
    config: &toml::Value,
    source: &str,
    result: &mut DiscoveredProvider,
) -> Result<(), String> {
    // models_cache.json cannot prove provider/account provenance. Only an
    // explicitly configured catalogue belongs to this provider snapshot.
    if let Some(catalog) = config.get("model_catalog_json") {
        let catalog = catalog
            .as_str()
            .filter(|path| !path.trim().is_empty())
            .ok_or("model_catalog_json 必须为非空文件路径")?;
        let path = if let Some(relative) = catalog.strip_prefix("~/") {
            dirs::home_dir()
                .ok_or("无法解析模型目录的用户路径")?
                .join(relative)
        } else {
            let path = PathBuf::from(catalog);
            if path.is_absolute() {
                path
            } else {
                Path::new(source.split("#profiles.").next().unwrap_or(source))
                    .parent()
                    .unwrap_or_else(|| Path::new("."))
                    .join(path)
            }
        };
        let raw = read_bounded(&path).map_err(|_| {
            "无法读取显式 model_catalog_json；文件必须为不超过 1 MiB 的 UTF-8 JSON".to_string()
        })?;
        result.catalog_fingerprint = digest(&[&path.to_string_lossy(), &raw]);
        let value: serde_json::Value =
            serde_json::from_str(&raw).map_err(|_| "Codex 模型目录不是有效 JSON")?;
        let rows = value
            .get("models")
            .and_then(serde_json::Value::as_array)
            .ok_or("Codex 模型目录必须包含 models 数组")?;
        if rows.len() > MAX_MODELS_PER_PROVIDER {
            return Err("Codex 模型目录超过 200 个条目".into());
        }
        if rows.iter().any(|row| {
            row.get("supported_in_api") == Some(&serde_json::Value::Bool(false))
                && row
                    .get("slug")
                    .or_else(|| row.get("id"))
                    .and_then(serde_json::Value::as_str)
                    .is_some_and(|id| id.trim() == result.model)
        }) {
            return Err("当前模型在显式目录中标记为不支持 API，不能用于 note-bridge 直连".into());
        }
        result.models = crate::model_catalog::parse_models(&value)?;
    }
    if result.model.is_empty() {
        result.model = result
            .models
            .first()
            .map(|model| model.id.clone())
            .unwrap_or_default();
    } else if !result.models.iter().any(|model| model.id == result.model) {
        if result.models.len() >= MAX_MODELS_PER_PROVIDER {
            return Err("模型目录及当前模型合计超过 200 个".into());
        }
        result
            .models
            .push(ModelOption::configured(result.model.clone()));
    }
    Ok(())
}
