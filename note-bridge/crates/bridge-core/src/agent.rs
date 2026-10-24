//! 与随包 Pi worker 通信的私有边界；不暴露 CLI，也不把凭据放入 argv、环境变量或日志。
//!
//! `process` 管理子进程生命周期，`transport` 管理 RPC 关联与有界队列，
//! `pipes` 只负责管道读写和 JSONL 拆帧。对外保留稳定的 AgentProcess API。

mod command;
mod limits;
mod pipes;
mod process;
mod transport;

pub use command::AgentCommand;
pub use process::AgentProcess;
pub use transport::unavailable;
