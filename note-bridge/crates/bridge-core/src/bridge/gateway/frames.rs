//! 网关错误帧与有界写入；不包含 worker 的内部协议。
use crate::protocol::VERSION;
use axum::extract::ws::{Message, WebSocket};
use serde_json::{json, Value};
use std::time::Duration;

pub(super) fn error(code: &str, message: &str) -> Value {
    json!({
        "v": VERSION,
        "type": "error",
        "code": code,
        "message": message,
    })
}
pub(super) async fn send(socket: &mut WebSocket, value: Value) -> bool {
    matches!(
        tokio::time::timeout(
            Duration::from_secs(5),
            socket.send(Message::Text(value.to_string().into()))
        )
        .await,
        Ok(Ok(()))
    )
}

/// 将 worker 结果转换为稳定的产品响应帧，内部 IPC 不泄漏到网站协议。
pub(super) fn response(id: &str, result: Result<Value, Value>) -> Value {
    match result {
        Ok(result) => json!({"v": VERSION, "type": "response", "id": id, "result": result}),
        Err(error) => json!({"v": VERSION, "type": "response", "id": id, "error": error}),
    }
}
