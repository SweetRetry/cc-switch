use cc_switch_lib::AppType;
use std::str::FromStr;

#[test]
fn parse_known_apps_case_insensitive_and_trim() {
    for (input, expected) in [
        ("claude", AppType::Claude),
        ("codex", AppType::Codex),
        ("opencode", AppType::OpenCode),
        ("pi", AppType::Pi),
        ("agy", AppType::Agy),
        (" ClAuDe \n", AppType::Claude),
        ("\tcoDeX\t", AppType::Codex),
    ] {
        assert_eq!(AppType::from_str(input).unwrap(), expected);
    }
}

#[test]
fn retired_clients_are_not_accepted_or_listed() {
    assert_eq!(
        AppType::all()
            .map(|app| app.as_str().to_string())
            .collect::<Vec<_>>(),
        vec!["claude", "codex", "opencode", "pi", "agy"]
    );
    for input in [
        "claude-desktop",
        "gemini",
        "grokbuild",
        "Grok-Build",
        "openclaw",
        "hermes",
        "mcode",
        "kimi",
        "omp",
    ] {
        assert!(AppType::from_str(input).is_err(), "{input}");
    }
}

#[test]
fn parse_unknown_app_returns_localized_error_message() {
    let err = AppType::from_str("unknown").unwrap_err();
    let msg = err.to_string();
    assert!(msg.contains("可选值") || msg.contains("Allowed"));
    assert!(msg.contains("unknown"));
}
