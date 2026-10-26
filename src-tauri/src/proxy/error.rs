use thiserror::Error;

/// Errors shared by native endpoint extraction and managed account authentication.
#[derive(Debug, Error)]
pub enum ProxyError {
    #[error("配置错误: {0}")]
    ConfigError(String),
    #[error("认证失败: {0}")]
    AuthError(String),
}
