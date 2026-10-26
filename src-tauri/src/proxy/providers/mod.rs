//! Account authentication, native endpoint extraction and catalog identity.
mod claude;
mod codex;
pub mod codex_oauth_auth;
pub mod copilot_auth;
pub mod copilot_model_map;
mod gemini;
pub mod xai_oauth_auth;

use crate::app_config::AppType;
use crate::provider::Provider;
use crate::proxy::error::ProxyError;
pub use codex::{is_codex_official_provider, resolve_codex_catalog_tool_profile};
pub(crate) use gemini::gemini_base_url;

pub const CHATGPT_CODEX_BASE_URL: &str = "https://chatgpt.com/backend-api/codex";
pub const XAI_API_BASE_URL: &str = "https://api.x.ai/v1";

pub(crate) fn base_url(app: &AppType, provider: &Provider) -> Result<String, ProxyError> {
    match app {
        AppType::Claude => claude::claude_base_url(provider),
        AppType::Codex | AppType::OpenCode => codex::codex_base_url(provider),
        _ => Err(ProxyError::ConfigError(format!(
            "{} has no native endpoint extractor",
            app.as_str()
        ))),
    }
}
