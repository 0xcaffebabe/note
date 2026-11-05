//! 有界日志与滚动文件；只接受 bridge 生成的诊断摘要。
use super::{now, Bridge, LogEntry};
use std::{collections::VecDeque, fs, io::Write, path::Path};

const LOG_LIMIT: usize = 1000;

/// 仅恢复合法诊断摘要；跳过损坏或过大文件，并保留最近的有限条目。
pub(super) fn load_logs(dir: &Path) -> VecDeque<LogEntry> {
    let entries = fs::read(dir.join("runtime.jsonl"))
        .ok()
        .filter(|data| data.len() <= 1024 * 1024)
        .map(|data| {
            String::from_utf8_lossy(&data)
                .lines()
                .filter_map(|line| serde_json::from_str::<LogEntry>(line).ok())
                .collect::<VecDeque<_>>()
        })
        .unwrap_or_default();
    entries
        .into_iter()
        .rev()
        .take(LOG_LIMIT)
        .collect::<VecDeque<_>>()
        .into_iter()
        .rev()
        .collect()
}

impl Bridge {
    /// 清除当前及上一份滚动日志。
    pub async fn clear_logs(&self) {
        let mut state = self.inner.state.lock().await;
        state.logs.clear();
        let _ = fs::remove_file(self.inner.data_dir.join("runtime.jsonl"));
        let _ = fs::remove_file(self.inner.data_dir.join("runtime.previous.jsonl"));
    }

    /// 将受限诊断摘要导出为 JSONL。
    pub async fn export_logs(&self) -> String {
        self.inner
            .state
            .lock()
            .await
            .logs
            .iter()
            .filter_map(|entry| serde_json::to_string(entry).ok())
            .collect::<Vec<_>>()
            .join("\n")
    }

    pub(super) async fn log(
        &self,
        level: &str,
        message: &str,
        chat: Option<(&str, &str, &str, u64)>,
    ) {
        let entry = LogEntry {
            timestamp: now(),
            level: level.into(),
            message: message.into(),
            request_id: chat.map(|(id, _, _, _)| id.into()),
            provider_id: chat.map(|(_, provider, _, _)| provider.into()),
            model: chat.map(|(_, _, model, _)| model.into()),
            duration_ms: chat.map(|(_, _, _, ms)| ms),
        };
        let mut state = self.inner.state.lock().await;
        state.logs.push_back(entry.clone());
        while state.logs.len() > LOG_LIMIT {
            state.logs.pop_front();
        }
        let path = self.inner.data_dir.join("runtime.jsonl");
        if fs::metadata(&path).is_ok_and(|m| m.len() > 1024 * 1024) {
            let previous = self.inner.data_dir.join("runtime.previous.jsonl");
            let _ = fs::remove_file(&previous);
            let _ = fs::rename(&path, previous);
        }
        if let Ok(mut file) = fs::OpenOptions::new().create(true).append(true).open(path) {
            if let Ok(line) = serde_json::to_string(&entry) {
                let _ = writeln!(file, "{line}");
            }
        }
    }
}
