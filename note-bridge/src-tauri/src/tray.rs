//! 托盘菜单、窗口唤起和菜单状态同步。
//!
//! 托盘操作仍调用 Bridge 的同一生命周期接口；关闭窗口不会停止本机服务。

use bridge_core::Bridge;
use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};
use tauri_plugin_dialog::DialogExt;

/// 显示并聚焦主窗口，供托盘和单实例激活共用。
pub(crate) fn show_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

/// 在内存中生成跨平台托盘图标，不依赖外部图片资源。
fn tray_icon() -> Image<'static> {
    let mut pixels = Vec::with_capacity(32 * 32 * 4);
    for y in 0_i32..32 {
        for x in 0_i32..32 {
            let mark = (6..26).contains(&y)
                && ((6..10).contains(&x)
                    || (22..26).contains(&x)
                    || (x - (7 + (y - 6) * 4 / 5)).abs() < 3);
            pixels.extend_from_slice(if mark {
                &[65, 76, 135, 255]
            } else {
                &[0, 0, 0, 0]
            });
        }
    }
    Image::new_owned(pixels, 32, 32)
}

/// 安装托盘并同步运行状态；Bridge 在应用退出时由入口统一停止。
pub(crate) fn install(app: &tauri::App, bridge: Bridge) -> Result<(), Box<dyn std::error::Error>> {
    let status = MenuItem::with_id(app, "status", "服务已停止", false, None::<&str>)?;
    let show = MenuItem::with_id(app, "show", "显示 / 隐藏窗口", true, None::<&str>)?;
    let toggle = MenuItem::with_id(app, "toggle", "启动服务", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "退出 note-bridge", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&status, &show, &toggle, &quit])?;
    TrayIconBuilder::new()
        .icon(tray_icon())
        .icon_as_template(cfg!(target_os = "macos"))
        .tooltip("note-bridge · 本地模型桥接")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| handle_menu_action(app, event.id.as_ref()))
        .on_tray_icon_event(|tray, event| {
            if matches!(
                event,
                TrayIconEvent::Click {
                    button: MouseButton::Left,
                    button_state: MouseButtonState::Up,
                    ..
                }
            ) {
                show_window(tray.app_handle());
            }
        })
        .build(app)?;
    tauri::async_runtime::spawn(sync_menu_status(bridge, status, toggle));
    Ok(())
}

/// 将托盘菜单事件分派到窗口、服务和退出操作，保持安装过程只负责组装。
fn handle_menu_action(app: &tauri::AppHandle, action: &str) {
    match action {
        "show" => toggle_window(app),
        "toggle" => {
            tauri::async_runtime::spawn(toggle_bridge(app.clone()));
        }
        "quit" => {
            let app = app.clone();
            tauri::async_runtime::spawn(async move {
                app.state::<Bridge>().stop().await;
                app.exit(0);
            });
        }
        _ => {}
    }
}

fn toggle_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            show_window(app);
        }
    }
}

/// 服务启动失败时打开主窗口并展示原生提示，避免托盘操作静默失败。
async fn toggle_bridge(app: tauri::AppHandle) {
    let bridge = app.state::<Bridge>();
    let snapshot = bridge.snapshot().await;
    if snapshot.running {
        bridge.stop().await;
    } else if let Err(error) = bridge.start(snapshot.port, snapshot.allowed_origins).await {
        show_window(&app);
        app.dialog()
            .message(error)
            .title("无法启动桥接服务")
            .show(|_| {});
    }
}

/// 以快照更新菜单文案；后台任务随桌面进程退出而结束。
async fn sync_menu_status(
    bridge: Bridge,
    status: MenuItem<tauri::Wry>,
    toggle: MenuItem<tauri::Wry>,
) {
    loop {
        let snapshot = bridge.snapshot().await;
        let _ = status.set_text(if snapshot.running {
            "服务运行中"
        } else {
            "服务已停止"
        });
        let _ = toggle.set_text(if snapshot.running {
            "停止服务"
        } else {
            "启动服务"
        });
        tokio::time::sleep(std::time::Duration::from_secs(1)).await;
    }
}
