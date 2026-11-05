/// 本机秘密存储端口，配置文件只能保存引用，不能保存凭据值。
///
/// 条目 ID 必须是标准 UUID。凭据轮换使用全新条目，元数据原子提交后再清理旧条目；
/// 实现须支持多线程访问，并且不得通过错误消息或诊断输出泄露凭据。
pub trait SecretStore: Send + Sync {
    /// 读取条目；条目不存在返回 None，平台访问失败返回错误。
    fn get(&self, id: &str) -> Result<Option<String>, String>;
    /// 写入一个已验证的凭据条目；调用方负责后续元数据提交与清理。
    fn set(&self, id: &str, secret: &str) -> Result<(), String>;
    /// 删除条目；条目已不存在也视为成功。
    fn delete(&self, id: &str) -> Result<(), String>;
}
