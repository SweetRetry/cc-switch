use crate::provider::Provider;
use crate::proxy::error::ProxyError;
pub(crate) fn claude_base_url(provider: &Provider) -> Result<String, ProxyError> {
    // Codex OAuth: 强制使用 ChatGPT 后端 API 端点（忽略用户配置的 base_url）
    if provider.is_codex_oauth() {
        return Ok(super::CHATGPT_CODEX_BASE_URL.to_string());
    }

    // xAI OAuth: ignore editable provider base URLs and always use the xAI
    // API origin associated with the managed token.
    if provider.is_xai_oauth() {
        return Ok(super::XAI_API_BASE_URL.to_string());
    }

    // 1. 从 env 中获取
    if let Some(env) = provider.settings_config.get("env") {
        if let Some(url) = env.get("ANTHROPIC_BASE_URL").and_then(|v| v.as_str()) {
            return Ok(url.trim_end_matches('/').to_string());
        }
    }

    // 2. 尝试直接获取
    if let Some(url) = provider
        .settings_config
        .get("base_url")
        .and_then(|v| v.as_str())
    {
        return Ok(url.trim_end_matches('/').to_string());
    }

    if let Some(url) = provider
        .settings_config
        .get("baseURL")
        .and_then(|v| v.as_str())
    {
        return Ok(url.trim_end_matches('/').to_string());
    }

    if let Some(url) = provider
        .settings_config
        .get("apiEndpoint")
        .and_then(|v| v.as_str())
    {
        return Ok(url.trim_end_matches('/').to_string());
    }

    Err(ProxyError::ConfigError(
        "Claude Provider 缺少 base_url 配置".to_string(),
    ))
}
