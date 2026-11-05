//! 只读模型目录入口。HTTP 分页和外部数据归一化分别维护，返回值只是候选模型。
//! 只有用户在原生界面选择并保存后，候选模型才会进入可调用配置。

mod parsing;
mod remote;

pub use parsing::parse_models;
pub use remote::fetch;

#[cfg(test)]
mod tests;
