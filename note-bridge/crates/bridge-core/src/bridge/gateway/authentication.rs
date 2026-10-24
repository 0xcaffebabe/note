use super::super::{now, state::Session, Bridge, ConnectionInfo};
use super::frames::{error, send};
use crate::{
    authorization::{self, Authorization, MAX_AUTHORIZATIONS},
    protocol::{ClientFrame, ClientMessage, VERSION},
};
use axum::extract::ws::{Message, WebSocket};
use std::time::Duration;
use tokio_util::sync::CancellationToken;
use uuid::Uuid;

/// 已落盘授权对应的连接上下文；token 只用于此次认证响应。
pub(super) struct Authenticated {
    pub(super) info: ConnectionInfo,
    pub(super) authorization_id: String,
    pub(super) token: String,
    pub(super) cancel: CancellationToken,
}

/// 配对消费、授权提交与连接注册在同一临界区完成。
pub(super) async fn authenticate(
    bridge: &Bridge,
    socket: &mut WebSocket,
    origin: &str,
    shutdown: &CancellationToken,
) -> Option<Authenticated> {
    let first = tokio::select! {
        _ = shutdown.cancelled() => return None,
        result = tokio::time::timeout(Duration::from_secs(10), socket.recv()) => result.ok()??.ok()?,
    };
    let Message::Text(text) = first else {
        return None;
    };
    let Ok(frame) = serde_json::from_str::<ClientFrame>(&text) else {
        send(socket, error("invalid_message", "认证消息格式无效")).await;
        return None;
    };
    if frame.v != VERSION {
        send(
            socket,
            error("unsupported_version", "协议版本不兼容，请更新站点或 bridge"),
        )
        .await;
        return None;
    }
    // Consuming a code, committing its grant, registering sockets, and revocation
    // share one lock. A code cannot issue two grants or cross a service restart.
    let mut state = bridge.inner.state.lock().await;
    if !state.running || shutdown.is_cancelled() {
        return None;
    }
    let (authorization_id, token) = match frame.message {
        ClientMessage::Pair { code } => {
            state.pair_attempts = state.pair_attempts.saturating_add(1);
            if state.pair_attempts > 10
                || state.authorizations.len() >= MAX_AUTHORIZATIONS
                || !state
                    .pairing
                    .as_ref()
                    .is_some_and(|p| p.expires_at > now() && p.code == code)
            {
                if state.pair_attempts >= 10 {
                    state.pairing = None;
                }
                drop(state);
                send(
                    socket,
                    error(
                        "pairing_failed",
                        "配对码无效或已过期，请在桌面端重新开启配对",
                    ),
                )
                .await;
                return None;
            }
            state.pairing = None;
            (None, authorization::new_token())
        }
        ClientMessage::Auth { token } => {
            let Some(hash) = authorization::hash_token(&token) else {
                drop(state);
                send(socket, error("auth_failed", "会话已失效，请重新配对")).await;
                return None;
            };
            (Some(hash), token)
        }
        _ => {
            drop(state);
            send(socket, error("auth_required", "请先配对认证")).await;
            return None;
        }
    };
    // No token can be issued before its grant has been committed.
    let mut next = state.authorizations.clone();
    let authorization_id = if let Some(hash) = authorization_id {
        let Some(grant) = next
            .iter_mut()
            .find(|grant| grant.token_hash == hash && grant.origin == origin)
        else {
            drop(state);
            send(socket, error("auth_failed", "网站授权已失效，请重新配对")).await;
            return None;
        };
        grant.last_connected_at = now().max(grant.last_connected_at);
        grant.id.clone()
    } else {
        if next.len() >= MAX_AUTHORIZATIONS {
            drop(state);
            send(
                socket,
                error("pairing_failed", "网站授权已达上限，请先在桌面端撤销旧授权"),
            )
            .await;
            return None;
        }
        let id = Uuid::new_v4().to_string();
        let timestamp = now();
        next.push(Authorization {
            id: id.clone(),
            origin: origin.into(),
            token_hash: authorization::hash_token(&token)?,
            created_at: timestamp,
            last_connected_at: timestamp,
        });
        id
    };
    if authorization::save(&bridge.inner.data_dir, &next).is_err() {
        drop(state);
        send(
            socket,
            error(
                "authorization_unavailable",
                "无法保存网站授权，请检查桌面端存储后重试",
            ),
        )
        .await;
        return None;
    }
    state.authorizations = next;
    let info = ConnectionInfo {
        id: Uuid::new_v4().to_string(),
        origin: origin.into(),
        connected_at: now(),
    };
    let cancel = shutdown.child_token();
    state.sessions.insert(
        info.id.clone(),
        Session {
            info: info.clone(),
            authorization_id: authorization_id.clone(),
            cancel: cancel.clone(),
        },
    );
    Some(Authenticated {
        info,
        authorization_id,
        token,
        cancel,
    })
}
