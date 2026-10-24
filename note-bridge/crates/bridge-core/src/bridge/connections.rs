//! 配对窗口与授权撤销。只有文件提交成功才更新内存授权。
use super::{now, state::Runtime, Bridge, PairingWindow, PAIR_TTL_MS};
use crate::authorization;
use rand::Rng;

impl Bridge {
    /// 开启限时单次配对窗口，正确配对码即可完成认证。
    pub async fn open_pairing(&self) -> Result<PairingWindow, String> {
        let mut state = self.inner.state.lock().await;
        if !state.running {
            return Err("请先启动服务".into());
        }
        let pairing = PairingWindow {
            code: format!("{:06}", rand::thread_rng().gen_range(0..1_000_000)),
            expires_at: now() + PAIR_TTL_MS,
        };
        state.pairing = Some(pairing.clone());
        state.pair_attempts = 0;
        Ok(pairing)
    }

    /// 撤销连接所属授权，并断开同一授权的全部连接。
    pub async fn revoke_connection(&self, id: String) -> Result<(), String> {
        let mut state = self.inner.state.lock().await;
        let authorization_id = state
            .sessions
            .get(&id)
            .ok_or("连接不存在")?
            .authorization_id
            .clone();
        self.revoke_locked(&mut state, &authorization_id)?;
        drop(state);
        self.sync_agent_configuration().await?;
        self.log("info", "已撤销网站授权", None).await;
        Ok(())
    }

    /// 先持久化撤销再通知 worker，同步失败即关闭 worker。
    pub async fn revoke_authorization(&self, id: String) -> Result<(), String> {
        let mut state = self.inner.state.lock().await;
        self.revoke_locked(&mut state, &id)?;
        drop(state);
        self.sync_agent_configuration().await?;
        self.log("info", "已撤销网站授权", None).await;
        Ok(())
    }

    fn revoke_locked(&self, state: &mut Runtime, id: &str) -> Result<(), String> {
        if !state.authorizations.iter().any(|grant| grant.id == id) {
            return Err("网站授权不存在".into());
        }
        let mut next = state.authorizations.clone();
        next.retain(|grant| grant.id != id);
        authorization::save(&self.inner.data_dir, &next)?;
        state.authorizations = next;
        state.sessions.retain(|_, session| {
            if session.authorization_id == id {
                session.cancel.cancel();
                false
            } else {
                true
            }
        });
        Ok(())
    }
}
