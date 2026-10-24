use super::{
    command::AgentCommand,
    limits::{CHILD_EXIT_TIMEOUT, SHUTDOWN_RPC_TIMEOUT},
    transport::JsonlTransport,
};
use serde_json::{json, Value};
use std::{process::Stdio, sync::Arc};
use tokio::{
    process::{Child, Command},
    sync::{broadcast, Mutex},
};

/// 一个已完成 v2 初始化握手的 worker 进程。
///
/// 进程生命周期与 JSONL 传输分别管理；关闭先请求 worker 落盘，再有界等待退出。
/// Drop 只发出取消信号，Child 的 kill_on_drop 保证宿主释放后不会遗留后台 Node。
pub struct AgentProcess {
    transport: JsonlTransport,
    child: Mutex<Child>,
}

impl AgentProcess {
    /// 启动隔离环境的 worker，并通过私有管道注入初始化数据。
    ///
    /// 只有 ready/version 握手成功才返回可用实例；失败会关闭刚创建的进程。
    pub async fn spawn(command: &AgentCommand, initialize: Value) -> Result<Arc<Self>, String> {
        let mut child = spawn_child(command)?;
        let stdin = child.stdin.take().ok_or("无法建立 Agent 输入通道")?;
        let stdout = child.stdout.take().ok_or("无法建立 Agent 输出通道")?;
        let worker = Arc::new(Self {
            transport: JsonlTransport::start(stdin, stdout),
            child: Mutex::new(child),
        });
        match worker.call("initialize", initialize).await {
            Ok(value) if value["ready"] == true && value["version"] == 2 => Ok(worker),
            _ => {
                worker.shutdown().await;
                Err("Agent 初始化失败，请检查运行时版本或本地数据目录".into())
            }
        }
    }

    /// 仅表示通道仍可接收请求；实际调用仍可能遇到并发退出或超时。
    pub fn alive(&self) -> bool {
        self.transport.alive()
    }

    /// 订阅 worker 推送。接收者落后时按 broadcast 语义报告丢帧，调用方应重新读取快照。
    pub fn subscribe(&self) -> broadcast::Receiver<Value> {
        self.transport.subscribe()
    }

    /// 发出一个私有 RPC；超时不代表底层任务回滚，客户端应重新读取会话状态。
    pub async fn call(&self, method: &str, params: Value) -> Result<Value, Value> {
        self.transport.call(method, params).await
    }

    /// 请求有序停机，然后有界等待/终止子进程；已提交的 Pi 检查点供下次启动恢复。
    pub async fn shutdown(&self) {
        if self.alive() {
            let _ =
                tokio::time::timeout(SHUTDOWN_RPC_TIMEOUT, self.call("shutdown", json!({}))).await;
        }
        self.transport.stop();
        let mut child = self.child.lock().await;
        if tokio::time::timeout(CHILD_EXIT_TIMEOUT, child.wait())
            .await
            .is_err()
        {
            let _ = child.kill().await;
        }
    }
}

impl Drop for AgentProcess {
    fn drop(&mut self) {
        self.transport.cancel();
    }
}

/// 子进程只继承系统运行必需的环境，不读取 API key、NODE_OPTIONS 或 CLI 配置环境。
fn spawn_child(command: &AgentCommand) -> Result<Child, String> {
    if !command.entry.is_file() {
        return Err("Agent 运行时缺失，请重新安装或先构建 agent".into());
    }
    let mut process = Command::new(&command.node);
    process
        .arg("--no-warnings")
        .arg(&command.entry)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .kill_on_drop(true)
        .env_clear();
    for key in [
        "SYSTEMROOT",
        "WINDIR",
        "TEMP",
        "TMP",
        "TMPDIR",
        "LANG",
        "LC_ALL",
        "TZ",
    ] {
        if let Some(value) = std::env::var_os(key) {
            process.env(key, value);
        }
    }
    #[cfg(windows)]
    process.creation_flags(0x08000000); // CREATE_NO_WINDOW：GUI 桥接不弹出 Node 控制台。
    process
        .spawn()
        .map_err(|_| "无法启动 Agent 子进程，请检查安装包中的 Node 运行时".into())
}
