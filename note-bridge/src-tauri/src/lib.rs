use bridge_core::{
    Bridge, DiscoveredProvider, DiscoveryPaths, PairingWindow, Provider, ProviderInput, Snapshot,
};
use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, State,
};
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
async fn get_snapshot(bridge: State<'_, Bridge>) -> Result<Snapshot, String> {
    Ok(bridge.snapshot().await)
}

#[tauri::command]
async fn start_bridge(
    bridge: State<'_, Bridge>,
    port: u16,
    origins: Vec<String>,
) -> Result<(), String> {
    bridge.start(port, origins).await
}

#[tauri::command]
async fn stop_bridge(bridge: State<'_, Bridge>) -> Result<(), String> {
    bridge.stop().await;
    Ok(())
}

#[tauri::command]
async fn open_pairing(bridge: State<'_, Bridge>) -> Result<PairingWindow, String> {
    bridge.open_pairing().await
}

#[tauri::command]
async fn revoke_connection(bridge: State<'_, Bridge>, id: String) -> Result<(), String> {
    bridge.revoke_connection(id).await
}

#[tauri::command]
async fn revoke_authorization(bridge: State<'_, Bridge>, id: String) -> Result<(), String> {
    bridge.revoke_authorization(id).await
}

#[tauri::command]
async fn discover_providers(
    bridge: State<'_, Bridge>,
    paths: DiscoveryPaths,
) -> Result<Vec<DiscoveredProvider>, String> {
    Ok(bridge.discover(paths).await)
}

#[tauri::command]
async fn import_provider(
    bridge: State<'_, Bridge>,
    candidate_id: String,
) -> Result<Provider, String> {
    bridge.import_provider(candidate_id).await
}

#[tauri::command]
async fn save_provider(
    bridge: State<'_, Bridge>,
    input: ProviderInput,
) -> Result<Provider, String> {
    bridge.save_provider(input).await
}

#[tauri::command]
async fn remove_provider(bridge: State<'_, Bridge>, id: String) -> Result<(), String> {
    bridge.remove_provider(id).await
}

#[tauri::command]
async fn test_provider(bridge: State<'_, Bridge>, id: String) -> Result<(), String> {
    bridge.test_provider(id).await
}

#[tauri::command]
async fn clear_logs(bridge: State<'_, Bridge>) -> Result<(), String> {
    bridge.clear_logs().await;
    Ok(())
}

#[tauri::command]
async fn save_logs(
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

fn show_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

fn tray_icon() -> Image<'static> {
    let mut pixels = Vec::with_capacity(32 * 32 * 4);
    for y in 0..32 {
        for x in 0..32 {
            let mark = (6..26).contains(&y)
                && ((6..10).contains(&x)
                    || (22..26).contains(&x)
                    || (x as i32 - (7 + (y - 6) * 4 / 5) as i32).abs() < 3);
            pixels.extend_from_slice(if mark {
                &[65, 76, 135, 255]
            } else {
                &[0, 0, 0, 0]
            });
        }
    }
    Image::new_owned(pixels, 32, 32)
}

pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            show_window(app)
        }))
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_snapshot,
            start_bridge,
            stop_bridge,
            open_pairing,
            revoke_connection,
            revoke_authorization,
            discover_providers,
            import_provider,
            save_provider,
            remove_provider,
            test_provider,
            clear_logs,
            save_logs
        ])
        .setup(|app| {
            let bridge = Bridge::new(app.path().app_data_dir()?).map_err(std::io::Error::other)?;
            app.manage(bridge.clone());
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
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                show_window(app);
                            }
                        }
                    }
                    "toggle" => {
                        let app = app.clone();
                        tauri::async_runtime::spawn(async move {
                            let bridge = app.state::<Bridge>();
                            let snapshot = bridge.snapshot().await;
                            if snapshot.running {
                                bridge.stop().await;
                            } else if let Err(error) =
                                bridge.start(snapshot.port, snapshot.allowed_origins).await
                            {
                                show_window(&app);
                                app.dialog()
                                    .message(error)
                                    .title("无法启动桥接服务")
                                    .show(|_| {});
                            }
                        });
                    }
                    "quit" => {
                        let app = app.clone();
                        tauri::async_runtime::spawn(async move {
                            app.state::<Bridge>().stop().await;
                            app.exit(0);
                        });
                    }
                    _ => {}
                })
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
            tauri::async_runtime::spawn(async move {
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
            });
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
