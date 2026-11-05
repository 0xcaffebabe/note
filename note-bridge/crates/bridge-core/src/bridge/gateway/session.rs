//! 连接生命周期：认证、订阅、事件转发以及断线清理。

use super::super::Bridge;
use super::{
    authentication::{authenticate, Authenticated},
    frames::{error, send},
    output::spawn_writer,
    requests::handle_message,
};
use crate::{agent::AgentProcess, protocol::VERSION};
use axum::extract::ws::WebSocket;
use futures_util::StreamExt;
use serde_json::{json, Value};
use std::{sync::Arc, time::Duration};
use tokio::{sync::mpsc, task::JoinSet};
use tokio_util::sync::CancellationToken;

/// 转发已认证 RPC 和提交事件；断开仅 detach，不终止后台回答。
pub(super) async fn socket_session(
    bridge: Bridge,
    mut socket: WebSocket,
    origin: String,
    shutdown: CancellationToken,
) {
    let Some(identity) = authenticate(&bridge, &mut socket, &origin, &shutdown).await else {
        return;
    };
    serve_connection(&bridge, socket, &identity).await;
    bridge
        .inner
        .state
        .lock()
        .await
        .sessions
        .remove(&identity.info.id);
}

/// 只有 worker 配置同步成功才返回 token；先订阅再检查存活，防止漏掉退出事件。
async fn serve_connection(bridge: &Bridge, mut socket: WebSocket, identity: &Authenticated) {
    let Some(worker) = prepare_worker(bridge, &mut socket, &identity.cancel).await else {
        return;
    };
    let mut events = worker.subscribe();
    if !worker.alive() {
        return;
    }
    let mut provider_changes = bridge.inner.provider_changes.subscribe();
    let reply = json!({
        "v": VERSION,
        "type": "auth.ok",
        "token": identity.token,
        "providers": bridge.browser_providers(),
        "connectionId": identity.info.id,
        "authorizationId": identity.authorization_id,
        "capabilities": ["persistent_sessions", "knowledge_tools"],
    });
    let authenticated = tokio::select! {
        biased;
        _ = identity.cancel.cancelled() => false,
        sent = send(&mut socket, reply) => sent,
    };
    if !authenticated {
        return;
    }
    let (sink, mut source) = socket.split();
    let (output, writer) = spawn_writer(sink, identity.cancel.clone());
    let mut calls = JoinSet::new();
    loop {
        let incoming = tokio::select! {
            biased;
            _ = identity.cancel.cancelled() => break,
            event = events.recv() => {
                // 事件丢失时通过重连获得完整快照，不能继续使用不完整的增量。
                let Ok(event) = event else {
                    break;
                };
                if !forward_event(event, &identity.info.id, &output).await {
                    break;
                }
                continue;
            },
            changed = provider_changes.changed() => {
                if changed.is_err() {
                    break;
                }
                let _ = output.send(json!({
                    "v": VERSION,
                    "type": "providers.updated",
                    "providers": bridge.browser_providers(),
                })).await;
                continue;
            },
            Some(_) = calls.join_next(), if !calls.is_empty() => {
                continue;
            },
            result = tokio::time::timeout(Duration::from_secs(90), source.next()) => {
                match result {
                    Ok(Some(Ok(message))) => message,
                    _ => break,
                }
            },
        };
        if !handle_message(incoming, bridge, identity, &worker, &output, &mut calls).await {
            break;
        }
    }
    identity.cancel.cancel();
    finish_requests(&mut calls).await;
    let _ = tokio::time::timeout(
        Duration::from_secs(3),
        worker.call("detach", json!({"connectionId": identity.info.id})),
    )
    .await;
    drop(output);
    let _ = writer.await;
}

async fn prepare_worker(
    bridge: &Bridge,
    socket: &mut WebSocket,
    cancel: &CancellationToken,
) -> Option<Arc<AgentProcess>> {
    let prepared = tokio::select! {
        biased;
        _ = cancel.cancelled() => return None,
        prepared = bridge.ensure_agent() => prepared,
    };
    let worker = match prepared {
        Ok(worker) => worker,
        Err(_) => {
            send(
                socket,
                error("agent_unavailable", "Agent 服务正在恢复，请稍后重连"),
            )
            .await;
            return None;
        }
    };
    let configured = tokio::select! {
        biased;
        _ = cancel.cancelled() => false,
        result = bridge.sync_agent_configuration() => result.is_ok(),
    };
    configured.then_some(worker)
}

/// 只投影属于当前连接的产品事件，不向浏览器暴露内部 worker 消息。
async fn forward_event(event: Value, connection_id: &str, output: &mpsc::Sender<Value>) -> bool {
    if event["event"] == "worker.offline" {
        return false;
    }
    if event["connectionId"] != connection_id {
        return true;
    }
    let kind = event["event"].as_str().unwrap_or("");
    if !matches!(kind, "session.updated" | "sessions.changed") {
        return true;
    }
    let mut payload = event["data"].as_object().cloned().unwrap_or_default();
    payload.insert("v".into(), json!(VERSION));
    payload.insert("type".into(), json!(kind));
    matches!(
        tokio::time::timeout(Duration::from_secs(5), output.send(Value::Object(payload))).await,
        Ok(Ok(()))
    )
}

/// 断线前等待已准入请求；超时仅回收 RPC 等待任务，不主动取消持久 Agent 回合。
async fn finish_requests(calls: &mut JoinSet<()>) {
    while !calls.is_empty() {
        if tokio::time::timeout(Duration::from_secs(2), calls.join_next())
            .await
            .is_err()
        {
            calls.abort_all();
            break;
        }
    }
}
