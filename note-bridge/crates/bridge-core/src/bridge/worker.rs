//! Worker 组装与配置同步；凭据只从原生存储交给受控子进程。
use super::Bridge;
use crate::agent::{AgentCommand, AgentProcess};
use serde_json::{json, Value};
use std::sync::Arc;

#[cfg(test)]
mod tests;

impl Bridge {
    /// 桌面注入包内运行时路径；测试和开发可注入隔离的 worker fixture。
    pub fn set_agent_command(&self, command: AgentCommand) {
        *self
            .inner
            .agent_command
            .write()
            .expect("agent command lock") = command;
    }

    /// 只向受控 worker 提供已启用配置；读取凭据在阻塞线程完成，不占用状态锁。
    async fn agent_configuration(&self) -> Result<Value, String> {
        let authorizations = {
            let state = self.inner.state.lock().await;
            state
                .authorizations
                .iter()
                .filter(|grant| state.settings.allowed_origins.contains(&grant.origin))
                .map(|grant| json!({"id": grant.id, "origin": grant.origin}))
                .collect::<Vec<_>>()
        };
        let bridge = self.clone();
        let providers = tokio::task::spawn_blocking(move || -> Result<Vec<Value>, String> {
            Ok(bridge
                .inner
                .storage
                .enabled_providers_with_secrets()?
                .into_iter()
                .map(|(provider, secret)| {
                    let mut value = serde_json::to_value(provider).expect("provider serialization");
                    if let Some(secret) = secret {
                        value["secret"] = json!(secret);
                    }
                    value
                })
                .collect())
        })
        .await
        .map_err(|_| "无法读取模型配置")??;
        Ok(json!({
            "providers": providers,
            "authorizations": authorizations,
        }))
    }

    /// 在 worker 槽锁内关闭旧进程并启动新进程，确保 SQLite 只有一个所有者。
    pub(super) async fn ensure_agent(&self) -> Result<Arc<AgentProcess>, String> {
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

    /// 同步失败即关闭旧 worker，不能让已经撤销的授权继续产生模型请求。
    pub(super) async fn sync_agent_configuration(&self) -> Result<(), String> {
        let slot = self.inner.agent.lock().await;
        if let Some(worker) = slot.as_ref().filter(|worker| worker.alive()) {
            let config = self.agent_configuration().await?;
            if worker.call("configure", config).await.is_err() {
                worker.shutdown().await;
                return Err("Agent 配置同步失败，服务将自动恢复".into());
            }
        }
        Ok(())
    }
}
