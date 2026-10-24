//! 监听和 worker supervisor 生命周期；启动与停止共享 lifecycle 锁。
use super::{
    gateway,
    settings::{save_settings, validate_settings, Settings},
    Bridge,
};
use axum::{routing::get, Router};
use std::time::Duration;
use tokio::net::TcpListener;
use tokio_util::sync::CancellationToken;

impl Bridge {
    /// 串行启动本机回环监听和唯一 worker。
    pub async fn start(&self, port: u16, origins: Vec<String>) -> Result<(), String> {
        let _lifecycle = self.inner.lifecycle.lock().await;
        validate_settings(port, &origins)?;
        let mut state = self.inner.state.lock().await;
        if state.running {
            return Err("服务已启动，请先停止后修改设置".into());
        }
        let listener = TcpListener::bind((std::net::Ipv4Addr::LOCALHOST, port))
            .await
            .map_err(|_| "无法监听本机端口，端口可能已被占用".to_string())?;
        let settings = Settings {
            port,
            allowed_origins: origins,
        };
        save_settings(&self.inner.data_dir, &settings)?;
        state.settings = settings;
        drop(state);
        self.ensure_agent().await?;
        let mut state = self.inner.state.lock().await;
        state.shutdown = CancellationToken::new();
        let shutdown = state.shutdown.clone();
        state.running = true;
        let app = Router::new()
            .route("/ws", get(gateway::upgrade))
            .with_state(self.clone());
        state.server = Some(tokio::spawn(async move {
            let _ = axum::serve(listener, app)
                .with_graceful_shutdown(shutdown.cancelled_owned())
                .await;
        }));
        let bridge = self.clone();
        let shutdown = state.shutdown.clone();
        state.supervisor = Some(tokio::spawn(async move {
            let mut delay = 2;
            loop {
                tokio::select! {
                    _ = shutdown.cancelled() => break,
                    _ = tokio::time::sleep(Duration::from_secs(delay)) => {}
                }
                if bridge.ensure_agent().await.is_err() {
                    delay = (delay * 2).min(30);
                } else {
                    delay = 2;
                }
            }
        }));
        drop(state);
        self.log("info", "本机服务与 Agent 已启动", None).await;
        Ok(())
    }

    /// 停止连接并关闭 worker，让 Pi 将可恢复任务写回 SQLite。
    pub async fn stop(&self) {
        let _lifecycle = self.inner.lifecycle.lock().await;
        let mut state = self.inner.state.lock().await;
        state.running = false;
        state.shutdown.cancel();
        state.pairing = None;
        for session in state.sessions.values() {
            session.cancel.cancel();
        }
        state.sessions.clear();
        let server = state.server.take();
        let supervisor = state.supervisor.take();
        drop(state);
        if let Some(task) = supervisor {
            task.abort();
            let _ = task.await;
        }
        if let Some(mut task) = server {
            if tokio::time::timeout(Duration::from_secs(3), &mut task)
                .await
                .is_err()
            {
                task.abort();
            }
        }
        if let Some(worker) = self.inner.agent.lock().await.take() {
            worker.shutdown().await;
        }
        self.log("info", "本机服务已停止，Agent 状态已保存", None)
            .await;
    }
}
