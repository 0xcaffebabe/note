//! 提供方管理；浏览器只接收模型目录，不接收端点或凭据。
use super::Bridge;
use crate::{
    discovery::{self, DiscoveredProvider, DiscoveryPaths},
    model::{ModelOption, Provider, ProviderInput},
    model_catalog, provider,
};
use serde_json::{json, Value};

impl Bridge {
    /// 只读扫描 CLI 配置，保存候选指纹供导入时核验。
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

    /// 重新核验来源指纹，避免导入已变化的端点或凭据。
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

    /// 保存模型配置与凭据，发布变化并同步 worker。
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

    /// 删除配置和凭据，随后同步 worker 的可用模型。
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

    /// 原生侧只读获取候选模型，不自动改写已保存的模型选择或 CLI 配置。
    pub async fn fetch_provider_models(&self, id: String) -> Result<Vec<ModelOption>, String> {
        let (provider, secret) = self.provider_snapshot(id).await?;
        model_catalog::fetch(&self.inner.client, &provider, secret.as_deref()).await
    }

    /// 投影网站所需的模型字段，省略仅供本机使用的端点和凭据。
    pub(super) fn browser_providers(&self) -> Vec<Value> {
        self.inner
            .storage
            .providers()
            .into_iter()
            .filter(|provider| provider.enabled)
            .map(|provider| {
                json!({
                    "id": provider.id,
                    "name": provider.name,
                    "protocol": provider.protocol,
                    "model": provider.model,
                    "models": provider.model_options(),
                    "efforts": provider::supported_efforts(&provider),
                })
            })
            .collect()
    }

    /// 原生侧测试提供方连通性，只记录结果摘要。
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
}
