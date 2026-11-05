use std::path::PathBuf;

/// Node worker 的可执行文件与入口位置；配置中不得携带凭据或用户输入参数。
///
/// 默认值供开发环境使用，桌面安装包可替换为随包分发的绝对路径。
#[derive(Clone)]
pub struct AgentCommand {
    pub node: PathBuf,
    pub entry: PathBuf,
}
impl Default for AgentCommand {
    fn default() -> Self {
        Self {
            node: std::env::var_os("NOTE_BRIDGE_NODE")
                .map(PathBuf::from)
                .or_else(|| {
                    std::env::var_os("PATH").and_then(|paths| {
                        std::env::split_paths(&paths)
                            .map(|dir| dir.join(if cfg!(windows) { "node.exe" } else { "node" }))
                            .find(|path| path.is_file())
                    })
                })
                .unwrap_or_else(|| "node".into()),
            entry: PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../agent/dist/index.js"),
        }
    }
}
