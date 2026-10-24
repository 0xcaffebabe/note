//! 内部状态。配对消费、授权落盘、连接注册和撤销必须共享同一把锁。
use super::{
    contracts::{ConnectionInfo, LogEntry, PairingWindow},
    settings::Settings,
};
use crate::{
    agent::{AgentCommand, AgentProcess},
    authorization::Authorization,
    discovery::DiscoveryPaths,
    storage::Storage,
};
use std::{
    collections::{HashMap, VecDeque},
    path::PathBuf,
    sync::{Arc, RwLock},
};
use tokio::{
    sync::{watch, Mutex, Semaphore},
    task::JoinHandle,
};
use tokio_util::sync::CancellationToken;

/// bridge 内部共享资源；可见性限制在应用门面，协议和模型层不能直接修改。
pub(super) struct Inner {
    pub(super) storage: Storage,
    pub(super) data_dir: PathBuf,
    pub(super) client: reqwest::Client,
    pub(super) state: Mutex<Runtime>,
    pub(super) slots: Arc<Semaphore>,
    pub(super) provider_changes: watch::Sender<u64>,
    pub(super) agent: Mutex<Option<Arc<AgentProcess>>>,
    pub(super) agent_command: RwLock<AgentCommand>,
    pub(super) lifecycle: Mutex<()>,
}

/// 配对、授权与连接的同步状态，单一 mutex 保护跨字段的认证不变量。
pub(super) struct Runtime {
    pub(super) running: bool,
    pub(super) settings: Settings,
    pub(super) shutdown: CancellationToken,
    pub(super) server: Option<JoinHandle<()>>,
    pub(super) supervisor: Option<JoinHandle<()>>,
    pub(super) pairing: Option<PairingWindow>,
    pub(super) pair_attempts: u8,
    pub(super) sessions: HashMap<String, Session>,
    pub(super) authorizations: Vec<Authorization>,
    pub(super) discovered: HashMap<String, (DiscoveryPaths, String)>,
    pub(super) logs: VecDeque<LogEntry>,
}

/// 临时连接及所属持久授权；连接取消只关闭通道，任务取消由 worker 处理。
pub(super) struct Session {
    pub(super) info: ConnectionInfo,
    pub(super) authorization_id: String,
    pub(super) cancel: CancellationToken,
}
