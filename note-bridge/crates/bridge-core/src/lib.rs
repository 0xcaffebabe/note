//! Note Bridge 原生应用层：本机授权、配置与 worker 网关。
//! Pi 执行和聊天持久化由 Node worker 负责；知识正文仍由网站独立发布。
pub mod agent;
mod authorization;
mod bridge;
pub mod discovery;
pub mod model;
pub mod model_catalog;
mod origin;
pub mod protocol;
pub mod provider;
pub mod storage;

pub use bridge::{AuthorizationInfo, Bridge, ConnectionInfo, LogEntry, PairingWindow, Snapshot};
pub use discovery::{DiscoveredProvider, DiscoveryPaths};
pub use model::{ModelOption, Provider, ProviderInput};
