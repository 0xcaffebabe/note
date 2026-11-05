//! 单个浏览器连接的有界输出队列和 WebSocket 写任务。

use axum::extract::ws::{Message, WebSocket};
use futures_util::{stream::SplitSink, SinkExt};
use serde_json::Value;
use std::time::Duration;
use tokio::{sync::mpsc, task::JoinHandle};
use tokio_util::sync::CancellationToken;

/// 慢消费者超过写入时限即断开；关闭连接只释放订阅，不取消 Pi 任务。
pub(super) fn spawn_writer(
    mut sink: SplitSink<WebSocket, Message>,
    cancel: CancellationToken,
) -> (mpsc::Sender<Value>, JoinHandle<()>) {
    let (sender, mut receiver) = mpsc::channel::<Value>(64);
    let writer = tokio::spawn(async move {
        loop {
            tokio::select! {
                biased;
                _ = cancel.cancelled() => break,
                event = receiver.recv() => {
                    let Some(event) = event else {
                        break;
                    };
                    let sent = tokio::time::timeout(
                        Duration::from_secs(5),
                        sink.send(Message::Text(event.to_string().into())),
                    ).await;
                    if !matches!(sent, Ok(Ok(()))) {
                        cancel.cancel();
                        break;
                    }
                }
            }
        }
        let _ = tokio::time::timeout(Duration::from_secs(1), sink.close()).await;
    });
    (sender, writer)
}
