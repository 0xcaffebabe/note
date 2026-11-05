//! 连接配置的持久化与校验；只接受精确 Origin。
use serde::{Deserialize, Serialize};
use std::{fs, path::Path};

/// 原生监听配置，与模型端点配置及网站持久授权分别保存。
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct Settings {
    pub(super) port: u16,
    pub(super) allowed_origins: Vec<String>,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            port: 19661,
            allowed_origins: [
                "https://note.ismy.wang",
                "https://b.ismy.wang",
                "https://notec.ismy.wang",
                "https://notev.ismy.wang",
                "http://localhost:3000",
                "http://localhost:5173",
                "http://localhost:4391",
                "http://127.0.0.1:4391",
            ]
            .into_iter()
            .map(String::from)
            .collect(),
        }
    }
}

pub(super) fn validate_settings(port: u16, origins: &[String]) -> Result<(), String> {
    if port < 1024 {
        return Err("请选择 1024–65535 的端口".into());
    }
    if origins.is_empty() || origins.len() > 20 {
        return Err("请设置 1 到 20 个允许的网站来源".into());
    }
    for origin in origins {
        crate::origin::validate(origin)?;
    }
    Ok(())
}

/// 启动时读取并校验配置；文件缺失使用默认值，损坏配置不会静默覆盖。
pub(super) fn load_settings(dir: &Path) -> Result<Settings, String> {
    let settings = match fs::read(dir.join("settings.json")) {
        Ok(bytes) if bytes.len() < 65536 => {
            serde_json::from_slice::<Settings>(&bytes).map_err(|_| "连接配置格式无效")?
        }
        Ok(_) => return Err("连接配置过大".into()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Settings::default(),
        Err(_) => return Err("无法读取连接配置".into()),
    };
    validate_settings(settings.port, &settings.allowed_origins)?;
    Ok(settings)
}

pub(super) fn save_settings(dir: &std::path::Path, settings: &Settings) -> Result<(), String> {
    let bytes = serde_json::to_vec_pretty(settings).map_err(|_| "无法序列化连接设置")?;
    let temp = dir.join("settings.json.tmp");
    fs::write(&temp, bytes).map_err(|_| "无法保存连接设置")?;
    fs::rename(temp, dir.join("settings.json")).map_err(|_| "无法更新连接设置".into())
}
