pub mod agent;
mod authorization;
pub mod discovery;
pub mod model;
pub mod model_catalog;
pub mod protocol;
pub mod provider;
pub mod storage;

use agent::{AgentCommand, AgentProcess};
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
use protocol::{ClientFrame, ClientMessage, VERSION};
use rand::Rng;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{
    collections::{HashMap, VecDeque},
    fs,
    io::Write,
    path::PathBuf,
    sync::{Arc, RwLock},
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use storage::{SecretStore, Storage};
use tokio::{
    net::TcpListener,
    sync::{mpsc, watch, Mutex, Semaphore},
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
    agent: Mutex<Option<Arc<AgentProcess>>>,
    agent_command: RwLock<AgentCommand>,
    lifecycle: Mutex<()>,
}

struct Runtime {
    running: bool,
    settings: Settings,
    shutdown: CancellationToken,
    server: Option<JoinHandle<()>>,
    supervisor: Option<JoinHandle<()>>,
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
                agent: Mutex::new(None),
                agent_command: RwLock::new(AgentCommand::default()),
                lifecycle: Mutex::new(()),
                state: Mutex::new(Runtime {
                    running: false,
                    settings,
                    shutdown: CancellationToken::new(),
                    server: None,
                    supervisor: None,
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

    /// Desktop injects packaged paths; tests/dev may inject isolated worker fixtures.
    pub fn set_agent_command(&self, command: AgentCommand) {
        *self
            .inner
            .agent_command
            .write()
            .expect("agent command lock") = command;
    }

    async fn agent_configuration(&self) -> Result<Value, String> {
        let authorizations = {
            let state = self.inner.state.lock().await;
            state
                .authorizations
                .iter()
                .filter(|grant| state.settings.allowed_origins.contains(&grant.origin))
                .map(|grant| json!({"id":grant.id,"origin":grant.origin}))
                .collect::<Vec<_>>()
        };
        let bridge = self.clone();
        let providers = tokio::task::spawn_blocking(move || {
            bridge
                .inner
                .storage
                .providers()
                .into_iter()
                .filter(|p| p.enabled)
                .map(|provider| {
                    let secret = bridge
                        .inner
                        .storage
                        .provider_with_secret(&provider.id)
                        .ok()
                        .and_then(|(_, secret)| secret);
                    let mut value = serde_json::to_value(provider).expect("provider serialization");
                    if let Some(secret) = secret {
                        value["secret"] = json!(secret);
                    }
                    value
                })
                .collect::<Vec<_>>()
        })
        .await
        .map_err(|_| "无法读取模型配置")?;
        Ok(json!({"providers":providers,"authorizations":authorizations}))
    }

    async fn ensure_agent(&self) -> Result<Arc<AgentProcess>, String> {
        let mut slot = self.inner.agent.lock().await;
        if let Some(worker) = slot.as_ref().filter(|worker| worker.alive()) {
            return Ok(worker.clone());
        }
        if let Some(previous) = slot.take() {
            previous.shutdown().await;
        }
        let mut config = self.agent_configuration().await?;
        config["dataDir"] = json!(self.inner.data_dir.join("agent"));
        let command = self
            .inner
            .agent_command
            .read()
            .expect("agent command lock")
            .clone();
        let worker = AgentProcess::spawn(&command, config).await?;
        *slot = Some(worker.clone());
        Ok(worker)
    }

    async fn sync_agent_configuration(&self) -> Result<(), String> {
        let slot = self.inner.agent.lock().await;
        if let Some(worker) = slot.as_ref().filter(|worker| worker.alive()) {
            let config = self.agent_configuration().await?;
            if worker.call("configure", config).await.is_err() {
                // A failed revocation/config update must never leave a stale worker making requests.
                worker.shutdown().await;
                return Err("Agent 配置同步失败，服务将自动恢复".into());
            }
        }
        Ok(())
    }

    pub async fn start(&self, port: u16, origins: Vec<String>) -> Result<(), String> {
        let _lifecycle = self.inner.lifecycle.lock().await;
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
        drop(state);
        self.ensure_agent().await?;
        let mut state = self.inner.state.lock().await;
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
        let bridge = self.clone();
        let shutdown = state.shutdown.clone();
        state.supervisor = Some(tokio::spawn(async move {
            let mut delay = 2;
            loop {
                tokio::select! { _ = shutdown.cancelled() => break, _ = tokio::time::sleep(Duration::from_secs(delay)) => {} }
                if bridge.ensure_agent().await.is_err() {
                    delay = (delay * 2).min(30);
                } else {
                    delay = 2;
                }
            }
        }));
        drop(state);
        self.log("info", "本机服务与 Agent 已启动", None).await;
        Ok(())
    }

    pub async fn stop(&self) {
        let _lifecycle = self.inner.lifecycle.lock().await;
        let mut state = self.inner.state.lock().await;
        state.running = false;
        state.shutdown.cancel();
        state.pairing = None;
        for session in state.sessions.values() {
            session.cancel.cancel();
        }
        state.sessions.clear();
        let server = state.server.take();
        let supervisor = state.supervisor.take();
        drop(state);
        if let Some(task) = supervisor {
            task.abort();
            let _ = task.await;
        }
        if let Some(mut task) = server {
            if tokio::time::timeout(Duration::from_secs(3), &mut task)
                .await
                .is_err()
            {
                task.abort();
            }
        }
        if let Some(worker) = self.inner.agent.lock().await.take() {
            worker.shutdown().await;
        }
        self.log("info", "本机服务已停止，Agent 状态已保存", None)
            .await;
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
        self.sync_agent_configuration().await?;
        self.log("info", "已撤销网站授权", None).await;
        Ok(())
    }

    pub async fn revoke_authorization(&self, id: String) -> Result<(), String> {
        let mut state = self.inner.state.lock().await;
        self.revoke_locked(&mut state, &id)?;
        drop(state);
        self.sync_agent_configuration().await?;
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
        self.sync_agent_configuration().await?;
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
        self.sync_agent_configuration().await?;
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
        let result = provider::probe(&self.inner.client, &provider, secret.as_deref()).await;
        self.log(
            if result.is_ok() { "info" } else { "warn" },
            if result.is_ok() {
                "模型连接测试成功"
            } else {
                "模型连接测试失败"
            },
            None,
        )
        .await;
        result
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

    async fn log(&self, level: &str, message: &str, chat: Option<(&str, &str, &str, u64)>) {
        let entry = LogEntry {
            timestamp: now(),
            level: level.into(),
            message: message.into(),
            request_id: chat.map(|(id, _, _, _)| id.into()),
            provider_id: chat.map(|(_, provider, _, _)| provider.into()),
            model: chat.map(|(_, _, model, _)| model.into()),
            duration_ms: chat.map(|(_, _, _, ms)| ms),
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
    let prepared = tokio::select! {
        biased;
        _ = connection_cancel.cancelled() => { remove_session(&bridge, &info.id).await; return; },
        prepared = bridge.ensure_agent() => prepared,
    };
    let worker = match prepared {
        Ok(worker) => worker,
        Err(_) => {
            send(
                &mut socket,
                error("agent_unavailable", "Agent 服务正在恢复，请稍后重连"),
            )
            .await;
            remove_session(&bridge, &info.id).await;
            return;
        }
    };
    let configured = tokio::select! {
        biased;
        _ = connection_cancel.cancelled() => false,
        result = bridge.sync_agent_configuration() => result.is_ok(),
    };
    if !configured {
        remove_session(&bridge, &info.id).await;
        return;
    }
    let mut events = worker.subscribe();
    // Subscribe before this check, so an exit cannot be lost between preparation and the event loop.
    if !worker.alive() {
        remove_session(&bridge, &info.id).await;
        return;
    }
    let mut provider_changes = bridge.inner.provider_changes.subscribe();
    let authenticated = tokio::select! {
        biased;
        _ = connection_cancel.cancelled() => false,
        sent = send(&mut socket, json!({"v":VERSION,"type":"auth.ok","token":token,"providers":bridge.browser_providers(),"connectionId":info.id,"authorizationId":authorization_id,"capabilities":["persistent_sessions","knowledge_tools"]})) => sent,
    };
    if !authenticated {
        remove_session(&bridge, &info.id).await;
        return;
    }
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
    let mut calls = tokio::task::JoinSet::new();
    loop {
        let incoming = tokio::select! {
            biased;
            _ = connection_cancel.cancelled() => break,
            event = events.recv() => {
                match event {
                    Ok(frame) if frame["event"] == "worker.offline" => break,
                    Ok(frame) if frame["connectionId"] == info.id => {
                        let kind = frame["event"].as_str().unwrap_or("");
                        if matches!(kind, "session.updated" | "sessions.changed") {
                            let mut payload = frame["data"].as_object().cloned().unwrap_or_default();
                            payload.insert("v".into(), json!(VERSION)); payload.insert("type".into(), json!(kind));
                            if !matches!(tokio::time::timeout(Duration::from_secs(5), tx.send(Value::Object(payload))).await, Ok(Ok(()))) { break; }
                        }
                    }
                    Ok(_) => {},
                    // Lost increments require a fresh snapshot, obtained by reconnecting.
                    Err(_) => break,
                }
                continue;
            },
            changed = provider_changes.changed() => {
                if changed.is_err() { break; }
                let _ = tx.send(json!({"v":VERSION,"type":"providers.updated","providers":bridge.browser_providers()})).await;
                continue;
            },
            Some(_) = calls.join_next(), if !calls.is_empty() => { continue; },
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
                    .send(error(
                        "invalid_message",
                        "消息格式或协议版本无效，请更新站点与 bridge",
                    ))
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
                        .send(error("forget_failed", "授权更新失败，请在桌面端检查服务"))
                        .await;
                }
                break;
            }
            ClientMessage::Ping => {
                let _ = tx.send(json!({"v":VERSION,"type":"pong"})).await;
            }
            ClientMessage::Request { id, method, params } => {
                if !protocol::valid_request(&id, &method, &params) || calls.len() >= 16 {
                    let _ = tx.send(json!({"v":VERSION,"type":"response","id":id.chars().take(80).collect::<String>(),"error":{"code":"request_rejected","message":"请求无效或过多"}})).await;
                    continue;
                }
                let worker = worker.clone();
                let output = tx.clone();
                let request = json!({"connectionId":info.id,"authorizationId":authorization_id,"origin":origin,"request":{"id":id,"method":method,"params":params}});
                calls.spawn(async move {
                    let result = worker.call("request", request).await;
                    let frame = match result {
                        Ok(result) => {
                            json!({"v":VERSION,"type":"response","id":id,"result":result})
                        }
                        Err(error) => json!({"v":VERSION,"type":"response","id":id,"error":error}),
                    };
                    let _ = tokio::time::timeout(Duration::from_secs(5), output.send(frame)).await;
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
    // Finish already-admitted RPCs before detach; neither disconnect nor unsubscribe cancels a Pi run.
    while !calls.is_empty() {
        if tokio::time::timeout(Duration::from_secs(2), calls.join_next())
            .await
            .is_err()
        {
            calls.abort_all();
            break;
        }
    }
    let _ = tokio::time::timeout(
        Duration::from_secs(3),
        worker.call("detach", json!({"connectionId":info.id})),
    )
    .await;
    drop(tx);
    let _ = writer.await;
    remove_session(&bridge, &info.id).await;
}
async fn remove_session(bridge: &Bridge, id: &str) {
    bridge.inner.state.lock().await.sessions.remove(id);
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
        bridge.set_agent_command(AgentCommand {
            entry: PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/worker.mjs"),
            ..AgentCommand::default()
        });
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
                json!({"v":VERSION,"type":"pair","code":pairing.code})
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
