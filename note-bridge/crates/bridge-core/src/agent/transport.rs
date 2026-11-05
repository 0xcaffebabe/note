use super::{
    limits::{
        EVENT_QUEUE_CAPACITY, INPUT_QUEUE_CAPACITY, MAX_LINE_BYTES, MAX_PENDING_REQUESTS,
        RPC_TIMEOUT,
    },
    pipes,
};
use serde_json::{json, Value};
use std::{
    collections::HashMap,
    sync::{
        atomic::{AtomicBool, AtomicU64, Ordering},
        Arc,
    },
};
use tokio::{
    process::{ChildStdin, ChildStdout},
    sync::{broadcast, mpsc, oneshot, Mutex},
};
use tokio_util::sync::CancellationToken;

type PendingReplies = HashMap<String, oneshot::Sender<Result<Value, Value>>>;

/// 管道收发共享的关联状态；reader 退出时统一清空等待者并发布一次 offline。
///
/// 不持有 Child 或进程配置，管道故障只撤销通道，子进程回收由生命周期层完成。
pub(super) struct ConnectionState {
    pending: Mutex<PendingReplies>,
    events: broadcast::Sender<Value>,
    alive: AtomicBool,
    stop: CancellationToken,
}

impl ConnectionState {
    pub(super) fn cancellation(&self) -> CancellationToken {
        self.stop.clone()
    }

    pub(super) async fn receive(&self, frame: Value) {
        if let Some(id) = frame["id"].as_str() {
            if let Some(reply) = self.pending.lock().await.remove(id) {
                let result = if frame.get("error").is_some() {
                    Err(frame["error"].clone())
                } else {
                    Ok(frame["result"].clone())
                };
                let _ = reply.send(result);
            }
        } else if frame.get("event").is_some() {
            let _ = self.events.send(frame);
        }
    }

    pub(super) async fn disconnected(&self) {
        self.alive.store(false, Ordering::Release);
        self.stop.cancel();
        for (_, reply) in self.pending.lock().await.drain() {
            let _ = reply.send(Err(unavailable()));
        }
        let _ = self.events.send(json!({ "event": "worker.offline" }));
    }
}

/// 有界 RPC 通道：序号关联、排队、响应超时及推送订阅。
///
/// 请求完成或超时均删除关联项；管道断开会结束全部等待者，不记录任何传输正文。
pub(super) struct JsonlTransport {
    input: mpsc::Sender<Vec<u8>>,
    state: Arc<ConnectionState>,
    sequence: AtomicU64,
}

impl JsonlTransport {
    pub(super) fn start(stdin: ChildStdin, stdout: ChildStdout) -> Self {
        let (input, input_rx) = mpsc::channel(INPUT_QUEUE_CAPACITY);
        let (events, _) = broadcast::channel(EVENT_QUEUE_CAPACITY);
        let state = Arc::new(ConnectionState {
            pending: Mutex::new(HashMap::new()),
            events,
            alive: AtomicBool::new(true),
            stop: CancellationToken::new(),
        });
        tokio::spawn(pipes::write_input(stdin, input_rx, state.cancellation()));
        tokio::spawn(pipes::read_output(stdout, state.clone()));
        Self {
            input,
            state,
            sequence: AtomicU64::new(1),
        }
    }

    pub(super) fn alive(&self) -> bool {
        self.state.alive.load(Ordering::Acquire) && !self.state.stop.is_cancelled()
    }

    pub(super) fn subscribe(&self) -> broadcast::Receiver<Value> {
        self.state.events.subscribe()
    }

    pub(super) async fn call(&self, method: &str, params: Value) -> Result<Value, Value> {
        if !self.alive() {
            return Err(unavailable());
        }
        let id = self.sequence.fetch_add(1, Ordering::Relaxed).to_string();
        let bytes = format!(
            "{}\n",
            json!({ "id": id, "method": method, "params": params }),
        )
        .into_bytes();
        if bytes.len() > MAX_LINE_BYTES {
            return Err(json!({
                "code": "request_too_large",
                "message": "请求超过传输大小上限",
            }));
        }
        let (reply, response) = oneshot::channel();
        {
            let mut pending = self.state.pending.lock().await;
            if pending.len() >= MAX_PENDING_REQUESTS {
                return Err(json!({ "code": "busy", "message": "请求过多，请稍后重试" }));
            }
            pending.insert(id.clone(), reply);
        }
        let result = tokio::time::timeout(RPC_TIMEOUT, async {
            self.input.send(bytes).await.map_err(|_| unavailable())?;
            response.await.map_err(|_| unavailable())?
        })
        .await
        .unwrap_or_else(|_| {
            Err(json!({
                "code": "agent_timeout",
                "message": "Agent 请求超时，请重新读取会话状态",
            }))
        });
        self.state.pending.lock().await.remove(&id);
        result
    }

    pub(super) fn cancel(&self) {
        self.state.stop.cancel();
    }

    pub(super) fn stop(&self) {
        self.cancel();
        self.state.alive.store(false, Ordering::Release);
    }
}

/// 可安全返回站点的固定错误；不包含 worker 输出、文件路径或凭据。
pub fn unavailable() -> Value {
    json!({
        "code": "agent_unavailable",
        "message": "Agent 服务暂不可用，请等待重连或在桌面端重启服务",
    })
}
