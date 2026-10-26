use crate::provider::Provider;
use crate::proxy::error::ProxyError;
pub(crate) fn gemini_base_url(provider: &Provider) -> Result<String, ProxyError> {
    // 从 env 中获取
    if let Some(env) = provider.settings_config.get("env") {
        if let Some(url) = env.get("GOOGLE_GEMINI_BASE_URL").and_then(|v| v.as_str()) {
            return Ok(url.trim_end_matches('/').to_string());
        }
    }

    // 尝试直接获取
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

    Err(ProxyError::ConfigError(
        "Gemini Provider 缺少 base_url 配置".to_string(),
    ))
}
