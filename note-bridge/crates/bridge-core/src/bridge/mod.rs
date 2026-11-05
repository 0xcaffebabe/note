//! 应用门面与组装；网关、配置、授权和 worker 生命周期各自聚合。
mod connections;
mod contracts;
mod gateway;
mod lifecycle;
mod logging;
mod providers;
mod settings;
mod state;
#[cfg(test)]
mod tests;
mod worker;

use crate::{
    agent::AgentCommand,
    authorization, provider,
    storage::{SecretStore, Storage},
};
pub use contracts::{AuthorizationInfo, ConnectionInfo, LogEntry, PairingWindow, Snapshot};
use settings::load_settings;
use state::{Inner, Runtime};
use std::{
    collections::HashMap,
    path::PathBuf,
    sync::{Arc, RwLock},
    time::{SystemTime, UNIX_EPOCH},
};
use tokio::sync::{watch, Mutex, Semaphore};
use tokio_util::sync::CancellationToken;

const PAIR_TTL_MS: u64 = 120_000;
fn now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

/// 桌面端和 WebSocket 网关共用的应用门面。
///
/// 克隆共享内部资源，不创建第二个 worker。配置变更同步到受控子进程，
/// 配对和撤销共享状态锁；Agent 会话与知识正文不由本门面存储。
#[derive(Clone)]
pub struct Bridge {
    inner: Arc<Inner>,
}

impl Bridge {
    /// 加载应用配置和持久授权；凭据通过系统凭据库读取。
    pub fn new(data_dir: PathBuf) -> Result<Self, String> {
        let storage = Storage::new(data_dir.clone())?;
        Self::from_storage(data_dir, storage)
    }

    /// 为测试或嵌入环境注入隔离的凭据端口；桌面应用始终使用原生存储。
    pub fn with_secrets(data_dir: PathBuf, secrets: Arc<dyn SecretStore>) -> Result<Self, String> {
        let storage = Storage::with_secrets(data_dir.clone(), secrets)?;
        Self::from_storage(data_dir, storage)
    }

    fn from_storage(data_dir: PathBuf, storage: Storage) -> Result<Self, String> {
        let settings = load_settings(&data_dir)?;
        let authorizations = authorization::load(&data_dir)?;
        let logs = logging::load_logs(&data_dir);
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
                    logs,
                }),
            }),
        })
    }

    /// 返回桌面可显示的状态副本，不暴露凭据和内部可变状态。
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
}
