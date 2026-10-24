//! 已认证消息的产品协议分派；不允许浏览器调用私有 worker 管理方法。

use super::super::Bridge;
use super::{
    authentication::Authenticated,
    frames::{error, response},
};
use crate::{
    agent::AgentProcess,
    protocol::{self, ClientFrame, ClientMessage, VERSION},
};
use axum::extract::ws::Message;
use serde_json::{json, Value};
use std::{sync::Arc, time::Duration};
use tokio::{sync::mpsc, task::JoinSet};

/// 返回 false 表示连接应退出。已准入 RPC 由连接清理阶段等待，避免断线重发。
pub(super) async fn handle_message(
    incoming: Message,
    bridge: &Bridge,
    identity: &Authenticated,
    worker: &Arc<AgentProcess>,
    output: &mpsc::Sender<Value>,
    calls: &mut JoinSet<()>,
) -> bool {
    if matches!(incoming, Message::Close(_)) {
        return false;
    }
    let Message::Text(text) = incoming else {
        return true;
    };
    let frame = match serde_json::from_str::<ClientFrame>(&text) {
        Ok(frame) if frame.v == VERSION => frame,
        _ => {
            let _ = output
                .send(error(
                    "invalid_message",
                    "消息格式或协议版本无效，请更新站点与 bridge",
                ))
                .await;
            return true;
        }
    };
    match frame.message {
        ClientMessage::AuthForget => {
            if bridge
                .revoke_authorization(identity.authorization_id.clone())
                .await
                .is_err()
            {
                let _ = output
                    .send(error("forget_failed", "授权更新失败，请在桌面端检查服务"))
                    .await;
            }
            false
        }
        ClientMessage::Ping => {
            let _ = output.send(json!({"v": VERSION, "type": "pong"})).await;
            true
        }
        ClientMessage::Request { id, method, params } => {
            if !protocol::valid_request(&id, &method, &params) || calls.len() >= 16 {
                let id = id.chars().take(80).collect::<String>();
                let failure = json!({
                    "code": "request_rejected",
                    "message": "请求无效或过多",
                });
                let _ = output.send(response(&id, Err(failure))).await;
                return true;
            }
            let request = json!({
                "connectionId": identity.info.id,
                "authorizationId": identity.authorization_id,
                "origin": identity.info.origin,
                "request": {"id": id, "method": method, "params": params},
            });
            let worker = worker.clone();
            let output = output.clone();
            calls.spawn(async move {
                let result = worker.call("request", request).await;
                let frame = response(&id, result);
                let _ = tokio::time::timeout(Duration::from_secs(5), output.send(frame)).await;
            });
            true
        }
        _ => {
            let _ = output
                .send(error("invalid_operation", "连接已认证，无法重复配对"))
                .await;
            true
        }
    }
}
