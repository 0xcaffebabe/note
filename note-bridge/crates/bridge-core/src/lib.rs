mod authorization;
pub mod discovery;
pub mod model;
pub mod model_catalog;
pub mod protocol;
pub mod provider;
pub mod storage;

use authorization::{Authorization, MAX_AUTHORIZATIONS};
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State as WebState,
    },
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    routing::get,
    Router,
};
pub use discovery::{DiscoveredProvider, DiscoveryPaths};
use futures_util::{SinkExt, StreamExt};
pub use model::{ModelOption, Provider, ProviderInput};
use protocol::{ChatRequest, ClientFrame, ClientMessage, VERSION};
use rand::Rng;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{
    collections::{HashMap, HashSet, VecDeque},
    fs,
    io::Write,
    path::PathBuf,
    sync::Arc,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use storage::{SecretStore, Storage};
use tokio::{
    net::TcpListener,
    sync::{mpsc, oneshot, watch, Mutex, Semaphore},
    task::JoinHandle,
};
use tokio_util::sync::CancellationToken;
use uuid::Uuid;

const PAIR_TTL_MS: u64 = 120_000;
const LOG_LIMIT: usize = 1000;

fn now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

#[derive(Clone)]
pub struct Bridge {
    inner: Arc<Inner>,
}

struct Inner {
    storage: Storage,
    data_dir: PathBuf,
    client: reqwest::Client,
    state: Mutex<Runtime>,
    slots: Arc<Semaphore>,
    provider_changes: watch::Sender<u64>,
}

struct Runtime {
    running: bool,
    settings: Settings,
    shutdown: CancellationToken,
    server: Option<JoinHandle<()>>,
    pairing: Option<PairingWindow>,
    pair_attempts: u8,
    sessions: HashMap<String, Session>,
    authorizations: Vec<Authorization>,
    discovered: HashMap<String, (DiscoveryPaths, String)>,
    logs: VecDeque<LogEntry>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Settings {
    port: u16,
    allowed_origins: Vec<String>,
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

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PairingWindow {
    pub code: String,
    pub expires_at: u64,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionInfo {
    pub id: String,
    pub origin: String,
    pub connected_at: u64,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthorizationInfo {
    pub id: String,
    pub origin: String,
    pub created_at: u64,
    pub last_connected_at: u64,
    pub connected: bool,
}

struct Session {
    info: ConnectionInfo,
    authorization_id: String,
    cancel: CancellationToken,
}

type PendingTools = Arc<
    Mutex<HashMap<String, oneshot::Sender<Result<provider::ToolResult, provider::UpstreamError>>>>,
>;

struct ActiveChat {
    id: String,
    cancel: CancellationToken,
    task: JoinHandle<()>,
    tools: PendingTools,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LogEntry {
    pub timestamp: u64,
    pub level: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub request_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub provider_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration_ms: Option<u64>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Snapshot {
    pub running: bool,
    pub port: u16,
    pub allowed_origins: Vec<String>,
    pub providers: Vec<Provider>,
    pub pairing: Option<PairingWindow>,
    pub connections: Vec<ConnectionInfo>,
    pub authorizations: Vec<AuthorizationInfo>,
    pub logs: Vec<LogEntry>,
}

impl Bridge {
    pub fn new(data_dir: PathBuf) -> Result<Self, String> {
        let storage = Storage::new(data_dir.clone())?;
        Self::from_storage(data_dir, storage)
    }

    /// Tests and embedders may provide an isolated credential store. Desktop always uses native storage.
    pub fn with_secrets(data_dir: PathBuf, secrets: Arc<dyn SecretStore>) -> Result<Self, String> {
        let storage = Storage::with_secrets(data_dir.clone(), secrets)?;
        Self::from_storage(data_dir, storage)
    }

    fn from_storage(data_dir: PathBuf, storage: Storage) -> Result<Self, String> {
        let settings = match fs::read(data_dir.join("settings.json")) {
            Ok(bytes) if bytes.len() < 65536 => {
                serde_json::from_slice::<Settings>(&bytes).map_err(|_| "连接配置格式无效")?
            }
            Ok(_) => return Err("连接配置过大".into()),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Settings::default(),
            Err(_) => return Err("无法读取连接配置".into()),
        };
        validate_settings(settings.port, &settings.allowed_origins)?;
        let authorizations = authorization::load(&data_dir)?;
        // Log files contain only bridge-generated summaries; corrupt/oversized files are not loaded.
        let logs = fs::read(data_dir.join("runtime.jsonl"))
            .ok()
            .filter(|data| data.len() <= 1024 * 1024)
            .map(|data| {
                String::from_utf8_lossy(&data)
                    .lines()
                    .filter_map(|line| serde_json::from_str::<LogEntry>(line).ok())
                    .collect::<VecDeque<_>>()
            })
            .unwrap_or_default();
        Ok(Self {
            inner: Arc::new(Inner {
                storage,
                data_dir,
                client: provider::client()?,
                slots: Arc::new(Semaphore::new(8)),
                provider_changes: watch::channel(0).0,
                state: Mutex::new(Runtime {
                    running: false,
                    settings,
                    shutdown: CancellationToken::new(),
                    server: None,
                    pairing: None,
                    pair_attempts: 0,
                    sessions: HashMap::new(),
                    authorizations,
                    discovered: HashMap::new(),
                    logs: logs
                        .into_iter()
                        .rev()
                        .take(LOG_LIMIT)
                        .collect::<VecDeque<_>>()
                        .into_iter()
                        .rev()
                        .collect(),
                }),
            }),
        })
    }

    pub async fn snapshot(&self) -> Snapshot {
        let state = self.inner.state.lock().await;
        Snapshot {
            running: state.running,
            port: state.settings.port,
            allowed_origins: state.settings.allowed_origins.clone(),
            providers: self.inner.storage.providers(),
            pairing: state.pairing.clone().filter(|p| p.expires_at > now()),
            connections: state.sessions.values().map(|s| s.info.clone()).collect(),
            authorizations: state
                .authorizations
                .iter()
                .map(|grant| AuthorizationInfo {
                    id: grant.id.clone(),
                    origin: grant.origin.clone(),
                    created_at: grant.created_at,
                    last_connected_at: grant.last_connected_at,
                    connected: state.sessions.values().any(|session| {
                        session.authorization_id == grant.id && !session.cancel.is_cancelled()
                    }),
                })
                .collect(),
            logs: state.logs.iter().cloned().collect(),
        }
    }

    pub async fn start(&self, port: u16, origins: Vec<String>) -> Result<(), String> {
        validate_settings(port, &origins)?;
        let mut state = self.inner.state.lock().await;
        if state.running {
            return Err("服务已启动，请先停止后修改设置".into());
        }
        let listener = TcpListener::bind((std::net::Ipv4Addr::LOCALHOST, port))
            .await
            .map_err(|_| "无法监听本机端口，端口可能已被占用".to_string())?;
        let settings = Settings {
            port,
            allowed_origins: origins,
        };
        save_settings(&self.inner.data_dir, &settings)?;
        state.settings = settings;
        state.shutdown = CancellationToken::new();
        let shutdown = state.shutdown.clone();
        state.running = true;
        let app = Router::new()
            .route("/ws", get(upgrade))
            .with_state(self.clone());
        state.server = Some(tokio::spawn(async move {
            let _ = axum::serve(listener, app)
                .with_graceful_shutdown(shutdown.cancelled_owned())
                .await;
        }));
        drop(state);
        self.log("info", "本机服务已启动", None).await;
        Ok(())
    }

    pub async fn stop(&self) {
        let mut state = self.inner.state.lock().await;
        state.running = false;
        state.shutdown.cancel();
        state.pairing = None;
        for session in state.sessions.values() {
            session.cancel.cancel();
        }
        state.sessions.clear();
        let server = state.server.take();
        drop(state);
        if let Some(mut task) = server {
            if tokio::time::timeout(Duration::from_secs(3), &mut task)
                .await
                .is_err()
            {
                task.abort();
            }
            self.log("info", "本机服务已停止", None).await;
        }
    }

    pub async fn open_pairing(&self) -> Result<PairingWindow, String> {
        let mut state = self.inner.state.lock().await;
        if !state.running {
            return Err("请先启动服务".into());
        }
        let pairing = PairingWindow {
            code: format!("{:06}", rand::thread_rng().gen_range(0..1_000_000)),
            expires_at: now() + PAIR_TTL_MS,
        };
        state.pairing = Some(pairing.clone());
        state.pair_attempts = 0;
        Ok(pairing)
    }

    pub async fn revoke_connection(&self, id: String) -> Result<(), String> {
        let mut state = self.inner.state.lock().await;
        let authorization_id = state
            .sessions
            .get(&id)
            .ok_or("连接不存在")?
            .authorization_id
            .clone();
        self.revoke_locked(&mut state, &authorization_id)?;
        drop(state);
        self.log("info", "已撤销网站授权", None).await;
        Ok(())
    }

    pub async fn revoke_authorization(&self, id: String) -> Result<(), String> {
        let mut state = self.inner.state.lock().await;
        self.revoke_locked(&mut state, &id)?;
        drop(state);
        self.log("info", "已撤销网站授权", None).await;
        Ok(())
    }

    fn revoke_locked(&self, state: &mut Runtime, id: &str) -> Result<(), String> {
        if !state.authorizations.iter().any(|grant| grant.id == id) {
            return Err("网站授权不存在".into());
        }
        let mut next = state.authorizations.clone();
        next.retain(|grant| grant.id != id);
        authorization::save(&self.inner.data_dir, &next)?;
        state.authorizations = next;
        state.sessions.retain(|_, session| {
            if session.authorization_id == id {
                session.cancel.cancel();
                false
            } else {
                true
            }
        });
        Ok(())
    }

    pub async fn discover(&self, paths: DiscoveryPaths) -> Vec<DiscoveredProvider> {
        let source = paths.clone();
        let found = tokio::task::spawn_blocking(move || discovery::discover(source))
            .await
            .unwrap_or_default();
        let mut state = self.inner.state.lock().await;
        state.discovered = found
            .iter()
            .map(|candidate| {
                (
                    candidate.id.clone(),
                    (paths.clone(), candidate.fingerprint.clone()),
                )
            })
            .collect();
        found
    }

    pub async fn import_provider(&self, candidate_id: String) -> Result<Provider, String> {
        let (paths, fingerprint) = self
            .inner
            .state
            .lock()
            .await
            .discovered
            .get(&candidate_id)
            .cloned()
            .ok_or("请先重新扫描配置")?;
        let input = tokio::task::spawn_blocking(move || {
            discovery::import_candidate(paths, &candidate_id, &fingerprint)
        })
        .await
        .map_err(|_| "配置导入失败")??;
        self.save_provider(input).await
    }

    pub async fn save_provider(&self, mut input: ProviderInput) -> Result<Provider, String> {
        if input
            .api_key
            .as_deref()
            .is_some_and(|key| key.trim().is_empty())
        {
            input.api_key = None;
        }
        let bridge = self.clone();
        let provider = tokio::task::spawn_blocking(move || bridge.inner.storage.save(input))
            .await
            .map_err(|_| "保存配置失败")??;
        self.inner
            .provider_changes
            .send_modify(|revision| *revision = revision.wrapping_add(1));
        self.log("info", "模型配置已保存", None).await;
        Ok(provider)
    }

    pub async fn remove_provider(&self, id: String) -> Result<(), String> {
        let bridge = self.clone();
        tokio::task::spawn_blocking(move || bridge.inner.storage.remove(&id))
            .await
            .map_err(|_| "删除配置失败")??;
        self.inner
            .provider_changes
            .send_modify(|revision| *revision = revision.wrapping_add(1));
        self.log("info", "模型配置已删除", None).await;
        Ok(())
    }

    /// Native-only discovery: fetching never edits saved model choices or CLI configuration.
    pub async fn fetch_provider_models(&self, id: String) -> Result<Vec<ModelOption>, String> {
        let (provider, secret) = self.provider_snapshot(id).await?;
        model_catalog::fetch(&self.inner.client, &provider, secret.as_deref()).await
    }

    fn browser_providers(&self) -> Vec<Value> {
        self.inner.storage.providers().into_iter().filter(|provider| provider.enabled).map(|provider| {
            json!({"id":provider.id,"name":provider.name,"protocol":provider.protocol,"model":provider.model,"models":provider.model_options(),"efforts":provider::supported_efforts(&provider)})
        }).collect()
    }

    pub async fn test_provider(&self, id: String) -> Result<(), String> {
        let (provider, secret) = self.provider_snapshot(id).await?;
        let chat: ChatRequest = serde_json::from_value(json!({"requestId":"connection-test", "providerId":provider.id, "model":provider.model, "messages":[{"role":"user", "content":"Reply OK."}], "context":{"documents":[]}, "maxOutputTokens":16})).map_err(|_| "连接测试初始化失败")?;
        let (tx, mut rx) = mpsc::channel(16);
        let drain = tokio::spawn(async move { while rx.recv().await.is_some() {} });
        let result = provider::generate(
            &self.inner.client,
            &provider,
            secret.as_deref(),
            &chat,
            tx,
            CancellationToken::new(),
        )
        .await;
        let _ = drain.await;
        self.log(
            if result.is_ok() { "info" } else { "warn" },
            if result.is_ok() {
                "模型连接测试成功"
            } else {
                "模型连接测试失败"
            },
            Some((&chat, 0)),
        )
        .await;
        result.map_err(|error| error.message.to_string())
    }

    async fn provider_snapshot(&self, id: String) -> Result<(Provider, Option<String>), String> {
        let bridge = self.clone();
        tokio::task::spawn_blocking(move || bridge.inner.storage.provider_with_secret(&id))
            .await
            .map_err(|_| "读取凭据失败")?
    }

    pub async fn clear_logs(&self) {
        let mut state = self.inner.state.lock().await;
        state.logs.clear();
        let _ = fs::remove_file(self.inner.data_dir.join("runtime.jsonl"));
        let _ = fs::remove_file(self.inner.data_dir.join("runtime.previous.jsonl"));
    }

    pub async fn export_logs(&self) -> String {
        self.inner
            .state
            .lock()
            .await
            .logs
            .iter()
            .filter_map(|entry| serde_json::to_string(entry).ok())
            .collect::<Vec<_>>()
            .join("\n")
    }

    async fn log(&self, level: &str, message: &str, chat: Option<(&ChatRequest, u64)>) {
        let entry = LogEntry {
            timestamp: now(),
            level: level.into(),
            message: message.into(),
            request_id: chat.map(|(c, _)| c.request_id.clone()),
            provider_id: chat.map(|(c, _)| c.provider_id.clone()),
            model: chat.map(|(c, _)| c.model.clone()),
            duration_ms: chat.map(|(_, ms)| ms),
        };
        let mut state = self.inner.state.lock().await;
        state.logs.push_back(entry.clone());
        while state.logs.len() > LOG_LIMIT {
            state.logs.pop_front();
        }
        let path = self.inner.data_dir.join("runtime.jsonl");
        if fs::metadata(&path).is_ok_and(|m| m.len() > 1024 * 1024) {
            let previous = self.inner.data_dir.join("runtime.previous.jsonl");
            let _ = fs::remove_file(&previous);
            let _ = fs::rename(&path, previous);
        }
        if let Ok(mut file) = fs::OpenOptions::new().create(true).append(true).open(path) {
            if let Ok(line) = serde_json::to_string(&entry) {
                let _ = writeln!(file, "{line}");
            }
        }
    }
}

fn validate_settings(port: u16, origins: &[String]) -> Result<(), String> {
    if port < 1024 {
        return Err("请选择 1024–65535 的端口".into());
    }
    if origins.is_empty() || origins.len() > 20 {
        return Err("请设置 1 到 20 个允许的网站来源".into());
    }
    for origin in origins {
        let url = url::Url::parse(origin).map_err(|_| "网站来源格式无效")?;
        model::validate_base_url(origin)?;
        if url.origin().ascii_serialization() != *origin {
            return Err("网站来源只包含协议、主机和可选端口，不含路径或末尾斜线".into());
        }
    }
    Ok(())
}

fn save_settings(dir: &std::path::Path, settings: &Settings) -> Result<(), String> {
    let bytes = serde_json::to_vec_pretty(settings).map_err(|_| "无法序列化连接设置")?;
    let temp = dir.join("settings.json.tmp");
    fs::write(&temp, bytes).map_err(|_| "无法保存连接设置")?;
    fs::rename(temp, dir.join("settings.json")).map_err(|_| "无法更新连接设置".into())
}

async fn upgrade(
    WebState(bridge): WebState<Bridge>,
    headers: HeaderMap,
    ws: WebSocketUpgrade,
) -> Response {
    let origin = headers
        .get("origin")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("");
    let host = headers
        .get("host")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("");
    let state = bridge.inner.state.lock().await;
    if !state.running
        || !state
            .settings
            .allowed_origins
            .iter()
            .any(|allowed| allowed == origin)
        || host != format!("127.0.0.1:{}", state.settings.port)
    {
        return StatusCode::FORBIDDEN.into_response();
    }
    let shutdown = state.shutdown.clone();
    drop(state);
    let Ok(permit) = bridge.inner.slots.clone().try_acquire_owned() else {
        return StatusCode::TOO_MANY_REQUESTS.into_response();
    };
    let origin = origin.to_string();
    ws.max_message_size(protocol::MAX_FRAME_BYTES)
        .max_frame_size(protocol::MAX_FRAME_BYTES)
        .on_upgrade(move |socket| async move {
            let _permit = permit;
            socket_session(bridge, socket, origin, shutdown).await;
        })
        .into_response()
}

fn error(code: &str, message: &str) -> Value {
    json!({"v":VERSION, "type":"error", "code":code, "message":message})
}
async fn send(socket: &mut WebSocket, value: Value) -> bool {
    matches!(
        tokio::time::timeout(
            Duration::from_secs(5),
            socket.send(Message::Text(value.to_string().into()))
        )
        .await,
        Ok(Ok(()))
    )
}

struct Authenticated {
    info: ConnectionInfo,
    authorization_id: String,
    token: String,
    cancel: CancellationToken,
}

async fn authenticate(
    bridge: &Bridge,
    socket: &mut WebSocket,
    origin: &str,
    shutdown: &CancellationToken,
) -> Option<Authenticated> {
    let first = tokio::select! {
        _ = shutdown.cancelled() => return None,
        result = tokio::time::timeout(Duration::from_secs(10), socket.recv()) => result.ok()??.ok()?,
    };
    let Message::Text(text) = first else {
        return None;
    };
    let Ok(frame) = serde_json::from_str::<ClientFrame>(&text) else {
        send(socket, error("invalid_message", "认证消息格式无效")).await;
        return None;
    };
    if frame.v != VERSION {
        send(
            socket,
            error("unsupported_version", "协议版本不兼容，请更新站点或 bridge"),
        )
        .await;
        return None;
    }
    // Consuming a code, committing its grant, registering sockets, and revocation
    // share one lock. A code cannot issue two grants or cross a service restart.
    let mut state = bridge.inner.state.lock().await;
    if !state.running || shutdown.is_cancelled() {
        return None;
    }
    let (authorization_id, token) = match frame.message {
        ClientMessage::Pair { code } => {
            state.pair_attempts = state.pair_attempts.saturating_add(1);
            if state.pair_attempts > 10
                || state.authorizations.len() >= MAX_AUTHORIZATIONS
                || !state
                    .pairing
                    .as_ref()
                    .is_some_and(|p| p.expires_at > now() && p.code == code)
            {
                if state.pair_attempts >= 10 {
                    state.pairing = None;
                }
                drop(state);
                send(
                    socket,
                    error(
                        "pairing_failed",
                        "配对码无效或已过期，请在桌面端重新开启配对",
                    ),
                )
                .await;
                return None;
            }
            state.pairing = None;
            (None, authorization::new_token())
        }
        ClientMessage::Auth { token } => {
            let Some(hash) = authorization::hash_token(&token) else {
                drop(state);
                send(socket, error("auth_failed", "会话已失效，请重新配对")).await;
                return None;
            };
            (Some(hash), token)
        }
        _ => {
            drop(state);
            send(socket, error("auth_required", "请先配对认证")).await;
            return None;
        }
    };
    // No token can be issued before its grant has been committed.
    let mut next = state.authorizations.clone();
    let authorization_id = if let Some(hash) = authorization_id {
        let Some(grant) = next
            .iter_mut()
            .find(|grant| grant.token_hash == hash && grant.origin == origin)
        else {
            drop(state);
            send(socket, error("auth_failed", "网站授权已失效，请重新配对")).await;
            return None;
        };
        grant.last_connected_at = now().max(grant.last_connected_at);
        grant.id.clone()
    } else {
        if next.len() >= MAX_AUTHORIZATIONS {
            drop(state);
            send(
                socket,
                error("pairing_failed", "网站授权已达上限，请先在桌面端撤销旧授权"),
            )
            .await;
            return None;
        }
        let id = Uuid::new_v4().to_string();
        let timestamp = now();
        next.push(Authorization {
            id: id.clone(),
            origin: origin.into(),
            token_hash: authorization::hash_token(&token)?,
            created_at: timestamp,
            last_connected_at: timestamp,
        });
        id
    };
    if authorization::save(&bridge.inner.data_dir, &next).is_err() {
        drop(state);
        send(
            socket,
            error(
                "authorization_unavailable",
                "无法保存网站授权，请检查桌面端存储后重试",
            ),
        )
        .await;
        return None;
    }
    state.authorizations = next;
    let info = ConnectionInfo {
        id: Uuid::new_v4().to_string(),
        origin: origin.into(),
        connected_at: now(),
    };
    let cancel = shutdown.child_token();
    state.sessions.insert(
        info.id.clone(),
        Session {
            info: info.clone(),
            authorization_id: authorization_id.clone(),
            cancel: cancel.clone(),
        },
    );
    Some(Authenticated {
        info,
        authorization_id,
        token,
        cancel,
    })
}

async fn socket_session(
    bridge: Bridge,
    mut socket: WebSocket,
    origin: String,
    shutdown: CancellationToken,
) {
    let Some(Authenticated {
        info,
        authorization_id,
        token,
        cancel: connection_cancel,
    }) = authenticate(&bridge, &mut socket, &origin, &shutdown).await
    else {
        return;
    };
    let mut provider_changes = bridge.inner.provider_changes.subscribe();
    let providers = bridge.browser_providers();
    let sent = tokio::select! {
        biased;
        _ = connection_cancel.cancelled() => false,
        sent = send(&mut socket, json!({"v":VERSION,"type":"auth.ok","token":token,"providers":providers,"connectionId":info.id,"authorizationId":authorization_id})) => sent,
    };
    if !sent {
        remove_session(&bridge, &info.id).await;
        return;
    }
    bridge.log("info", "网站已连接", None).await;
    let (mut sink, mut source) = socket.split();
    let (tx, mut rx) = mpsc::channel::<Value>(64);
    let writer_cancel = connection_cancel.clone();
    let writer = tokio::spawn(async move {
        loop {
            tokio::select! {
                biased;
                _ = writer_cancel.cancelled() => break,
                event = rx.recv() => {
                    let Some(event) = event else { break; };
                    if !matches!(tokio::time::timeout(Duration::from_secs(5), sink.send(Message::Text(event.to_string().into()))).await, Ok(Ok(()))) { writer_cancel.cancel(); break; }
                }
            }
        }
        let _ = tokio::time::timeout(Duration::from_secs(1), sink.close()).await;
    });
    let mut active: Option<ActiveChat> = None;
    let mut used_ids = HashSet::new();
    loop {
        let incoming = tokio::select! {
            biased;
            _ = connection_cancel.cancelled() => break,
            changed = provider_changes.changed() => {
                if changed.is_err() { break; }
                let _ = tx.send(json!({"v":VERSION,"type":"providers.updated","providers":bridge.browser_providers()})).await;
                continue;
            },
            result = tokio::time::timeout(Duration::from_secs(90), source.next()) => match result { Ok(Some(Ok(message))) => message, _ => break },
        };
        if matches!(incoming, Message::Close(_)) {
            break;
        }
        let Message::Text(text) = incoming else {
            continue;
        };
        let frame = match serde_json::from_str::<ClientFrame>(&text) {
            Ok(frame) if frame.v == VERSION => frame,
            _ => {
                let _ = tx
                    .send(error("invalid_message", "消息格式或协议版本无效"))
                    .await;
                continue;
            }
        };
        match frame.message {
            ClientMessage::AuthForget => {
                if bridge
                    .revoke_authorization(authorization_id.clone())
                    .await
                    .is_err()
                {
                    let _ = tx
                        .send(error("forget_failed", "无法撤销网站授权，请在桌面端重试"))
                        .await;
                } else {
                    break;
                }
            }
            ClientMessage::Ping => {
                let _ = tx.send(json!({"v":VERSION,"type":"pong"})).await;
            }
            ClientMessage::ChatCancel { request_id } => {
                if let Some(chat) = &active {
                    if chat.id == request_id {
                        chat.cancel.cancel();
                    }
                }
            }
            ClientMessage::ToolResult {
                request_id,
                call_id,
                result,
                is_error,
            } => {
                let reply = if let Some(chat) = &active {
                    if chat.id == request_id
                        && !chat.cancel.is_cancelled()
                        && !chat.task.is_finished()
                    {
                        chat.tools.lock().await.remove(&call_id)
                    } else {
                        None
                    }
                } else {
                    None
                };
                if let Some(reply) = reply {
                    let checked = provider::validate_tool_result(&result, is_error)
                        .map(|()| provider::ToolResult { result, is_error });
                    let _ = reply.send(checked);
                } else {
                    let _ = tx
                        .send(error(
                            "tool_result_rejected",
                            "工具结果不属于当前连接的待处理调用",
                        ))
                        .await;
                }
            }
            ClientMessage::ChatStart(chat) => {
                if active
                    .as_ref()
                    .is_some_and(|chat| chat.cancel.is_cancelled())
                {
                    if let Some(mut previous) = active.take() {
                        if tokio::time::timeout(Duration::from_secs(2), &mut previous.task)
                            .await
                            .is_err()
                        {
                            previous.task.abort();
                        }
                    }
                }
                let invalid = chat.validate().err();
                let busy = active.as_ref().is_some_and(|chat| !chat.task.is_finished());
                let duplicate = used_ids.contains(&chat.request_id);
                if invalid.is_some() || busy || duplicate || used_ids.len() >= 1000 {
                    // Invalid ID is never reflected; valid duplicate IDs do not emit a second terminal event.
                    let message = invalid.unwrap_or(if busy {
                        "已有回答正在生成"
                    } else {
                        "请求 ID 已使用或会话请求数达到上限"
                    });
                    let _ = tx.send(error("request_rejected", message)).await;
                    continue;
                }
                used_ids.insert(chat.request_id.clone());
                let cancel = connection_cancel.child_token();
                let job_bridge = bridge.clone();
                let job_tx = tx.clone();
                let job_cancel = cancel.clone();
                let id = chat.request_id.clone();
                let tools = Arc::new(Mutex::new(HashMap::new()));
                let job_tools = tools.clone();
                let task = tokio::spawn(async move {
                    run_chat(job_bridge, chat, job_tx, job_cancel, job_tools).await;
                });
                active = Some(ActiveChat {
                    id,
                    cancel,
                    task,
                    tools,
                });
            }
            _ => {
                let _ = tx
                    .send(error("invalid_operation", "连接已认证，无法重复配对"))
                    .await;
            }
        }
    }
    connection_cancel.cancel();
    if let Some(mut chat) = active {
        chat.cancel.cancel();
        if tokio::time::timeout(Duration::from_secs(2), &mut chat.task)
            .await
            .is_err()
        {
            chat.task.abort();
        }
    }
    drop(tx);
    let _ = writer.await;
    remove_session(&bridge, &info.id).await;
}

async fn remove_session(bridge: &Bridge, id: &str) {
    // Every socket has its own identity; disconnecting never revokes its grant.
    bridge.inner.state.lock().await.sessions.remove(id);
}

async fn run_chat(
    bridge: Bridge,
    chat: ChatRequest,
    output: mpsc::Sender<Value>,
    cancel: CancellationToken,
    pending_tools: PendingTools,
) {
    let started = Instant::now();
    let mut seq = 0u64;
    let (provider, secret) = match bridge.provider_snapshot(chat.provider_id.clone()).await {
        Ok(snapshot)
            if snapshot.0.enabled && snapshot.0.accepts_model(&chat.model, chat.effort) =>
        {
            snapshot
        }
        Ok(_) => {
            let _ = output.send(json!({"v":VERSION,"type":"chat.error","requestId":chat.request_id,"seq":seq,"code":"provider_unavailable","message":"模型或思考强度不可用，请选择桌面端已配置的模型"})).await;
            return;
        }
        Err(_) => {
            let _ = output.send(json!({"v":VERSION,"type":"chat.error","requestId":chat.request_id,"seq":seq,"code":"missing_credential","message":"无法读取模型凭据，请检查桌面端配置"})).await;
            return;
        }
    };
    bridge.log("info", "开始生成回答", Some((&chat, 0))).await;
    let (event_tx, mut event_rx) = mpsc::channel(32);
    let mut generation = Box::pin(provider::generate(
        &bridge.inner.client,
        &provider,
        secret.as_deref(),
        &chat,
        event_tx,
        cancel.clone(),
    ));
    let result = loop {
        tokio::select! {
            biased;
            _ = cancel.cancelled() => break Ok(()),
            event = event_rx.recv() => {
                if let Some(event) = event {
                    seq += 1;
                    let frame = generation_frame(event, &chat.request_id, seq, &pending_tools).await;
                    tokio::select! {
                        _ = cancel.cancelled() => break Ok(()),
                        result = tokio::time::timeout(Duration::from_secs(5), output.send(frame)) => if !matches!(result, Ok(Ok(()))) { cancel.cancel(); break Ok(()); },
                    }
                } else { break generation.as_mut().await; }
            }
            result = &mut generation => {
                // Generation may finish before its bounded output queue has drained.
                while let Ok(event) = event_rx.try_recv() {
                    seq += 1;
                    let frame = generation_frame(event, &chat.request_id, seq, &pending_tools).await;
                    if !matches!(tokio::time::timeout(Duration::from_secs(5), output.send(frame)).await, Ok(Ok(()))) { break; }
                }
                break result;
            }
        }
    };
    // Drop the response stream immediately when cancelled, before waiting for
    // downstream writes or log persistence.
    drop(generation);
    pending_tools.lock().await.clear();
    seq += 1;
    let terminal = match result {
        _ if cancel.is_cancelled() => {
            json!({"v":VERSION,"type":"chat.done","requestId":chat.request_id,"seq":seq,"finishReason":"cancelled"})
        }
        Ok(()) => {
            json!({"v":VERSION,"type":"chat.done","requestId":chat.request_id,"seq":seq,"finishReason":"stop"})
        }
        Err(ref error) => {
            json!({"v":VERSION,"type":"chat.error","requestId":chat.request_id,"seq":seq,"code":error.code,"message":error.message})
        }
    };
    let status = if cancel.is_cancelled() {
        "回答生成已取消"
    } else if result.is_ok() {
        "回答生成完成"
    } else {
        "回答生成失败"
    };
    bridge
        .log(
            if result.is_ok() { "info" } else { "warn" },
            status,
            Some((&chat, started.elapsed().as_millis() as u64)),
        )
        .await;
    let _ = tokio::time::timeout(Duration::from_secs(5), output.send(terminal)).await;
}

async fn generation_frame(
    event: provider::GenerationEvent,
    request_id: &str,
    seq: u64,
    pending_tools: &PendingTools,
) -> Value {
    match event {
        provider::GenerationEvent::Text(delta) => {
            json!({"v":VERSION,"type":"chat.delta","requestId":request_id,"seq":seq,"delta":delta})
        }
        provider::GenerationEvent::ToolCall {
            call_id,
            name,
            arguments,
            reply,
        } => {
            pending_tools.lock().await.insert(call_id.clone(), reply);
            json!({"v":VERSION,"type":"tool.call","requestId":request_id,"seq":seq,"callId":call_id,"name":name,"arguments":arguments})
        }
    }
}

#[cfg(test)]
mod pairing_tests {
    use super::*;
    use storage::MemorySecretStore;
    use tokio_tungstenite::{
        connect_async,
        tungstenite::{
            client::IntoClientRequest, http::HeaderValue, Message as ClientSocketMessage,
        },
    };

    #[tokio::test]
    async fn expired_pairing_code_is_rejected_without_persisting_an_authorization() {
        let dir = tempfile::tempdir().unwrap();
        let bridge =
            Bridge::with_secrets(dir.path().into(), Arc::new(MemorySecretStore::new())).unwrap();
        let reservation = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let port = reservation.local_addr().unwrap().port();
        drop(reservation);
        bridge
            .start(port, vec!["http://localhost:4391".into()])
            .await
            .unwrap();
        let pairing = bridge.open_pairing().await.unwrap();
        // Move the actual server's window into the past without a two-minute sleep.
        bridge
            .inner
            .state
            .lock()
            .await
            .pairing
            .as_mut()
            .unwrap()
            .expires_at = now() - 1;
        let mut request = format!("ws://127.0.0.1:{port}/ws")
            .into_client_request()
            .unwrap();
        request
            .headers_mut()
            .insert("origin", HeaderValue::from_static("http://localhost:4391"));
        let (mut socket, _) = connect_async(request).await.unwrap();
        socket
            .send(ClientSocketMessage::Text(
                json!({"v":1,"type":"pair","code":pairing.code})
                    .to_string()
                    .into(),
            ))
            .await
            .unwrap();
        let frame = tokio::time::timeout(Duration::from_secs(5), socket.next())
            .await
            .unwrap()
            .unwrap()
            .unwrap();
        let denied: Value = serde_json::from_str(frame.to_text().unwrap()).unwrap();
        assert_eq!(denied["code"], "pairing_failed");
        assert!(denied.get("token").is_none());
        let snapshot = bridge.snapshot().await;
        assert!(snapshot.authorizations.is_empty());
        assert!(snapshot.connections.is_empty());
        assert!(!dir.path().join("authorizations.json").exists());
        bridge.stop().await;
    }
}
