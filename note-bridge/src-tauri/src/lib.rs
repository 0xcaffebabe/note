//! note-bridge 桌面进程的组装入口。
//!
//! 业务由 bridge-core 管理；本模块只装配平台插件、命令、托盘和退出清理。

mod commands;
mod tray;

use bridge_core::Bridge;
use tauri::Manager;

/// 装配本机服务与桌面窗口，并在进程退出前停止桥接。
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            tray::show_window(app)
        }))
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_snapshot,
            commands::start_bridge,
            commands::stop_bridge,
            commands::open_pairing,
            commands::revoke_connection,
            commands::revoke_authorization,
            commands::discover_providers,
            commands::import_provider,
            commands::save_provider,
            commands::remove_provider,
            commands::fetch_provider_models,
            commands::test_provider,
            commands::clear_logs,
            commands::save_logs
        ])
        .setup(|app| {
            let bridge = Bridge::new(app.path().app_data_dir()?).map_err(std::io::Error::other)?;
            configure_packaged_agent(app, &bridge)?;
            app.manage(bridge.clone());
            tray::install(app, bridge)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .build(tauri::generate_context!())
        .expect("无法启动 note-bridge 桌面应用");
    app.run(|app, event| {
        if matches!(event, tauri::RunEvent::Exit) {
            tauri::async_runtime::block_on(app.state::<Bridge>().stop());
        }
    });
}

/// 发布包使用随应用附带的 Node 和代理入口；开发模式保留 bridge-core 的默认定位。
fn configure_packaged_agent(
    app: &tauri::App,
    bridge: &Bridge,
) -> Result<(), Box<dyn std::error::Error>> {
    if cfg!(debug_assertions) {
        return Ok(());
    }
    let executable = std::env::current_exe()?;
    let binary_dir = executable
        .parent()
        .ok_or_else(|| std::io::Error::other("无法定位 Agent 运行时"))?;
    let node_name = if cfg!(windows) {
        "note-agent-node.exe"
    } else {
        "note-agent-node"
    };
    bridge.set_agent_command(bridge_core::agent::AgentCommand {
        node: binary_dir.join(node_name),
        entry: app.path().resource_dir()?.join("agent/dist/index.js"),
    });
    Ok(())
}
