//! 本地 CLI 配置发现的公共入口。
//!
//! 配置数据、文件读取、Claude/Codex 适配器各自维护边界；导入前重新扫描并核对
//! 指纹，防止过期 UI 选择把变化后的端点或凭据静默导入。

mod bounded_file;
mod candidate;
mod claude;
mod claude_models;
mod codex;
mod contracts;

pub use claude::parse_claude_settings;
pub use contracts::{DiscoveredProvider, DiscoveryPaths, DiscoveryStatus};

use crate::model::{Protocol, ProviderInput};
use bounded_file::{read_bounded, resolve_dir};
use candidate::failure;
use codex::discover_codex;

/// 显式、只读地扫描 CLI 配置；不会执行 helper、hook 或 shell 命令。
pub fn discover(paths: DiscoveryPaths) -> Vec<DiscoveredProvider> {
    let home = dirs::home_dir();
    let claude = resolve_dir(
        paths.claude_dir,
        "CLAUDE_CONFIG_DIR",
        ".claude",
        home.as_deref(),
    );
    let codex = resolve_dir(paths.codex_dir, "CODEX_HOME", ".codex", home.as_deref());
    let mut candidates = Vec::new();
    if let Some(directory) = claude {
        let path = directory.join("settings.json");
        let source = path.to_string_lossy();
        match read_bounded(&path) {
            Ok(settings) => candidates.push(parse_claude_settings(&settings, &source)),
            Err(message) => candidates.push(failure(
                "Claude Code",
                Protocol::Anthropic,
                &source,
                &message,
                "",
            )),
        }
    }
    if let Some(directory) = codex {
        candidates.extend(discover_codex(&directory, &|key| std::env::var(key).ok()));
    }
    candidates
}

/// 导入前重读源文件与环境值；源内容、凭据或模型目录变化时必须重新扫描确认。
pub fn import_candidate(
    paths: DiscoveryPaths,
    id: &str,
    fingerprint: &str,
) -> Result<ProviderInput, String> {
    let candidate = discover(paths)
        .into_iter()
        .find(|candidate| candidate.id == id)
        .ok_or("配置来源已消失，请重新扫描")?;
    if candidate.fingerprint != fingerprint {
        return Err("配置来源已变化，请重新扫描并确认后导入".into());
    }
    if candidate.status != DiscoveryStatus::Ready {
        return Err("该配置当前不能导入，请检查扫描结果".into());
    }
    let input = candidate.input();
    input.validate()?;
    Ok(input)
}

#[cfg(test)]
mod tests;
