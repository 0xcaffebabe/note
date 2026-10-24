//! Private, bounded JSONL link to the packaged Pi worker. Credentials never enter argv or logs.
use serde_json::{json, Value};
use std::{
    collections::HashMap,
    path::PathBuf,
    process::Stdio,
    sync::{
        atomic::{AtomicBool, AtomicU64, Ordering},
        Arc,
    },
    time::Duration,
};
use tokio::{
    io::{AsyncBufReadExt, AsyncWriteExt, BufReader},
    process::{Child, Command},
    sync::{broadcast, mpsc, oneshot, Mutex},
};
use tokio_util::sync::CancellationToken;

const MAX_LINE: usize = 16 * 1024 * 1024;
const RPC_TIMEOUT: Duration = Duration::from_secs(45);
type Pending = Arc<Mutex<HashMap<String, oneshot::Sender<Result<Value, Value>>>>>;

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

pub struct AgentProcess {
    input: mpsc::Sender<Vec<u8>>,
    pending: Pending,
    events: broadcast::Sender<Value>,
    sequence: AtomicU64,
    alive: Arc<AtomicBool>,
    stop: CancellationToken,
    child: Mutex<Child>,
}

pub fn unavailable() -> Value {
    json!({"code":"agent_unavailable","message":"Agent 服务暂不可用，请等待重连或在桌面端重启服务"})
}

impl AgentProcess {
    pub async fn spawn(command: &AgentCommand, initialize: Value) -> Result<Arc<Self>, String> {
        if !command.entry.is_file() {
            return Err("Agent 运行时缺失，请重新安装或先构建 agent".into());
        }
        let mut cmd = Command::new(&command.node);
        cmd.arg("--no-warnings")
            .arg(&command.entry)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .kill_on_drop(true)
            .env_clear();
        // Node receives no API-key, NODE_OPTIONS or user CLI environment. Runtime auth is injected over the pipe.
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
                cmd.env(key, value);
            }
        }
        #[cfg(windows)]
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW: a GUI bridge must not flash a Node console.
        let mut child = cmd
            .spawn()
            .map_err(|_| "无法启动 Agent 子进程，请检查安装包中的 Node 运行时")?;
        let mut stdin = child.stdin.take().ok_or("无法建立 Agent 输入通道")?;
        let stdout = child.stdout.take().ok_or("无法建立 Agent 输出通道")?;
        let (input, mut input_rx) = mpsc::channel::<Vec<u8>>(64);
        let pending: Pending = Arc::new(Mutex::new(HashMap::new()));
        let (events, _) = broadcast::channel(128);
        let alive = Arc::new(AtomicBool::new(true));
        let stop = CancellationToken::new();
        let worker = Arc::new(Self {
            input,
            pending: pending.clone(),
            events: events.clone(),
            sequence: AtomicU64::new(1),
            alive: alive.clone(),
            stop: stop.clone(),
            child: Mutex::new(child),
        });
        let write_stop = stop.clone();
        tokio::spawn(async move {
            loop {
                let bytes = tokio::select! { _ = write_stop.cancelled() => break, item = input_rx.recv() => match item { Some(item) => item, None => break } };
                let result =
                    tokio::time::timeout(Duration::from_secs(10), stdin.write_all(&bytes)).await;
                if !matches!(result, Ok(Ok(()))) {
                    write_stop.cancel();
                    break;
                }
            }
        });
        tokio::spawn(async move {
            let mut reader = BufReader::new(stdout);
            let mut line = Vec::new();
            'read: loop {
                line.clear();
                loop {
                    let available = tokio::select! { _ = stop.cancelled() => break 'read, bytes = reader.fill_buf() => match bytes { Ok(bytes) if !bytes.is_empty() => bytes, _ => break 'read } };
                    let end = available.iter().position(|byte| *byte == b'\n');
                    let take = end.map_or(available.len(), |end| end + 1);
                    if line.len() + take > MAX_LINE {
                        break 'read;
                    }
                    line.extend_from_slice(&available[..take]);
                    reader.consume(take);
                    if end.is_some() {
                        break;
                    }
                }
                let Ok(frame) = serde_json::from_slice::<Value>(&line) else {
                    break;
                };
                if let Some(id) = frame["id"].as_str() {
                    if let Some(reply) = pending.lock().await.remove(id) {
                        let result = if frame.get("error").is_some() {
                            Err(frame["error"].clone())
                        } else {
                            Ok(frame["result"].clone())
                        };
                        let _ = reply.send(result);
                    }
                } else if frame.get("event").is_some() {
                    let _ = events.send(frame);
                }
            }
            alive.store(false, Ordering::Release);
            stop.cancel();
            for (_, reply) in pending.lock().await.drain() {
                let _ = reply.send(Err(unavailable()));
            }
            let _ = events.send(json!({"event":"worker.offline"}));
        });
        match worker.call("initialize", initialize).await {
            Ok(value) if value["ready"] == true && value["version"] == 2 => Ok(worker),
            _ => {
                worker.shutdown().await;
                Err("Agent 初始化失败，请检查运行时版本或本地数据目录".into())
            }
        }
    }
    pub fn alive(&self) -> bool {
        self.alive.load(Ordering::Acquire) && !self.stop.is_cancelled()
    }
    pub fn subscribe(&self) -> broadcast::Receiver<Value> {
        self.events.subscribe()
    }
    pub async fn call(&self, method: &str, params: Value) -> Result<Value, Value> {
        if !self.alive() {
            return Err(unavailable());
        }
        let id = self.sequence.fetch_add(1, Ordering::Relaxed).to_string();
        let bytes = format!("{}\n", json!({"id":id,"method":method,"params":params})).into_bytes();
        if bytes.len() > MAX_LINE {
            return Err(json!({"code":"request_too_large","message":"请求超过传输大小上限"}));
        }
        let (tx, rx) = oneshot::channel();
        {
            let mut pending = self.pending.lock().await;
            if pending.len() >= 64 {
                return Err(json!({"code":"busy","message":"请求过多，请稍后重试"}));
            }
            pending.insert(id.clone(), tx);
        }
        let result = tokio::time::timeout(RPC_TIMEOUT, async {
            self.input.send(bytes).await.map_err(|_| unavailable())?;
            rx.await.map_err(|_| unavailable())?
        })
        .await
        .unwrap_or_else(|_| {
            Err(json!({"code":"agent_timeout","message":"Agent 请求超时，请重新读取会话状态"}))
        });
        self.pending.lock().await.remove(&id);
        result
    }
    pub async fn shutdown(&self) {
        if self.alive() {
            let _ = tokio::time::timeout(Duration::from_secs(5), self.call("shutdown", json!({})))
                .await;
        }
        self.stop.cancel();
        self.alive.store(false, Ordering::Release);
        let mut child = self.child.lock().await;
        if tokio::time::timeout(Duration::from_secs(3), child.wait())
            .await
            .is_err()
        {
            let _ = child.kill().await;
        }
    }
}
impl Drop for AgentProcess {
    fn drop(&mut self) {
        self.stop.cancel();
    }
}
