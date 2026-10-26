//! Native endpoint extraction and Codex catalog identity.
use crate::provider::Provider;
use crate::proxy::error::ProxyError;
use serde_json::Value as JsonValue;
use toml::Value as TomlValue;
const CODEX_NATIVE_RESPONSES_HOSTS: &[&str] = &[
    "bigmodel.cn",
    "z.ai",
    "xiaomimimo.com",
    "minimaxi.com",
    "minimax.cn",
    "minimax.io",
    "longcat.chat",
];

/// Path markers of a listed vendor's OpenAI *Chat Completions* endpoint, which is
/// NOT its Responses endpoint. Zhipu documents three separate base URLs per site
/// (Anthropic `/api/anthropic`, Chat `/api/coding/paas/v4` + pay-as-you-go
/// `/api/paas/v4`, Responses `/api/v1`) and warns that the wrong one cannot use
/// Coding Plan quota. A stored provider still pointing at a Chat path is a
/// pre-2026-09 Chat-route record: it keeps its `ProxyChat` catalog (the proxy
/// route converts it correctly; direct connect fails loudly with the #6944 400
/// until the preset is re-imported) instead of being silently steered onto the
/// wrong endpoint with a native catalog.
const CODEX_NATIVE_RESPONSES_CHAT_PATH_MARKERS: &[&str] = &["/paas/v4"];

pub fn codex_provider_uses_anthropic(provider: &Provider) -> bool {
    if let Some(api_format) = provider
        .meta
        .as_ref()
        .and_then(|meta| meta.api_format.as_deref())
        .or_else(|| {
            provider
                .settings_config
                .get("api_format")
                .and_then(|v| v.as_str())
        })
        .or_else(|| {
            provider
                .settings_config
                .get("apiFormat")
                .and_then(|v| v.as_str())
        })
    {
        return is_anthropic_wire_api(api_format);
    }

    provider
        .settings_config
        .get("config")
        .and_then(|v| v.as_str())
        .and_then(extract_codex_wire_api_from_toml)
        .map(|wire_api| is_anthropic_wire_api(&wire_api))
        .unwrap_or(false)
}

fn has_explicit_codex_third_party_upstream(provider: &Provider) -> bool {
    let non_empty_setting = |key: &str| {
        provider
            .settings_config
            .get(key)
            .and_then(JsonValue::as_str)
            .is_some_and(|value| !value.trim().is_empty())
    };
    let config = provider
        .settings_config
        .get("config")
        .and_then(JsonValue::as_str)
        .map(|text| {
            crate::codex_config::strip_codex_unified_session_bucket(text)
                .unwrap_or_else(|_| text.to_string())
        });
    let config = config.as_deref();

    ["baseUrl", "baseURL", "base_url"]
        .into_iter()
        .any(non_empty_setting)
        || config
            .and_then(crate::codex_config::extract_codex_experimental_bearer_token)
            .is_some()
        || config
            .and_then(crate::codex_config::extract_codex_base_url)
            .is_some()
        || config
            .and_then(|text| text.parse::<TomlValue>().ok())
            .and_then(|doc| {
                doc.get("model_provider")
                    .and_then(TomlValue::as_str)
                    .map(str::trim)
                    .filter(|provider_id| !provider_id.is_empty())
                    .map(str::to_string)
            })
            // Exact match, mirroring upstream: the built-in lookup is
            // case-sensitive, so `OpenAI` routes to a custom table — a
            // third-party upstream, not the official provider.
            .is_some_and(|provider_id| provider_id != "openai")
}

pub fn is_codex_official_provider(provider: &Provider) -> bool {
    let is_fixed_official_id = provider.id == crate::database::CODEX_OFFICIAL_PROVIDER_ID;
    if is_fixed_official_id && provider.category.as_deref() == Some("official") {
        return true;
    }

    let has_auth_object = provider
        .settings_config
        .get("auth")
        .is_some_and(JsonValue::is_object);
    let has_valid_config_shape = provider
        .settings_config
        .get("config")
        .is_none_or(|config| config.is_null() || config.is_string());
    if !has_auth_object || !has_valid_config_shape {
        return false;
    }

    if has_explicit_codex_third_party_upstream(provider) {
        return false;
    }

    let has_managed_account = provider
        .meta
        .as_ref()
        .and_then(|meta| meta.managed_account_id_for("codex_oauth"))
        .is_some_and(|account_id| !account_id.trim().is_empty());
    if has_managed_account {
        return true;
    }

    let has_stored_api_key = provider
        .settings_config
        .get("auth")
        .and_then(|auth| auth.get("OPENAI_API_KEY"))
        .and_then(JsonValue::as_str)
        .is_some_and(|key| !key.trim().is_empty());
    if has_stored_api_key {
        return false;
    }

    is_fixed_official_id || provider.category.as_deref() == Some("official")
}

pub fn is_codex_native_responses_url(base_url: &str) -> bool {
    if !crate::codex_config::codex_url_host_matches_any(base_url, CODEX_NATIVE_RESPONSES_HOSTS) {
        return false;
    }
    if is_chat_completions_url(base_url) {
        return false;
    }
    let lower = base_url.to_ascii_lowercase();
    !CODEX_NATIVE_RESPONSES_CHAT_PATH_MARKERS
        .iter()
        .any(|marker| lower.contains(marker))
}

pub fn resolve_codex_catalog_tool_profile(
    provider: &Provider,
) -> crate::codex_config::CodexCatalogToolProfile {
    use crate::codex_config::CodexCatalogToolProfile;
    if is_codex_official_provider(provider) {
        return CodexCatalogToolProfile::NativeResponses;
    }
    // xAI OAuth pins the native Responses profile regardless of editable
    // api_format, mirroring the Claude-side managed-provider invariant.
    if provider.is_xai_oauth() {
        return CodexCatalogToolProfile::NativeResponses;
    }
    if provider.is_github_copilot() {
        return CodexCatalogToolProfile::Copilot;
    }
    if codex_provider_uses_anthropic(provider) {
        return CodexCatalogToolProfile::Anthropic;
    }

    // Defensive fallback for providers saved in SQLite before their preset
    // switched to `openai_responses` (the #6944 reporter reinstalled to no
    // effect precisely because the stale `apiFormat` lives in the DB row): a
    // base_url on a listed vendor's native Responses gateway forces the
    // NativeResponses catalog. Chat-endpoint paths are deliberately excluded —
    // see `CODEX_NATIVE_RESPONSES_CHAT_PATH_MARKERS`.
    if let Some(base_url) = provider
        .settings_config
        .get("config")
        .and_then(|v| v.as_str())
        .and_then(extract_codex_base_url_from_toml)
        .or_else(|| {
            provider
                .settings_config
                .get("base_url")
                .or_else(|| provider.settings_config.get("baseURL"))
                .and_then(|v| v.as_str())
                .map(ToString::to_string)
        })
    {
        if is_codex_native_responses_url(&base_url) {
            return CodexCatalogToolProfile::NativeResponses;
        }
    }

    let api_format = provider
        .meta
        .as_ref()
        .and_then(|m| m.api_format.as_deref())
        .or_else(|| {
            provider
                .settings_config
                .get("api_format")
                .and_then(|v| v.as_str())
        })
        .or_else(|| {
            provider
                .settings_config
                .get("apiFormat")
                .and_then(|v| v.as_str())
        });
    CodexCatalogToolProfile::from_api_format(api_format)
}

fn is_anthropic_wire_api(value: &str) -> bool {
    matches!(
        value.trim().to_ascii_lowercase().as_str(),
        "anthropic" | "anthropic_messages" | "anthropic-messages" | "claude" | "messages"
    )
}

fn is_chat_completions_url(value: &str) -> bool {
    value
        .trim_end_matches('/')
        .to_ascii_lowercase()
        .ends_with("/chat/completions")
}

fn extract_codex_wire_api_from_toml(config_text: &str) -> Option<String> {
    let doc = config_text.parse::<TomlValue>().ok()?;

    if let Some(active_provider) = doc.get("model_provider").and_then(|v| v.as_str()) {
        if let Some(wire_api) = doc
            .get("model_providers")
            .and_then(|providers| providers.get(active_provider))
            .and_then(|provider| provider.get("wire_api"))
            .and_then(|v| v.as_str())
        {
            return Some(wire_api.to_string());
        }
    }

    doc.get("wire_api")
        .and_then(|v| v.as_str())
        .map(ToString::to_string)
}

fn extract_codex_base_url_from_toml(config_text: &str) -> Option<String> {
    // Canonical parser lives in codex_config; keep this thin alias so the
    // proxy hot path and the usage-credential resolver share one implementation.
    crate::codex_config::extract_codex_base_url(config_text)
}

pub(crate) fn codex_base_url(provider: &Provider) -> Result<String, ProxyError> {
    if is_codex_official_provider(provider) {
        return Ok(super::CHATGPT_CODEX_BASE_URL.to_string());
    }

    if provider.is_github_copilot() {
        return Ok("https://api.githubcopilot.com".to_string());
    }

    // xAI OAuth: ignore editable provider base URLs and always use the xAI
    // API origin associated with the managed token.
    if provider.is_xai_oauth() {
        return Ok(super::XAI_API_BASE_URL.to_string());
    }

    // 1. 尝试直接获取 base_url 字段
    if let Some(url) = provider
        .settings_config
        .get("base_url")
        .and_then(|v| v.as_str())
    {
        return Ok(url.trim_end_matches('/').to_string());
    }

    // 2. 尝试 baseURL
    if let Some(url) = provider
        .settings_config
        .get("baseURL")
        .and_then(|v| v.as_str())
    {
        return Ok(url.trim_end_matches('/').to_string());
    }

    // 3. 尝试从 config 对象中获取
    if let Some(config) = provider.settings_config.get("config") {
        if let Some(url) = config.get("base_url").and_then(|v| v.as_str()) {
            return Ok(url.trim_end_matches('/').to_string());
        }

        // 尝试解析 TOML 字符串格式
        if let Some(config_str) = config.as_str() {
            // The table `model_provider` selects, read the way Codex reads it. The text
            // scans below remain for a top-level `openai_base_url` and for TOML that
            // does not parse.
            if let Some(url) = extract_codex_base_url_from_toml(config_str) {
                return Ok(url.trim_end_matches('/').to_string());
            }
            if let Some(start) = config_str.find("base_url = \"") {
                let rest = &config_str[start + 12..];
                if let Some(end) = rest.find('"') {
                    return Ok(rest[..end].trim_end_matches('/').to_string());
                }
            }
            if let Some(start) = config_str.find("base_url = '") {
                let rest = &config_str[start + 12..];
                if let Some(end) = rest.find('\'') {
                    return Ok(rest[..end].trim_end_matches('/').to_string());
                }
            }
        }
    }

    Err(ProxyError::ConfigError(
        "Codex Provider 缺少 base_url 配置".to_string(),
    ))
}
