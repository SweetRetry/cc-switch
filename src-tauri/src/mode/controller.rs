//! Upgrade legacy local routing and aggregation configurations to direct connections.
//! The client write lock and crash recovery are also used by ordinary provider switching.

use super::state::{op, Contract, Mode, ModeState, PendingTarget};
use super::{current, operation};
use crate::app_config::AppType;
use crate::error::AppError;
use crate::live::engine::DeviceStore;
use crate::live::project::claude::{direct_patch, ClaudeProjection};
use crate::provider::Provider;
use crate::services::provider::claude_direct;
use crate::services::provider::codex_direct::{self, Owner};
use crate::store::AppState;
use serde_json::{json, Value};
use tokio::sync::OwnedMutexGuard;

const LEGACY_PROXY_APPS: [AppType; 2] = [AppType::Claude, AppType::Codex];

fn err(error: impl std::fmt::Display) -> String {
    error.to_string()
}

fn provider(state: &AppState, app: &AppType, id: &str) -> Result<Option<Provider>, String> {
    state.db.get_provider_by_id(id, app.as_str()).map_err(err)
}

fn direct_provider(state: &AppState, app: &AppType) -> Result<Option<Provider>, String> {
    current::direct_provider(&state.db, app).map_err(err)
}

fn route_provider(
    state: &AppState,
    app: &AppType,
    mode: &ModeState,
) -> Result<Option<Provider>, String> {
    match mode.proxy_route.as_deref() {
        Some(id) => provider(state, app, id),
        None => Ok(None),
    }
}

/// 客户端文件现在对应的是谁。
enum LiveNow {
    /// 直连投影（或还没写过任何东西）。
    Direct(Option<Provider>),
    /// 代理契约；`route` 是写入契约时的路由供应商。
    Proxy {
        contract: Option<Contract>,
        route: Option<Provider>,
    },
}

impl LiveNow {
    fn of(state: &AppState, app: &AppType, mode: &ModeState) -> Result<Self, String> {
        if mode.attached {
            // 旧版接管留下的状态没有路由记录，那时路由就是直连指针。
            let route = match route_provider(state, app, mode)? {
                Some(route) => Some(route),
                None => direct_provider(state, app)?,
            };
            Ok(Self::Proxy {
                contract: mode.contract.clone(),
                route,
            })
        } else {
            Ok(Self::Direct(direct_provider(state, app)?))
        }
    }

    /// live 里现在由哪个供应商带进来的独有字段。
    fn claude_exclusive_owner(&self) -> Option<ClaudeProjection> {
        match self {
            Self::Direct(provider) => provider
                .as_ref()
                .map(|provider| ClaudeProjection::of(&provider.settings_config)),
            Self::Proxy {
                contract: Some(contract),
                ..
            } => Some(ClaudeProjection {
                exclusive: contract.exclusive.clone(),
                ..ClaudeProjection::default()
            }),
            Self::Proxy {
                contract: None,
                route,
            } => route
                .as_ref()
                .map(|provider| ClaudeProjection::of(&provider.settings_config)),
        }
    }

    /// Codex 的 live 现在是谁写进去的。
    fn codex_owner(&self) -> Owner<'_> {
        match self {
            Self::Direct(provider) => provider.as_ref().map_or(Owner::None, Owner::Provider),
            Self::Proxy {
                contract: Some(contract),
                route,
            } => Owner::Contract {
                contract,
                route: route.as_ref(),
            },
            Self::Proxy {
                contract: None,
                route,
            } => route.as_ref().map_or(Owner::None, Owner::Provider),
        }
    }
}

fn commit_state(state: &AppState, app: &AppType, target: &PendingTarget) -> Result<(), String> {
    operation::commit_target(&state.db, &DeviceStore::for_device(), app.as_str(), target)
        .map_err(err)
}

fn write_direct(
    state: &AppState,
    app: &AppType,
    op_name: &str,
    live_now: &LiveNow,
    target: ModeState,
) -> Result<(), String> {
    let direct = direct_provider(state, app)?;
    let pending_target = PendingTarget::mode(target);
    let attached = matches!(live_now, LiveNow::Proxy { .. });
    match app {
        AppType::Claude => {
            let empty = ClaudeProjection::default();
            let projection = usable_direct(app, direct.as_ref())
                .map(|provider| ClaudeProjection::of(&provider.settings_config));
            let mut patch = direct_patch(
                live_now.claude_exclusive_owner().as_ref(),
                projection.as_ref().unwrap_or(&empty),
            );
            crate::services::provider::claude_official::strip_from_patch(&mut patch);
            // 退出路由（不是退出 CC Switch 时的分离）回到直连的官方卡：和切换一样把它绑的
            // 账号换进 Claude Code 的登录（路由期间可能改过这张卡绑的号）
            let login_target = usable_direct(app, direct.as_ref()).filter(|_| op_name == op::EXIT);
            crate::services::provider::claude_official::with_login_switch(login_target, || {
                claude_direct::run(
                    &state.db,
                    op_name,
                    attached.then_some(&patch),
                    pending_target,
                )
            })
            .map_err(err)?;
        }
        AppType::Codex => {
            if !attached {
                commit_state(state, app, &pending_target)?;
                return Ok(());
            }
            let target = usable_direct(app, direct.as_ref());
            let owner = live_now.codex_owner();
            if let Err(error) = codex_direct::write_direct(
                &state.db,
                &state.codex_oauth_manager,
                op_name,
                owner,
                target,
                pending_target.clone(),
            ) {
                // 直连供应商写不出来（比如绑定的托管账号已被删除）也不能让客户端一直指着
                // 代理：退一步只清空关键字段。
                log::warn!("写回直连的 Codex 配置失败，只清空关键字段: {error}");
                codex_direct::write_direct(
                    &state.db,
                    &state.codex_oauth_manager,
                    op_name,
                    owner,
                    None,
                    pending_target,
                )
                .map_err(err)?;
            }
        }

        _ => return Err(format!("{} 不支持本地路由", app.as_str())),
    }
    Ok(())
}

/// 能照写回 live 的直连供应商：行里本身带着占位符（旧版接管期间被导入的残留）的不行，
/// 否则客户端会一直指着已经不在的本地代理。
fn usable_direct<'a>(app: &AppType, direct: Option<&'a Provider>) -> Option<&'a Provider> {
    direct.filter(|provider| {
        let polluted = crate::services::ProxyService::config_has_proxy_placeholder(
            app,
            &provider.settings_config,
        );
        if polluted {
            log::warn!(
                "直连供应商 {} 的行里带着代理占位符，只清空关键字段",
                provider.id
            );
        }
        !polluted && crate::services::provider::supports_direct(app, provider)
    })
}

pub(crate) async fn lock_settled(
    state: &AppState,
    app: &AppType,
) -> Result<OwnedMutexGuard<()>, AppError> {
    let guard = state.proxy_service.lock_switch_for_app(app.as_str()).await;
    operation::settle(&state.db, app.as_str()).map_err(|error| {
        AppError::localized(
            "mode.unsettled",
            format!(
                "{} 上一次写配置文件的操作没做完，现在也补不完：{error}。本次什么都没做，请排查后重试",
                app.as_str()
            ),
            format!(
                "The previous write to {}'s config files is unfinished and cannot be completed now: {error}. Nothing was done; fix the cause and retry",
                app.as_str()
            ),
        )
    })?;
    Ok(guard)
}

/// 同步代码里用的 [`lock_settled`]。没有路由模式的应用没有模式可以被并发改掉，不拿锁。
pub(crate) fn lock_settled_blocking(
    state: &AppState,
    app: &AppType,
) -> Result<Option<OwnedMutexGuard<()>>, AppError> {
    if !app.uses_managed_live_state() {
        return Ok(None);
    }
    futures::executor::block_on(lock_settled(state, app)).map(Some)
}

/// Restore old routing and aggregation clients once. This function never starts a server.
/// Keep failed migrations in the legacy state so the next startup can retry safely.
pub async fn startup(state: &AppState) {
    for app in LEGACY_PROXY_APPS {
        let result = match lock_settled(state, &app).await {
            Ok(_guard) => migrate_to_direct(state, &app).await,
            Err(error) => Err(error.to_string()),
        };
        if let Err(error) = result {
            log::error!("恢复 {} 的直连配置失败: {error}", app.as_str());
        }
    }
}

async fn migrate_to_direct(state: &AppState, app: &AppType) -> Result<(), String> {
    drain_legacy_backup(state, app).await;
    let mut mode =
        super::state::mode_state(&DeviceStore::for_device(), app.as_str()).map_err(err)?;
    // Older takeovers can lack the device-local attachment marker.
    if state.proxy_service.live_has_proxy_placeholder(app) {
        mode.attached = true;
    }
    if mode.attached || mode.is_proxy() {
        let live_now = LiveNow::of(state, app, &mode)?;
        write_direct(
            state,
            app,
            op::EXIT,
            &live_now,
            ModeState {
                mode: Some(Mode::Direct),
                ..ModeState::default()
            },
        )?;
    }
    let store = DeviceStore::for_device();
    let legacy = super::state::load(&store).map_err(err)?;
    if legacy.apps.get(app.as_str()).is_some_and(|entry| {
        entry.proxy_route.is_some() || !entry.stack.is_empty() || entry.contract.is_some()
    }) {
        super::state::update(&store, |state| {
            if let Some(entry) = state.apps.get_mut(app.as_str()) {
                entry.proxy_route = None;
                entry.contract = None;
                entry.stack = Default::default();
            }
        })
        .map_err(err)?;
    }
    // Legacy database flags can otherwise come back through imported or synced data.
    let mut config = state
        .db
        .get_proxy_config_for_app(app.as_str())
        .await
        .map_err(err)?;
    if config.enabled || config.auto_failover_enabled {
        config.enabled = false;
        config.auto_failover_enabled = false;
        state
            .db
            .update_proxy_config_for_app(config)
            .await
            .map_err(err)?;
    }
    let mut global = state.db.get_global_proxy_config().await.map_err(err)?;
    if global.proxy_enabled {
        global.proxy_enabled = false;
        state
            .db
            .update_global_proxy_config(global)
            .await
            .map_err(err)?;
    }
    Ok(())
}

/// 旧版的接管备份行：不回放，转存到本机文件后删除。留着的话，降级后旧版启动时会把这份
/// 陈旧的快照写回客户端。
async fn drain_legacy_backup(state: &AppState, app: &AppType) -> bool {
    let backup = match state.db.get_live_backup(app.as_str()).await {
        Ok(Some(backup)) => backup,
        Ok(None) => return false,
        Err(error) => {
            log::warn!("读取 {} 的旧接管备份失败: {error}", app.as_str());
            return false;
        }
    };
    let dir = crate::config::get_home_dir()
        .join(".cc-switch")
        .join("backups")
        .join("proxy-live-backup");
    let stamp = chrono::Utc::now().format("%Y%m%dT%H%M%SZ");
    let path = dir.join(format!("{}-{stamp}.json", app.as_str()));
    let saved = serde_json::to_vec_pretty(&json!({
        "app": app.as_str(),
        "backedUpAt": backup.backed_up_at,
        "originalConfig": serde_json::from_str::<Value>(&backup.original_config)
            .unwrap_or(Value::String(backup.original_config.clone())),
    }))
    .map_err(err)
    .and_then(|bytes| {
        std::fs::create_dir_all(&dir).map_err(err)?;
        crate::config::atomic_write_private(&path, &bytes).map_err(err)
    });
    match saved {
        Ok(()) => {
            if let Err(error) = state.db.delete_live_backup(app.as_str()).await {
                log::warn!("删除 {} 的旧接管备份失败: {error}", app.as_str());
            } else {
                log::info!(
                    "{} 的旧接管备份已转存到 {} 并从数据库删除",
                    app.as_str(),
                    path.display()
                );
            }
        }
        Err(error) => log::warn!(
            "转存 {} 的旧接管备份失败，保留数据库里的备份行: {error}",
            app.as_str()
        ),
    }
    true
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::{read_json_file, write_json_file};
    use crate::provider::ProviderMeta;
    use serial_test::serial;
    use std::{ffi::OsString, sync::Arc};

    struct TestHome {
        _dir: tempfile::TempDir,
        saved: Vec<(&'static str, Option<OsString>)>,
    }

    impl TestHome {
        fn new() -> Self {
            let dir = tempfile::tempdir().unwrap();
            let saved = ["HOME", "USERPROFILE", "CC_SWITCH_TEST_HOME"]
                .into_iter()
                .map(|key| {
                    let previous = std::env::var_os(key);
                    std::env::set_var(key, dir.path());
                    (key, previous)
                })
                .collect();
            crate::settings::reload_settings().unwrap();
            Self { _dir: dir, saved }
        }
    }

    impl Drop for TestHome {
        fn drop(&mut self) {
            for (key, value) in self.saved.drain(..) {
                match value {
                    Some(value) => std::env::set_var(key, value),
                    None => std::env::remove_var(key),
                }
            }
            let _ = crate::settings::reload_settings();
        }
    }

    fn state() -> AppState {
        AppState::new(Arc::new(crate::database::Database::memory().unwrap()))
    }

    fn direct_provider(app: &AppType) -> Provider {
        let settings = match app {
            AppType::Claude => json!({"env": {
                "ANTHROPIC_BASE_URL": "https://direct.example/v1",
                "ANTHROPIC_AUTH_TOKEN": "sk-direct",
                "ANTHROPIC_MODEL": "direct-model"
            }}),
            AppType::Codex => json!({"auth": {"OPENAI_API_KEY": "sk-direct"}, "config":
                "model = \"direct-model\"\nmodel_provider = \"custom\"\n[model_providers.custom]\nbase_url = \"https://direct.example/v1\"\nwire_api = \"responses\"\n"}),
            _ => unreachable!(),
        };
        Provider::with_id("direct".into(), "Direct".into(), settings, None)
    }

    async fn seed_legacy(state: &AppState, app: &AppType, stack: bool, attached: bool) {
        let provider = direct_provider(app);
        state.db.save_provider(app.as_str(), &provider).unwrap();
        crate::settings::set_current_provider(app, Some("direct")).unwrap();
        state
            .db
            .set_current_provider(app.as_str(), "direct")
            .unwrap();
        let store = DeviceStore::for_device();
        super::super::state::update(&store, |state| {
            let entry = state.apps.entry(app.as_str().into()).or_default();
            entry.mode = Some(Mode::Proxy);
            entry.attached = attached;
            entry.proxy_route = Some("removed-route".into());
            entry.stack.enabled = stack;
            entry.stack.members = vec!["removed-route".into()];
        })
        .unwrap();
        let mut config = state
            .db
            .get_proxy_config_for_app(app.as_str())
            .await
            .unwrap();
        config.enabled = true;
        config.auto_failover_enabled = true;
        state.db.update_proxy_config_for_app(config).await.unwrap();
        let mut global = state.db.get_global_proxy_config().await.unwrap();
        global.proxy_enabled = true;
        state.db.update_global_proxy_config(global).await.unwrap();
        if !attached {
            return;
        }
        match app {
            AppType::Claude => write_json_file(&crate::config::get_claude_settings_path(), &json!({
                "env": {"ANTHROPIC_BASE_URL": "http://127.0.0.1:15721", "ANTHROPIC_AUTH_TOKEN": "PROXY_MANAGED", "ANTHROPIC_MODEL": "ccs-old/model"},
                "modelPicker": {"options": [{"model":"ccs-old/model"}]},
                "permissions": {"allow": ["Read"]}
            })).unwrap(),
            AppType::Codex => {
                write_json_file(&crate::codex_config::get_codex_auth_path(), &json!({"OPENAI_API_KEY":"PROXY_MANAGED"})).unwrap();
                let path = crate::codex_config::get_codex_config_path();
                std::fs::create_dir_all(path.parent().unwrap()).unwrap();
                std::fs::write(path, "model = \"ccs-old/model\"\nmodel_provider = \"custom\"\n[model_providers.custom]\nbase_url = \"http://127.0.0.1:15721/v1\"\nexperimental_bearer_token = \"PROXY_MANAGED\"\nwire_api = \"responses\"\n").unwrap();
            }
            _ => unreachable!(),
        }
    }

    #[tokio::test]
    #[serial]
    async fn startup_restores_routing_and_aggregation_without_starting_a_server() {
        for app in LEGACY_PROXY_APPS {
            for stack in [false, true] {
                let _home = TestHome::new();
                let state = state();
                seed_legacy(&state, &app, stack, true).await;
                startup(&state).await;
                let live = match app {
                    AppType::Claude => {
                        let live: Value =
                            read_json_file(&crate::config::get_claude_settings_path()).unwrap();
                        assert_eq!(
                            live["env"]["ANTHROPIC_BASE_URL"],
                            "https://direct.example/v1"
                        );
                        assert_eq!(live["env"]["ANTHROPIC_AUTH_TOKEN"], "sk-direct");
                        assert_eq!(live["env"]["ANTHROPIC_MODEL"], "direct-model");
                        assert_eq!(live["permissions"], json!({"allow":["Read"]}));
                        assert!(live.get("modelPicker").is_none());
                        serde_json::to_string(&live).unwrap()
                    }
                    AppType::Codex => {
                        let text =
                            std::fs::read_to_string(crate::codex_config::get_codex_config_path())
                                .unwrap();
                        let config: toml::Value = text.parse().unwrap();
                        assert_eq!(config["model"].as_str(), Some("direct-model"));
                        assert_eq!(
                            config["model_providers"]["custom"]["base_url"].as_str(),
                            Some("https://direct.example/v1")
                        );
                        assert_eq!(
                            config["model_providers"]["custom"]["experimental_bearer_token"]
                                .as_str(),
                            Some("sk-direct")
                        );
                        text
                    }
                    _ => unreachable!(),
                };
                assert!(!live.contains("PROXY_MANAGED"));
                assert!(!live.contains("ccs-old"));
                let mode =
                    super::super::state::mode_state(&DeviceStore::for_device(), app.as_str())
                        .unwrap();
                assert_eq!(mode.mode, Some(Mode::Direct));
                assert!(!mode.attached);
                assert!(mode.proxy_route.is_none());
                assert!(
                    super::super::state::stack(&DeviceStore::for_device(), app.as_str())
                        .unwrap()
                        .is_empty()
                );
                assert_eq!(state.db.get_proxy_flags_sync(app.as_str()), (false, false));
                assert!(
                    !state
                        .db
                        .get_global_proxy_config()
                        .await
                        .unwrap()
                        .proxy_enabled
                );
                startup(&state).await;
                let again = match app {
                    AppType::Claude => serde_json::to_string(
                        &read_json_file::<Value>(&crate::config::get_claude_settings_path())
                            .unwrap(),
                    )
                    .unwrap(),
                    AppType::Codex => {
                        std::fs::read_to_string(crate::codex_config::get_codex_config_path())
                            .unwrap()
                    }
                    _ => unreachable!(),
                };
                assert_eq!(again, live);
            }
        }
    }

    #[tokio::test]
    #[serial]
    async fn startup_clears_detached_legacy_mode_without_changing_direct_live() {
        let _home = TestHome::new();
        let state = state();
        seed_legacy(&state, &AppType::Codex, true, false).await;
        let path = crate::codex_config::get_codex_config_path();
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        let expected = "# preserve my direct config\nmodel = \"unchanged\"\n";
        std::fs::write(&path, expected).unwrap();
        startup(&state).await;
        assert_eq!(std::fs::read_to_string(path).unwrap(), expected);
        assert_eq!(
            super::super::state::mode_state(&DeviceStore::for_device(), "codex")
                .unwrap()
                .mode,
            Some(Mode::Direct)
        );
    }

    #[tokio::test]
    #[serial]
    async fn migration_does_not_restore_a_provider_that_needs_removed_routing() {
        let _home = TestHome::new();
        let state = state();
        seed_legacy(&state, &AppType::Claude, false, true).await;
        let mut provider = direct_provider(&AppType::Claude);
        provider.meta = Some(ProviderMeta {
            provider_type: Some("github_copilot".into()),
            ..Default::default()
        });
        state.db.save_provider("claude", &provider).unwrap();
        startup(&state).await;
        let live: Value = read_json_file(&crate::config::get_claude_settings_path()).unwrap();
        assert!(live["env"].get("ANTHROPIC_AUTH_TOKEN").is_none());
        assert!(live["env"].get("ANTHROPIC_BASE_URL").is_none());
        assert_eq!(live["permissions"], json!({"allow":["Read"]}));
    }
    #[test]
    #[serial]
    fn enabling_an_unsupported_provider_keeps_the_current_client_files() {
        let _home = TestHome::new();
        let state = state();
        for (app, provider_type, format, wire) in [
            (AppType::Claude, None, Some("openai_chat"), None),
            (
                AppType::Claude,
                Some("github_copilot"),
                Some("anthropic"),
                None,
            ),
            (
                AppType::Claude,
                Some("codex_oauth"),
                Some("anthropic"),
                None,
            ),
            (AppType::Codex, None, Some("openai_chat"), Some("responses")),
            (AppType::Codex, None, Some("openai_responses"), Some("chat")),
            (
                AppType::Codex,
                Some("xai_oauth"),
                Some("openai_responses"),
                Some("responses"),
            ),
        ] {
            let mut provider = direct_provider(&app);
            provider.id = "unsupported".into();
            provider.meta = Some(ProviderMeta {
                provider_type: provider_type.map(str::to_string),
                api_format: format.map(str::to_string),
                ..Default::default()
            });
            if let Some(wire) = wire {
                let config = provider.settings_config["config"]
                    .as_str()
                    .unwrap()
                    .replace("responses", wire);
                provider.settings_config["config"] = Value::String(config);
            }
            state.db.save_provider(app.as_str(), &provider).unwrap();
            crate::settings::set_current_provider(&app, None).unwrap();
            let path = match app {
                AppType::Claude => crate::config::get_claude_settings_path(),
                AppType::Codex => crate::codex_config::get_codex_config_path(),
                _ => unreachable!(),
            };
            std::fs::create_dir_all(path.parent().unwrap()).unwrap();
            let expected = "unchanged client files";
            std::fs::write(&path, expected).unwrap();
            let result =
                crate::services::ProviderService::switch(&state, app.clone(), "unsupported");
            assert!(
                result.is_err(),
                "must reject {app:?}/{provider_type:?}/{format:?}/{wire:?}"
            );
            assert_eq!(std::fs::read_to_string(path).unwrap(), expected);
        }
    }
}
