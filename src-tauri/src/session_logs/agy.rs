//! Read Antigravity's exported transcripts; never open its binary conversation store for writing.
use chrono::DateTime;
use serde_json::Value;
use std::{
    collections::{BTreeMap, HashSet},
    fs,
    io::{BufRead, BufReader},
    path::{Path, PathBuf},
};

/// Antigravity CLI keeps sessions in `~/.gemini/antigravity-cli/brain`, while the IDE writes the
/// same layout to `~/.gemini/antigravity/brain`. API-key providers run agy with a private
/// `--gemini_dir` (`~/.cc-switch/agy/<provider>/`), so their sessions live under that directory's
/// `antigravity-cli/brain`. All of them are scanned.
fn session_roots() -> Vec<PathBuf> {
    let cli = crate::agy_config::agy_dir();
    let ide = cli.with_file_name("antigravity");
    let mut roots = vec![cli.join("brain"), ide.join("brain")];
    let mut profiles: Vec<PathBuf> = fs::read_dir(crate::agy_config::key_profiles_root())
        .into_iter()
        .flatten()
        .flatten()
        .filter(|entry| entry.file_type().is_ok_and(|t| t.is_dir()))
        .map(|entry| entry.path())
        .collect();
    profiles.sort();
    roots.extend(
        profiles
            .into_iter()
            .map(|dir| dir.join("antigravity-cli").join("brain")),
    );
    roots
}

/// Every readable transcript as `(conversation id, transcript path)`.
pub(crate) fn transcripts() -> Vec<(String, PathBuf)> {
    transcripts_in(&session_roots())
}

/// Missing roots are tolerated; a conversation id found in several roots is reported once (first wins).
fn transcripts_in(roots: &[PathBuf]) -> Vec<(String, PathBuf)> {
    let mut seen = HashSet::new();
    roots
        .iter()
        .flat_map(|root| transcripts_in_root(root))
        .filter(|(id, _)| seen.insert(id.clone()))
        .collect()
}

fn transcripts_in_root(root: &Path) -> Vec<(String, PathBuf)> {
    let canonical_root = root.canonicalize().ok();
    let mut found = Vec::new();
    let Ok(entries) = fs::read_dir(root) else {
        return found;
    };
    for entry in entries.flatten() {
        if !entry.file_type().is_ok_and(|t| t.is_dir()) {
            continue;
        }
        let Some(id) = entry.file_name().to_str().map(str::to_string).filter(|id| {
            !id.is_empty() && id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-')
        }) else {
            continue;
        };
        let path = entry
            .path()
            .join(".system_generated/logs/transcript_full.jsonl");
        if path.is_file()
            && path
                .canonicalize()
                .ok()
                .zip(canonical_root.as_ref())
                .is_some_and(|(path, root)| path.starts_with(root))
        {
            found.push((id, path));
        }
    }
    found
}

pub(crate) fn records(path: &Path) -> Result<Vec<Value>, String> {
    let file =
        fs::File::open(path).map_err(|e| format!("Cannot read Antigravity transcript: {e}"))?;
    // The export can rewrite steps as they finish. The latest record for a step wins.
    let mut steps = BTreeMap::new();
    for line in BufReader::new(file).lines() {
        let line = line.map_err(|e| format!("Cannot read Antigravity transcript: {e}"))?;
        let Ok(value) = serde_json::from_str::<Value>(&line) else {
            continue;
        };
        if let Some(index) = value["step_index"].as_u64() {
            steps.insert(index, value);
        }
    }
    Ok(steps.into_values().collect())
}

/// Milliseconds since the epoch. Integers may be seconds or milliseconds; strings are RFC 3339.
pub(crate) fn timestamp(value: &Value) -> Option<i64> {
    let value = &value["created_at"];
    if let Some(n) = value.as_i64().or_else(|| value.as_f64().map(|n| n as i64)) {
        return Some(if n > 1_000_000_000_000 { n } else { n * 1000 });
    }
    DateTime::parse_from_rfc3339(value.as_str()?)
        .ok()
        .map(|dt| dt.timestamp_millis())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn write_transcript(dir: &Path, content: &str) -> PathBuf {
        let logs = dir.join(".system_generated/logs");
        fs::create_dir_all(&logs).unwrap();
        let file = logs.join("transcript_full.jsonl");
        fs::write(&file, content).unwrap();
        file
    }

    #[test]
    fn agy_scans_cli_and_ide_roots_deduplicating_and_tolerating_missing() {
        let home = tempfile::tempdir().unwrap();
        let line = r#"{"step_index":0,"type":"USER_INPUT","content":"hi"}"#;
        write_transcript(&home.path().join("antigravity-cli/brain/cli-1"), line);
        write_transcript(&home.path().join("antigravity/brain/ide-1"), line);
        write_transcript(&home.path().join("antigravity/brain/cli-1"), line);
        write_transcript(&home.path().join("antigravity/brain/bad id"), line);
        let roots = vec![
            home.path().join("antigravity-cli/brain"),
            home.path().join("antigravity/brain"),
            home.path().join("missing/brain"),
        ];
        let mut found: Vec<_> = transcripts_in(&roots)
            .into_iter()
            .map(|(id, path)| (id, path.starts_with(home.path().join("antigravity-cli"))))
            .collect();
        found.sort();
        assert_eq!(
            found,
            [("cli-1".to_string(), true), ("ide-1".to_string(), false)]
        );
    }

    #[test]
    #[cfg(unix)]
    fn agy_discovery_does_not_follow_transcripts_outside_its_root() {
        let root = tempfile::tempdir().unwrap();
        let outside = tempfile::tempdir().unwrap();
        let session = root.path().join("abc-123");
        fs::create_dir_all(&session).unwrap();
        write_transcript(
            outside.path(),
            r#"{"step_index":0,"type":"USER_INPUT","content":"outside"}"#,
        );
        std::os::unix::fs::symlink(
            outside.path().join(".system_generated"),
            session.join(".system_generated"),
        )
        .unwrap();
        assert!(transcripts_in_root(root.path()).is_empty());
    }

    #[test]
    fn agy_records_keep_the_latest_step_and_skip_a_partial_tail() {
        let dir = tempfile::tempdir().unwrap();
        let file = write_transcript(dir.path(), concat!(
            "{\"step_index\":0,\"type\":\"USER_INPUT\",\"content\":\"hello\",\"created_at\":\"2026-10-13T17:26:12Z\"}\n",
            "{\"step_index\":1,\"type\":\"PLANNER_RESPONSE\",\"content\":\"draft\"}\n",
            "{\"step_index\":1,\"type\":\"PLANNER_RESPONSE\",\"content\":\"done\",\"input_tokens\":100}\n{"
        ));
        let rows = records(&file).unwrap();
        assert_eq!(rows.len(), 2);
        assert_eq!(rows[1]["content"], "done");
        assert_eq!(timestamp(&rows[0]), Some(1_791_912_372_000));
        assert_eq!(timestamp(&rows[1]), None);
    }

    #[test]
    fn agy_timestamps_accept_seconds_and_milliseconds() {
        assert_eq!(
            timestamp(&json!({"created_at": 1_771_061_953_033_i64})),
            Some(1_771_061_953_033)
        );
        assert_eq!(
            timestamp(&json!({"created_at": 1_771_061_953_i64})),
            Some(1_771_061_953_000)
        );
    }
}
