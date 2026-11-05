//! 监听白名单和持久授权共用的精确网站来源约束。

/// 校验 HTTP(S) Origin；不接受路径、尾斜线、用户信息或非回环明文地址。
pub(crate) fn validate(origin: &str) -> Result<(), String> {
    let url = url::Url::parse(origin).map_err(|_| "网站来源格式无效")?;
    crate::model::validate_base_url(origin)?;
    if url.origin().ascii_serialization() != origin {
        return Err("网站来源只包含协议、主机和可选端口，不含路径或末尾斜线".into());
    }
    Ok(())
}
