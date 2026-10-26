use std::fs;
use std::path::{Path, PathBuf};

pub(crate) const MAX_TREE_ENTRIES: usize = 500_000;
const MAX_TREE_ID_BYTES: usize = 256;
pub(crate) const MAX_SESSION_BYTES: u64 = 128 * 1024 * 1024;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum SessionLayout {
    Flat,
    ProjectDirectories,
}

#[derive(Debug, PartialEq, Eq)]
enum SessionRootResolution {
    Available {
        root: PathBuf,
        layout: SessionLayout,
    },
    RequiresProjectContext {
        configured_path: String,
    },
    Unavailable {
        reason: String,
    },
}

/// Return candidate JSONL files using Pi's active root and layout rules.
/// Oversized files remain candidates so the usage importer can report them
/// instead of silently treating an incomplete import as success. Nested
/// subagent and fork sessions are included.
pub(crate) fn session_files() -> Result<Vec<PathBuf>, String> {
    session_files_from_resolution(resolve_session_root())
}

fn session_files_from_resolution(
    resolution: SessionRootResolution,
) -> Result<Vec<PathBuf>, String> {
    match resolution {
        SessionRootResolution::Available { root, layout } => {
            let mut files = Vec::new();
            collect_jsonl_files(&root, layout, &mut files);
            let mut children = Vec::new();
            for session in &files {
                collect_child_session_files(&session.with_extension(""), &mut children);
            }
            files.extend(children);
            files.sort();
            Ok(files)
        }
        SessionRootResolution::RequiresProjectContext { configured_path } => Err(format!(
            "Pi sessionDir '{configured_path}' requires a project cwd and cannot be globally enumerated"
        )),
        SessionRootResolution::Unavailable { reason } => Err(reason),
    }
}

/// Pi keeps a relative `sessionDir` relative through SessionManager creation;
/// its file operations therefore depend on the launching process cwd. A global
/// importer has no authoritative launch cwd, so relative values are
/// deliberately non-enumerable and never fall back to another root.
fn resolve_session_root() -> SessionRootResolution {
    let home = crate::config::get_home_dir();
    if let Some(raw) = std::env::var_os("PI_CODING_AGENT_SESSION_DIR") {
        if !raw.is_empty() {
            return classify_configured_session_dir(
                raw.to_string_lossy().as_ref(),
                &home,
                "environment",
            );
        }
    }

    match crate::pi_config::read_pi_native_defaults() {
        Ok(defaults) => {
            if let Some(value) = defaults.session_dir.filter(|value| !value.is_empty()) {
                return classify_configured_session_dir(&value, &home, "settings");
            }
        }
        Err(error) => {
            return SessionRootResolution::Unavailable {
                reason: error.to_string(),
            };
        }
    }

    match crate::pi_config::get_pi_agent_dir() {
        Ok(agent_dir) => SessionRootResolution::Available {
            root: agent_dir.join("sessions"),
            layout: SessionLayout::ProjectDirectories,
        },
        Err(error) => SessionRootResolution::Unavailable {
            reason: error.to_string(),
        },
    }
}

fn classify_configured_session_dir(
    value: &str,
    home: &Path,
    source: &'static str,
) -> SessionRootResolution {
    match resolve_global_session_dir(value, home) {
        Some(root) => match fs::metadata(&root) {
            Ok(metadata) if !metadata.is_dir() => SessionRootResolution::Unavailable {
                reason: format!(
                    "Configured Pi session directory from {source} is not a directory: {}",
                    root.display()
                ),
            },
            Ok(_) => match fs::read_dir(&root) {
                Ok(_) => SessionRootResolution::Available {
                    root,
                    layout: SessionLayout::Flat,
                },
                Err(error) => SessionRootResolution::Unavailable {
                    reason: format!(
                        "Configured Pi session directory from {source} is not readable ({}): {error}",
                        root.display()
                    ),
                },
            },
            Err(error) => SessionRootResolution::Unavailable {
                reason: format!(
                    "Configured Pi session directory from {source} is unavailable ({}): {error}",
                    root.display()
                ),
            },
        },
        None => SessionRootResolution::RequiresProjectContext {
            configured_path: value.to_string(),
        },
    }
}

fn resolve_global_session_dir(value: &str, home: &Path) -> Option<PathBuf> {
    let path = if value == "~" {
        home.to_path_buf()
    } else if let Some(suffix) = value
        .strip_prefix("~/")
        .or_else(|| value.strip_prefix("~\\"))
    {
        home.join(suffix)
    } else {
        PathBuf::from(value)
    };
    path.is_absolute().then_some(path)
}

pub(crate) fn is_valid_tree_id(id: &str) -> bool {
    let bytes = id.as_bytes();
    !bytes.is_empty()
        && bytes.len() <= MAX_TREE_ID_BYTES
        && bytes.first().is_some_and(u8::is_ascii_alphanumeric)
        && bytes.last().is_some_and(u8::is_ascii_alphanumeric)
        && bytes
            .iter()
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_' | b'.'))
}

fn collect_jsonl_files(root: &Path, layout: SessionLayout, output: &mut Vec<PathBuf>) {
    let Ok(entries) = fs::read_dir(root) else {
        return;
    };
    for entry in entries.flatten() {
        let Ok(file_type) = entry.file_type() else {
            continue;
        };
        match layout {
            SessionLayout::Flat if file_type.is_file() => push_jsonl_file(&entry, output),
            SessionLayout::ProjectDirectories if file_type.is_dir() => {
                let Ok(project_entries) = fs::read_dir(entry.path()) else {
                    continue;
                };
                for project_entry in project_entries.flatten() {
                    if project_entry
                        .file_type()
                        .is_ok_and(|file_type| file_type.is_file())
                    {
                        push_jsonl_file(&project_entry, output);
                    }
                }
            }
            SessionLayout::Flat | SessionLayout::ProjectDirectories => {}
        }
    }
}

fn push_jsonl_file(entry: &fs::DirEntry, output: &mut Vec<PathBuf>) {
    let path = entry.path();
    if path.extension().and_then(|value| value.to_str()) == Some("jsonl") {
        output.push(path);
    }
}

/// Subagent runs and forks nest under their parent session's extension-less
/// path, and grandchildren under the child's own. `subagent-artifacts`
/// directories hold transcripts and audit logs without a session header, so
/// they are skipped. `DirEntry::file_type` does not follow symlinks, so the
/// walk cannot loop.
fn collect_child_session_files(dir: &Path, output: &mut Vec<PathBuf>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let Ok(file_type) = entry.file_type() else {
            continue;
        };
        if file_type.is_dir() {
            if entry.file_name() != "subagent-artifacts" {
                collect_child_session_files(&entry.path(), output);
            }
        } else if file_type.is_file() {
            push_jsonl_file(&entry, output);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;

    fn write_session_header(path: &Path, id: &str) {
        fs::create_dir_all(path.parent().expect("session parent")).expect("create session parent");
        fs::write(
            path,
            format!("{{\"type\":\"session\",\"version\":3,\"id\":\"{id}\",\"cwd\":\"/work\"}}\n"),
        )
        .expect("write session");
    }

    #[test]
    fn relative_root_is_explicitly_non_enumerable() {
        assert_eq!(
            resolve_global_session_dir(".pi/sessions", Path::new("/home/pi")),
            None
        );
        assert_eq!(
            classify_configured_session_dir(".pi/sessions", Path::new("/home/pi"), "settings"),
            SessionRootResolution::RequiresProjectContext {
                configured_path: ".pi/sessions".to_string(),
            }
        );
    }

    #[test]
    fn unavailable_explicit_roots_are_not_reported_as_empty_history() {
        let temp = tempfile::tempdir().expect("tempdir");
        let missing = temp.path().join("missing");
        assert!(matches!(
            classify_configured_session_dir(
                missing.to_string_lossy().as_ref(),
                temp.path(),
                "settings"
            ),
            SessionRootResolution::Unavailable { .. }
        ));

        let file = temp.path().join("sessions.jsonl");
        fs::write(&file, b"").expect("session file");
        assert!(matches!(
            classify_configured_session_dir(
                file.to_string_lossy().as_ref(),
                temp.path(),
                "settings"
            ),
            SessionRootResolution::Unavailable { .. }
        ));

        let directory = temp.path().join("sessions");
        fs::create_dir(&directory).expect("session directory");
        assert!(matches!(
            classify_configured_session_dir(
                directory.to_string_lossy().as_ref(),
                temp.path(),
                "settings"
            ),
            SessionRootResolution::Available { root, .. } if root == directory
        ));

        let unavailable = SessionRootResolution::Unavailable {
            reason: "fixture unavailable".to_string(),
        };
        assert_eq!(
            session_files_from_resolution(unavailable).expect_err("discovery error"),
            "fixture unavailable"
        );
        let relative = SessionRootResolution::RequiresProjectContext {
            configured_path: ".pi/sessions".to_string(),
        };
        assert!(session_files_from_resolution(relative)
            .expect_err("relative discovery error")
            .contains("requires a project cwd"));
    }

    #[test]
    fn usage_collection_keeps_oversized_files_for_error_reporting() {
        let temp = tempfile::tempdir().expect("tempdir");
        let root = temp.path().join("sessions");
        fs::create_dir_all(&root).expect("root");
        let path = root.join("oversized.jsonl");
        File::create(&path)
            .expect("create sparse session")
            .set_len(MAX_SESSION_BYTES + 1)
            .expect("size sparse session");

        let resolution = SessionRootResolution::Available {
            root,
            layout: SessionLayout::Flat,
        };
        assert_eq!(
            session_files_from_resolution(resolution).expect("usage files"),
            vec![path]
        );
    }

    #[test]
    fn usage_discovery_includes_subagent_child_sessions() {
        for layout in [SessionLayout::Flat, SessionLayout::ProjectDirectories] {
            let temp = tempfile::tempdir().expect("tempdir");
            let root = temp.path().join("sessions");
            let base = match layout {
                SessionLayout::Flat => root.clone(),
                SessionLayout::ProjectDirectories => root.join("project"),
            };
            let parent = base.join("parent.jsonl");
            let run = base.join("parent").join("run-a").join("run-0");
            let child = run.join("session.jsonl");
            let fork = base.join("parent").join("forks").join("fork.jsonl");
            let grandchild = run
                .join("session")
                .join("run-b")
                .join("run-0")
                .join("session.jsonl");
            for (path, id) in [
                (&parent, "parent"),
                (&child, "child"),
                (&fork, "fork"),
                (&grandchild, "grandchild"),
            ] {
                write_session_header(path, id);
            }
            let nested_artifacts = run.join("subagent-artifacts");
            let fork_artifacts = base.join("parent").join("forks").join("subagent-artifacts");
            for artifact in [
                base.join("subagent-artifacts")
                    .join("run-a_worker_0_transcript.jsonl"),
                nested_artifacts.join("run-b_worker_0_transcript.jsonl"),
                nested_artifacts.join("run-b.jsonl"),
                nested_artifacts
                    .join("permission-audit")
                    .join("audit.jsonl"),
                fork_artifacts.join("fork_worker_0_transcript.jsonl"),
            ] {
                fs::create_dir_all(artifact.parent().expect("artifact parent"))
                    .expect("create artifact parent");
                fs::write(&artifact, "{\"recordType\":\"message\"}\n").expect("write artifact");
            }

            let mut expected = vec![parent, child, fork, grandchild];
            expected.sort();
            let resolution = SessionRootResolution::Available {
                root: root.clone(),
                layout,
            };
            assert_eq!(
                session_files_from_resolution(resolution).expect("usage files"),
                expected,
                "{layout:?}"
            );
        }
    }
}
