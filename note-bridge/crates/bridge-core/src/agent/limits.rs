//! 私有 worker 通道的资源预算；与站点 WebSocket 协议预算独立维护。

use std::time::Duration;

pub(super) const MAX_LINE_BYTES: usize = 16 * 1024 * 1024;
pub(super) const MAX_PENDING_REQUESTS: usize = 64;
pub(super) const INPUT_QUEUE_CAPACITY: usize = 64;
pub(super) const EVENT_QUEUE_CAPACITY: usize = 128;
pub(super) const RPC_TIMEOUT: Duration = Duration::from_secs(45);
pub(super) const WRITE_TIMEOUT: Duration = Duration::from_secs(10);
pub(super) const SHUTDOWN_RPC_TIMEOUT: Duration = Duration::from_secs(5);
pub(super) const CHILD_EXIT_TIMEOUT: Duration = Duration::from_secs(3);
