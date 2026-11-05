//! Session usage sync holds the database connection for 30–40 s on a large
//! session file. Tauri 2 runs synchronous commands on the main thread, so any
//! command that waits for that lock froze the window and the tray. Each command
//! below must instead yield while the lock is held, then finish once it is free.

use std::future::Future;
use std::sync::{mpsc, Arc};
use std::task::Context;
use std::time::Duration;

use tauri::Manager;

use crate::database::Database;
use crate::provider::Provider;
use crate::services::model_pricing::ModelPricingInfo;
use crate::store::AppState;

struct TestHome {
    previous: Option<std::ffi::OsString>,
    _directory: tempfile::TempDir,
}

impl TestHome {
    fn new() -> Self {
        let directory = tempfile::tempdir().unwrap();
        let previous = std::env::var_os("CC_SWITCH_TEST_HOME");
        std::env::set_var("CC_SWITCH_TEST_HOME", directory.path());
        crate::settings::reload_settings().unwrap();
        Self {
            previous,
            _directory: directory,
        }
    }
}

impl Drop for TestHome {
    fn drop(&mut self) {
        match &self.previous {
            Some(value) => std::env::set_var("CC_SWITCH_TEST_HOME", value),
            None => std::env::remove_var("CC_SWITCH_TEST_HOME"),
        }
        let _ = crate::settings::reload_settings();
    }
}

/// Poll the command once while another thread holds the connection mutex.
/// A command that waits on the polling thread keeps the holder from being
/// released by us, and the holder's own timeout turns that into a failure.
fn while_connection_locked<F: Future>(db: &Arc<Database>, name: &str, command: F) -> F::Output {
    let (locked_tx, locked_rx) = mpsc::channel();
    let (release_tx, release_rx) = mpsc::channel();
    let db = db.clone();
    let holder = std::thread::spawn(move || {
        let _guard = db.conn.lock().unwrap();
        locked_tx.send(()).unwrap();
        release_rx.recv_timeout(Duration::from_secs(5)).is_ok()
    });
    locked_rx.recv_timeout(Duration::from_secs(5)).unwrap();

    let mut command = std::pin::pin!(command);
    let first_poll = command
        .as_mut()
        .poll(&mut Context::from_waker(futures::task::noop_waker_ref()));
    let _ = release_tx.send(());
    assert!(
        holder.join().unwrap(),
        "{name} blocked its polling thread on the database lock"
    );
    assert!(
        first_poll.is_pending(),
        "{name} must wait asynchronously for the database"
    );

    tauri::async_runtime::block_on(async {
        tokio::time::timeout(Duration::from_secs(5), command)
            .await
            .unwrap_or_else(|_| panic!("{name} did not complete after releasing the database"))
    })
}

#[test]
#[serial_test::serial]
fn database_commands_yield_during_session_sync_contention() {
    let _home = TestHome::new();
    let db = Arc::new(Database::memory().unwrap());
    let provider = Provider::with_id(
        "test-provider".into(),
        "Test provider".into(),
        serde_json::json!({}),
        None,
    );
    db.save_provider("opencode", &provider).unwrap();
    db.save_provider("claude", &provider).unwrap();
    db.set_current_provider("claude", &provider.id).unwrap();
    let app = tauri::test::mock_builder()
        .manage(AppState::new(db.clone()))
        .build(tauri::test::mock_context(tauri::test::noop_assets()))
        .unwrap();

    // `run!` returns the command's own result; `ok!` also unwraps it.
    macro_rules! run {
        ($name:ident ( $($arg:expr),* )) => {
            while_connection_locked(&db, stringify!($name), super::$name($($arg),*))
        };
    }
    macro_rules! ok {
        ($name:ident ( $($arg:expr),* )) => {
            run!($name($($arg),*)).unwrap()
        };
    }

    // Providers.
    let providers = ok!(get_providers(app.state(), "opencode".into()));
    assert_eq!(providers[&provider.id].name, "Test provider");
    assert_eq!(
        ok!(get_current_provider(app.state(), "claude".into())),
        "test-provider"
    );
    assert!(ok!(ensure_codex_official_provider(app.state())));
    run!(import_default_config(app.state(), "claude".into())).ok();
    assert_eq!(ok!(import_opencode_providers_from_live(app.state())), 0);

    // Endpoint speed test.
    let url = "https://example.invalid/v1".to_string();
    ok!(add_custom_endpoint(
        app.state(),
        "claude".into(),
        provider.id.clone(),
        url.clone()
    ));
    ok!(update_endpoint_last_used(
        app.state(),
        "claude".into(),
        provider.id.clone(),
        url.clone()
    ));
    let endpoints = ok!(get_custom_endpoints(
        app.state(),
        "claude".into(),
        provider.id.clone()
    ));
    assert_eq!(endpoints.len(), 1);
    assert_eq!(endpoints[0].url, url);
    ok!(remove_custom_endpoint(
        app.state(),
        "claude".into(),
        provider.id.clone(),
        url
    ));

    // Icon picker.
    assert!(ok!(get_custom_icons(app.state())).is_empty());
    run!(add_custom_icon(
        app.state(),
        "x".into(),
        "not-an-image".into()
    ))
    .ok();
    run!(rename_custom_icon(
        app.state(),
        "missing".into(),
        "y".into()
    ))
    .ok();
    run!(delete_custom_icon(app.state(), "missing".into())).ok();

    // Skills (state comes last).
    assert!(ok!(get_installed_skills(app.state())).is_empty());
    ok!(scan_unmanaged_skills(app.state()));
    assert!(ok!(import_skills_from_apps(Vec::new(), app.state())).is_empty());
    run!(toggle_skill_app(
        "missing".into(),
        "claude".into(),
        true,
        app.state()
    ))
    .ok();
    run!(restore_skill_backup(
        "missing".into(),
        "claude".into(),
        app.state()
    ))
    .ok();
    run!(uninstall_skill_unified("missing".into(), app.state())).ok();

    // Pi.
    let script: crate::provider::UsageScript = serde_json::from_value(serde_json::json!({
        "enabled": false, "language": "javascript", "code": ""
    }))
    .unwrap();
    run!(update_pi_provider_usage_script(
        app.state(),
        "pi".into(),
        "missing".into(),
        script
    ))
    .ok();

    // Deep link import.
    let request: crate::deeplink::DeepLinkImportRequest =
        serde_json::from_value(serde_json::json!({
            "version": "v1", "resource": "provider", "app": "claude", "name": "Deep link",
            "endpoint": "https://example.invalid", "apiKey": "test"
        }))
        .unwrap();
    run!(import_from_deeplink(app.state(), request)).ok();

    // Model pricing and usage settings (startup path).
    let pricing = ModelPricingInfo {
        model_id: "offthread-test-model".into(),
        display_name: "Test model".into(),
        input_cost_per_million: "1".into(),
        output_cost_per_million: "2".into(),
        cache_read_cost_per_million: "0".into(),
        cache_creation_cost_per_million: "0".into(),
    };
    let sync = ok!(get_models_dev_sync_config(app.state()));
    ok!(save_models_dev_sync_config(app.state(), sync.config));
    assert_eq!(
        ok!(update_model_pricing_batch(
            app.state(),
            vec![pricing.clone()]
        )),
        1
    );
    ok!(update_model_pricing(
        app.state(),
        pricing.model_id.clone(),
        "Renamed".into(),
        "3".into(),
        "4".into(),
        "0".into(),
        "0".into()
    ));
    let prices = ok!(get_model_pricing(app.state()));
    let entry = prices
        .iter()
        .find(|entry| entry.model_id == "offthread-test-model")
        .unwrap();
    assert_eq!(entry.display_name, "Renamed");
    ok!(record_models_dev_sync_result(
        app.state(),
        Some(1234),
        Some("offline".into())
    ));
    let sync = ok!(get_models_dev_sync_config(app.state()));
    assert_eq!(sync.config.last_sync_at, Some(1234));
    assert_eq!(sync.config.last_sync_error.as_deref(), Some("offline"));
    ok!(delete_model_pricing(app.state(), pricing.model_id.clone()));
    ok!(check_provider_limits(
        app.state(),
        provider.id.clone(),
        "claude".into()
    ));
    assert!(ok!(get_usage_data_sources(app.state())).is_empty());

    // Mutations last: removing and deleting the opencode provider.
    run!(remove_provider_from_live_config(
        app.state(),
        "opencode".into(),
        provider.id.clone()
    ))
    .ok();
    assert!(ok!(delete_provider(
        app.state(),
        "opencode".into(),
        provider.id.clone()
    )));
    assert!(db
        .get_provider_by_id(&provider.id, "opencode")
        .unwrap()
        .is_none());

    // Validation errors still reach the caller after moving work off-thread.
    assert!(
        tauri::async_runtime::block_on(super::get_providers(app.state(), "invalid".into()))
            .is_err()
    );
}

/// Pi reads its state behind the app's switch lock, which a provider switch
/// holds while it waits for the database.
#[test]
#[serial_test::serial]
fn pi_state_yields_while_a_provider_switch_holds_the_lock() {
    let _home = TestHome::new();
    let app = tauri::test::mock_builder()
        .manage(AppState::new(Arc::new(Database::memory().unwrap())))
        .build(tauri::test::mock_context(tauri::test::noop_assets()))
        .unwrap();
    let state = app.state::<AppState>();
    let guard = tauri::async_runtime::block_on(state.proxy_service.lock_switch_for_app("pi"));
    let command = super::get_pi_current_state(app.state());
    let mut command = std::pin::pin!(command);
    let first_poll = command
        .as_mut()
        .poll(&mut Context::from_waker(futures::task::noop_waker_ref()));
    drop(guard);
    assert!(
        first_poll.is_pending(),
        "get_pi_current_state must wait asynchronously for the switch lock"
    );
    let pi = tauri::async_runtime::block_on(async {
        tokio::time::timeout(Duration::from_secs(5), command)
            .await
            .expect("get_pi_current_state did not complete after releasing the switch lock")
    })
    .unwrap();
    assert!(pi.enabled_provider_ids.is_empty());
}
