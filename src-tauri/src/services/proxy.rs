//! Legacy takeover detection and shared client configuration write locks.

use crate::app_config::AppType;
use crate::config::{get_claude_settings_path, read_json_file};
use crate::database::Database;
use crate::live::project::claude::PROXY_TOKEN_PLACEHOLDER;
use crate::proxy::switch_lock::SwitchLockManager;
use serde_json::{json, Value};
use std::sync::Arc;

#[derive(Clone)]
pub struct ProxyService {
    db: Arc<Database>,
    switch_locks: SwitchLockManager,
}

pub(crate) fn proxy_origin(host: &str, listen_port: u16) -> String {
    let host = match host {
        "0.0.0.0" => "127.0.0.1",
        "::" => "::1",
        other => other,
    };
    if host.contains(':') && !host.starts_with('[') {
        format!("http://[{host}]:{listen_port}")
    } else {
        format!("http://{host}:{listen_port}")
    }
}

impl ProxyService {
    pub fn new(db: Arc<Database>) -> Self {
        Self {
            db,
            switch_locks: SwitchLockManager::new(),
        }
    }
    pub(crate) async fn lock_switch_for_app(
        &self,
        app_type: &str,
    ) -> tokio::sync::OwnedMutexGuard<()> {
        self.switch_locks.lock_for_app(app_type).await
    }
    /// 客户端文件里有没有接管占位符 `PROXY_MANAGED`（旧版接管的遗留物，或新版接上代理
    /// 时写的契约）。Codex 的官方路由不带占位符，按指向本地代理的地址认。
    pub(crate) fn live_has_proxy_placeholder(&self, app_type: &AppType) -> bool {
        match app_type {
            AppType::Claude => match self.read_claude_live() {
                Ok(config) => Self::is_claude_live_taken_over(&config),
                Err(_) => false,
            },
            AppType::Codex => {
                match self.read_codex_live() {
                    Ok(config) => Self::is_codex_live_taken_over(&config)
                        || config
                            .get("config")
                            .and_then(|v| v.as_str())
                            .is_some_and(|text| {
                                crate::services::provider::codex_direct::routes_official_to_proxy(
                                    &self.db, text,
                                )
                            }),
                    Err(_) => false,
                }
            }

            _ => false,
        }
    }

    /// 一份配置（客户端文件或供应商行）里有没有接管占位符：行里带着它的是旧版接管期间
    /// 被导入的残留，不能照写回 live，否则客户端会一直指着已经不在的本地代理。
    pub(crate) fn config_has_proxy_placeholder(app_type: &AppType, config: &Value) -> bool {
        match app_type {
            AppType::Claude => Self::is_claude_live_taken_over(config),
            AppType::Codex => Self::is_codex_live_taken_over(config),

            _ => false,
        }
    }

    fn is_claude_live_taken_over(config: &Value) -> bool {
        let env = match config.get("env").and_then(|v| v.as_object()) {
            Some(env) => env,
            None => return false,
        };

        for key in [
            "ANTHROPIC_AUTH_TOKEN",
            "ANTHROPIC_API_KEY",
            "OPENROUTER_API_KEY",
            "OPENAI_API_KEY",
        ] {
            if env.get(key).and_then(|v| v.as_str()) == Some(PROXY_TOKEN_PLACEHOLDER) {
                return true;
            }
        }

        false
    }

    fn codex_live_has_proxy_placeholder(config: &Value) -> bool {
        if config
            .get("auth")
            .and_then(|v| v.as_object())
            .and_then(|auth| auth.get("OPENAI_API_KEY"))
            .and_then(|v| v.as_str())
            == Some(PROXY_TOKEN_PLACEHOLDER)
        {
            return true;
        }

        config
            .get("config")
            .and_then(|v| v.as_str())
            .and_then(crate::codex_config::extract_codex_experimental_bearer_token)
            .as_deref()
            == Some(PROXY_TOKEN_PLACEHOLDER)
    }

    fn is_codex_live_taken_over(config: &Value) -> bool {
        Self::codex_live_has_proxy_placeholder(config)
            || config
                .get("config")
                .and_then(|v| v.as_str())
                .is_some_and(crate::codex_config::codex_config_has_official_proxy_route)
    }

    // ==================== Live 配置读写辅助方法 ====================

    fn read_claude_live(&self) -> Result<Value, String> {
        let path = get_claude_settings_path();
        if !path.exists() {
            return Err("Claude 配置文件不存在".to_string());
        }

        let mut value: Value =
            read_json_file(&path).map_err(|e| format!("读取 Claude 配置失败: {e}"))?;

        if value.is_null() {
            value = json!({});
        }

        if !value.is_object() {
            let kind = match &value {
                Value::Null => "null",
                Value::Bool(_) => "boolean",
                Value::Number(_) => "number",
                Value::String(_) => "string",
                Value::Array(_) => "array",
                Value::Object(_) => "object",
            };
            return Err(format!(
                "Claude 配置文件格式错误：根节点必须是 JSON 对象（当前为 {kind}），路径: {}",
                path.display()
            ));
        }

        Ok(value)
    }

    fn read_codex_live(&self) -> Result<Value, String> {
        crate::codex_config::read_codex_live_settings()
            .map_err(|e| format!("读取 Codex Live 配置失败: {e}"))
    }
}
