use url::{Host, Url};

/// 校验凭据即将发送到的服务基础地址。
///
/// 远端必须使用 HTTPS；HTTP 仅接受回环主机。拒绝 userinfo、查询参数和片段，
/// 避免 URL 自带凭据或隐式改变认证目标；不会在校验阶段进行网络请求。
pub fn validate_base_url(base_url: &str) -> Result<(), String> {
    if base_url.len() > 2_048
        || base_url.trim() != base_url
        || base_url.chars().any(char::is_control)
    {
        return Err("服务地址过长或包含非法空白字符".into());
    }
    let url = Url::parse(base_url).map_err(|_| "服务地址不是有效 URL".to_string())?;
    let explicit_userinfo = base_url.split_once("://").is_some_and(|(_, rest)| {
        rest.split(['/', '?', '#'])
            .next()
            .is_some_and(|authority| authority.contains('@'))
    });
    if explicit_userinfo
        || !url.username().is_empty()
        || url.password().is_some()
        || url.query().is_some()
        || url.fragment().is_some()
    {
        return Err("服务地址不能包含用户名、密码、查询参数或片段".into());
    }
    let loopback = match url.host() {
        Some(Host::Domain(domain)) => domain.eq_ignore_ascii_case("localhost"),
        Some(Host::Ipv4(ip)) => ip.is_loopback(),
        Some(Host::Ipv6(ip)) => ip.is_loopback(),
        None => return Err("服务地址缺少主机名".into()),
    };
    match url.scheme() {
        "https" => Ok(()),
        "http" if loopback => Ok(()),
        _ => Err("远程服务必须使用 HTTPS；HTTP 仅允许本机回环地址".into()),
    }
}
