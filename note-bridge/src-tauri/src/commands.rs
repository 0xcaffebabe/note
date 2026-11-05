//! Tauri IPC 命令适配层。
//!
//! 保持前端命令名与 bridge-core 业务方法的映射，不在这里维护代理或配对状态。

use bridge_core::{
    Bridge, DiscoveredProvider, DiscoveryPaths, ModelOption, PairingWindow, Provider,
    ProviderInput, Snapshot,
};
use tauri::State;
use tauri_plugin_dialog::DialogExt;

/// 读取可展示的桥接快照；不向界面返回密钥或完整问答。
#[tauri::command]
pub(crate) async fn get_snapshot(bridge: State<'_, Bridge>) -> Result<Snapshot, String> {
    Ok(bridge.snapshot().await)
}

/// 按界面明确提交的端口和 Origin 白名单启动本机桥接。
#[tauri::command]
pub(crate) async fn start_bridge(
    bridge: State<'_, Bridge>,
    port: u16,
    origins: Vec<String>,
) -> Result<(), String> {
    bridge.start(port, origins).await
}

/// 停止监听并关闭 worker；持久授权与可恢复任务保留供下次启动使用。
#[tauri::command]
pub(crate) async fn stop_bridge(bridge: State<'_, Bridge>) -> Result<(), String> {
    bridge.stop().await;
    Ok(())
}

/// 创建有时限的一次性配对码，由网站输入后完成授权。
#[tauri::command]
pub(crate) async fn open_pairing(bridge: State<'_, Bridge>) -> Result<PairingWindow, String> {
    bridge.open_pairing().await
}

/// 撤销指定连接所属的持久授权，并断开使用同一授权的全部连接。
#[tauri::command]
pub(crate) async fn revoke_connection(bridge: State<'_, Bridge>, id: String) -> Result<(), String> {
    bridge.revoke_connection(id).await
}

/// 撤销持久授权并终止使用该授权的连接和请求。
#[tauri::command]
pub(crate) async fn revoke_authorization(
    bridge: State<'_, Bridge>,
    id: String,
) -> Result<(), String> {
    bridge.revoke_authorization(id).await
}

/// 扫描本机 CLI 配置，只返回不含凭据的候选服务。
#[tauri::command]
pub(crate) async fn discover_providers(
    bridge: State<'_, Bridge>,
    paths: DiscoveryPaths,
) -> Result<Vec<DiscoveredProvider>, String> {
    Ok(bridge.discover(paths).await)
}

/// 按扫描候选 ID 导入服务；凭据始终在原生层内处理。
#[tauri::command]
pub(crate) async fn import_provider(
    bridge: State<'_, Bridge>,
    candidate_id: String,
) -> Result<Provider, String> {
    bridge.import_provider(candidate_id).await
}

/// 校验并保存服务配置；未提交新凭据时保留已保存的密钥。
#[tauri::command]
pub(crate) async fn save_provider(
    bridge: State<'_, Bridge>,
    input: ProviderInput,
) -> Result<Provider, String> {
    bridge.save_provider(input).await
}

/// 删除模型服务及其保存的凭据。
#[tauri::command]
pub(crate) async fn remove_provider(bridge: State<'_, Bridge>, id: String) -> Result<(), String> {
    bridge.remove_provider(id).await
}

/// 从已保存的服务地址获取模型目录，不发起问答生成。
#[tauri::command]
pub(crate) async fn fetch_provider_models(
    bridge: State<'_, Bridge>,
    id: String,
) -> Result<Vec<ModelOption>, String> {
    bridge.fetch_provider_models(id).await
}

/// 发送最小模型请求，检查本机配置的凭据和协议是否可用。
#[tauri::command]
pub(crate) async fn test_provider(bridge: State<'_, Bridge>, id: String) -> Result<(), String> {
    bridge.test_provider(id).await
}

/// 清空内存日志以及当前和上一份滚动日志文件。
#[tauri::command]
pub(crate) async fn clear_logs(bridge: State<'_, Bridge>) -> Result<(), String> {
    bridge.clear_logs().await;
    Ok(())
}

/// 通过系统文件对话框导出 bridge 诊断摘要；取消时返回 None。
#[tauri::command]
pub(crate) async fn save_logs(
    app: tauri::AppHandle,
    bridge: State<'_, Bridge>,
) -> Result<Option<String>, String> {
    let contents = bridge.export_logs().await;
    tauri::async_runtime::spawn_blocking(move || {
        let file = app
            .dialog()
            .file()
            .add_filter("Text log", &["txt"])
            .set_file_name("note-bridge-logs.txt")
            .blocking_save_file();
        let Some(file) = file else {
            return Ok(None);
        };
        let path = file
            .into_path()
            .map_err(|_| "无法访问选择的保存位置".to_string())?;
        std::fs::write(&path, contents).map_err(|error| format!("日志导出失败：{error}"))?;
        Ok(Some(path.to_string_lossy().into_owned()))
    })
    .await
    .map_err(|error| error.to_string())?
}
