//! 有界管道 I/O。解析失败、超大帧、EOF 和取消均终止读循环，不尝试跳过未知协议数据。

use super::{
    limits::{MAX_LINE_BYTES, WRITE_TIMEOUT},
    transport::ConnectionState,
};
use serde_json::Value;
use std::sync::Arc;
use tokio::{
    io::{AsyncBufReadExt, AsyncWriteExt, BufReader},
    process::{ChildStdin, ChildStdout},
    sync::mpsc,
};
use tokio_util::sync::CancellationToken;

/// 写入既有有界队列；单次写入超过时限会取消整个通道，唤醒 reader 的清理流程。
pub(super) async fn write_input(
    mut stdin: ChildStdin,
    mut input: mpsc::Receiver<Vec<u8>>,
    stop: CancellationToken,
) {
    loop {
        let bytes = tokio::select! {
            _ = stop.cancelled() => break,
            item = input.recv() => match item {
                Some(item) => item,
                None => break,
            },
        };
        let result = tokio::time::timeout(WRITE_TIMEOUT, stdin.write_all(&bytes)).await;
        if !matches!(result, Ok(Ok(()))) {
            stop.cancel();
            break;
        }
    }
}

/// reader 是断开通知的唯一生产者，确保等待者清理与 offline 事件有明确先后顺序。
pub(super) async fn read_output(stdout: ChildStdout, state: Arc<ConnectionState>) {
    let mut reader = BufReader::new(stdout);
    let stop = state.cancellation();
    let mut line = Vec::new();
    while let Some(frame) = read_frame(&mut reader, &stop, &mut line).await {
        state.receive(frame).await;
    }
    state.disconnected().await;
}

/// 限制完整帧（包含换行）的累计大小；复用缓冲区，避免 read_line 在换行前无限分配。
async fn read_frame(
    reader: &mut BufReader<ChildStdout>,
    stop: &CancellationToken,
    line: &mut Vec<u8>,
) -> Option<Value> {
    line.clear();
    loop {
        let available = tokio::select! {
            _ = stop.cancelled() => return None,
            bytes = reader.fill_buf() => match bytes {
                Ok(bytes) if !bytes.is_empty() => bytes,
                _ => return None,
            },
        };
        let end = available.iter().position(|byte| *byte == b'\n');
        let take = end.map_or(available.len(), |end| end + 1);
        if line.len() + take > MAX_LINE_BYTES {
            return None;
        }
        line.extend_from_slice(&available[..take]);
        reader.consume(take);
        if end.is_some() {
            return serde_json::from_slice(line).ok();
        }
    }
}
