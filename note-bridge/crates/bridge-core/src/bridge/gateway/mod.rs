//! 浏览器网关：精确 Origin/Host 校验、认证和连接级流量转发。
mod authentication;
mod frames;
mod output;
mod requests;
mod session;
use super::Bridge;
use crate::protocol;
use axum::{
    extract::{ws::WebSocketUpgrade, State as WebState},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
};
use session::socket_session;

pub(super) async fn upgrade(
    WebState(bridge): WebState<Bridge>,
    headers: HeaderMap,
    ws: WebSocketUpgrade,
) -> Response {
    let origin = headers
        .get("origin")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("");
    let host = headers
        .get("host")
        .and_then(|h| h.to_str().ok())
        .unwrap_or("");
    let state = bridge.inner.state.lock().await;
    if !state.running
        || !state
            .settings
            .allowed_origins
            .iter()
            .any(|allowed| allowed == origin)
        || host != format!("127.0.0.1:{}", state.settings.port)
    {
        return StatusCode::FORBIDDEN.into_response();
    }
    let shutdown = state.shutdown.clone();
    drop(state);
    let Ok(permit) = bridge.inner.slots.clone().try_acquire_owned() else {
        return StatusCode::TOO_MANY_REQUESTS.into_response();
    };
    let origin = origin.to_string();
    ws.max_message_size(protocol::MAX_FRAME_BYTES)
        .max_frame_size(protocol::MAX_FRAME_BYTES)
        .on_upgrade(move |socket| async move {
            let _permit = permit;
            socket_session(bridge, socket, origin, shutdown).await;
        })
        .into_response()
}
