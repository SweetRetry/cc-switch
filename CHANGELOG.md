# Changelog

All notable changes to CC Switch will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.20] - 2026-10-24

This release adds Oh My Pi as the thirteenth managed app: providers coexist in `models.yml` with enable/remove actions, MCP, Skills, prompts and sessions are supported, and the Apps page installs, updates and uninstalls `omp`. The Apps page is split into installed and not-installed sections, installed apps can be reordered by dragging and the sidebar follows that order. Official Kimi cards can be edited and removed from Kimi Code, and managed ChatGPT accounts can sign in through the browser. Other fixes cover an empty or negative DeepSeek balance shown as an expired plan, missing Kimi Code subagent usage, HTTP 429 on Skills updates, 401 on Pi usage queries with `$NAME` API keys, `<local-command-stdout>` as Claude Code session titles, and window dragging on Linux with app-level window controls.

**Stats**: 37 commits | 198 files changed | +11737 insertions | -3046 deletions

### Added

- **Oh My Pi Support** (#6747, #8308; refs #6422, #6662, #8057): Oh My Pi (command `omp`) is a new additive app. The agent directory is `~/.omp/agent` (or `~/.omp/profiles/<name>/agent` for a named profile; `PI_CONFIG_DIR` and the XDG data dir are honored) and can be overridden in settings. Providers are edited in `models.yml` as text: only the one entry CC Switch writes is rewritten, entries with anchors, tags or flow style are refused instead of re-emitted, and the file is rolled back byte for byte when the database commit fails. Nodes are checked against omp 18.12's schema before writing (compat enums, `reasoningEffortMap` levels, `auth`, `authHeader`, discovery type, `injectV1`, `timeoutMs`), since one invalid node disables every custom provider; with only a legacy `models.json` present, adding a provider is refused until omp has migrated it. The Pi provider form, presets and fetched-model dialog are shared, with a discovery type selector under Advanced Options. Usage queries resolve an omp `apiKey` as an environment variable name (process env, then `.env` in the agent dir, config root and home) before falling back to the literal; `!command` values are never run. MCP goes to `mcp.json` (revision checked), Skills follow Pi (no DB column, state from `<agent>/skills`), the global prompt goes to `AGENTS.md`, and sessions are read through the Pi session reader with project images allowed in previews. The Apps page installs with the official installer (Bun when present, otherwise the verified binary), updates with `omp update` and recognizes the installer's binary for uninstall. The MCP and Skills matrices explain in the Oh My Pi column that omp also discovers servers and skills from other agents' directories. Local routing and usage import do not apply. Database schema 22 → 23 adds `enabled_omp` to `mcp_servers`.
- **Browser Login for Managed ChatGPT Accounts** (#8288, fixes #8284): The Auth Center and the Codex provider form offer browser login (authorization code + PKCE with a loopback callback on port 1455) next to device-code login, including reauthentication, for workspaces that disable device codes.

### Changed

### Fixed

- **Empty DeepSeek Balance Shown as an Expired Plan** (b9f317af5, refs #8812): `is_available` only says whether the balance covers calls; the balance is always reported valid and invalid keys go through the 401/403 path.
- **Kimi Code Subagent Usage Missing** (f395cd6be, refs #8792): Every `agents/<agent>/wire.jsonl` is scanned; subagent `step.end` records with usage are imported, keyed by `messageId`, with a per-agent request index. The parent's `subagent.completed` summary is not counted.
- **Antigravity Subagent Usage Imported as Unknown** (#8693): The model is recovered read-only from `conversations/<id>.db` (field 21, falling back to 19).
- **Skills Downloads Throttled with HTTP 429** (442df1db7, refs #8813): Archive downloads send `CC-Switch/<version>` as the User-Agent.
- **Pi `$NAME` API Keys Sent Verbatim to Usage Queries** (dcdcbcb47, refs #8822): `$NAME`, `${NAME}`, `$$` and `$!` are resolved with Pi's rules for Coding Plan, balance and usage-script requests; unset references and `!command` give an empty key; nothing is written back.
- **`<local-command-stdout>` as Claude Code Session Titles** (#8799, fixes #8798): Title and summary skip injected local-command output and slash command records.
- **Linux Window Dragging and Resize Cursors with App-Level Window Controls** (#8092, fixes #8091).
- **Orphan Tool Result Media Placeholder** (#8157): The Codex Chat orphan path uses the "attached as native media" marker instead of pointing at a following user message.
- **omp Duplicate Key Check Queried Pi** (6e040f4c8).

### Upgrade notes

- **Database schema 22 → 23** (adds `enabled_omp` to `mcp_servers`); the database is backed up before upgrading. Older versions refuse a version-23 database.
- Oh My Pi is shown in the sidebar by default; turn it off on the Apps page.

## [4.0.19] - 2026-10-23

This release adds Kimi Code as the twelfth managed app (the CLI and the desktop app share one configuration, so both are covered): providers coexist in `~/.kimi-code/config.toml` with add/remove/set-default actions, MCP, Skills, prompts, sessions and session-log usage are supported, and official Kimi subscriptions can be signed in to (several accounts in the Auth Center, each with its own credential slot, provider, nickname and quota). The usage page is reorganized around one scope bar, a selectable metric strip driving the trend chart and heatmap, and a tabbed detail panel with a rows-per-page choice. Other fixes cover Codex `unsupported call: exec` after switching between third-party GPT and direct models in aggregation, Settings → About freezing when launched from a terminal on Linux/WSL, Codex image input turned off by model-metadata fill, the "Unsupported content type: redacted_thinking" message in Claude Code's VS Code extension on Responses upstreams, macOS Claude subscription quota reading the wrong keychain item, Antigravity quota missing the Gemini group and Windows console windows, the Hermes dashboard on WSL, and Escape closing every stacked panel.

**Stats**: 45 commits | 206 files changed | +15661 insertions | -2347 deletions

### Added

- **Kimi Code Support** (#8687): Kimi Code (command `kimi`) is a new additive app reading `~/.kimi-code/config.toml` (or `KIMI_CODE_HOME`). The Kimi Code CLI and desktop app share this directory, so everything below applies to both. Providers and their models are written as native `[providers]`/`[models]` entries without touching other nodes, environment variables or OAuth references; presets come from the Pi catalog grouped like the other apps. MCP (stdio, HTTP, SSE), Skills with native-directory protection, the global prompt, session browsing/resume and session-log usage import (input, output, cache, first-token time and duration) are supported. The Apps page installs, upgrades and uninstalls Kimi Code with the official installer. Local routing and aggregation do not apply. Database schema 21 → 22 adds `enabled_kimi` columns.
- **Kimi Provider Cards** (d6a232419, 1c52fa918): Available cards get "Add", which writes the provider and its models into `config.toml` without changing `default_model`; added cards get "Remove", and "Set as default" lives in the more menu. The provider owning `default_model` (or the subagent model) is marked as default and cannot be removed; a refused removal rereads `config.toml` and explains why in all four locales. Native nodes already in `config.toml` are never overwritten from the stored copy.
- **Kimi Provider Form** (b61e2767c, 0f7682900, 8969264b9, b96ff6182): "Fetch models" and the per-row picker fill context window, thinking and image input from the matching preset or models.dev; models are one row each with a display name column (`display_name`, shown in Kimi's `/model`); "Always thinking" and "Load tools on demand" have help tips; request headers move under "Advanced options".
- **Kimi Official Accounts** (#8710, #8726, cdd2190df, c49c2be94, 44e0fc963): Sign in with Kimi (mainland or global, device code in the browser) from the Auth Center; the "Kimi Code official login" preset links there. Official cards are managed only in the Auth Center. The first login uses Kimi's own `managed:kimi-code` slot; further accounts get their own credential file, provider node and model aliases (`kimi-code-ccs-<hash>`), and their provider key is "Kimi 订阅 <nickname>" so Kimi's model picker shows a readable name. Each row and official card shows the account's nickname and quota; tokens close to expiry are refreshed under Kimi's own lock (`<slot>.lock`, read-only on Windows). Re-login updates the same slot and keeps custom fields; removing a separate account deletes its node, models, credential and card (refused while in use); Kimi's own login is only hidden, never logged out. OAuth hosts are pinned per region and connection errors name the host and cause.

### Changed

### Fixed

- **Codex `unsupported call: exec` After Switching Models in Aggregation** (fixes #8676): Every third-party aggregation row shared one `comp_hash`, so switching from a third-party GPT row (`code_mode_only`, shell calls recorded as `exec`) to a direct model skipped compaction and the direct model copied `exec` calls. Rows are now grouped by tool protocol (`cc-switch-<tool_mode>`; direct rows keep `cc-switch`), so cross-protocol switches compact first.
- **Settings → About Froze When Launched from a Terminal on Linux/WSL** (fixes #3241): The `$SHELL -lic` version probe kept the controlling tty and was stopped by SIGTTIN. It now runs with stdin null, its own session and the 10 s deadline.
- **Codex Image Input Turned Off by Model Metadata Fill** (refs #8682): Picking a fetched model the lookup reported as text-only wrote `inputModalities: ["text"]`, which Codex treats as no images, with no control to undo it. Modalities are only filled when the metadata includes image.
- **Relay Models Borrowed Another Vendor's Hosted Entry** (refs #8765, #8682): When no same-name entry resolved, the metadata fallback took any entry listed under a vendor-like provider, so `deepseek-v4.1-flash-1017` picked thinkingmachines' text-only LoRA entry (262144 window). Entries whose `canonical_model_id` names another vendor are now skipped and the fields stay empty.
- **"Unsupported content type: redacted_thinking" in Claude Code's VS Code Extension** (refs #8691): Encrypted-only reasoning from OpenAI Responses upstreams is emitted as an empty `thinking` block carrying the signature instead of `redacted_thinking`; replay is byte-identical. Summary text that only arrives in `output_item.done` is recovered.
- **macOS Claude Subscription Quota Read the Wrong Keychain Item** (#8764, fixes #8762): Lookup now queries `-a $USER` first, keeps the service-only query for compatibility, and skips entries without a Claude OAuth token so the credentials-file fallback runs.
- **Antigravity Quota Missing Gemini on macOS**: Google returns the Gemini group only to `antigravity/cli/<version>` from 1.2.0, so the User-Agent is now `cc-switch/<version> (antigravity/cli/<agy version>)` from the local `agy --version` (fallback 1.4.6).
- **Black Console Windows When Refreshing Antigravity Quota on Windows** (refs #8700): `agy --print /usage` and `agy models` run with `CREATE_NO_WINDOW`.
- **Hermes Dashboard Started on Windows When Hermes Lives in WSL** (refs #8689): With a `\\wsl$` / `\\wsl.localhost` config directory, "launch dashboard" runs `hermes dashboard` inside the distribution through the login shell.
- **Codex Session Header Aliases** (#8718): `session-id` and `thread-id` headers are recognized after `session_id` and `x-session-id`.
- **Bailian / Qianwen Token Plan Model List** (#8755): `/apps/anthropic` base URLs also try `{root}/compatible-mode/v1/models`.
- **OpenCode Zen / Go Addresses Not Matched to models.dev**: The old `/zen/...` addresses map to the moved `/inference/...` entries, so models such as `deepseek-v4.1-flash` fill again.
- **Escape Closed Every Stacked Panel**: Only the topmost full-screen panel reacts.
- **A Finished Deep-Link Import Closed a Newer Link's Confirmation** (refs #8696).
- **Usage 7/14/30-Day Presets Shifted a Day Across DST** (refs #8719): The start is computed from calendar days.
- **Empty Request Log After the Total Shrank on a Later Page**: The page index is clamped back.
- **Redundant "not installed or not executable" Line on the Apps Page**.
- **Advanced Options Toggles Jumped When Pressed** in the Claude, Codex and Kimi Code forms.

### Upgrade notes

- **Database schema 21 → 22** (adds `enabled_kimi` to `mcp_servers` and `skills`); the database is backed up before upgrading. Older versions refuse a version-22 database.
- Kimi Code is shown in the sidebar by default; turn it off on the Apps page.

## [4.0.18] - 2026-10-21

This release adds Antigravity CLI (`agy`) as the eleventh managed app. Official-login and third-party API-key cards each open a terminal running agy with that provider; a provider only applies to agy started from its card's Open Terminal, never to a plain `agy` in another terminal. MCP servers, Skills and prompts sync to agy's shared customization folder, sessions can be browsed and resumed, usage is imported from session logs, and the Apps page installs, updates and uninstalls the CLI. On macOS the Auth Center manages several Antigravity accounts: switch agy's sign-in, see each account's quota and bind official cards to an account. Windows in-app updates no longer reboot the machine when a file is in use, the MSI installer makes the desktop shortcut optional, and the header shows the actual connection as a compact mode-colored badge. Fixes cover the router exhausting file descriptors under bursts on macOS, "Restart Codex daemon" failing with `env: node` when launched from Finder, Claude Code sessions staying under their old project after `/cd`, Windows Open Terminal spinning until the console is closed, countdowns on unused Codex quota windows, and unpriced DeepSeek V4.1 Flash requests.

**Stats**: 38 commits | 206 files changed | +10711 insertions | -1253 deletions

### Added

- **Antigravity CLI Support** (#8268, with follow-ups ported from #8608): `agy` is a new managed app with its own provider list, MCP and Skills flags, prompt file, sessions and usage, separate from Gemini CLI.
  - Providers: the official login card starts `agy --model=<display name>`, applying the model to that session only; API-key cards start `agy --gemini_dir=~/.cc-switch/agy/<id>`, a private profile whose settings carry `modelProvider: "gemini"` and the model and whose `config` links back to `~/.gemini/config`. The key and endpoint reach that one process through the environment only (a 0600 file read and deleted right away on macOS/Linux, a `setlocal` block on Windows); they are never written to agy's files, shell rc files or a wrapper. Every card's action is "Open Terminal with This Provider" and there is no "in use" state; agy's own `~/.gemini/antigravity-cli/settings.json` is never written, apart from removing the `modelProvider` and wrapper/PATH blocks left by #8268 preview builds on startup. Custom cards need an API key; an empty endpoint uses Google's default API. Model lists come from agy's offline catalog (display names), and only a settings file with a model is imported as the official card.
  - MCP (`~/.gemini/config/mcp_config.json`, stdio and Streamable HTTP, `disabled: true` for off; a zero-byte file is treated as empty), Skills (`~/.gemini/config/skills`) and the prompt (`~/.gemini/config/AGENTS.md`, shared by key profiles). Database schema 20 → 21 adds `enabled_agy` to `mcp_servers` and `skills`.
  - Sessions from the CLI and Antigravity IDE `brain` folders and from key profiles, showing only the text inside `<USER_REQUEST>`; key-profile sessions resume with the matching `--gemini_dir` and key. Usage is imported from `transcript_full.jsonl`, attributed to the model from the `Model Selection` step, and priced at Gemini API prices; session-log rows show as "Session log".
  - Official quota (Gemini and Claude/GPT, each with a 5-hour and a weekly window) from agy's `/usage`; the card shows the tightest window per group and a dropdown lists all four with their reset times.
  - The Apps page installs agy with the official script (`install.ps1` on Windows), updates it with `agy update` (Homebrew cask included) and uninstalls script and cask installs. Antigravity has its own icon. Deep links accept `agy` for providers, MCP and prompts.
- **Antigravity Accounts in the Auth Center** (macOS): Sign in with Google in the browser using agy's own OAuth client (PKCE, loopback callback). CC Switch keeps a copy of each account and switches agy by writing it into the `gemini`/`antigravity` keychain entry through `/usr/bin/security` (`-U`, read back and checked); the current login is absorbed first and an unreadable one is stashed to `agy-login-stash.json`. Removing an account never signs agy out. After a switch CC Switch warns when agy is running. Each row shows its quota through Google's `retrieveUserQuotaSummary` with the account's own token (User-Agent `cc-switch/<version> (antigravity)`, read-only); refreshed tokens are saved only to CC Switch's copy. A 403 from an ineligible account shows Google's reason from `loadCodeAssist`. Official cards can bind an account (`authBinding`, `agy_oauth`): Open Terminal switches agy's sign-in first and refuses when the account is missing on this computer, and the card shows the bound account's quota. Unbound official cards read the signed-in account from the keychain instead of starting agy for `/usage`.

### Changed

### Fixed

- **Windows In-App Updates Could Reboot the Machine** (#8628, fixes #8534): The updater runs the MSI with `/passive`, and with no restart option Windows Installer rebooted as soon as a file was in use. The MSI now carries `REBOOT=ReallySuppress` (covering updates driven by older updaters), the updater passes it too, a leftover instance is closed on the updater path only, and the release workflow fails if the MSI lacks the property.
- **Windows Desktop Shortcut Not Optional** (#8601, fixes #5667): The MSI install-directory page has a "Create a desktop shortcut" checkbox and `CREATEDESKTOPSHORTCUT=0` skips it in silent installs. Upgrades keep the current shortcut state, and a Desktop that cannot be written no longer blocks the install.
- **Router Ran Out of File Descriptors on macOS** (refs #8668): GUI apps inherit launchd's soft `RLIMIT_NOFILE` of 256, so bursts of parallel requests failed with EMFILE in accept, upstream connects, `live-state.json` reads and SQLite. The soft limit is raised to the hard limit (capped at 10240) at startup on Unix.
- **"Restart Codex Daemon" Failed with `env: node` When Launched from Finder** (refs #8653): Runtime CLI commands (also `opencode models`) ran with launchd's narrow PATH plus the tool's own directory, so an npm CLI could not find node in another directory. The login-shell PATH is now merged in front, honoring the caller's deadline.
- **Claude Code Sessions Stayed Under Their Old Project After `/cd`** (#8643, fixes #6862): The last `relocated` record in the final 64 KiB of the transcript now decides the project, as in Claude Code, so grouping and the resume command follow `/cd` and worktree moves; ordinary drifting `cwd` values are ignored.
- **Windows Open Terminal Kept Spinning Until the Console Closed** (refs #6712): `cmd /C start` inherited the wrapper's stdout pipe, which only reached EOF when the console closed. Stdio now goes to NUL and only the exit status is awaited (the approach of #6716).
- **Countdowns on Unused Codex Quota Windows** (#8631): A window with `used_percent` exactly 0 returns a placeholder reset time of now plus the window length, so the countdown restarted on every refresh. Such windows no longer show a reset time.
- **DeepSeek V4.1 Flash Unpriced**: `deepseek-v4.1-flash` (OpenCode Go, OpenRouter, Hermes presets) was shown as unpriced and counted at $0; it now gets a pricing row at the `deepseek-flash` peak price; requests already logged are not repriced.
- **Aggregation Exhausted-Quota Workaround** (docs, refs #7962): The guide and manual 4.6 now describe the method that still works since #8431 (switch to Direct, keep "Keep official login for direct switches" off, use a third-party card and fully restart Codex) and mark the old one as no longer working.

### Upgrade notes

- **Database schema 20 → 21** (adds `enabled_agy` to `mcp_servers` and `skills`); the database is backed up before upgrading. Older versions refuse a version-21 database.
- Antigravity providers only apply to agy started from the card's "Open Terminal with This Provider"; running `agy` in any other terminal keeps agy's own Google sign-in and settings.
- Antigravity is shown on the Apps page by default and can be hidden there.
- Antigravity account management in the Auth Center is macOS only; other platforms show no account picker, official cards follow agy's own sign-in, and bindings synced from a Mac are ignored.

## [4.0.17] - 2026-10-20

This release fixes two regressions from 4.0.16 and polishes the tray panel. Lightweight mode frees the tray panel's WebView again, so WebView2 processes exit on Windows, and Codex no longer gets stuck on the sign-in page after a long-expired stashed ChatGPT login was given back on entering routing. The tray panel keeps its rows in place while hovering between apps, fits high-DPI and small Windows displays, lines up quota bars with a time-until-reset, and shows remaining balances in green; on Windows a left click opens the main window again. The Hermes form now warns when a provider key is one of Hermes' built-in provider ids. Other fixes cover the proxy port staying taken after quitting on Windows, Codex remote compaction usage recorded as zero, MCP servers lost when several are toggled at once, URL-only MCP servers synced to Hermes and OpenCode as empty entries, smart quotes inside valid TOML strings being rewritten, WebDAV sync on Data Capsule, API keys capitalized by macOS, and MSI installs over a portable folder still treated as portable.

**Stats**: 16 commits | 34 files changed | +1674 insertions | -164 deletions

### Changed

- **Hermes Built-in Provider Key Warning**: Hermes routes `model.provider` to its built-in provider whenever the name is a canonical built-in id, so a card keyed `deepseek` or `openrouter` was ignored and Hermes asked for the built-in's own API key env var. #8538 only fixed the two MiniMax presets. The provider key field now warns for any of the 52 canonical ids (generated from hermes-agent rc.3-v0.22.0) and suggests `cc-switch-<key>`; a locked key gets a variant that says to re-add the provider under another key. Aliases such as `kimi` still reach the custom provider and are not flagged. Saving is not blocked.
- **Tray Panel Quota Lines**: Each quota block is one grid (label, bar, reset), so bars start and end at the same x across tiers and extend under the "In use" column. The absolute reset date is replaced by a compact time until reset (at most two units, e.g. "1d 23h"), and labels no longer wrap. A pay-as-you-go balance colors only the amount green, like the provider card; a used-up balance keeps its warning color. The panel payload carries a new `emphasis` field for this.
- **Windows Tray Left Click Opens the Main Window** (#8572): Left click always opens the main window; right click shows the selected tray style (panel or menu). The "Tray style" help text says so. macOS is unchanged: both buttons open the selected style.

### Fixed

- **Lightweight Mode Kept the Tray Panel WebView Alive** (refs #8612): Since the panel became the default in 4.0.16, it is a second WebView window that was only hidden after the first tray click, so WebView2 processes never exited in lightweight mode. In lightweight mode the panel is now destroyed whenever it is hidden (and right away when entering lightweight mode with it hidden), deferred to a later main-thread turn and re-checked before tearing down; the next tray click creates it again with a fresh theme state and, on macOS, fresh glass views.
- **Expired Stashed ChatGPT Login Given Back on Entering Routing** (refs #8573): The #8431 restore in 4.0.16 could hand back a login stashed months earlier, which made the route table require OpenAI auth and left Codex desktop stuck refreshing a dead token on every enter/exit. The restore now skips a login whose `access_token` JWT has expired; undecodable tokens are still restored, and the skipped login stays in the stash for switching back to an official card.
- **Tray Panel Rows Jumping and Clipped on Scaled Windows Displays** (#8572, #8595, fixes #8549, #8553, refs #8564): Both columns now follow the main panel's height and long provider lists scroll inside the sub panel, so hovering between apps no longer moves rows under the cursor or leaves blank space with a single app. On Windows, WebView CSS pixels and screen logical pixels are converted with the monitor scale factor, the panel is narrowed and clamped to the monitor work area, footer buttons can shrink, and a `devicePixelRatio` change after moving to another monitor relays out the panel and its clip region on the first show.
- **Proxy Port Still Taken After Quitting on Windows** (refs #8552): The locked mio 1.1.1 created inheritable listener sockets, and terminals or CLI tools started by CC Switch inherited them, so the port stayed LISTENING under the dead PID and the next start failed with os error 10048. mio is bumped to 1.2.1 (`WSA_FLAG_NO_HANDLE_INHERIT`), with a Windows test asserting the listener handle is not inheritable.
- **Codex Remote Compaction Usage Recorded as Zero** (#8479): Codex 0.153+ writes a `token_usage_record` per response, and a remote compaction follows it with an all-zero `last_token_usage`. Such records are now imported as `codex_thread:{root_thread_id}:usage:{response_id}`; matching `token_count` rows stay the only row, existing `event_index` values and cursors are kept, and lines scanned before the upgrade are not re-imported.
- **MCP Servers Lost When Toggled Concurrently** (refs #8580): `toggle_mcp_app` and `set_mcp_enabled` edited the live config without the per-app switch lock, so parallel toggles, or a toggle racing a provider switch or MCP resync, could drop servers from the live file while the database showed them enabled. Both commands now go through `McpService::toggle_app_locked`.
- **URL-only MCP Servers Synced as Empty Entries to Hermes and OpenCode** (refs #8579): A spec with a `url` but no `type` (from JSON mode or a deep link) was treated as stdio, giving Hermes an entry with only `enabled: true` and OpenCode a `local` entry with an empty command. Codex's transport inference moves to `mcp/validation.rs` and all three projections use it.
- **Smart Quotes Inside Valid TOML Strings Rewritten** (refs #8559): Normalization replaced every curly or fullwidth quote, so MCP import and validation and the Codex config editor turned `"don’t"` into `"don't"` and rejected valid values such as `["say“hello”"]`. Only smart quotes used as string delimiters become ASCII now; quotes inside ASCII-quoted strings are kept, multi-line strings and comments are handled, and the Chinese IME case still parses. Text without smart quotes is unchanged.
- **WebDAV Sync Failed on Data Capsule** (refs #8554): CSTCloud Data Capsule answered `PUT manifest.json` with 500 for multi-line JSON sent as `application/json`. The manifest is uploaded as `application/octet-stream`; its bytes and hash are unchanged and readers ignore Content-Type, so old and new versions read each other's manifests. S3 is unchanged.
- **macOS Capitalized Typed API Keys**: The API key field lacked the autocorrect, auto-capitalization and spellcheck opt-outs of the shared input, so a typed `sk-…` key shown in plain text could be saved as `Sk-…`. Pasted keys were not affected.
- **MSI Install Over a Portable Folder Still Treated as Portable** (#8529, refs #3132): A leftover `portable.ini` kept the app in portable mode, so the update button only opened the Releases page. The MSI now removes `INSTALLDIR/portable.ini` on install (not on uninstall, no wildcard).

### Upgrade notes

- **No database schema change** (still 20).
- On Windows a left click on the tray icon opens the main window again (it opened the panel in 4.0.16); right click shows the tray style chosen in Settings → General.
- Codex compaction lines scanned before upgrading stay unbilled; only lines read after the upgrade use the new path.

## [4.0.16] - 2026-10-19

This release turns the tray into a quick panel and fixes a batch of Codex and routing issues. Clicking the tray icon now opens a panel with each app's in-use provider, mode, quota and usage; the native menu is still available under Settings → General → Tray style. In Codex aggregation mode, a session no longer gets stuck compacting on the provider it came from, and the ChatGPT login is no longer lost every time CC Switch restarts while Codex is routed. Codex through Chat upstreams keeps parallel tool results together around image notices, configured GPT context windows now apply to official GPT catalog entries, and the 272K GPT cap from 4.0.13 only applies to windows borrowed from the vendor entry. Claude Code routing and Claude Desktop route mode publish the 5.5 catalog ids for 5.5 upstreams. Other fixes cover Zhipu pay-as-you-go accounts showing "query failed", Volcengine plan quota turning red on new cards, fnm-managed Node CLIs on Windows, an idle card that could not be deleted, the "Get API Key" link in the edit form, and a softer grey macOS icon tile. OpenCode cards can now set OpenCode's default model.

**Stats**: 40 commits | 121 files changed | +8525 insertions | -552 deletions

### Added

- **Tray Panel** (#8432): On macOS and Windows, clicking the tray icon opens a panel by default; Settings → General → Window and terminal adds a "Tray style" option, Panel (default) or Menu. The panel has a Configuration tab (apps, in-use providers with search and switching, modes in their theme colors, quota) and a Usage tab whose trend follows the main window's currency and chart style. Every row reuses the native menu's event id and goes through `handle_tray_menu_event`. macOS draws native glass under each card with a mostly opaque theme fill so text stays readable over dark windows; Windows uses opaque cards on a clipped canvas. Switching provider rows follows the pointer immediately (with a menu-aim check toward the open sub panel), panel state is collected off the main thread and change notifications are throttled. The choice is a device setting (`nativeTrayMenu` in `settings.json`; unset means the panel) and applies without restarting. Linux keeps the native menu and gets an "Open quick panel" item at the top.
- **OpenCode Default Model From a Card** (refs #8509): Added OpenCode cards get the "Set as default" action already used by OpenClaw, with a model menu built from the same fragment CC Switch writes. It writes only the top-level `model` (`<provider>/<model>`) in `opencode.json` through the format-preserving path, leaving comments and `small_model` alone. New commands `get_opencode_default_model` / `set_opencode_default_model`.

### Changed

### Fixed

### Upgrade notes

- **No database schema change** (still 20).
- On macOS and Windows the tray icon opens the panel after upgrading; the native menu can be picked under Settings → General → Tray style. On Windows a left click used to open the main window and now opens the panel too; "Open main window" sits at the bottom of the panel.
- Existing GPT model rows are not migrated. Codex GPT rows saved before 4.0.13 with an auto-filled 1.05M window take effect since #8385; the form shows a note when opened.

## [4.0.15] - 2026-10-17

This release is mainly fixes. On Windows, settings such as hidden apps and config dir overrides no longer reset to defaults after an update, and updating Codex no longer removes a healthy install when `--version` is slow. The macOS app icon gets a white rounded-square background so macOS 26 stops placing it in a grey tile. Requests through the local route keep Claude Code's session identity again, which restores the stable cache key on the Codex OAuth path and the Gemini signature replay for Claude Desktop. Codex through Chat upstreams recovers from a malformed tool call in history, and DeepSeek no longer rejects replayed tool history. Other fixes cover slow WebDAV/S3 transfers cut off at 300 seconds, "'claude' is not recognized" in Windows provider terminals, Hermes sessions in WSL, unconditional restart prompts on routed switches, the routing marker after failover, and drag sorting. New: a bar / area style for the usage trend chart, an image input switch per Hermes model, and model fetching for managed OAuth providers in the Claude Desktop form.

**Stats**: 31 commits | 86 files changed | +5214 insertions | -380 deletions

### Added

- **Usage Trend Chart Style** (#8439, fixes #8406): The Display section of the usage Settings tab adds a trend chart style, bar (default) or area. It is stored with the other display settings as `usageDisplay.trendChartType` in `~/.cc-switch/settings.json` (bar when unset or unknown). Both styles share the metrics, axes, tooltip and currency conversion; the area chart draws a dot for a single data point. The Display controls are now laid out as an aligned two-pair grid, with the exchange rate on its own row under the currency.
- **Hermes Per-model Image Input** (refs #8464): The expanded model details get a "Supports image input" switch. On writes `supports_vision: true`; off removes the key so Hermes falls back to its own detection instead of being forced to text-only. Picking a fetched model whose metadata lists image input pre-fills `true` (never `false`), and an explicit value is left alone.
- **Claude Desktop Fetches Models for Managed OAuth Providers** (refs #8426): The "Fetch models" button now shows for GitHub Copilot, Codex OAuth and xAI OAuth providers and calls the account-scoped model APIs, asking to log in first when needed. The fetched list is reset and in-flight results are dropped when the provider type or account changes.

### Changed

### Fixed

- **Windows Settings Reset to Defaults After Updates** (refs #8429): An older non-atomic save could leave leftover bytes after a shorter `settings.json`, and a failed load silently used defaults that the next full save (for example the What's New dialog) wrote back. Saves now go through a temp file and rename; reads retry transient errors, strip a UTF-8 BOM, keep every field that still deserializes, and read only the first JSON value when a trailing tail is present. A file that did not fully load is backed up to `settings.json.broken-<time>.bak`, and saving is refused until that backup succeeds.
- **Updating Codex Could Remove a Working Install**: The uninstall-then-install repair ran whenever the pre-update probe marked Codex as not runnable, including when `--version` timed out or failed to spawn; if the reinstall then failed, Codex showed as not installed. Repair now runs only when `--version` really exited with an error, and other cases take the normal npm upgrade.
- **macOS 26 Grey Icon Tile** (refs #8401): `icon.icns` now bakes in a white 824px rounded square on Apple's 1024px grid, so macOS 26 and 15 show the same white tile. Windows and Linux icons stay transparent.
- **Claude Session Identity Lost in the Proxy** (#8236, fixes #8235; refs #8234, #8418): Claude Code now sends `metadata.user_id` as a JSON string with `session_id`, which the proxy did not parse, so every request got a generated ID. JSON session ids are parsed first (legacy `_session_` still works), and `claude-desktop` also honors the Claude session headers. This restores the session-derived `prompt_cache_key` and session headers on the Codex OAuth path, and the Gemini signature replay for Claude Desktop routing to Gemini.
- **Codex History With a Malformed Tool Call Broke Chat Upstreams** (#8241, fixes #5197): A historical `function_call` whose arguments are not a JSON object (for example truncated output) is turned into assistant text with its results folded into the same message when converting to Chat; valid history is byte-identical.
- **DeepSeek Rejected Replayed Codex Tool History** (#8351, refs #8331): Empty assistant messages, progress text or reasoning between a `function_call` and its results became standalone assistant messages after conversion, and DeepSeek returned 400. For explicit DeepSeek model ids only, they are folded into the open tool-call message; well-formed history is unchanged.
- **Codex Aggregation Stripped `x-codex-beta-features`** (#8437, fixes #8435): Aggregation mode removed every `x-codex-*` header before forwarding. The non-identity beta marker is kept for native Responses upstreams; identity headers are still stripped.
- **Claude Desktop Mapping Loop for Native Providers** (#8444, fixes #8441): Saving a mapping required routing, and routing required a mapping. A native provider without a model list can now enter routing with the default route set, so the mapping can be saved on the same card.
- **Slow WebDAV / S3 Transfers Cut Off at 300 s** (refs #8428): The fixed per-request timeout covered the whole body, so a large `skills.zip` on a slow link failed with "error decoding response body". The overall timeout now scales with the payload (300 s plus time at 16 KiB/s), and GET adds a 120 s idle timeout for headers and each body chunk.
- **Windows Provider Terminals Could Not Find `claude`** (refs #8446): The `cmd /C start` launch inherited CC Switch's process PATH, which can miss user-level entries after the MSI auto-update relaunch or when the CLI was installed later. The terminal now gets the restored user + machine PATH; CC Switch's own environment is unchanged.
- **Hermes Sessions in WSL** (#8254, fixes #8205): For `wsl.localhost` / `wsl$` Hermes paths, the live WAL database is read inside its distribution via `wsl.exe` and Python SQLite (read-only, one short transaction). Requires `python3` (3.7+) and `timeout` in the distribution; other paths are unchanged.
- **Routing Marker Stayed on the Old Provider After Failover** (refs #7998): `provider-switched` now invalidates the whole `["providers", app]` query prefix, so the marker reads the new route.
- **Pi Subagent Usage Missing or Recorded as `unknown`** (#8318, fixes #8298): Each pi-subagents child session file (including nested runs and forked contexts) is imported with its real model and provider; `subagent-artifacts` directories are skipped, and the parent's summary is dropped when all linked children are imported. Counting starts from the first import on this version; history is not backfilled.
- **Provider Cards Stretched and Overlapped While Dragging** (#8315, fixes #8283): Dragged cards keep their size, the drag layer sits on the positioned wrapper, and movement is locked to the vertical axis.
- **Skills Download Errors Masked by Branch Fallback**: Falling back from the configured branch to `main` and `master` now happens only on 404, so a timeout, oversized archive or extraction error is reported instead of "repository or branch not found"; errors also fill in the repo owner and name.
- **DeepSeek Balance Showed an Empty Wallet as Used Up** (refs #8170): When any currency wallet still has funds, wallets at or below zero are hidden, so the card no longer shows a red "used up" row or reopens the plan panel on every launch.
- **Codex Thinking Level Picker Cut Off in Short Windows** (refs #8094): The popover is capped at the available height, the level list scrolls, and the default-level section keeps its full height.

### Upgrade notes

- **No database schema change** (still 20).
- On Windows, a `settings.json` that already carries a trailing tail is recovered on first launch and the original is kept as `settings.json.broken-<time>.bak`. Settings already reset by an earlier update are not restored.
- Pi subagent usage is counted from the first import on this version; earlier subagent usage keeps its old `unknown` rows.
- Reading Hermes sessions in WSL needs `python3` (3.7+) inside the distribution.

## [4.0.14] - 2026-10-16

This release adds a wide range of customization options to the usage dashboard: a new Settings tab, amounts in a chosen currency with an editable exchange rate, a choice of what the sidebar Today label shows, selectable request log columns with new cache write, hit rate, total time and status code columns, and the last tab, range and chart metrics remembered. "Open Terminal" on a Claude card now explains what the folder is for and remembers recent folders. Fixes cover Codex through the local route to Gemini failing on the second tool-call turn, Codex retry and stream timeout keys dropped in routing mode, Skills repos over 128 MiB, custom pricing for model ids with capital letters, OpenCode speed estimates and deep-link imports, Hermes dev builds always showing an update, failover queue reordering, and Windows session groups split by path case.

**Stats**: 30 commits | 100 files changed | +4242 insertions | -373 deletions

### Added

- **Usage Amounts in a Chosen Currency**: A Settings tab replaces the usage page's Pricing tab, with a Display section on top and the existing pricing configuration below. Amounts can be shown in USD (default), CNY, EUR, JPY, TWD or TRY with an editable rate (pre-filled with a reference value); untouched preset rates are not written, so later preset updates still reach those users. Costs stay stored in USD and are converted only for display (hover shows the USD value); chart data is converted before plotting so axis ticks stay round. Converted amounts show at most two decimals (yen two fewer), and an amount that would round to zero keeps two significant digits. Usage amounts now group thousands, and every usage amount goes through one money formatter. Pricing input, quota and balance footers and the Codex credit conversion keep their own currencies. Stored device-locally as `usageDisplay` in `~/.cc-switch/settings.json`.
- **Sidebar Today Label**: Pick up to two of cost (default), tokens, requests and cache hit rate, or show nothing (`sidebarTodayItems`, an empty list means hidden). Tokens use the same real-consumption total as the usage card; hit rate is left out before the first request of the day. The item name keeps its width and the trailing text wraps; with two values the row shows two numbers and the full text moves to the tooltip and accessible name. Amounts from 100 up drop decimals.
- **Request Log Columns**: The Display section picks which request log columns show. Four new columns, hidden by default: Cache Write ("—" with an explanation for Codex, Gemini and Grok, which do not report it), Hit Rate (per request, floored to one decimal so a near-full hit never reads 100%, #7298), Total Time (from `latency_ms`; estimates from session logs carry "≈") and Status Code (replaces the error badge next to the time when shown). The time column always stays. Only columns that differ from their default are saved (`usageDisplay.requestLogColumns`), and the table scrolls sideways instead of squeezing.
- **Usage Page Remembers the Last View**: Tab, preset range and trend/heatmap metrics are restored from localStorage. A custom date range does not replace the remembered preset, and app/provider/model filters are not kept.
- **Open Terminal Explains and Remembers the Folder**: "Open Terminal" on a Claude card opens a dialog that says a terminal will start Claude Code with this provider in the chosen folder, prefills the last folder that opened successfully and lists up to five recent folders (localStorage, this device only). Cards with their own base URL and key also note that the terminal is isolated from later switches; official login cards do not show the note.
- **Pricing Seed for Gemini 4 Argon** (#8356): Introductory Standard-tier prices (2.00 / 10.00 / cache read 0.10 per MTok, through 2026-11-30); existing installs pick it up through the startup insert, and zero-cost history is recomputed by the startup backfill.

### Changed

### Fixed

- **Codex Through the Local Route to Gemini Failed on the Second Tool Turn** (refs #8336): Gemini's OpenAI-compatible Chat endpoint returns `tool_calls[].extra_content.google.thought_signature` and requires it back, but the Responses ↔ Chat bridge dropped it both ways. A non-empty `extra_content` is now carried onto the Responses call items (streaming and non-streaming), restored by call id from `CodexChatHistoryStore` and copied back onto the next request's tool calls. When a cached signature is lost (for example after a restart mid-turn), Gemini 3+ model ids get the documented `skip_thought_signature_validator` placeholder on the first function call of each model step in the current turn; real signatures and other upstreams are untouched.
- **Codex Retry and Stream Timeout Keys Dropped in Routing Mode** (refs #8265): The proxy contract table now keeps `request_max_retries`, `stream_max_retries` and `stream_idle_timeout_ms` from the routed provider's table, so a provider set to 50 stream retries no longer falls back to Codex's default of 5.
- **Skills Repos Over 128 MiB** (refs #8421): Repo ZIPs are streamed into an anonymous temp file instead of memory, the download cap is raised to the 512 MiB extraction budget, and a download over the cap reports its own `ARCHIVE_DOWNLOAD_TOO_LARGE` error instead of the extraction one.
- **Custom Pricing Ignored for Model Ids With Capital Letters** (#8414, fixes #8413): Exact pricing lookup uses `COLLATE NOCASE`, so a custom row such as `GLM-5.3-Flash-EXL3` matches the lowercased candidate for new requests and the history backfill; no migration needed.
- **OpenCode Speed Estimates Too Low on Tool-heavy Turns** (#8410, fixes #8402): Latency ends at `time.streamed` when present and later than `time.created`, falling back to `time.completed`, so tool execution time is no longer counted.
- **OpenCode Deep-link Imports** (#8382, fixes #8380; #8381, fixes #8379): After an OpenCode import the live provider and runtime model queries are refreshed, so the card's added state is current; providers with non-ASCII names get an ASCII slug with a UUID suffix so the V1 editor can save them, and an existing V1 id can be saved unchanged.
- **Hermes Dev Builds Always Showed an Update** (#8398, fixes #8394): Versions such as `0.22.1+238.g<sha>` keep their local segment and are treated as incomparable dev builds on both sides; ordinary semver build metadata is still ignored per spec.
- **WSL Probe Marked Broken Tools as Not Installed** (#8167): Only bash/zsh, dash and fish command-missing output (and exit 127) counts as not installed, so a tool failing with "module not found" shows as found but failing.
- **Codex Parent Rollouts With Malformed UTF-8** (#8360): Parent records are read as bytes and decoded separately, so invalid text is skipped like malformed JSON instead of deferring every child; real I/O and decompression errors still return as transient failures.
- **Failover Queue Reordering Did Nothing** (refs #8297): Moving a provider reassigned the members' existing `sortIndex` values, which could tie when members shared a value or a new provider fell back to its array index; reassigned slots are now strictly increasing.
- **Windows Session Groups Split by Path Case** (refs #8233): Sessions group by a normalized key (trailing separators dropped; Windows drive-letter and UNC paths case-folded with `/` unified to `\`); POSIX paths stay case-sensitive and the group shows its first session's original path.
- **OpenClaw User-Agent Switch Out of Sync With the JSON Editor** (refs #8256): Editing headers in the configuration JSON now updates the switch from the case-insensitive presence of a `User-Agent` header, without rewriting the JSON.

### Upgrade notes

- **No database schema change** (still 20).
- The usage page's Pricing tab is now under Settings. Display settings are device-local and not synced.
- Claude Desktop direct profiles keep the duplicate 1M rows until the provider is switched or saved again; route and aggregation profiles update on the next launch.
- The Gemini 4 Argon introductory price ends on 2026-11-30.

## [4.0.13] - 2026-10-16

**Stats**: 30 commits | 114 files changed | +7171 insertions | -1551 deletions

### Added

### Changed

### Fixed

- **Duplicate Codex Provider Table on Save** (#8276, fixes #8271): Writing `base_url` did not recognise a quoted header such as `[model_providers."custom"]` and appended a second table, so saving failed with `duplicate key custom`. Table headers are compared in canonical dotted-key form, and ids that need quoting map to a quoted header.
- **Codex Remote Compaction Lost Under Routing / Aggregation** (#8339, fixes #8338): The proxy contract rebuilt the provider as `name = "custom"` without `capabilities.remote_compaction`, so Codex fell back to local summarization and sessions with search history could fail with `response protection is unavailable`. The routed provider's OpenAI-name compaction switch and explicit `remote_compaction` value are kept; switching to a provider without them clears them.
- **Chat Stream Converters Kept Reading After `[DONE]`** (#8281): Both Chat Completions converters now return right after their `[DONE]` finalization, so a later connection reset no longer appends an Anthropic `error` or Responses `response.failed`, and a repeated `[DONE]` no longer emits a second `message_stop`.
- **OpenCode Speed Column Empty** (#8309, fixes #6326): OpenCode session imports wrote latency 0; they now use `time.completed - time.created`, recording 0 when `created` is missing or the clock went backwards. Earlier rows are not backfilled.
- **Usage Lost on Paginated Pages of Forked Codex Threads** (#8290, fixes #8161): A forked thread's continuation page (`rollout-…-<branchId>_<pageId>.jsonl`) keeps its parent's `forked_from_id` but is stamped at pagination time, so it was deferred forever. Same-thread leading ids or a `history_base` pointing at the thread itself now mark it as the thread's own continuation.
- **Slow Mode Switching With Many fnm Shells** (#8322, refs #8313): CLI search path deduplication was quadratic; an `IndexSet` keeps the same order and exact-path semantics.
- **Windows Window Hang in WebView2 Drag Regions** (#8327, refs #8321, #8324): Native CSS drag regions are limited to macOS; Windows moves and maximizes the window through Tauri's existing mouse handling.
- **Haiku Tier at 200K in Claude Code Aggregation**: Stack mode stripped `[1M]` from the Haiku tier, and Stack ids are not `claude-` prefixed, so the Haiku tier fell back to a 200K window. It now gets the same Stack id as the other tiers, marker included.
- **Mode Preview Counted 0 Models for the Old Default**: The default provider publishes no models in Codex aggregation, so picking another default previewed it as contributing none; members now report how many models they publish as a plain member.

### Internal

- Test fixes for Rust 1.95 clippy (`cloned_ref_to_slice_refs`), a slow Apps page remount, and the WSL2 nightly (Codex parse-cache counts where files have no identity, npm lifecycle test outside the UNC temp dir).

### Upgrade notes

- **No database schema change** (still 20).
- Claude Desktop users on a mapping card are moved to routing on first launch; restart Desktop after changing its mode or route.
- Classic sub-agent tools are on by default in Codex aggregation; a previously saved off value is not carried over.
- The 272K GPT cap only affects newly added providers and newly fetched model metadata; existing cards keep their windows.
- Codex needs a restart after changing the Auto Review model.
- The 1M preset changes only affect newly added providers; existing cards can tick the 1M checkbox in the model mapping.

## [4.0.12] - 2026-10-14

This release rounds out the Apps page: coding clients can be installed, updated and uninstalled there, and conflicting installations found by "Diagnose installs" can now be resolved by uninstalling whichever copy you pick. Updates check the Node version the new release requires before they are offered, and the current Grok Build install layout can be uninstalled. A new Local preset group connects to Ollama, LM Studio, llama.cpp and vLLM on this computer, with loopback requests bypassing the configured proxy, and 14 cloud platforms get presets. Session log scanning drops to every 10 minutes in the background and follows the selected interval while the usage page is open. Turkish joins as a community translation, and unsupported system languages now default to English.

**Stats**: 49 commits | 87 files changed | +13812 insertions | -749 deletions

### Added

- **Choose Which Installation to Uninstall**: `prepare_tool_uninstall` returns every detected installation with its own plan or the reason it must be removed manually. The dialog lists source, path, version and the default marker; a single plannable install is preselected, two or more are not, and unplannable ones are disabled with their reason. Execution finds the confirmed path in a fresh enumeration and re-derives its plan, rejecting any difference from the preview. Grok 0.2.112+ (`~/.grok/bin/grok-<version>` linked from `grok`) is recognized and its whole installer set is removed (files only; `config.toml` and sessions kept). Native uninstall also removes launcher symlinks in the search directories that resolve to the same binary, and the Grok npm copy is flagged as reinstalled by the updater when a native install exists and `[cli] installer = "npm"` is set.
- **Node Version Check Before npm Updates**: When a newer version exists, its `engines.node` is read from the registry and compared with the node the update would use (next to the default installation, else the login shell's PATH). An unsatisfied range reports `update_blocked_by_node`: the row explains why, hides the update button and is skipped by "Update All", and the lifecycle command checks again before running. Unknown range syntax, lookup failures and installations that do not run on node (native binaries, Homebrew, Bun, MiniMax Code, WSL) are never blocked. Motivated by OpenClaw 2026.9.3+ requiring Node `>=24.16.0 <25 || >=26.1.0`.
- **Local Preset Group and Local Inference Presets**: A new `local` category maps to a "Local" group after Cloud providers. Ollama (`localhost:11434`), LM Studio (`localhost:1234`), llama.cpp (`127.0.0.1:9931`, with `:8080` as an endpoint candidate) and vLLM (`localhost:8000`) presets cover Claude Code and Codex (native Anthropic Messages / Responses with the NativeResponses tool profile), Claude Desktop (proxy mode) and, where the client has no built-in provider, OpenCode, OpenClaw, Hermes and Pi; keys use the placeholders the servers document.
- **Loopback Requests Bypass the Proxy**: reqwest never bypasses loopback on its own (an explicit global proxy applies to every target, and the system-proxy path only honours `NO_PROXY`). `http_client::is_loopback_url` (localhost, `*.localhost`, `127.0.0.0/8`, `::1`) plus a proxy-free client route loopback targets directly in the forwarder (reqwest and hyper paths), endpoint speed test, stream check and model fetching. Request bodies and headers are untouched.
- **Turkish Interface and Tray** (#8208, fixes #8207): Turkish is a community translation that falls back to English for missing strings; the full-catalog parity check is dropped for `tr`, and the Turkish tray texts start from English and override translated items. The option is shown as plain "Türkçe".
- **New Provider Presets**: Ollama Cloud, Baseten, Meta Model API, DeepInfra, Vercel AI Gateway, Nebius Token Factory, Groq, SambaNova, DigitalOcean, Hugging Face, Microsoft Foundry, Fireworks AI, Mistral AI (Claude Code, Claude Desktop and Codex presets hidden pending a real-key test) and Cloudflare AI Gateway; SiliconFlow CN and international for OpenCode (#4878, fixes #4500); StreamLake for Codex, with every StreamLake preset moved to the public `kat-coder-pro-v2.5` endpoint. No OpenCode preset is added for providers OpenCode ships built in. Icons added for the new providers.

### Changed

- **Session Log Scanning Follows the Usage Page** (#8301): The background scan drops from every 60 seconds to every 10 minutes as a safety net. While the usage page is visible it scans immediately, again when the window becomes visible, and then at the selected interval (5/10/30/60 s, default 60 s). The setting is renamed "Session log scan interval", the "Off" option is removed (a saved 0 falls back to 60 s), and it is hidden when automatic scanning is off. Statistics no longer poll; imports refresh them through `usage-log-recorded`, and time-relative ranges re-run once a minute.
- **Provider Search Sits at the End of the First List Row** (#8151, fixes #8100): The search panel no longer floats over the first card's actions or pushes the list down. Claude Code, Codex, Gemini CLI and Grok Build portal a compact field into the mode row; other apps share the first section title row ("Added · N"). The scope and Esc hints move into the input tooltip.
- **Apps Page Layout**: Uninstall moves into a per-row "..." menu. Header and rows share one grid template (#8293), and the actions column reserves the width of invisible Install and Update buttons so it no longer grows as versions load or updates appear; the check-for-updates button keeps its width while checking. The hide-app help now says hiding only affects display.
- **Unsupported System Languages Default to English**: On first launch the UI and tray use English instead of Simplified Chinese for system languages the app does not ship. An empty locale still defaults to Simplified Chinese, and a saved language is never overridden.
- **Uninstall Feedback** (#8262): The dialog shows "Checking the installation…" while planning; native Windows Hermes uninstall warns about Python file locks; a successful uninstall followed by a failed or empty diagnostic is reported as a warning instead of a failure.

### Fixed

- **Skills Restore Failed Permanently After a Leftover `skills.bak`** (#8155, fixes #8153): The incoming tree is copied completely into a unique directory beside the Skills SSOT and swapped in by same-filesystem renames; `skills.bak` and earlier recovery directories are never removed or reused. If installation and rollback both fail, the original tree is kept and both errors are reported with its path.
- **Stream Error After a Terminal Responses Event** (#8138): The Responses-to-Anthropic streaming converter appended an Anthropic `error` event when the upstream body reported a transport error after `response.completed` or `response.incomplete`; late transport errors are now ignored once terminated.
- **Unsaved-Changes Guard Cleared by Re-clicking the Current Page** (#7900): On the MCP, Prompts and pricing editors, `openPage` returns early when the target is the current view, so it neither prompts nor clears the unsaved registration.
- **Empty Upstream Error Bodies** (#6910, refs #6895): An empty or whitespace-only upstream error body is rendered as "上游未返回错误内容" instead of ending with a dangling colon.
- **Pi Session Speed Estimates** (#8278): Pi session imports estimate request duration from each assistant message's request-start and write timestamps instead of writing latency 0. Earlier rows are not backfilled.
- **Pi on a WSL Config Directory** (#8249, fixes #8245): `commit_staged` skips `ReplaceFileW` (unsupported on WSL UNC) and goes straight to the rename fallback, and Auto skill sync resolves to Copy on WSL targets; an explicit Symlink choice keeps its error. Non-WSL behavior is unchanged.
- **Windows CLI PATH After an MSI Restart** (#8262): `run_detected_tool_command_with_timeout` uses the effective PATH, so `opencode models` and the Codex client catalog find their CLI; `%VAR%` references in PATH expand from the process, `HKCU\Environment` and system environment (nested, with cycle protection); the process PATH is read with `var_os` so one invalid UTF-16 unit no longer drops it; captured output reuses the Windows command builder so `\\?\`-prefixed `.cmd` / `.bat` paths run.
- **Preset IDs Shifted After a Hidden Preset**: Preset ids now keep the original array index and hidden entries are filtered afterwards, since `AddProviderDialog` and `useProviderCategory` resolve presets by that index. Codex and Claude Desktop presets gain the `hidden` flag.

### Internal

- Windows `windows_npm_path_fallback_uses_batch_compatible_path` test timeout widened from 10 s to 30 s (#8295, fixes #8294).

### Upgrade notes

- **No database schema change** (still 20).
- Background session log scanning is now every 10 minutes; non-routed usage can take up to 10 minutes to appear unless the usage page is open. A saved "Off" interval becomes 60 s.
- Pi speed estimates only apply to rows imported after upgrading.
- New and changed presets (including StreamLake's public endpoint) only affect newly added providers.
- Claude Desktop clears the key when a local preset is selected; type the placeholder by hand (`ollama`, `lmstudio`, `no-key` or `dummy`).

## [4.0.11] - 2026-10-13

This release adds uninstall to the Apps page, so coding clients can now be installed, updated and uninstalled from CC Switch. The Apps page removes a detected client installation after showing the exact path and command, and lists manual uninstall commands for every install method. Coding-plan quota queries are enabled by default for every app, both when adding a provider and when importing a link. Codex usage import no longer rereads deferred fork rollouts every minute and now resolves fork parents across paginated Codex Desktop rollouts. Fixes cover install and update commands losing the user PATH after an MSI auto-restart on Windows, full-screen panels flickering, and bulk Skills and MCP toggles reporting success when writes failed. New presets: StreamLake China, AIComing, SoruxGPT Coding Plan and GrooRoute Pro.

**Stats**: 14 commits | 57 files changed | +5342 insertions | -306 deletions

### Added

### Changed

- **Coding-Plan Usage Enabled by Default for Every App**: Adding a provider whose base URL matches a coding plan (Kimi, Zhipu, MiniMax, Volcengine, OpenCode Go, Command Code) turns on the `token_plan` usage query in every app, not only Claude Code; the frontend base URL lookup now also covers Gemini CLI, Grok Build, Hermes, OpenClaw and MiniMax Code. Deep links without a usage script whose primary endpoint is a coding plan import with the query enabled and `codingPlanProvider` set, and the confirmation dialog names the plan. `usageEnabled=false` is honored, ZenMux stays Claude-only, and existing providers are unchanged.
- **Full-Screen Panels No Longer Fade** (#8201): `FullScreenPanel` defaults to no motion on every platform (the auth settings panel keeps its slide), which removes the flicker on Windows for the pricing, usage script, endpoint speed test, universal provider and workspace panels. The universal provider form initializes in a layout effect so the first frame isn't empty, and the workspace file and daily memory editors open only after their read completes, with stale reads discarded.
- **Presets**: AIGoCode moves to aigocode.net, with api.aigocode.dev as the default request address and api.aigocode.app kept as a fallback.

### Fixed

- **Windows Install and Update Commands Lost the User PATH After an MSI Restart** (#8173, fixes #8171): Detection already restored the user PATH from the registry, but the `.bat` that runs install / update / uninstall inherited the stripped PATH, so npm was not found. The lifecycle subprocess now gets the effective PATH.
- **Deferred Codex Fork Rollouts Reread Every Minute** (#8218, fixes #8217, #8209): A retryable child rollout was fully reparsed on every 60-second sync and its pending entry dropped, so the deferral warning was logged every minute too. A dependency snapshot of the child and every parent candidate is kept, and an unchanged child returns deferred before opening the file. Parent read failures stay uncached, and billing is unchanged.
- **Codex Subagent Usage Lost After a Paginated Parent Turns the Page** (#8213, fixes #8210, #7084): Codex Desktop continues long threads in `rollout-<time>-<threadId>_<pageId>.jsonl`, but the rollout index only keyed files by the trailing UUID, so a child forked after the page turn found only the frozen first page and stayed deferred. Continuation pages are also registered under the thread UUID and all pages are merged in filename order before the fork cutoff check; every replica of a segment must reach the cutoff. Children deferred this way import on the next sync.
- **Bulk Skills and MCP Toggles Reported Success When Writes Failed** (#8137): Bulk enable/disable in the Skills and MCP panels shows an error toast when every write fails and a warning on partial failure, and undo reports its real outcome.
- **Workspace Editor Could Save the Previous File's Content** (#8201): The editor stayed mounted, so after a failed read it kept showing the previously opened file under the new title, and saving wrote that content into the new file. A failed read now returns to the list.
- **StreamLake International Presets for OpenCode, OpenClaw and Pi**: They pointed at `.../endpoints/${ENDPOINT_ID}/openai`, which the gateway rejects ("Missing Action parameter"); they now use the `.../v1/endpoints` base with the endpoint ID as the model ID.

## [4.0.10] - 2026-10-13

The sixth patch release on the 4.0 stable line, centered on `ccswitch://` import links. Links clicked while CC Switch is not running are no longer lost; links can declare the API format, import Pi providers and bring the site's own icon; Codex and Grok Build links keep the provider settings carried in their `config.toml` instead of being rebuilt from a fixed template; values that additive apps would expand into commands or local secrets are rejected; and the confirmation dialog lets the user decide whether to switch right away. Site owners get a guide in three languages and an online link generator. Provider icons can be uploaded into a named "My Icons" library, and the usage page shows first-token time, estimated from session logs when routing is off. Fixes cover the routed Claude Code haiku alias being sent with thinking disabled, Codex sessions recorded under the retired `cc-switch-official` provider, Grok Build session titles on third-party providers, empty balances shown as an expired plan, Codex usage after an in-thread model change, settings autosave carrying unconfirmed directories, flicker when opening provider pages on Windows, and MSI upgrades recreating a deleted desktop shortcut.

**Stats**: 32 commits | 123 files changed | +12435 insertions | -2355 deletions

### Added

- **Deep Link `apiFormat` and Pi Providers**: A single `apiFormat` parameter (`anthropic` / `openai_chat` / `openai_responses` / `gemini_native`) maps to each app's own field: `meta.apiFormat` for Claude Code, Codex and Grok Build (non-native formats need local routing), `npm` for OpenCode, `api` for OpenClaw and Pi, `api_mode` for Hermes. Unsupported combinations are rejected while parsing; links without it keep the previous defaults byte for byte. Pi provider links are now supported; they write a `models.json` node and must carry a model.
- **Deep Link Activation Switch**: The confirmation dialog has a switch for "switch after import" (providers, off unless the link sets `enabled=true`, with a warning when on), "add to the app config" (additive apps, on by default), "enable in Pi" and "enable after import" (prompts). The link's `enabled` only sets the initial state. Turning the switch off only saves the row: a new `ProviderService::add_without_switching` skips the first-provider path in `add` that would otherwise write the client config.
- **Deep Link `iconUrl`** (closes #8117): A provider link can carry an https address of the site's logo. The confirmation dialog downloads it on open and shows it; importing stores it as the card's custom icon, and any failure silently falls back to `icon` or the name's initials. The address is never stored or rendered and the import command never downloads. The download (`deeplink/icon_fetch.rs`) drops non-https, IP, non-default-port and credentialed addresses, requires every resolved address to be public and pins the connection to them, follows up to 3 redirects by hand with each hop rechecked, uses no system proxy, cookies or Referer, times out after 5 s, caps the body at 256 KB, and requires a PNG / JPEG / WebP / SVG Content-Type matching the magic bytes with bitmap dimensions up to 4096. 198.18.0.0/15 is allowed on purpose for Clash / Surge fake-ip mode. Errors are logged without the URL.
- **Custom Provider Icons and "My Icons"** (refs #8117): The icon picker has two groups filtered by one search box. "My Icons" starts with an upload tile (PNG, JPG, WebP or SVG, up to 2 MB and 4096 px); the image is redrawn on a canvas into a 96×96 PNG and a naming dialog (file name by default) saves it to the library and selects it. Library icons can be picked by any provider in any app and renamed or deleted on hover; uploading an image already in the library reuses the entry, and a current custom icon outside the library (for example from an import link) shows as "Current icon" and can be saved. Clicking an icon selects it and closes the picker; "Clear icon" sits next to the search box. Providers store the image itself as a data URI in the existing `icon` column, not a library id, so library changes never alter a provider. The library lives in the cloud-synced settings key `custom_icons` (up to 100 icons, names up to 64 characters). SVG is loaded through `<img>` and rasterized, re-encoding drops EXIF, and custom icons are only ever rendered with `<img>`. Saving a provider or universal provider, syncing a universal provider and adding to the library fully decode the PNG with the `png` crate under a 1 MiB decode limit and cap it at 64 KiB and 256×256; SQL import and cloud sync drop invalid images from `providers`, the universal provider JSON and the library before replacing the main database; rendering checks the PNG signature and IHDR dimensions first. Aggregation no longer derives model key prefixes from a custom icon, and the deep-link `icon` parameter only accepts built-in names.
- **First-Token Time on the Usage Page**: Provider and model stats gain a First token column with the median over successful streaming requests through the routing service, and the request log gains a First token column after Speed. Without routing, first-token time is derived from session logs and shown with ≈: for Claude Code, a reply that starts with a thinking block gives the block's write time minus `thinkingDurationMs`; for Codex, newer rollouts record `started_at_ms` on `item_completed`, and the earliest reasoning or agent message item marks the start. Replies that open with text or a tool call yield no estimate. Estimates are stored in `first_token_ms`, so exact and estimated values are told apart by `data_source`; estimated speed still divides by the whole duration, and earlier rows are not backfilled.
- **Sub2API Usage Query Template**: Uses `GET /v1/usage` with the provider's key and base URL (with or without `/v1`), shows the plan name, and reports used/total only when the quota has a limit, so unlimited subscriptions no longer show a negative balance. The usage modal's hand-written template-type unions are replaced with the shared `TemplateType`.
- **New Provider Preset**: NekoCode (nekoapi.ai) for Claude Code, Claude Desktop, Codex, OpenCode, OpenClaw, Hermes and Pi (MiniMax Code inherits the Pi preset). The site's default groups only serve Claude Code and Codex CLI, so the OpenCode, OpenClaw, Hermes and Pi presets carry the claude-cli User-Agent its "max (external)" group requires; Claude Desktop cannot set one and may be refused.

### Changed

### Fixed

- **Deep Links Lost on Cold Start**: On Windows and Linux the plugin emitted the startup URL before our handler was registered, and events fired before the JS listener existed (cold start, window rebuilt in lightweight mode) went nowhere. The parsed link or parse error now waits in a backend pending slot with a monotonic id; the dialog peeks on mount and on each `deeplink-pending` notification and acks by id only after showing it, processing serially so an older link can't replace a newer one. `get_current()` is read after registering the URL handler, and our own `RunEvent::Opened` handling on macOS is dropped since the plugin already emits it (links opened twice). `configUrl` is rejected up front, `mcode` is accepted for prompts and `pi` / `mcode` for MCP, and the tray menu refreshes after a provider import.
- **Codex Deep Links Dropped Provider Settings** (refs #7438, #7942, #5510): A link carrying `config.toml` used to keep only the key, endpoint and model and rebuild a fixed template, dropping auth mode, headers, websocket support and the model catalog URL. The selected `[model_providers.*]` table now keeps its connection and auth fields (renamed to `custom`), `model_catalog_url` is kept only on the endpoint's origin, and top-level provider-exclusive fields (model, reasoning effort, web_search, context window, sub-agent model) are kept, using the same field lists as the live projection. Global settings are not imported. Tables using `auth`, `aws`, `gateway_oauth` or `env_http_headers` are rejected; `env_key` is dropped in favor of the link's key, and an `env_key`-only link is rejected. Links without a config keep the old template byte for byte.
- **Grok Build Deep Links Dropped the Model Profile** (refs #6457): The table named by `[models] default` is kept through an allowlist of Grok 1.0.50 profile fields (display name, description, API backend, context window); endpoint, key and model come from the link. Tables using `auth_provider`, `env_http_headers` or `mtls_cert_dir` are rejected, `env_key` is dropped, and only one model table is imported.
- **Deep Link Values Expanded by Additive Apps**: Pi values starting with `!` or containing `$NAME` / `${NAME}`, OpenCode `{env:}` / `{file:}`, and `${...}` for OpenClaw and Hermes would run a command or send local secrets and files to the link's endpoint. They are rejected when parsing, when merging `config` and when building the provider.
- **Routed Claude Code Haiku Requests Rejected for Disabled Thinking** (fixes #8118): Routing writes stable role aliases, and Claude Code looks the alias up in its own model table to decide how to send thinking. `claude-haiku-4-5` is listed as able to disable thinking without adaptive thinking, so haiku-tier requests went out with thinking disabled and upstreams that require thinking rejected them. The alias is now `claude-haiku-5-5`, matching the sonnet and opus aliases; the proxy still maps by the "haiku" keyword.
- **Codex Sessions Under the Retired `cc-switch-official` Provider** (refs #7948): v3.17–v3.20 recorded official-account sessions through routing under `cc-switch-official`, and resuming them in 4.0 failed with "Model provider `cc-switch-official` not found". On startup they are moved to the built-in `openai` bucket in the state DB and each rollout's `session_meta` line (compressed rollouts included), before the unify migration so that setting still works through its normal path; `config.toml` is untouched. The migration is skipped without recording completion when `config.toml` or a profile still selects `cc-switch-official`, or a state DB cannot be locked. Completion is recorded per Codex config directory and backups go to the existing session group migration folder.
- **Grok Build Session Titles on Third-Party Providers** (fixes #7003): With `models.session_summary` unset, Grok Build (1.0.50) generates titles with the built-in `grok-4.6` model but sends the request to the default table's endpoint, so third-party upstreams reject it. The switch patch now points `session_summary` at the target table when it is unset or names a table CC Switch wrote, and removes it when switching to the official account; a user's own choice is left alone.
- **Empty OpenRouter and Novita Balances Shown as an Expired Plan** (#8175, fixes #8148): A parsed balance of zero or less now stays valid and shows the existing "balance used up" line. Missing, malformed, non-finite or overflowing amounts return an error instead of a zero balance.
- **Codex Usage After an In-Thread Model Change** (#8176): A model change recorded in `event_msg/thread_settings_applied` without a new `turn_context` was ignored, so later tokens were attributed and priced as the previous model (or `unknown`). `payload.thread_settings.model` is now read; existing rows can be corrected with Usage > Data sources > Rebuild Codex usage.
- **Settings Autosave Committed Unconfirmed Directory Edits** (#8023, fixes #7849): Autosave of an unrelated setting now keeps the eight directory fields at their confirmed values unless the update changes that directory, and the directory display is reconciled with the effective path after the form resets.
- **Flicker When Opening Provider Pages on Windows** (#8159, refs #8141): `FullScreenPanel` gains a `none` motion preset, used by the add and edit provider pages so the whole-panel fade no longer flickers.
- **MSI Upgrades Recreated a Deleted Desktop Shortcut**: A major upgrade reinstalls from scratch and the shortcut component was unconditional. AppSearch now looks for the existing shortcut before the old version is removed, and the shortcut is installed only on a fresh install or when it is still present.
- **Japanese Advanced Options Label**: 高級オプション is renamed to 詳細オプション in the UI and in the Japanese README, routing guides and user manual.

### Docs

- Site owner integration guide in Chinese, English and Japanese: building links, wiring an import button that fetches the link from the backend, the not-installed fallback, usage scripts (New API and Sub2API ship an import button already).
- The link generator becomes a tool for site owners hosted at ccswitch.io/deplink.html (the old GitHub Pages link returned 404), with provider / MCP / prompt / Skill tabs, per-app `apiFormat` choices, usage script templates and `icon` / `iconUrl` checks matching the app.
- The user manual covers `apiFormat`, Pi links, the activation switch, `iconUrl`, Codex config import rules, the Sub2API template and "My Icons".

### Upgrade notes

- **No database schema change** (still 20). The "My Icons" library is a settings key.
- Routed Claude Code clients get the new haiku alias when CC Switch starts and reattaches.
- The `cc-switch-official` session migration runs once per Codex config directory on startup.
- New presets only affect newly added providers.

## [4.0.9] - 2026-10-11

The fifth patch release on the 4.0 stable line. Codex threads that carry tool results with no matching call, such as the create_thread receipt the Codex desktop app injects into new threads, no longer fail on strict Chat upstreams (HTTP 400) or xAI native Responses (HTTP 422). Clients that cannot reach the host's loopback, such as Claude Desktop sessions in WSL2, can be given a separate connection address for local routing. Fetched models are now picked in a dialog that can also remove them and shows each model's parameters, Codex can set a default sub-agent model and reasoning effort, and the provider forms move field explanations into help tips. Other fixes cover OpenAI-format Claude upstreams receiving `x-api-key`, aggregation compatibility switches, the UI language on cold start, macOS local network access and flicker when opening the provider editor.

**Stats**: 33 commits | 85 files changed | +5948 insertions | -1416 deletions

### Added

### Changed

- **Codex Model List Comes First and Its First Row Is the Default**: The model list sat collapsed in the advanced options below the default model it feeds. It now follows the connection fields, is named "Model list" as in the Aggregation layout, and its first row is the default model, replacing the separate default model field. Renaming or removing the first row updates the model; an older card whose default sits further down shows that row first without counting as an edit. Cards without a list keep the default model field, since a list row would shrink Codex's built-in `/model` menu to the listed entries; adding the first row to an empty list seeds it with the current default.
- **No More Stars in Aggregation Model Lists**: The star column and "make default" action in the Claude Code and Codex Aggregation model lists are gone; a help tip next to "Model list" says the first row is the default. A Codex direct card whose default model is another row shows that row first in the Aggregation layout for display only.
- **Form Explanations Move into Help Tips**: The Claude Code, Codex and Aggregation forms keep only consequences on the page (restart Codex after changing the model list, a max output above the real limit returns 400, settings that only apply in routing and Aggregation modes); what a field is and when to use it sits behind the "?" after its name. The full URL toggle moves into the advanced options (a provider with it on opens with the section expanded). The legacy provider fields notice is one sentence, and Claude Desktop's model mode hint now simply says to use Direct for native Claude models and Model Mapping for third-party ones such as DeepSeek or Kimi.
- **Form Hints Follow the App's Actual Mode**: The full form now knows whether the app is in direct mode. When the upstream format needs conversion it warns that saving the in-use card breaks requests, or that other cards need routing first; the Claude fallback model explanation describes the main model in direct mode. Wording that no longer matched behavior is fixed, the Codex default model field shows in the aggregation layout when the list is empty, fields the backend ignores on managed-account cards are hidden, and 12 unused codexConfig strings are removed.

### Fixed

- **Unmatched Tool Results Broke Codex Threads on Chat Upstreams** (#8136, fixes #7196, #4741): Codex history can carry tool results with no matching tool call, most notably the create_thread receipt the Codex desktop app injects into a new thread (a `function_call_output` whose `call_id` is null). The Responses-to-Chat conversion emitted them as `role=tool`, so strict Chat upstreams such as DeepSeek and OpenCode Zen rejected every request in that thread with HTTP 400. Unmatched `function_call_output` / `custom_tool_call_output` / `tool_search_output` items now become a marked user message, held until the current run of tool results ends so `role=tool` messages stay contiguous; media is sent as image parts rather than base64 text, and reasoning attachment is unchanged. Paired tool outputs convert exactly as before.
- **Call-id-less Tool Outputs Broke Codex Threads on xAI** (refs #7074): Codex Desktop injects `function_call_output` receipts (create_thread, automation_update, heartbeat, cross-thread messages) with only an `fco_` id. xAI's native Responses API rejects the whole request with 422 (missing field `call_id`), and since the receipt stays in history the thread never recovers. The xAI-only compat layer now rewrites these items into user messages with the same marker the Chat bridge uses, keeping text and image parts. Items with a `call_id` and other upstreams are untouched.
- **OpenAI-format Claude Upstreams Received `x-api-key`**: Claude routing picked the auth header from the env var name alone, so a provider with `ANTHROPIC_API_KEY` and an OpenAI Chat or Responses upstream sent `x-api-key`, which those protocols reject. OpenAI formats now always use `Authorization: Bearer`; Anthropic Messages upstreams keep the env var semantics. The form no longer shows the auth field for those formats (Copilot cards keep it).
- **Aggregation Used Only the Default Provider's Compatibility Switches**: Picking another member's model in Claude aggregation could send features that member rejects. Switches of all publishing members are now merged by kind: disabling experimental betas, Artifact or the auto mode server applies when any member asks for it; tool search, always-on effort and fine-grained tool streaming stay on only when every member turns them on. Extra body, thinking and window switches still follow the default provider.
- **UI Language on Cold Start**: The first-screen language came from a localStorage cache of the saved setting. When the cache was empty or stale (dev and release builds use different WebView origins, WebView data was cleared, `~/.cc-switch` was copied to a new machine) the UI showed the system language until a page that loads settings was opened. Settings are now fetched once during bootstrap and the saved language applied.
- **macOS Could Not Reach LAN API Endpoints** (#7213, fixes #7109): `Info.plist` now declares `NSLocalNetworkUsageDescription`, so macOS shows the local network permission prompt. The request that triggers the prompt may still fail; retry after allowing.
- **Flicker When Opening the Provider Editor** (#8145, fixes #8141): The edit panel opened on a loading page before the initial projection arrived. It now waits for the projection, keeping the same fade as the add panel.

### Docs

- Flatpak build docs pass `--bundles` to the Tauri CLI instead of Cargo (#8132) and explain skipping updater artifacts without a signing key.

### Upgrade notes

- **No database schema change** (still 20).
- New presets only affect newly added providers.

## [4.0.8] - 2026-10-10

The fourth patch release on the 4.0 stable line. Codex aggregation works for users who only installed the Codex desktop app, and when the official model list is unavailable the notice now says why and clears itself once the list is back. Model fetching in the Claude, Codex, Grok Build and OpenCode forms sends the configured request headers, Settings > Data gains an "Open log" button, and dark-mode text is less glaring.

**Stats**: 8 commits | 29 files changed | +1265 insertions | -128 deletions

### Added

- **Open Log Button**: The diagnostic log section in Settings > Data gets an "Open log" button that reveals `cc-switch.log` in the system file manager, falling back to the logs directory when the file has not been created yet, so the log can be attached to an issue without hunting for the hidden config folder.

### Fixed

- **Codex Aggregation Without a Standalone Codex CLI** (refs #8087, #7993): The Codex Stack page reported "official models unavailable" whenever both the online fetch and `codex debug models --bundled` failed, and users who only installed the desktop app have no `codex` on PATH. The desktop app's own CLI is now the last fallback: on macOS `ChatGPT.app` and the pre-rename `Codex.app` under `/Applications` and `~/Applications` (current `codex-cli/bin/codex` layout before the older `Resources/codex`; `ChatGPT.app` always wins so a leftover `Codex.app` cannot shadow a newer model list), on Windows `%LOCALAPPDATA%\OpenAI\Codex\bin\<version>\codex.exe`, newest modification time first. Standalone installs still take precedence.
- **Why the Official Codex Model List Is Unavailable** (refs #8087, #7993): Every cause collapsed into one generic notice and skipped logins were not logged. The Stack view now exposes `noticeReasons` and the notice lists them in all four locales: no usable ChatGPT login, login not refreshed for over 8 days, login missing the workspace or user ID, no Codex version, fetch failed or an invalid list for the official list; no Codex CLI found, the CLI failed to print a list, or no usable model for the bundled list. Each fallback logs one warning and CLI failures reach the default log level. Recovery is automatic: a refresh after a fallback always rewrites the client, and while the cached entry is still fresh the background check rewrites from it without fetching, so a 304 or unchanged list no longer leaves the notice in place until the next manual switch.
- **Model Fetching Ignored Configured Request Headers** (#7759, #7760, fixes #7747): The OpenCode form now sends its configured headers when fetching model lists, and the Claude and Codex forms (the Grok Build form reuses the Codex one) forward the provider's local-routing Header override JSON, parsed by the shared `parseHeaderOverrideJson` rules through a new `modelFetchRequestHeaders` helper, so gateways such as Cloudflare AI Gateway (`cf-aig-authorization`) accept the `GET /v1/models` probe. Invalid or empty overrides fall back to a plain fetch. Editing the override in the Codex form now also clears the fetched list and drops in-flight responses.
- **Dark-mode Text Too Bright**: The three dark-mode text tiers sat close to white (15.5 / 11.1 / 8.4 contrast on the app background). `--text-1` is now `#e4e4e7` with the shadcn `--foreground` family following, `--text-2` `#ababb3`, `--text-3` `#9a9aa2`, and `--muted-foreground` aligns with `--text-2`, for about 13.4 / 7.5 / 6.1; secondary and tertiary text stays at or above 4.5:1 on card and selected backgrounds. Light mode is unchanged.

### Docs

- The v4.0.7 release notes explain the Codex session compression switch in detail (how it maps to `config.toml`, when Codex compresses, resuming, CC Switch's session list and usage, caveats).
- The en and ja quota display help and the en, ja and zh-TW backup hints use the labels the UI actually shows.

### Upgrade notes

- **No database schema change** (still 20).

## [4.0.7] - 2026-10-10

The third patch release on the 4.0 stable line. Switching between the Plus and Team workspaces of the same OpenAI user works again (a 4.0 regression), quota windows can show what is used instead of what is left, compressed Codex session rollouts are read everywhere and can be enabled from Settings, and the Codex stale-client notice now covers direct ↔ routing switches and Windows. Usage accounting fixes cover Claude 1-hour cache writes, explicit-zero OpenAI cache fields from relays, Codex cache writes in session imports, missing Sonnet 5.5 / Haiku 5.5 prices and duplicate provider rows on the Claude stats tab; other fixes cover Codex top-level `base_url` being dropped on save, Windows batch files under non-ASCII usernames, and form editors in OpenCode, MiniMax Code and OpenClaw.

**Stats**: 20 commits | 100 files changed | +4705 insertions | -367 deletions

### Added

- **Quota Display: Left or Used** (closes #8024): Settings > General > Appearance gains "Quota display" with Left (default) and Used, stored as `quotaDisplay` in the device-local `settings.json` so the Rust-rendered tray follows it too. Only per-window percentages flip; balances, Codex Credits and saved resets keep showing what is left, and a used-up window still reads "used up". Colors, the "almost out" hint and which windows the card keeps are still decided by what is left (94% used is orange like 6% left). Expanded bars take their length from the number shown; balances keep drawing what is left. `SubscriptionQuotaView` stays a pure view and gets the mode from its wrappers.
- **Compressed Codex Session Rollouts**: Codex can compress rollouts untouched for 7 days into a sibling `rollout-*.jsonl.zst` and delete the original, through `[features] local_thread_store_compression` or the app-server `rollout/compress` RPC (which ignores the flag), and decompresses on resume. CC Switch only read `.jsonl`, so compressed sessions vanished from the session list, their usage was never imported, and history bucket migrations skipped them while recording themselves as done. A shared `codex_rollout_file` module now recognises both forms, reads `.jsonl.zst` transparently, writes a rollout back in its own form and keeps only the plain file when both briefly coexist. The session list decompresses only the head of a compressed rollout and uses its preserved mtime as the last active time with no last-reply preview; deleting a session removes both forms. Usage import inherits a cursor from any path with the same logical file name, taking the furthest line offset, in any directory and both directions; this is what prevents double counting across compress and resume, since request-id dedup only covers the 30 days of detail rows. History bucket migrations rewrite compressed rollouts in place and keep them compressed with their mtime. Settings > App config > Codex gets a "Compress old Codex sessions" switch backed directly by `config.toml` through the live write engine (write `true` to enable, remove the key to disable), showing the current size of the sessions directories.
- **Stale-client Detection in Every Codex Mode** (#7892, refs #7885): The model catalog check only ran while the aggregate stack view was active, so direct ↔ routing switches never warned about running Codex app-servers. It now runs in every mode, skipping only routes that manage their own catalog file. When the CC Switch catalog pointer is removed, clients that loaded our catalog are reported too; clients older than the first recorded generation are treated as fresh when no CC Switch catalog is in use, so direct users who never entered the proxy are not warned.
- **Stale-client Notice on Windows**: The check read the process table, which Windows does not have, so neither the model list nor the cached-account notice ever appeared and restart always reported the daemon as not running. The managed daemon is now found through its own `daemon.pid`, counted as running only while the process is active and its creation time matches, and restart is only offered for a daemon known to be running. Since the desktop app and editor plugins cannot be seen there, the notice falls back to "changed since you last dismissed it": model list and login fingerprints are recorded in `codex-client-ack.json` through the new `acknowledge_codex_stale_clients` command, with wording that says CC Switch cannot tell whether those clients are open. Without a record the current state counts as acknowledged, so upgrading does not show it. On every platform, dismissing the notice used to hide it until the app, mode or provider changed; the stack view now carries a fingerprint-derived revision and the notice reappears once it changes.
- **Scroll to App Configuration Entries** (#7934): Opening "Config directory" from an app page's menu scrolls Settings > App config to that app's entry with a short ease-out and flashes its outline twice. Scrolling stops when the user takes over, is skipped under reduced motion, and only moves the settings content pane.

### Fixed

- **Plus and Team Workspaces of One User Could Not Be Switched** (refs #8054): Since 4.0 an official Codex login was identified by the id_token subject alone; workspaces of one OpenAI user share it and differ only in `tokens.account_id`, so switching between their cards never rewrote `auth.json` or fired the restart notice, and the device login stash collapsed them into one entry. A login is now identified by user plus workspace, matching Codex. The stash file gains a version; an older stash is upgraded once on load, rekeying entries and restoring merged-away workspaces from the official cards only for users still present in the stash or the live `auth.json`, so logged-out users are not brought back.
- **Codex Top-level `base_url` Dropped on Save** (fixes #8039): A config with `base_url` (and `wire_api`) at the top level and no `model_provider` selector was projected as a route-less card: the editor showed an empty address, saving stripped both keys, and the proxy failed with "Codex Provider 缺少 base_url 配置"; direct switching also fell back to the built-in OpenAI route. The projection now normalizes a top-level `base_url` into `[model_providers.custom]` like the legacy `openai_base_url` shape. With no selector, `setCodexBaseUrl` now selects a custom table and writes the address into it, falling back to the old top-level write (which the backend normalizes) when the line-based rewrite cannot be verified against the parsed TOML.
- **Windows Batch Files Under Non-ASCII Paths** (fixes #8034): `cmd.exe` decodes `.bat` files with the console code page while CC Switch writes UTF-8. Tool install/update scripts now start with `chcp 65001` inside their own hidden console, fixing "The system cannot find the path specified" for npm installs under the profile. The Claude provider launcher refers to the temporary settings file as `%~dp0<name>` and passes a non-ASCII project directory through `CC_SWITCH_INTERNAL_CWD` instead of embedding it (ASCII directories are still written literally); `chcp` is not used there because it would persist in the user's interactive session.
- **Old Third-party Sessions on the Official Route Told Users to Restart**: With Codex on the official provider, a request carrying the proxy placeholder key comes either from a Codex process that has not reloaded its config, or from a session created under a third-party provider, which Codex resumes with its recorded `custom` provider id. The error now says an old third-party session needs a new session, and falls back to the restart hint otherwise.
- **Claude 1-hour Cache Writes Billed at the 5-minute Rate** (#7653, fixes #7652): `ephemeral_1h_input_tokens` from `usage.cache_creation` is now parsed in the proxy parsers and the Claude session importer, and that subset is priced at 1.6x the cache-write price (2x input versus 1.25x).
- **Explicit-zero OpenAI Cache Fields Masked Real Hits** (#8045, fixes #8041): Some relays hard-code `cache_read_input_tokens` to 0 and report hits only in `prompt_cache_hit_tokens`. Every cache-read candidate now has to be present and non-zero; an explicit 0 falls through, and an all-zero or missing chain still reads 0. Applied to Claude → Chat conversion (streaming and non-streaming; `Usage` gains `prompt_cache_hit_tokens`), Codex / Grok Build Chat-upstream usage synthesis and the passthrough usage parser.
- **Codex Session Import Ignored Cache Writes** (#7635, fixes #7634): `cache_write_input_tokens` from rollout `token_count` events is stored as `cache_creation_tokens` with total-inclusive input semantics. A zero cache-write count on pre-v3.17.0 legacy Codex proxy rows is treated as unknown in dedup, so those requests are not counted twice.
- **Claude Sonnet 5.5 and Haiku 5.5 Costed at $0** (#8053): Seeded `claude-sonnet-5-5` (2 / 10 / cache read 0.10 / cache write 2.50) and `claude-haiku-5-5` (0.10 / 0.50 / 0.01 / 0.125, the ≤100K-token tier).
- **Duplicate Provider Rows on the Claude Stats Tab** (#8032, fixes #8031): Provider stats now return `appType` and rows are keyed by `[appType, providerId]`, so a provider configured in both Claude Code and Claude Desktop no longer produces duplicate React keys and stale rows.
- **OpenCode / MiniMax Code Extra Options Changed Value Types** (#7841, fixes #7833): Row edits are merged into the stored options; untouched rows keep their original value and type, renamed keys inherit their value, and renaming onto an existing key is rejected.
- **OpenClaw User-Agent Toggle Dropped Custom Headers** (#7847, fixes #7846): Only the `User-Agent` entry is updated (variants dropped case-insensitively), and `headers` is removed only when it ends up empty.
- **Pi Volcengine Agent Plan Used the Coding Plan Endpoint** (#8044, fixes #7956): "火山 Agent Plan" now uses `/api/plan/v3` and a new "火山 Coding Plan" preset uses `/api/coding/v3`, in Pi and in MiniMax Code which builds its presets from Pi's list. The Agent Plan provider key stays `cc-switch-agentplan`.

### Docs

- The Chinese aggregation guide and the three-language manuals explain why Codex sub-agents on another provider cannot read encrypted tasks, and that Codex locks the picker to Luna Reserve once the official 5-hour quota runs out, with the workaround of temporarily making a third-party provider the default (#7945, #7962, #7974).
- The unified Codex session history setting and its confirmations are reworded in all four locales to say it only affects the Codex CLI resume list.

### Internal

- The thread version SQLite fixture test is skipped on WSL temp dirs, where Windows cannot take SQLite locks.

### Upgrade notes

- **No database schema change** (still 20). The pricing table gains two seed rows through the startup `INSERT OR IGNORE`.
- Claude cache-write costs rise from this release on for 1-hour cache writes (typical for the Claude Code main session); older rows are not recomputed.
- Zero-cost Sonnet 5.5 / Haiku 5.5 history is recomputed by the startup backfill. Haiku 5.5 prompts over 100K tokens are under-counted.
- Preset changes only affect new providers: existing Pi / MiniMax Code "火山 Agent Plan" cards keep `/api/coding/v3` until edited.
- The Codex login stash (`~/.cc-switch/codex-login-stash.json`) is upgraded to the new versioned format on first load.

## [4.0.6] - 2026-10-09

The second patch release on the 4.0 stable line. The provider page gains a search button that also matches API addresses, Skills can be updated all at once from the check button, quota numbers are colored again with a 20% warning threshold, and Codex aggregation gets an opt-in classic sub-agent tools toggle for cross-provider sub-agents. Fixes cover the last reply of Claude Code being dropped on Chat-converted routes, Codex aggregation compaction failing on `web_search` history, official models hidden from the aggregation picker by an old CLI on PATH, dangling account bindings after removing a managed ChatGPT account, `claude update` under npm 12, and tray quota rows missing the 5-hour tier.

**Stats**: 21 commits | 79 files changed | +3712 insertions | -723 deletions

### Added

- **Provider Search Button**: Provider search could only be opened with Cmd/Ctrl+F. A search button next to "Add provider" now toggles the existing panel, which closes when switching apps or leaving the provider page. Matching covers the API address as well as name, notes and website (the address is read from every app's `settingsConfig` shape by a shared `extractProviderBaseUrl`, which `ProviderCard` now also uses). The list is only filtered while the panel is open; closing it with Esc used to leave the list silently filtered. The panel is portaled to `document.body` so it no longer pushes the cards down by 1rem. A device-local "Show provider search" setting (on by default) hides the button; the shortcut keeps working.
- **Update All Skills From the Check Button**: Once updates are known, "Check updates" turns into "Update all (N)" and a check that finds updates opens the confirm dialog directly; re-checking moves to the "..." menu and the duplicate "Update all" in the filter row is gone. The confirm dialog lists each Skill with a clickable source repo (`V7ConfirmDialog` gains a `details` slot), closes immediately on confirm, and the toolbar shows "Updating 1/2..." while the batch runs.
- **Colored Quota Numbers and a 20% Warning**: The v3 green / orange / red is back, applied to the number only ("88%", "¥82.10", "$2500", the reset count) so tier names and "left" stay gray; lines with no number (used up, expired, query failed) are colored as a whole. A tier now warns below 20% left (was 10%), in the card and in the tray's "almost out". The "used $X" line has no total and stays uncolored; expanded bars and the Accounts page keep neutral numbers while normal.
- **Classic Sub-agent Tools for Codex Aggregation**: Codex multi-agent v2 has the main agent's backend encrypt the task handed to a sub-agent, so in aggregation mode a sub-agent on a different provider cannot read it. A device-level setting (off by default) stamps `multi_agent_version = "v1"` on every row of the aggregated catalog, official rows included, so tasks travel as plain text at the cost of v2-only tools such as `followup_task` and `interrupt_agent`. Toggling rewrites the catalog immediately in aggregation mode and rolls the setting back if the write fails; when `config.toml` forces `[features] multi_agent_v2` the settings row says the toggle has no effect. With the toggle off, the opaque-state rectifier no longer replaces the current (trailing) encrypted task with a placeholder, which used to hand the sub-agent an empty task; native Responses passthrough requests ending in an encrypted task hold the stream until the first non-lifecycle event (first-byte timeout, at most 10s) so an in-stream rejection reaches the rectifier, and when nothing else can be cleared CC Switch returns a 400 `unreadable_encrypted_agent_task` naming the toggle instead of letting Codex retry.
- **Cached-account Restart Notice Outside Aggregation** (#8006, refs #7700): Replacing `auth.json` does not always reload the running Codex app-server's auth cache, but the restart notice only fired on aggregation catalog changes. CC Switch now tracks a digest of the file-stored login's workspace/user identity (no tokens) and shows a separate "may still use the previous account" notice in direct, routing and aggregation modes; same-account token refreshes and first observations do not count. The daemon restarts only after confirmation, and desktop/editor users are told to quit and reopen.
- **Green CC Switch Update Dot**: The CC Switch update dot on "Settings" and the About row now uses the success green, and clicking "Settings" while an update is available opens About directly (Cmd+, still opens General). Tool update dots on "Apps" keep the neutral tone.

### Fixed

- **Last Claude Code Reply Dropped on Chat-converted Routes** (#7986, fixes #7984): The OpenAI Chat → Anthropic streaming conversion only closed content blocks on type switches and on the `finish_reason` path. At `[DONE]` or natural stream end it emitted `message_delta` / `message_stop` without closing blocks still open, so upstreams that omit `finish_reason` (or send content after it) left the last text or tool block unclosed and clients dropped it. Open non-tool and tool blocks are now closed right before the terminal events; the no-finish truncation path still emits no terminal events.
- **Codex Aggregation Compaction Failed on Tool History** (#7991, fixes #7976): The remote compaction summary turn for native Responses third-party upstreams removed `tools`, while replayed `web_search_call` / `function_call` items still referenced them, and some upstreams rejected the turn with 502. `tools` are now kept with `tool_choice: "none"` forced (added even when the request had none); requests without tools keep clearing stale call fields, and `text.format` is still removed.
- **Official Models Hidden From the Codex Aggregation Picker** (fixes #8014): With the official account as aggregation default, the official list was fetched with the version of the `codex` on PATH, and the server returns only hidden entries for 0.140 or older, which desktop-only users often keep on PATH. The version is now the newest Codex in use: the PATH CLI or the `cli_version` on the 20 most recently created threads in Codex's state DB (covering the desktop app and editor extensions). A list with no `visibility = "list"` row is not used; CC Switch falls back to the bundled list and shows a notice asking to update Codex.
- **Third-party Codex Catalog Entries Followed the Cached Official Template**: ProxyChat and Copilot catalogs cloned gpt-5.5 from Codex's `models_cache.json` (then `codex debug models --bundled`), so every change OpenAI made to that entry leaked into third-party models (the hidden flag behind #7924/#7954; newer entries carry `tool_mode: code_mode_only`, v2 sub-agents and experimental tools the Chat converter does not handle), and the cache announces GPT-5.5's retirement on 2026-10-14, after which every switch would spawn the Codex CLI. They now always use the bundled template, refreshed to Codex 0.162's gpt-5.5 entry (`shell_type: unified_exec`, skills / plugin usage instructions); the loader is renamed `load_codex_classic_tool_template`.
- **Removing a Managed ChatGPT Account Left Codex Providers Bound to It** (fixes #7055, refs #6969): Remove and logout now detach the affected Codex providers in one SQLite transaction (drop the binding, store an empty auth like a manual unbind, backfill `category=official` for legacy cards, keep unknown meta keys), so the card follows the native Codex login. Only this device's account IDs are unbound, since provider rows sync across devices; the command reports "account removed but unbinding failed" separately, and any row still dangling keeps going through the #7395 recovery path. The frontend invalidates the Codex provider list after remove/logout, including on partial failure. Thanks @SaladDay for the report and the first fix in #7060.
- **`claude update` Left a Placeholder Binary Under npm 12** (#7099): npm 12 blocks install scripts and still exits 0, so the primary `claude update` for an npm-installed Claude reported success with a broken binary and the npm fallback never ran. The primary update now runs with `npm_config_allow_scripts`, `npm_config_ignore_scripts=false` and `npm_config_include=optional` whenever the real target lives in the `@anthropic-ai/claude-code` npm package, which also covers npm prefixes classified as system (Intel Homebrew node, nodejs.org pkg, `~/.npm-global`, distro node). Windows anchored updates and the WSL static path are not covered.
- **Skills Import Dialog Could Not Be Closed** (fixes #7994): The import mutation's `onSettled` awaited every refresh including the discover list, which downloads each repository from GitHub, so the dialog stayed pending until discover finished. Only the installed and unmanaged refreshes are awaited now; repos and discover still invalidate in the background.
- **Tray Dropped the 5-hour Quota Tier** (fixes #8011): The app row title kept only the two tiers with the least left, which almost always dropped the 5-hour window of three-tier plans (Volcengine Agent/Coding Plan, Zhipu, MiniMax). All tiers are written in their original order as in 3.x; the "almost out" suffix still follows the lowest tier.
- **Apps Page Visibility Switches Were Hard to Read** (fixes #8010): The neutral tone drew a dark-gray checked track next to a medium-gray unchecked one in light mode. The neutral tone is removed and those switches use the action color.

### Docs

- A Chinese aggregation mode guide, and the three-language manuals now distinguish model fetching, models.dev metadata completion and manual entry.
- The Linux window-controls setting path in the three-language FAQ is updated for v4 (#7983).

### Internal

- Codex Copilot cards no longer store a representative `meta.apiFormat`; the form reads `codexCopilotApiFormat` directly and old cards drop the field on the next save (#7972).
- The release workflow fails fast when a Linux deb or rpm package is missing (#7985).
- DMXAPI logo updated.

### Upgrade notes

- **No database schema change** (still 20).
- Existing Codex sessions on ProxyChat (Chat-converted third-party) or Copilot providers lose the cached `comp_hash` and are compacted once on resume.

## [4.0.5] - 2026-10-08

The first patch release on the 4.0 stable line. Codex can use a GitHub Copilot account, and the all-time usage heatmap reaches back to the first recorded day. Fixes cover Claude Code sub-agents routed through Responses being forced into worktrees, GLM models hidden from the Codex aggregation picker, Linux deb/rpm auto-updates, Wayland title-bar buttons, blank Windows taskbar pins after an MSI upgrade, and Claude Code npm installs under npm 12.

**Stats**: 18 commits | 187 files changed | +10009 insertions | -4785 deletions

### Added

- **GitHub Copilot for Codex** (#7157): A GitHub Copilot preset for Codex that uses a managed GitHub account from the Accounts page. The local route resolves each request's model against the account's live Copilot `/models` catalogue and picks the transport the model advertises (native Responses first, Chat Completions as fallback in auto mode); the editor also offers an explicit protocol override. Response handling, the opaque-state rectifier and Stack `web_search` stripping follow the transport actually used for each request rather than the stored `apiFormat`. Fetching models fills the catalogue from the account's live prompt limit (`max_prompt_tokens`, falling back to `max_context_window_tokens`), parallel tool calls and reasoning levels; the preset keeps conservative fallbacks (272000, 200000 for luna). Codex only treats a card as managed Copilot by `providerType`, so self-hosted relays at the same host keep their own key and endpoint. The Copilot request identity headers are now shared between the Claude and Codex paths, and `codexCopilotApiFormat` is stored as a string so an unknown future value reads as auto and round-trips instead of dropping the whole meta.
- **All-time Heatmap Shows the Full History**: The heatmap only covered the last 53 weeks. It keeps that as the default view and adds a "Show more" toggle that lists earlier history in contiguous 53-week spans back to the first recorded day, each titled with its date range and totals; shading is bucketed across all spans so they stay comparable. A new `get_usage_first_date` command returns the earliest local day across `proxy_request_logs` and `usage_daily_rollups`, honoring the dashboard's app, provider and model filters.

### Fixed

- **Claude Code Sub-agents Forced Into Worktrees Through Responses** (#7717, fixes #7713): The Responses API strictifies a function tool when `strict` is omitted, so optional attributes land in `required` and the model filled Claude Code's optional Agent `isolation` (and `model`) on every call, sending sub-agents to a worktree that fails outside a git repo or overriding the agent's model. `anthropic_to_responses` now sets `strict: false` on converted function tools, matching what Codex CLI itself always sends; `parameters` still pass through `clean_schema` unchanged and the hosted web-search branch is untouched. Covers both plain Responses providers and the Codex OAuth backend.
- **Codex Aggregation Hid GLM and Other Configured Models** (#7925, fixes #7924): Generated catalog entries cloned the cached gpt-5.5 template without touching `visibility`, so once the official backend marked the template `hide`, every explicitly configured third-party model disappeared from `/model` while aggregation still counted it. Generated entries now pin `visibility: "list"`, matching the official mirror path; native official rows keep their own visibility.
- **MoArk Codex Preset Listed Only One Model** (#7940): The preset had no `modelCatalog`, so Codex fell back to generic metadata and `/model` showed only `deepseek-v4-flash-0731`. It now declares all five models with windows, image input and measured reasoning levels (Qwen3 Coder Plus a single `none` level), plus an explicit `apiFormat: "openai_responses"`. Existing MoArk cards keep their old catalog until the preset is applied again.
- **Linux deb/rpm Auto-update Failed With a Permission Error** (#7620, fixes #4060): tauri-bundler 2.6.1 patched the bundle type by symbol lookup, which broke with `strip = "symbols"`, so deb/rpm binaries reported `UNK`, fell back to the AppImage path and tried to write into `/usr/bin`. The Tauri CLI and the frontend `@tauri-apps/*` packages are aligned with the Rust crates (bundler 2.8 patches the string in place), Linux releases now carry deb/rpm updater signatures, and `latest.json` publishes `linux-<arch>-deb` / `linux-<arch>-rpm` entries; the release check requires all four signatures (#7943). Existing deb/rpm installs still carry `UNK` and need one manual install of this version.
- **Wayland Title-bar Buttons Did Not Respond** (#7947, fixes #7405, #2736, #7499): tao 0.34 wraps the HeaderBar in an `EventBox` with `above_child=true`, whose input window could stack above the minimize/maximize/close buttons after the first map or a tray hide/show. `above_child` is cleared on the GTK main thread whenever the main window is shown (a no-op once Tauri ships tao 0.36+). The input-region nudge now bumps one logical pixel instead of one physical pixel, skips maximized windows, and runs one at a time so the bumped size is always restored.
- **Windows Taskbar Pins Turned Blank After an MSI Upgrade** (#5952, fixes #5949): The desktop and Start Menu shortcuts pointed their icon at `ProductIcon`, which Windows Installer caches under a ProductCode directory that each major upgrade deletes; taskbar pins kept the dead path. The shortcuts now take their icon from the target exe. The `Icon` table and `ARPPRODUCTICON` stay for Programs and Features. Pins created before this fix still carry the dead path and need to be unpinned and pinned again once.
- **Claude Code npm Installs Left a Placeholder Binary Under npm 12** (#7929): npm 12 blocks Claude Code's postinstall by default and still exits 0, leaving the 500-byte placeholder at `bin/claude.exe`. Every Claude npm install and update fallback, and the copyable install command on the Apps page, now pass `--ignore-scripts=false --include=optional --allow-scripts=@anthropic-ai/claude-code`.
- **Grok Build Session Usage Took 10 Minutes to Appear**: The settle window that delays Grok Build session imports reused the ±10-minute takeover guard window. It is now 60 seconds (the guard window is unchanged), with a compile-time assertion keeping it below the guard window.

### Docs

- The four READMEs, the issue templates (all ten apps) and the three-language user manual are updated for the 4.0 interface.

### Internal

- **WSL2 Nightly Runs From a nextest Archive**: The nightly had failed since 10-05 with LNK1327, because the contract step re-invoked cargo with `TEMP` on `\\wsl.localhost` and `mt.exe` cannot write its manifest temp file to a UNC path. The lib tests are now built once into a nextest archive with the native `TEMP`, and both the contract test and the lib suite run from it. Three lib tests the 9P share cannot host (symlink fixtures, a 13,248-file extraction) skip only when their temp dir is on a WSL share, and the nightly alone retries flaky tests up to twice (os error 995 on 9P); the PR `ci` profile still fails on the first error.

### Upgrade notes

- **No database schema change** (still 20).
- **Linux deb/rpm**: install 4.0.5 manually once; auto-update works from then on.
- **Windows**: if a taskbar pin turns blank after this upgrade, unpin and pin it again once; later upgrades keep the icon.

## [4.0.4] - 2026-10-07

The first stable release of 4.0. On top of 4.0.3, macOS restarts after an in-app update or a config-directory change bring the new window to the front, new installs hide the project switcher until it is turned on in Settings, the request log's speed column stays visible in a narrow window, and the About card's star prompt gets its own dismissible strip. See the 4.0.0 to 4.0.3 sections below for everything else in 4.0.

**Stats**: 5 commits | 12 files changed | +136 insertions | -39 deletions

### Changed

- **Project Switcher Hidden by Default**: The switcher showed on the providers page header and in the tray for every new install, though most users never create a project. `show_profile_switcher` now defaults to false (plain `#[serde(default)]`, `AppSettings::default()` sets false), and the frontend fallbacks in `App.tsx` and `GeneralSection` are `?? false` so the header does not flash the switcher before settings load. Existing users keep their behavior: the field has been persisted to `settings.json` since v3.17.0.
- **Star Prompt on the About Card**: The prompt sat at the end of the link row and wrapped onto a line of its own like a stray caption. It now lives in a tinted strip at the bottom of the card with a slowly spinning star (stopped under `prefers-reduced-motion`) and a "Star on GitHub" button; the separate GitHub button is dropped while the strip shows. A close button dismisses it per device (`localStorage`), and the plain GitHub button returns to the link row.

### Fixed

- **macOS Window Stayed Behind Other Apps After a Restart**: `tauri::process::restart` spawns the binary directly, and since macOS 14 app activation is cooperative, so the new process's activation request was denied after an in-app update or a config-dir restart. `restart_process` now launches the bundle with `open -n` on macOS, letting the still-frontmost old instance hand activation over, and falls back to `tauri::process::restart` if that fails. `restart_app` uses `restart_process` instead of `app.restart()` so both paths behave the same. The update from an older version still restarts through that version's code, so the fix shows from the next update on.
- **Request Log Speed Column Pushed Out of View**: At the minimum window width with the sidebar expanded, the table area is 644 px but the table had `min-w-[700px]`, so the speed column sat in a horizontal scroll whose scrollbar was usually off-screen. The minimum is now 620 px, matching the provider, model and pricing tables; the provider and model columns already truncate.

### Internal

- **Hermes Scan-Limit Test Batched in One Transaction**: `first_user_messages_is_scoped_to_listed_sessions` inserted 1002 rows in separate autocommits, which took 150-180 s on the Windows runner and intermittently hit nextest's 180 s timeout. The fixture inserts now run in a single transaction.

### Upgrade notes

- **No database schema change** (still 20).
- **This is the first stable 4.0 release**, so 3.x installs update to it through the in-app updater. The full 4.0 notes for 3.x users are in `docs/release-notes/v4.0.4-*.md`.

## [4.0.3] - 2026-10-06

Fixes and smaller additions on top of 4.0.2. Claude Code mapped to GPT or Grok no longer reasons at full strength with thinking turned off, and `low` effort no longer returns 400 on pro models. Claude Code behind a gateway can skip the auto mode server check with a new quick toggle (on by default for new third-party providers), and every quick toggle now explains itself. Skills imported with several apps ticked actually reach those apps, OpenCode Go works from Claude Desktop, and mixed LF / CRLF SSE streams no longer lose tool calls. MCP and prompt editors open as full pages that ask before discarding unsaved changes; Backup & Restore shows every backup location under `~/.cc-switch` with its size; ChatGPT subscriptions show their Codex Credits balance; the usage tables count cache tokens and the model tab gains success rate and speed. OpenCode 2.0 native providers round-trip through the JSON editor, and OpenCode Zen and MoArk join the presets.

**Stats**: 29 commits | 116 files changed | +6,232 insertions | -773 deletions

### Added

- **Auto Mode Server-Check Quick Toggle for Claude Code** (refs #7538): Claude Code 2.1.281 added a server-side auto mode classifier that only official endpoints can serve, so every session through a gateway stopped once on a "not eligible" notice before falling back to the local check.
  - The Claude provider editor gets a "Disable auto mode server check" toggle that writes `CLAUDE_CODE_AUTO_MODE_SERVER=0`; its hint says official endpoints should leave it unchecked.
  - New Claude providers get the key by default unless the preset is official or a cloud provider, or already sets it; the custom provider's default form goes through the same overlay.
  - The key itself is now a Claude provider-exclusive env field (#7893 by SailingLoong, fixes #7891): written on switch-in and removed on switch-out only when the value is unchanged, so a value set globally by hand is left alone. Before this, the key stayed in the provider row and never reached `settings.json`. The frontend preset-scan mirror (`tests/config/claudeKeyFields.json`) is updated in lockstep.
- **A Help Tip on Every Claude Quick Toggle**: Each toggle above the Claude config editor gets the standard "?" tip with one sentence on what it does, why you would want it, and whether it is global or follows the provider. The toggles render from one list (copy under `claudeConfig.<key>` / `claudeConfig.<key>Help`), and the help button sits outside the `<label>` so opening a tip never flips the checkbox.
- **Full-Page MCP and Prompt Editors With an Unsaved-Changes Guard** (#7842 by Owlbay): MCP, prompt and Pi native prompt editors open as non-modal full pages inside the content area, so the sidebar and the window drag region stay usable; provider editors drop the 1008 px cap and follow the window width.
  - Full-page editors register unsaved changes (input, change, and clicks on checkbox / switch / radio / option / `aria-pressed` controls; display-only toggles opt out with `data-unsaved-ignore`). Leaving through the sidebar, ⌘, or the tray asks before discarding; back, cancel and Escape still close directly, and saves keep navigation locked via mutation keys.
  - Long page titles truncate, the whole page header is a drag region, and the unused editor delete buttons are removed.
- **"Other Backups" in Backup & Restore**: Only database snapshots were listed, while other backups grew unseen under `~/.cc-switch`; Codex session-history migration copies alone can reach several GB.
  - A collapsible section below the database list shows each location (skill uninstall backups, Codex unify / restore / provider-migration backups, config first-write backups, Hermes and OpenClaw config backups, environment-variable cleanup records, the migrated legacy routing takeover backups, and files left by older versions) with its path, size and item count, plus reveal-in-file-manager and delete-whole-category actions. Database snapshots are only summarized there and stay managed per file above.
  - The confirmation explains what each delete loses, e.g. deleting the Codex unify migration backups removes "Restore backup" when turning that switch off.
  - The frontend passes category ids only; paths are computed by the backend from each writer's own location, deletes never follow symlinks, and Codex migration and skill backups are deleted under their migration / skills-state locks so a running migration or uninstall cannot lose its directory mid-write.
- **Codex Credits Balance for ChatGPT Subscriptions**: `wham/usage` already returns `credits` (`{has_credits, unlimited, balance}`); it is now parsed into `SubscriptionQuota.credits_balance` with no extra request, and a zero, unlimited, missing or malformed balance is left out without failing the quota.
  - Credits are metered at API prices (the official rate card equals the API dollar price × 25 for every model), so one credit is $0.04, kept in a single constant.
  - The expanded view and auth center show a "Credits" row (count, then "about $2500"). The provider card shows the balance in dollars only once a tier is used up, since credits are spent only then; the card's reset drop-down lists it below the expiries, and a single saved reset can drop down when there is a balance.
- **OpenCode 2.0 Native Providers Round-Trip** (#7579 by DEAN-Cherry, co-authored by Jason; refs #7382): OpenCode 2.0 accepts native `providers` next to the legacy `provider` map; CC Switch only read `provider`, so native providers were invisible and writes landed in the map OpenCode ignored.
  - Both containers are read. For the same ID a valid native declaration wins regardless of key order; an invalid one does not shadow a valid legacy entry and is left untouched, matching OpenCode's normalizer (schema as of v2.0.12). Unknown extension fields are kept.
  - `meta.opencodeConfigFormat` records the source format, so `{}` and models-only built-in overrides stay native across database round-trips and re-enabling.
  - Native providers are written under `providers` through the comment-preserving JSONC editor; legacy writes shadowed by a valid native declaration are rejected, and removing a provider deletes the ID from both containers. Native JSON is validated before saving, with the first invalid field named.
  - Native providers are edited in the JSON editor, legacy ones keep the structured form; new native IDs need a package and at least one model. Common config extraction also skips native `settings.apiKey` / `baseURL`.
- **Model Stats Show Success Rate and Speed**: The model tab gains the success-rate and speed columns the provider tab has (rollup rows count toward the success rate but not speed, as they have no per-request timing). Both tables render them from shared `statsColumns`; the cost header reads "Cost" and the average cost per request moves into the cost cell's hover title.
- **Select All in the Installed Skills List** (#7887 by Allen Xu): The header checkbox acts on the rows the current search and filters show: checked when all are selected, indeterminate when some are; selections outside the current filter are left alone.
- **Switch and Mode Logging** (#7882 by Allen Xu, fixes #7881): `[SWITCH]` lines record every provider switch (direct or proxy route, from → to) and how it ended (done, done with warnings, refused by the official-provider rule, failed); `[MODE]` lines record entering / attaching, exiting / detaching and route changes with whether the client config was rewritten. The mode dialogs log what the user picked. TOML parse diagnostics have their quoted source lines stripped before logging, since that line can hold a credential.
- **New Provider Presets**: OpenCode Zen for Claude Code and Codex, merged with OpenCode Go into one "OpenCode" family row (closes #6016); MoArk for Claude Code, Codex, Pi, OpenCode and OpenClaw (#7580 by lcgash).

### Fixed

### Changed

- **Two Claude Quick Toggles Removed**: "Teammates" (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`) now only gates tmux / iTerm2 split-pane teammates and structured shutdown / plan-approval messages, since every Claude Code session already has an implicit team; "Max effort" (`CLAUDE_CODE_EFFORT_LEVEL=max`) pinned every session to the most expensive effort and made `/effort` a no-op, while Claude Code keeps max session-only on purpose. Configs that already carry either variable keep it untouched; `/effort max` still works per session.

### Internal

### Upgrade notes

- **No database schema change** (still 20).
- **Preset changes only affect newly added providers**: existing MiMo providers in Hermes / OpenClaw keep their model, existing OpenCode Go providers keep their old "Get API Key" link, and existing Claude providers do not gain `CLAUDE_CODE_AUTO_MODE_SERVER` — tick the new toggle to add it.
- **4.0 preview builds do not update themselves to 4.0.3.** The in-app updater only follows stable releases; download 4.0.3 from its release page.

## [4.0.2] - 2026-10-06

Fixes on top of the 4.0 previews: Claude Code on a ChatGPT account (through the Codex OAuth bridge) no longer breaks with a 400 on its next reply, a `model_catalog_json` left in Codex's `config.toml` no longer hides model mapping or aggregated models, and the time MCP preset starts again. In Claude Code's Aggregation mode, `/model` lists just the aggregated models instead of opening with four identical rows, and a running Claude Code picks up aggregation changes without a restart. MCP servers can now be synced to Pi 1.0, which moves the database schema to 20. After an update, a short dialog now lists what changed in the versions in between. The provider form follows the tab it was opened from, the full Codex form gets the fetched-model picker in its model mapping table, and provider icons with their own background fill the icon box.

**Stats**: 15 commits | 94 files changed | +2,894 insertions | -659 deletions

### Added

- **Sync MCP Servers to Pi 1.0** (#7862 by Owlbay, co-authored by LystranG): Pi 1.0 ships built-in MCP with a user-level `<Pi agent dir>/mcp.json` in the same `mcpServers` shape as Claude Code and MiniMax Code, so Pi is now an MCP app instead of being marked unsupported.
  - Writes replace only the connection fields (`command`, `args`, `env`, `cwd`, `url`, `headers`, `type`); Pi's own fields (`enabled`, `timeout`, `description`, `exposure`, `toolExposure`, `oauth`, `auth`) are kept as Pi wrote them.
  - Unticking Pi marks the entry `enabled: false` instead of deleting it, so ticking it again restores Pi's settings; a missing entry is rebuilt from the Pi fields saved at import. Deleting the server in CC Switch removes the entry.
  - What Pi refuses is refused up front: the SSE transport, names outside `[A-Za-z0-9_-]`, and names that collide once `-` and `_` are folded. The file and database are left untouched on refusal.
  - Like MiniMax Code, the file is written first and the database committed after, restoring the file if the commit fails; a full resync never deletes same-name entries CC Switch does not manage.
  - Import maps `streamable-http` to `http`, leaves `enabled: false` entries unticked, and skips same-name entries whose connection differs.
- **A Short Summary of What Changed After Updating**: The in-app updater only follows stable releases and its manifest notes just say "Release vX", so users jumping between stable versions never saw what the versions in between changed, and the full release notes are too long for a popup.
  - Each version gets `src/whats-new/<version>.json`: up to 4 one-line items (new / fix / improve) in zh, zh-TW, en and ja, bundled into the app at build time. `"items": []` marks a version that should not pop up.
  - On the first launch after an update, a dialog lists every non-empty version between the last one seen and the current one, newest first; versions beyond the first three are collapsed. Each version links to its page in the website changelog.
  - The last seen version is stored per device in `settings.json` (`whatsNewSeenVersion`) and only moves forward, so a downgrade and re-upgrade does not repeat anything. Without a record, only the current version is shown; with nothing to show, the version is recorded silently.
  - The dialog waits for the welcome and new-layout dialogs, and confirming either of them also records the current version, so a 3.x user does not get two dialogs in a row.
  - Settings > About gets a "Recent updates" button to open the summaries again, starting from 4.0.0.
- **Pick Fetched Models Into the Codex Model Mapping Table**: In the full Codex form, fetching models only added a small dropdown arrow beside each row's model field, and nothing visible at all when the table was empty.
  - Once models are fetched, the model mapping section shows the same searchable picker as the Aggregation layout. Picked models become rows named after the model ID, with the context window and reasoning levels filled from presets and models.dev; the per-row dropdown stays for swapping one row's model.
  - The add buttons next to "Fetch models" (Codex model mapping and model list, Claude Code Aggregation model list, OpenCode model list) are renamed to "Add manually", and the picker's "Add selected" button is neutral so Save stays the only solid button on the form.

### Fixed

- **`/model` in Claude Code's Aggregation Mode Opened With Four Identical Rows**: All four model tiers point at the default provider's first model, and Claude Code keeps its built-in Opus / Sonnet / Haiku rows (plus Fable once its tier is set) above the discovered models, so the picker opened with four rows for that model and its own discovered row was deduplicated away. Dropping the tier variables does not hide those rows; they fall back to `claude-opus-5-5` and friends, which would go upstream as is.
  - Aggregation mode now writes a top-level `modelPicker` to `settings.json` with `replaceBuiltInOptions: true` and one row per aggregated model (Stack id, display name, "<upstream model> · <window>"), so the picker shows Default plus these rows only. The four tier variables are still written, since Default, `--model opus` and subagent aliases resolve through them.
  - `modelPicker` is a Claude top-level key field: Aggregation writes the list, routing and direct leave none. A picker set by hand is not kept, the same rule as Codex's `model_catalog_json` pointer.
  - `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY` is no longer written; a value written by an older contract is removed on the next rewrite like any other exclusive field, and a user's own value is left alone. The contract digest includes top-level fields only when there are any, so routing contracts are unchanged.
  - Checked against Claude Code 2.1.287 with an isolated config directory and a fake gateway. Needs Claude Code 2.1.243 or later (see Upgrade notes).
- **Many Reasoning Levels Stretched the Codex Model Catalog**: Each catalog row is its own grid whose `1fr` tracks could not shrink below their content, so a long levels label widened its own row and the rows stopped lining up with the header. The templates now use `minmax(0,1fr)`. The trigger label collapses runs of three or more adjacent levels into "first → last" ("low → max", "none, low → max"), never across a skipped level; hovering or focusing it lists every picked level and the default one.

- **Claude Code on a ChatGPT Account Broke With `400 Unknown parameter: 'input[N].status'`** (#7876 by Lu Chong; fixes #7875): The Claude-to-Responses bridge carried the backend's reasoning output item verbatim inside the thinking signature and replayed it into `input` unchanged. Since 2026-10-03 the official Codex backend adds `status` to reasoning output items and rejects it on input, so every conversation broke on its next replay. Both sides of the envelope now keep only `type`, `id`, `summary` and `encrypted_content`; filtering on decode also recovers envelopes already saved in client histories, with no user action.
- **A `model_catalog_json` Written by Another Tool Hid Codex Model Mapping and Aggregated Models**: A `model_catalog_json` in `config.toml` that no provider owned was never touched, and CC Switch skipped writing its own pointer while it was there. A pointer written by another Codex switcher, or left by an older version, could keep the generated catalog from taking effect, with no warning at all in direct mode, and a pointer written by hand was removed again by the next write.
  - The pointer is now a plain key field and follows the target provider like `model` does: the provider's own pointer if its config has one, otherwise CC Switch's catalog when one is generated, otherwise none. Whatever `config.toml` held before is replaced.
  - When the routed provider's own config points at another catalog, the aggregation warning offers "Use CC Switch's model catalog", which removes that pointer from the row and rewrites Codex even when the contract is unchanged.
  - The provider editor no longer stores a pointer it only carried over from `config.toml`. Saving a card as is used to turn the user's global pointer into that card's own pointer (seen on the seeded OpenAI Official card).
- **The Time MCP Preset Exited on Start** (#7863 by Owlbay; fixes the time part of #4663): The preset ran `npx -y @modelcontextprotocol/server-time`, which does not exist on npm (404), so clients reported the connection as closed. It now runs the official PyPI server with `uvx mcp-server-time`, like the fetch preset. Servers already added from the old preset keep their command and need to be edited by hand.
- **Usage Range Picker Showed a Gray Box Inside the Orange Outline** (#7864 by Allen Xu): The active start/end card has a single orange outline, clicking into the date and time inputs no longer adds another ring, and the fields sit 12 px below the preset row.

### Changed

- **Claude Code Picks Up Aggregation Changes Without a Restart**: Aggregated models used to reach Claude Code through gateway discovery, which only runs at startup, so the UI asked for a restart after every change. With the models written into `settings.json` as `modelPicker`, a running Claude Code picks up added and removed models, a new default and window changes on its own. The Claude Code restart toasts and notes are removed (`useStackModelsChangedHint` included); adding or removing an aggregated provider now says it takes effect right away, and the Aggregation setting's description says only Codex needs a restart. Codex still reads its model catalog only at startup, so its hints stay.
- **The Provider Form Follows the Tab It Was Opened From**: The add and edit forms chose the Aggregation layout from the mode the app was actually in, with a link to toggle between the simple and the full form. Claude Code and Codex now use the simple form only when opened from the Aggregation tab (without a tab, as from the tray, the actual mode decides as before); the toggle link is removed, and the dialog header reads "<app> (Aggregation mode)" while the simple form is in use.
- **Provider Icons With Their Own Background Fill the Icon Box**: Icons that carry a solid background (88API, Qiniu, CherryIN, ...) used to sit as a small square inside the bordered box. A shared `ProviderIconBox` now draws the provider card, the name field's icon button and both preset lists: 28 icons marked `shape: "tile"` fill the box (clipped to its radius, with an inset ring so white tiles keep an edge), and transparent logos grow to a shared 22 px. Icons with wide transparent margins are cropped to their content, Xiaomi MiMo uses its official two-line wordmark on a black tile, and FennoAI's webp with a baked-in checkerboard is replaced by a transparent PNG.

### Internal

- **Release Gate for the Summary Files**: `release.yml` first requires the tagged version's `src/whats-new/<version>.json` and validates every bundled summary with the unit test before any build job starts, since a malformed item would crash the dialog and put the whole app on the error screen.
- **Tests**: The Pi DeepSeek preset is pinned to declare image input for `deepseek-flash` and keep `deepseek-v4-pro` text-only (#7865 by Allen Xu; refs #7859).

### Upgrade notes

- **Claude Code's Aggregation mode needs Claude Code 2.1.243 or later**: The `modelPicker` setting was added in 2.1.243. Earlier versions ignore it, and with gateway discovery no longer turned on, `/model` lists none of the aggregated models; the default model still works, and others can be picked with `/model <id>`.
- **Database schema 19 → 20**: Adds `mcp_servers.enabled_pi` (default 0), so upgrading writes nothing to Pi until a server is ticked. Once 4.0.2 has opened the database, 4.0.1, 4.0.0 and 3.x refuse it as "database version too new"; the pre-migration copy is saved under `~/.cc-switch/backups/` (`db_backup_*`).
- **4.0 preview builds do not update themselves to 4.0.2.** The in-app updater only follows stable releases; download 4.0.2 from its release page.

## [4.0.1] - 2026-10-05

Fixes on top of the 4.0.0 preview: Gemini CLI sessions written in the newer JSONL format show up again, OpenCode offers thinking variants for reasoning models added through CC Switch, an upstream rejection is no longer reported as an output-token limit, the Grok Build key link opens the preset's sign-up page, Codex config directories inside WSL no longer stall startup and the Sessions page, and the sidebar toggle animates at the display's refresh rate, with a few small UI touches. The release pipeline is rebuilt to build macOS architectures in parallel and to fail fast instead of shipping an incomplete update manifest.

**Stats**: 20 commits | 47 files changed | +1,958 insertions | -624 deletions

### Added

- **OpenCode Offers Thinking Variants for Reasoning Models**: OpenCode generates thinking variants (Ctrl+T) only for models whose `capabilities.reasoning` is true, and falls back to models.dev only when the provider key matches a models.dev provider. CC Switch writes custom provider keys, so preset and fetched models never got any variants.
  - A fetched model known to reason (from its preset row or models.dev) gets `reasoning: true`. `false` is never written, since it would shadow models.dev.
  - Reasoning-capable models in the OpenCode presets are marked, cross-checked with models.dev. Non-reasoning models, router (`auto`) and mixed entries are skipped, and so is LongCat 2.0, whose preset turns thinking off.
  - OpenCode derives the variants itself; CC Switch does not hardcode effort tables that drift between OpenCode releases.
- **Help Tip for "Skip Claude Code Onboarding"**: The setting's help popover now says what the toggle does: it writes or removes `hasCompletedOnboarding` in `~/.claude.json`.

### Fixed

### Performance

- **The Sidebar Toggle Animates at the Display's Refresh Rate** (#7860 by Allen Xu): The sidebar and content area are laid out at their final widths once, and the moving edge is drawn by a cover panel sliding on a 200 ms transform animation, so the toggle no longer runs at WKWebView's ~60 fps main-thread rate. Interrupting a toggle continues from the current edge; auto-collapse on window resize and `prefers-reduced-motion` skip the animation. This replaces the width transition from #7845.

### Internal

- **Release Pipeline Rebuilt**: macOS compiles aarch64 and x86_64 on separate runners and merges them with `lipo`, so a notarization retry re-runs only the bundle and sign step instead of recompiling both. HTTP 401/403 from Apple stops the job at once (an expired developer agreement cannot be fixed by retrying; v4.0.0 rebuilt twice more and hit the job timeout). A missing updater signature on any of the six platforms now fails the build before the release is created, instead of silently leaving that platform out of `latest.json`. Windows x64 builds only the MSI, the signing-key preparation is a shared composite action, and `workflow_dispatch` runs a full signed and notarized dry run without publishing.
- **Release Builds Use 16 Codegen Units**: The main crate compiles about 64% faster for a binary about 17% larger; thin LTO and `opt-level = "s"` are unchanged.
- **CI**: Jobs install the toolchain pinned in `rust-toolchain.toml` instead of downloading stable first. Backend tests run under `cargo nextest` (per-test 180 s timeout, no fail-fast, per-slot test homes for integration tests) with `Swatinem/rust-cache`. Pushes to main are path-filtered like pull requests, with a weekly full run to rebuild caches. The WSL2 nightly runs the lib suite with 9P-aware skips and passes again. Two clippy lints in test code are fixed so `cargo clippy --all-targets -- -D warnings` passes.

### Upgrade notes

- **4.0.0 preview builds do not update themselves to 4.0.1.** The in-app updater only follows stable releases; download 4.0.1 from its release page.

## [4.0.0] - 2026-10-04

This is a very large release. The core is a ground-up rewrite of how CC Switch writes client config files: Claude Code, Codex, Gemini CLI, Grok Build and Claude Desktop are now switched by replacing only key fields (endpoint, credential, model, protocol) through one crash-safe write engine, with a per-app direct / routing mode kept in a device-local `live-state.json` and no more live-file backups. Hooks, plugins, MCP servers and everything else in your client files stay in place: TOML and dotenv files keep their untouched lines byte for byte, JSON files keep every other key, value and order. On top of that comes a new Aggregation mode (code name Stack), which publishes models from several providers in one Claude Code or Codex model picker. The whole UI is redesigned (v7 sidebar shell with global pages, a Direct / Routing / Aggregation mode layer and a rebuilt tray, then the v8 pass with the orange theme colour and virtualized lists), and the usage dashboard and session reader are rebuilt. Around them sit local-routing protocol fixes, models.dev metadata fill for fetched models, new presets and pricing rows, and tool-lifecycle and Codex MCP fixes. The database schema stays at 19, but client files and device-local state change enough that the upgrade notes carry explicit downgrade steps.

**Stats**: 198 commits | 780 files changed | +144,579 insertions | -60,810 deletions

### Added

### Changed

### Fixed

- **Quitting With Cmd+Q, Dock "Quit" or Logout Left Clients Pointed at the Stopped Proxy** (broken in v3.20.4): macOS sends these through `applicationWillTerminate`, which Tauri reports only as `RunEvent::Exit`, never `ExitRequested`, where the cleanup ran. Claude Code, Codex, Gemini CLI and Grok Build stayed pointed at the local proxy until CC Switch started again. The cleanup now also runs on `RunEvent::Exit`, spawned onto the async runtime with the main thread waiting up to 8 s so a step needing the main thread cannot hang the quit. Restart requests also end in `RunEvent::Exit`, so they are flagged and skipped.
- **Claude Desktop Mapping Cards No Longer Leave the Routing Service Running**: Switching away from a mapping card (main switch, tray click, project apply) stops the service when nothing else uses it; switches that never involved a mapping card leave it alone, so a service started by hand keeps running.
- **Database Never Shrank After Pruning** (broken in v3.20.4): `PRAGMA incremental_vacuum` releases one page per result row only while stepped, and `execute_batch` stepped it once, so startup cleanup and periodic maintenance reclaimed a single page. `Database::incremental_vacuum_on_conn` now drains every row.
- **Codex Sessions Under the Official Proxy Route Stay in the Same History Bucket as Direct Use**: Codex groups sessions by `model_provider` in `config.toml`, and with the official provider as route CC Switch wrote `model_provider = "cc-switch-official"`, a third bucket apart from official (`openai`) and third-party (`custom`) history that vanished when the route moved. The official route now keeps the direct-use id. With unified session history off, no `model_provider` is written and a top-level `openai_base_url` points the built-in `openai` provider at the local proxy (updated in place, a leftover custom table kept dormant); with it on, the custom official mirror table points at the proxy with websockets off. Toggling the setting while routed officially rewrites the client, and `cc-switch-official` is no longer written. `openai_base_url` is written only for this route and only with the local proxy address; direct third-party routes never use it.
  - The proxy answers GET on Responses paths with 426 (the built-in provider tries WebSocket first and falls back at once on 426), and strips the built-in `version` header from third-party requests.
  - `live_has_proxy_placeholder` also recognizes a config routing the official provider to the configured proxy address (port must match), so other local gateways are not mistaken for leftover takeover state.
- **GPT Models in the Codex Model Catalog Keep Their Official Prompts and Capabilities**: Once `model_catalog_json` is set Codex knows only the models in that file, and v3.20.4 built third-party GPT rows from a neutral template (or on ProxyChat a `gpt-5.5` clone regardless of name), so GPT models lost their harness prompt, freeform `apply_patch` and reasoning levels. Rows now look up Codex's bundled official list with Codex's own matching rule (longest prefix, then one simple namespace segment, case-sensitive) and mirror the matched entry verbatim (a narrower relay window goes in `model_context_window`). Anthropic rows and the DeepSeek vendor catalog are unchanged, Aggregation members get the same entries under prefixed ids.
- **Switching Codex With a Native ChatGPT Login No Longer Logs a Spurious Warning**: The ownership check logged "Failed to read Codex managed OAuth auth marker ... file does not exist" on every switch and token lookup, though no marker is the normal state. It now checks existence first; an existing but unreadable marker still warns.
- **"Save and restart service" in Routing Settings Now Restarts the Service, Applies Logging Live, and No Longer Touches Per-App Retries or Timeouts**: In v3.20.4 the global save only ran an `UPDATE` on `proxy_config`, so a new listen address or port took effect at next launch while attached clients pointed at the old port, and logging did not apply live. The four global fields now go through `ProxyService::update_global_config`; the service restarts on change, attached routes are resynced and Claude Desktop's mapping gateway profile is rewritten. If the restart fails to bind, the previous config is written back and the server restarts on it, so a failed save changes nothing.
- **Codex Official-Route Replies Without a `Content-Type` Are Now Streamed**: chatgpt.com's `/backend-api/codex/responses` sends SSE with no `Content-Type`, and `process_response` decided streaming from the content type alone, so every official-route turn in routing mode was buffered: no live output until the turn ended (50-100s), usage logged with zero tokens and `is_streaming=0`, and the Codex session-log import (which dedups by token counts) inserting a second "Codex (Session)" row. A 2xx reply is now a stream when the request asked for one and the upstream sent no `Content-Type` at all; a declared type still wins (a gateway labeling JSON `text/plain` stays buffered so usage keeps parsing).
- **MiniMax Native Responses Tool Calls No Longer Fail With "failed to parse function arguments"**: After a long history MiniMax sends `function_call_arguments.done` and `output_item.done` with empty `arguments`, then one delta with the full JSON, and Codex settles the call on `output_item.done`. On the native Responses passthrough to non-official upstreams, a function call's end events are held while arguments are empty and released at the next non-argument-delta event, filled from accumulated deltas or `response.completed`; a delta from any call is forwarded without releasing the others. The trigger is the protocol violation, not a vendor name, so relays forwarding MiniMax's stream are covered. Well-ordered streams pass byte for byte and requests are untouched, so prompt caching is unaffected.
- **Inline `<think>…</think>` and `<thinking>…</thinking>` Blocks Are Split Into Reasoning on the Claude and Codex Chat Paths** (#7741 by 小七; fixes #7722, #7271): Chat-compatible upstreams (DeepSeek-style models, MiniMax M3) can inline reasoning at the start of `content`; the Claude path passed it through as text with the tags and the Codex path knew only `<think>`. One shared splitter (`proxy/providers/inline_think.rs`) serves both paths, streaming and not: both tag pairs, mismatched pairs and tags split across SSE chunks are handled; reasoning is emitted per delta with only a possible close-tag tail held back; held content is flushed at every boundary (tool calls before the tool block opens, `finish_reason`, `[DONE]`, EOF, stream errors).
- **A Responses Stream Delivering Output Only in the Terminal Event Keeps Text Ahead of the Web-Search Result** (#6509 by Allen Xu, follow-up to #5681): Such streams (output only in `response.completed` / `response.incomplete`) go through the established Responses JSON conversion, a missing terminal status falls back by event name matching the incremental path's stop-reason mapping, and terminal-only `function_call` items no longer yield `stop_reason: tool_use` without a `tool_use` block.
- **`/effort` Reaches Every `grok-4.x` Model From 4.5 Up** (#7369 by Sailing Loong, co-authored by allenxu09): Verbatim `grok-4.5` / `grok-4.6` entries in `supports_reasoning_effort` become a rule parsing the minor version and accepting `x >= 5` (mirroring the GPT-5+ rule), so `grok-4.7` (released 2026-09-21) no longer loses its effort on the Claude→Chat, Claude→Responses and Codex Responses→Chat paths. `grok-build-*` stays whitelisted, plain `grok-4` stays excluded.
- **`/effort max` Preserved on `gpt-6-sol` and `gpt-6-luna`** (#7662 by 2doright): The max-capable whitelist of #7531 predates them, so explicit `max` was downgraded to `xhigh`; both list `max` in OpenAI's docs and the Codex catalog and are added.
- **The Claude→Codex OAuth Route Advertises Codex 0.159.0, So `gpt-6-sol`, `gpt-6-luna` and `gpt-6.1-sol` Are Accepted and Listed** (#7597 by RemindZ, #7806 by Sailing Loong; fixes #7651, #7797): v3.20.4 sent client version 0.153.4, below ChatGPT's per-model gates, so the backend answered HTTP 400 "model is not supported when using Codex with a ChatGPT account" and discovery omitted them. The identity went to 0.155.0 (Sol/Luna floor), then 0.159.0, the exact observed floor for `gpt-6.1-sol` (listed only from `client_version` 0.159.0, above its advertised `minimal_client_version` 0.153.0), deliberately not the latest release to avoid opting into newer version-gated behavior.
- **Model-List Fetch No Longer Fails on a Differently-Shaped Top-Level `models` Field** (#7595 by 7TEN7; fixes #7593): v3.20.4 deserialized `models` as `{slug}` entries (Zhipu's Responses format), so a provider also sending OpenAI-shaped `models` (`{id, ...}`) failed with "missing field `slug`" and was reported "not supported". `models` is now raw JSON with ids extracted slug-first then `id`; non-array, non-string and empty values are skipped, and `data` stays preferred.
- **Output TPS No Longer Spikes to Thousands When an Upstream's First Event Has No Usage** (follow-up to #3369): `first_token_ms` was stamped on the first event the usage collector accepted, so when an opening event carried no usage key (Responses passthrough on `response.created`, Chat passthrough with usage only on the final chunk) the first accepted event was the terminal one, the generation window shrank to milliseconds and TPS hit the thousands. The first output is now marked on every SSE data line independent of the usage filter, skipping metadata events (`response.created`, `response.in_progress`, `ping`, keepalive). On the frontend TPS is hidden when the generation window is under 100ms, which also cleans earlier rows.
- **Claude Subagent Replies No Longer Stay Under-counted in Output Tokens**: Claude Code writes subagent transcripts block by block, every block but the last carrying the interim output count (often single digits) with no `stop_reason`; a sync between two blocks imported the interim count and the final block was dropped by `request_id` dedup. A stored reply is now refreshed when a later block reports more output tokens, rewriting tokens and costs; if the completed usage matches a row the routing service logged for the same request, the session-log row was a duplicate and is removed.
- **OpenCode 2.x Usage Is Imported Again** (#7541 by zhengkaics; fixes #7529): OpenCode 2.x stopped writing the V1 tables, so the collector imported nothing on upgraded installs. V2 is detected only when both `session_v2` and `session_message` exist, assistant rows and completed compaction rows are imported, and V1 rows migrated into V2 keep their ids so `request_id` dedup prevents double counting.
- **Opening a Hermes Session No Longer Fails With `no such column: created_at`** (supersedes #6694 by h6rime): The `messages` table stores `timestamp` (REAL epoch seconds), not `created_at`. The reader now follows Hermes' own display projection: columns are chosen by what the store has (older `state.db` still loads); live plus compaction-archived rows (`active = 1 OR compacted = 1`) show while rewound or regenerated rows stay hidden; copies re-inserted by compression collapse by display identity (role, content, timestamp, `tool_call_id`, `tool_calls`, `tool_name`); Structured content decodes to text and tool calls render as `[Tool: name]`.
- **OpenCode Imports and Live Writes No Longer Drop Provider Fields Outside the Typed Model** (#7577 by Bryan Nie; refs #7382): Round-tripping through `OpenCodeProviderConfig` silently dropped `api`, `env`, `whitelist` and `models.<id>.limit.input`. The original provider JSON is now persisted and written, with the typed config used only for validation and the display name; the lossy `get_typed_providers`/`set_typed_provider` helpers are removed.
- **Adding or Importing a Prompt No Longer Empties a Hand-Written Prompt File**: Saving any disabled prompt emptied the app's prompt file whenever none was enabled, wiping a hand-written `AGENTS.md` or Hermes `SOUL.md` without a backup (a deeplink import lost the file before `enable_prompt` could back it up). Following the MiniMax Code branch, the previous row is read first and the file is cleared only when that prompt was enabled, is now disabled and no other is enabled (disabling the last enabled prompt still empties the file).
- **Skill Sync No Longer Deletes Directories Inside OpenClaw's `~/.openclaw/skills`**: OpenClaw has no Skills support, yet `sync_to_app` walked its directory and deleted real directories whose names matched a managed skill, on every provider switch. OpenClaw is skipped alongside Claude Desktop and Pi, and all three are left out of resync results.
- **One Bad MCP Server No Longer Stops the Rest From Syncing** (co-authored with AnxForever): Projecting an app's MCP servers stopped at the first server that could not be written or removed, leaving later ones unwritten or still in the client config. Each server now syncs independently, and failures are logged and reported together at the end, grouped by identical reason.
- **MiniMax Code Empty-State Text No Longer Points to a Missing Import Button**: MiniMax Code intentionally has no "Import Current Config" button (like Pi), yet the empty list asked users to click it. It now has its own empty-state title and description in four locales, and Pi and MiniMax Code use their own text namespaces in `ProviderEmptyState`.

### Performance

- **Usage Dashboard Queries No Longer Freeze the Window** (contributed by Owlbay): The usage read commands (summary, trends, provider/model stats, request logs and detail) run through `spawn_blocking`; as sync commands they ran on the Tauri main thread and froze the window during wide scans. Session/proxy dedup picks a strategy per window (skipped when either side is empty; when proxy rows are the minority, duplicate session rows are found once via `rowid NOT IN`), taking a full scan on a session-heavy database from about 0.19s to 0.05s. The request-log total is cached per filter until a write or 60s.
- **Toggling the Sidebar No Longer Re-renders and Reflows the Page** (#7845 by Allen Xu): The collapsed state and the Cmd/Ctrl+\ shortcut move from `App` into `Sidebar`, so a toggle re-renders only the sidebar. During the 200 ms width transition the content area's children are pinned to the collapsed-sidebar width, so ResizeObserver-driven content (usage chart, virtual lists, tab indicators) lays out once at the end instead of every frame (skipped under `prefers-reduced-motion`), and `useSlidingIndicator` no longer sets state when the measured rect is unchanged.
- **Usage Stats Keep the Previous Numbers While Filters or Range Change**: Summary, trend, provider/model stats and request-log queries now use `keepPreviousData`, so a new filter, range or page no longer flashes the hero metrics to an ellipsis, spins the trend chart or collapses the log to its skeleton (which could toggle the scrollbar).

### Security

- **Shared Config Can No Longer Spread Provider Credentials or Key Fields** (broken in v3.20.4): The Claude Code common-config snippet could carry a provider's custom auth header (`*_CUSTOM_HEADERS`, `HEADERS`, keys containing `COOKIE` or `AUTHORIZATION`) or key fields (`ANTHROPIC_*`, the `CLAUDE_CODE_USE_BEDROCK/VERTEX/...` selectors, `AWS_*`, Vertex regions, top-level `model`/`apiKeyHelper`/`fallbackModel`) to every other provider, so switching from Bedrock to the official provider could keep Claude Code on Bedrock. These are now treated as never shareable, and with key-field switching the snippet is frozen and no longer merged on switch at all (see Changed).
- **Live Files Holding Keys Are Written Owner-Only**: Codex `auth.json` and `config.toml`, Claude Code `settings.json` and Grok Build `config.toml` are written 0600 (new files used to follow the umask, 0644); existing 0600 files are never loosened, and the Claude Desktop gateway profile is owner-only too.
- **AWS Bedrock (API Key) Preset Stores the Key Where Claude Code Reads It**: New cards keep the key in `env.AWS_BEARER_TOKEN_BEDROCK`; the key field and proxy read it too, and existing rows with a top-level `apiKey` keep working and are edited in place. The E-FlowCode and PIPELLM presets no longer ship personal preferences (`personality` on Codex E-FlowCode, `includeCoAuthoredBy`), and a preset scan keeps preference keys out of Claude and Codex presets.

### Internal

- **Golden Tests Lock Live-Config Behavior**: `cargo test --test golden` (snapshots in `src-tauri/tests/golden/snapshots`, refresh with `CC_SWITCH_UPDATE_GOLDEN=1`) pins MCP projection bytes, raw rows from deep-link and first-run import, file modes, Claude key fields across third-party, Bedrock, Vertex, `apiKeyHelper` and official providers, and 25 Codex invariants (config loads on Codex 0.149, the official login never reaches a third-party URL, refused switches leave files, current provider and rows untouched). A frontend golden test covers ProviderForm payloads for ten Claude and Codex presets.
- **Shared Helpers and Dead Code Removed**: Three-way conflict resolution (`ConflictPolicy::resolve`) and `JsonChange` are shared between editors, Codex/Grok TOML helpers move to `editor_toml.rs`, every engine write starts through `AppWrite::begin` (lock plus pre-write recovery check), and the request path passes the already-resolved provider to the router. Dead code (the common-config merge chain, `ProxyService::start_with_takeover`, the `sync_current_providers_to_live` family, the downgrade golden test and the Codex/Grok whole-file proxy writers) is removed.
- **Retry-Loop Bookkeeping Extracted**: `forward_with_retry_inner` moves breaker, status, in-use and failover-switch updates into `note_attempt`, `finish_success`, `record_provider_failure`, `finish_neutral_failure` and `record_failed_request`, covered by characterization tests against a scripted upstream. No behavior change.
- **Request Detail Lookup Fixed Before It Shipped**: The v7 redesign wired row clicks to the request detail panel (unmounted in v3.20.4), exposing `get_request_detail` failing with "ambiguous column name" on every lookup (`created_at` and about a dozen columns were unqualified across the `proxy_request_logs` / `providers` join). Columns are now qualified with a regression test, and the panel shows an error notice with retry on failure.
- **Shared models.dev Query and Committable Ref Helper**: `modelsDevQueryOptions` is exported so the metadata fill hook and both usage pricing dialogs share one query (including the one-hour `gcTime` the prefetch needs; the query key becomes `["models-dev"]` because the cache now holds the raw catalog), and a `useCommittableRef` hook replaces a repeated pattern in four forms. The Claude preset test now expects 73 rows.

### Upgrade notes

- **No database migration**: `SCHEMA_VERSION` stays 19 (same as v3.20.4), and settings keys, `ProviderMeta` and `AppSettings` only gain fields, so v3.20.4 opens the database. The risk of going back is in client files and device-local state, not the database.
- **Device-local state**: `~/.cc-switch/live-state.json` (per-app mode, attached flag, proxy route, contract, Aggregation list and key registry, pending operation, Grok write record), `codex-catalog-history.json`, the Codex login stash `~/.cc-switch/codex-login-stash.json` and first-write backups under `~/.cc-switch/backups/live-first-write/` are not synced and not read by older versions. Legacy takeover state is migrated on first launch: `proxy_live_backup` rows go to `~/.cc-switch/backups/proxy-live-backup/` and are deleted from the database.
- **What users notice after upgrading**:
  - **Switching** no longer copies live edits into the provider you leave or wipes shared settings. A model or reasoning effort chosen in the client (`/model`, Codex `model_reasoning_effort`, Gemini `GEMINI_MODEL`) resets to the provider's value when you switch away and back; to keep one, add it to the provider through the editor.
  - **Provider-exclusive fields** follow the card and are removed on switch-away only if live still holds that card's value. A Bedrock or Vertex provider whose selectors lived only in the shared snippet may need them re-entered once.
  - **Restarts**: Codex, Gemini CLI and Grok Build need a restart after a switch that changes the model (Gemini CLI now shows the notice too).
  - **Routing and editors**: Entering routing no longer backs up your config and leaving writes the direct provider back (the only backup is the first-write copy). The Claude, Codex and Gemini snippet editors and the Gemini explainer dialog are gone. Claude Desktop mapping providers start the local routing service on their own.
  - **UI and settings**: The first launch shows a one-time "new layout" dialog (fresh installs never see it). Usage, Accounts, MCP, Skills, Prompts and Sessions are sidebar pages, tool install and upgrade moves from About to the Apps page, settings are regrouped, and the connectivity-check Advanced settings are gone with built-in defaults. Session project groups start collapsed (the old `collapsedProjects` value is ignored and left in place, so downgrading restores it).
- **Aggregation is opt-in**: Nothing changes until the Aggregation switch is on, and only for Claude Code and Codex; turning it on first sends the other proxied app back to direct. After an Aggregation list change, restart Claude Code, restart the Codex daemon from the banner, and quit and reopen the Codex desktop app and editor extensions.
- **Catalog and session-history fixes need one re-switch**: The GPT catalog mirror and the official-route `model_provider` id are rewritten the next time CC Switch writes the Codex config, so on existing setups switch the provider or toggle the route once. Sessions already recorded under `cc-switch-official` stay in their old bucket and are not migrated.
- **Presets apply only to newly created providers**: E-FlowCode and PIPELLM preference removal, dropped Claude timeout/telemetry keys, the Bedrock key location, Command Code, 88API, Tu-zi, Zhipu `glm-5.3-flash`, refreshed model rows, Kimi invite links, the new preset icons and the ETok removal affect new providers only; stored cards keep what they have (add rows to the card's catalog or re-add the preset). Providers created from ETok presets keep working (the `etok` icon stays). New MiniMax Code providers use a key you type; earlier ones keep their UUID.
- **Pricing and usage backfill boundaries**: New pricing rows use `INSERT OR IGNORE`, so a same-id row you added is kept. The startup backfill re-prices history under the new ids only when recorded cost is $0 and tokens exist; non-zero costs (including `mimo-v2.5` and `o3-mini` under old prices) are not recomputed. Session-log rows imported earlier keep latency 0, subagent rows imported with an interim output count stay short, zero-token official-route rows and duplicated "Codex (Session)" rows are not repaired, and earlier TPS spikes are hidden by the 100ms rule but not rewritten. Non-streaming requests and proxy rows without a first-token time no longer show a speed (v3.20.4 divided by the full duration). models.dev sync defaults on only for fresh installs and pricing files without `autoSyncEnabled`. Metadata fill is form-time: re-pick a model to get its fields.
- **MCP, prompts and tools**: Existing `type` lines under `[mcp_servers.*]` in `~/.codex/config.toml` (and entries carrying the other transport's fields) are removed on the next MCP sync; re-sync once to clean an already-broken file. A prompt file already emptied by the old behavior is not restored. If both `opencode.jsonc` and `opencode.json` exist, CC Switch now uses only `opencode.jsonc` (v3.20.4 read only `opencode.json`) and leaves `opencode.json` as is, so providers kept only in `opencode.json` no longer show up. CLIs the Apps page reports as unmanaged (winget, Scoop, Nix, manual native binaries) are skipped rather than reinstalled through npm. After "Save and restart service", clients on the old port are repointed, so expect a brief interruption on a listen-address change.
- **Downgrading to v3.20.4 needs these steps, in this order**, because the old version has several paths that rewrite client files from the current row plus the old snippet without reading live first, and it replays takeover state it finds:
  1. In the new version, leave Aggregation mode and stop routing so every app is in direct mode (client files then carry no `ccs-` ids or proxy-pointing `openai_base_url`).
  2. Switch Codex back to its official card once, so the native ChatGPT login is restored from the stash. The old version does not read `codex-login-stash.json`, so otherwise you must run `codex login` again.
  3. Quit CC Switch from the tray ("Quit"); on Windows, quit manually before running the installer.
  4. Back up `~/.claude/settings.json`, `~/.codex/config.toml` and `auth.json`, `~/.gemini/.env` and `settings.json`, and `~/.grok/config.toml`. The first-write backups in `~/.cc-switch/backups/live-first-write/` are the fallback.
  5. Install v3.20.4. Before using cloud sync, import, the plugin-linkage toggles or config-directory changes (all of which rewrite client files wholesale in the old version), check each switch-mode app's live file against the step-4 backup. Switching away and back once makes the old version re-extract the shared snippet from live, but only for Claude Code and Codex providers with "write to common config" on whose snippet was never cleared. Gemini CLI, Grok Build and other providers are written whole from their slimmed rows, so restore any global settings the old version drops from the backup.
  6. Test devices should use a separate sync profile or sync off; old and new versions share the same cloud snapshot with no version gate.
- **What breaks if you skip the steps**: If still routing, the old version sees the `enabled` mirror and re-takes over, and one hot-switch followed by exit permanently overwrites live settings made under the new version; downgrading right after a crash in routing mode makes it rebuild live from the current rows. A leftover `openai_base_url` from the Codex official route is not recognized, and Aggregation ids and catalog history mean nothing to it. Smaller effects: rows synced from an old device can drop `stackModels`, Gemini and Grok "slim" rows are written whole, estimated-speed rows lose the "≈" marker, and the routing-save, no-`Content-Type`, MiniMax empty-argument and Codex `type`-line behaviors return (Codex 0.158+ rejects `type` under `--strict-config`).

## [3.20.4] - 2026-09-22

Development since v3.20.3 adds a tenth managed app and a wave of contributed correctness fixes, most of them for Codex through the local proxy. MiniMax Code joins as an additive-mode app (#7383): providers are written into its native `~/.minimax/config.yaml` alongside MiniMax Code's own settings, with bidirectional MCP sync, Skills, an `AGENTS.md` prompt library, a read-only session browser with resume, and session usage in the dashboard, while model selection, login and session deletion stay with MiniMax Code. Claude Desktop 3P configuration now works on Linux, Flatpak builds included (#7331). On the proxy, Codex 0.154+ requests carrying an `additional_tools` item no longer 400 on strict Chat gateways, where the converter had turned it into a `content: null` system message (#7454), a single `detail: "original"` screenshot no longer breaks a Codex session for good (#7476), tools without a description are no longer sent as `null` (#7319, #7378), Claude Code's auto mode classifier works through GitHub Copilot (#5404), models mapped to Grok 4.6 get their reasoning effort again and `/effort xhigh` is no longer dropped (#7318), and `/effort max` stays `max` on GPT-5.6 and GPT-6 Astra instead of being lowered to `xhigh` (#7531). Two Codex account bugs are closed: editing or switching away from a Codex provider that authenticates through its own provider table no longer silently erases its stored API key (#7434), and cards still bound to a ChatGPT account removed from the Auth Center can be rebound or switched away instead of failing every switch, takeover toggle and startup restore (#7395). The request log shows output tokens per second (#3369), the OpenCode provider form can search and bulk-add fetched models (#7515), skills.sh skills whose id differs from their directory and repositories with more than 10,000 files now install (#6381, #7489), the enabled prompt picks up external edits to `CLAUDE.md`/`AGENTS.md` (#7194), OMO with a WSL-hosted OpenCode directory edits the unified config it actually reads (#7550), the About card's tool probes stop hanging on npm metadata and misreading the WSL MOTD as a version (#7346, #7348), and the Windows main window no longer drops out of the taskbar after a silent start (#6348). On the preset side, the domestic Codex presets are refreshed from a Responses API audit (Kimi For Coding on K2.8 Preview with a 1M window, DeepSeek defaulting to `deepseek-flash`), MiniMax CN and BaiLing move to their current official endpoints, AICodeWith's Codex-family endpoint is corrected to `/v1`, Claude Desktop offers the 1M variant on DeepSeek V4 routes, and a handful of presets are added (Kimi Global, FluxA Token Plan, Soshow and four Codex Responses presets). DeepSeek V4 Pro pricing returns to its peak list price after DeepSeek withdrew the V4.1 Flash cutover that v3.20.3 had priced in early, and five previously unpriced models get pricing rows. This release changes the database schema: `SCHEMA_VERSION` 18 → 19 adds an `enabled_mcode` flag to `mcp_servers` and `skills`.

**Stats**: 46 commits | 156 files changed | +8,673 insertions | -684 deletions

### Added

### Changed

### Fixed

- **Codex Requests With an `additional_tools` Carrier No Longer 400 on Chat Gateways** (#7454; fixes #7451, #6158; supersedes #6159): Codex 0.154 and later ship a request's extra tools (the `functions`/`collaboration` exec namespaces, plugins) in an `additional_tools` input item — `{"type":"additional_tools","role":"developer","tools":[…]}`, which has a role but no `content`. The Codex Responses-to-Chat converter treated every item with a role as a message and emitted `{"role":"system","content":null}` at `messages[1]`, which strict Chat gateways reject with `messages[1]: missing field "content"` (or `data did not match any variant of …SystemMessageContent`), and the tools inside the carrier were silently dropped on both the Chat and the Anthropic conversions. The carrier is now skipped in the message walk and its tools are collected through the same registry that already handles `tool_search_output` groups: they are deduplicated against top-level `tools` (the top-level declaration wins), namespaces are flattened (`functions` → `exec_command` becomes `functions__exec_command`), and names round-trip back to Codex on the response side. Requests without a carrier convert byte-for-byte as before. Deliberate boundary: `custom`-typed children inside a namespace tool (e.g. the grammar-format `functions.exec`) are still not lifted, since they need their own response-side name round-trip.
- **One `detail: "original"` Image No Longer Breaks Codex Sessions on Chat Gateways** (#7476; fixes #6495, #7458; supersedes #6515): When a model's Codex catalog entry advertises `supports_image_detail_original`, Codex marks tool-returned images (e.g. `view_image` screenshots) with `detail: "original"`, a Responses-only value. When that media was moved out of `function_call_output` for a Chat upstream, the value was copied verbatim into `image_url.detail`, and strict OpenAI-compatible Chat gateways (Ark/Doubao, SenseNova, GLM, vLLM, …) reject the whole request with 400 `invalid_request_error` on `messages.N.content`. Because Codex replays the full rollout on every turn, a single such image made the session fail permanently, plain-text turns included. The fix has two layers: the proxy downgrades `original` to `auto` in the Chat image part (`auto`/`low`/`high` pass through unchanged), so already-poisoned sessions and Codex versions before 0.155.0, which do not normalize replayed history themselves, recover immediately; and generated Codex catalogs for the Chat (proxy-conversion) profile now always write `supports_image_detail_original: false`, so Codex stops emitting `original` at the source. Native Responses and Anthropic catalog profiles and the bundled DeepSeek official catalog are unchanged. Top-level user images were never affected, because the Chat conversion drops their part-level `detail`.
- **Editing or Switching Away From a Codex Provider No Longer Erases Its Stored API Key** (#7434; fixes #7433; supersedes #7492): Some Codex providers declare their own credential source in the `[model_providers.*]` table (`env_key`, an `auth`/`aws` table, or an explicit `Authorization` header in `http_headers`). For these no bearer token is injected into `config.toml`, and default mode deletes the shared `~/.codex/auth.json` on every third-party switch, so the live snapshot is permanently `{ auth: {}, config }` and `auth.OPENAI_API_KEY` in the database is the only copy of the key. Two paths treated that empty live auth as authoritative — the edit dialog for the current provider, which seeds the form from the live snapshot, and the switch-away backfill, which writes the live snapshot back into the database row — so opening the editor and saving without any change, or just switching away, silently wiped the key, after which the usage-script dialog read the keyless card as an official subscription and reset its saved script. Both layers now treat a live auth with no credential (a missing `auth.json`, or only the `auth_mode` logout marker) as an absent field: they keep the stored auth and still capture the live `config.toml`. Live auth still wins whenever it carries material, which covers manual edits to `~/.codex/auth.json`, and official providers keep the live login as their source of truth. Whether a provider counts as official is now decided by official identity (`is_codex_official_provider` on the backend, `resolveCodexOfficialIdentity` in the dialog) rather than `category` alone, so a legacy fixed official card with no stored category still honors a logout instead of bringing back the old login on switch-back.
- **Codex Cards Bound to a Deleted ChatGPT Account Can Be Rebound or Switched Away** (#7395; fixes #7392): Removing a managed ChatGPT account in the Auth Center and logging in again creates a new local account id, even for the same ChatGPT user and workspace. A Codex card still bound to the old id then failed every route switch, takeover toggle, startup restore and rebind with `账号不存在: <id>`, because the switch-away step reconciles the outgoing account's live `auth.json` before writing and hard-failed when that account no longer existed — the user could neither move to another provider nor pick the new account on the same card. Switch-away preparation now tells a deleted outgoing account apart from an existing account that simply has no matching live token: a deleted account only releases its cc-switch ownership marker and leaves `~/.codex/auth.json` untouched, so a later native Codex CLI login of the same user is not deleted as if cc-switch managed it, and the target provider's normal write policy still applies. An account counts as deleted only after the persisted store `codex_oauth_auth.json` is verified; the switch is aborted with the live files unchanged, instead of guessing, when the store is unreadable or malformed (broken JSON, no `accounts` object, a version other than 1/2, keys that don't match `account_id`), when the store file is missing while accounts are still loaded, or when the account is still present on disk. When a card's own binding is stale, the error now tells the user to click Choose account on the provider card and rebind, instead of a bare not-found error — including in the already-taken-over state, which used to return success without checking the binding. Startup restore goes through the same check. Recovery uses the existing Choose account action on the provider card and in the form, with no UI or locale changes; account deletion itself is unchanged, and nothing is rebound automatically.
- **DeepSeek V4 Pro Pricing Restored to the Peak List Price**: v3.20.3 repriced `deepseek-v4-pro` to the V4.1 Flash tier ($0.30/$1.20 per million, $0.006 cache read) because DeepSeek had announced that V4 Pro would be routed to V4.1 Flash from 2026-09-14. DeepSeek withdrew that announcement on 2026-09-12 and keeps serving V4 Pro with unchanged billing, so V4 Pro requests were being costed well below what the upstream charges. The seed row returns to $1.32 input / $3.96 output / $0.044 cache read per million (the peak tier, CNY 9/27/0.3). The v3.20.3 repair entry is replaced by its inverse, which only rewrites a `deepseek-v4-pro` row whose four price columns are still exactly 0.3/1.2/0.006/0, the values v3.20.3 seeded or repaired to; the old entry is removed rather than kept, because with both in place every startup would flip the row between the two tiers, and a regression test runs startup seeding twice and asserts the row settles at 1.32/3.96/0.044. Databases that never ran v3.20.3 still chain through the older built-in values (1.68/3.36/0.14 → 0.435/0.87/0.003625 → 1.32/3.96/0.044) and now stop at the peak tier; rows edited to any other value are left alone. `deepseek-v4-flash`, `deepseek-v4-flash-0731`, `deepseek-flash` and `deepseek-v4-flash-vision-exp` stay on the V4.1 Flash tier (0.3/1.2/0.006), and `deepseek-chat` and `deepseek-reasoner` are unchanged.
- **Tools Without a Description Are No Longer Sent as `null`** (#7319, #7378; fixes #7303): The Claude-to-OpenAI Chat and Claude-to-Responses converters copied each tool's `description` into the outbound request, so a tool without one went out as `"description": null`, and strict OpenAI-compatible upstreams rejected the entire turn with 400 `expected string, received null`. This hit Anthropic hosted tools such as `web_search`, which carry no description by definition, and any custom or MCP tool declared without one — failing the whole request rather than just the one tool. A missing or explicit-`null` description is now omitted and every other value passes through unchanged. Fields are still inserted in `name` → `description` → `parameters` order, so tools that do carry a description serialize byte-for-byte as before and prompt-cache prefixes are unaffected. The Codex Responses-to-Chat converter had the same `unwrap_or(null)` fallback for function tools and gets the same guard (#7378).
- **Claude Code Auto Mode Classifier Works Through GitHub Copilot** (#5404; fixes #5175): Claude Code's auto mode classifier sends `stop_sequences` on every safety check. On the GitHub Copilot path, the Anthropic-to-OpenAI Chat conversion mapped them to `stop`, and Copilot's Chat Completions route for Claude models answers such requests with HTTP 400, so every classifier call failed while normal chat kept working. The converted `stop` field is now removed only when the provider is GitHub Copilot; other OpenAI-compatible upstreams (e.g. OpenRouter) keep it. Copilot detection in this transform also covers cards identified only by an `env.ANTHROPIC_BASE_URL` that points at `githubcopilot.com`, in addition to the Copilot provider type and a top-level `baseUrl`.
- **Claude Code Effort Levels Reach OpenAI and Grok Upstreams Intact: `xhigh`, `max` and Grok 4.6** (#7318, #7531; fixes #7314, #6197, #3389, #5367): Three gaps in how Claude Code's reasoning effort is carried into converted OpenAI-format requests (`reasoning_effort` on Chat, `reasoning.effort` on Responses) are closed. Claude Code's `/effort xhigh` sends `output_config.effort: "xhigh"`, which the resolver did not recognise; it fell into the unknown-value branch, and because an explicit `output_config.effort` suppresses the `thinking` fallback, no effort was sent at all — `xhigh` now maps 1:1. The reasoning-capable model list only knew `grok-4.5`/`grok-4.5-*` and `grok-build-*`, so Claude models mapped to `grok-4.6` or `grok-4.6-build` lost every effort level, `max` included; `grok-4.6` and `grok-4.6-*` are added (plain `grok-4` stays excluded), and the same list also gates Codex's `reasoning.effort` passthrough on Chat upstreams that have no per-model reasoning settings. And an explicit `max` was always downgraded to `xhigh`; it is now forwarded as `max` for the models that support a distinct max tier — `gpt-5.6`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna` and `gpt-6-astra` (exact ids, case-insensitive). Every other model still falls back to `xhigh`, `thinking.type: "adaptive"` still resolves to `xhigh`, and `low`/`medium`/`high` requests are unchanged.
- **Enabled Prompt Picks Up External Edits to the Live Prompt File** (#7194): Editing the global `CLAUDE.md`, `AGENTS.md` or another app's live prompt file outside CC Switch left the Prompts list showing the old database content until a restart. Loading the Prompts list now reads the live file back into the currently enabled prompt and saves it, with a new `updated_at`, when the content differs, and the open Prompts panel also reloads when the window regains focus (still waiting while an edit, confirmation or write is in progress). Only the enabled prompt is refreshed; inactive templates are left alone. Missing, unreadable, empty or whitespace-only files leave the saved prompt as it is (matching `enable_prompt`), unchanged content causes no write, and the refresh is skipped while a sync or restore holds the sync lock, so loading the list cannot write a stale live file into a freshly restored database. Pi keeps its own `AGENTS.md`-based activation and is not part of this refresh.
- **skills.sh Skills Whose ID Differs From Their Directory Install and Update** (#6381; fixes #6365): skills.sh passes a skill's `skillId` as its directory, but the id is not always the directory name in the repository — `tencent/WeChatReading`, for example, publishes `weread-skills` at `skills/SKILL.md` with `name: weread-skills` — so installing it failed, and even a fixed install would have been missed by update checks, which matched only on the directory name. Source lookup still tries the explicit path first, then a directory named after the id; before falling back to a `SKILL.md` at the repository root, it now accepts a `SKILL.md` whose metadata `name` matches the id, as long as exactly one does, and refuses the install when several directories declare the same name instead of picking whichever the file walk found first. Update checks and manual updates first look for the skill at the source path saved in its `readme_url`, then by directory name, then by the same unique-name rule, and an update saves the path where the skill was actually found, so a skill that moved inside its repository or was renamed in its metadata keeps updating. The local install directory is still the original `skillId`, and storage, sync and the database are unchanged.
- **Large Skill Repositories Install Instead of Being Rejected as Zip Bombs** (#7489; fixes #7475): Skill installs download the whole GitHub repository archive, not just the skill directory, so installing `hugohe3/ppt-master` from skills.sh (a 13,248-entry archive) failed with `ARCHIVE_TOO_MANY_ENTRIES` against the 10,000-entry cap. `MAX_ARCHIVE_ENTRIES` rises to 30,000 for both remote archives and local ZIP installs, and WebDAV's `MAX_EXTRACT_ENTRIES` rises to 30,000 as well, so a synced `skills.zip` containing such a skill can still be restored. The entry count is only a quick check before extraction; the real bound stays the 512 MiB extraction budget, which now charges every file at least one 4 KiB block, the same way directories are charged, so an archive of empty files is still limited by the byte budget.
- **OMO Finds Its Unified Config on the WSL Side** (#7550; fixes #7363; supersedes #7367): When the OpenCode config directory points into WSL (`\\wsl.localhost\<distro>\home\<user>\.config\opencode` or `\\wsl$\…`), OMO 4.19.3 and later keep their unified config in the WSL-side home (`~/.omo/omo.jsonc` or `omo.json`). CC Switch only looked in the Windows home, never found it, and silently fell back to the legacy per-plugin file (`oh-my-opencode.jsonc`) that OMO no longer reads, so provider switches appeared to succeed but did nothing. The WSL-side home is now worked out from the OpenCode directory's WSL path (`home/<user>` or `root`; non-WSL paths and WSL paths outside a home directory give no candidate) and checked before the Windows home, for reads, writes and deletes. Only detection changes: when neither home has a unified config, the legacy fallback still applies. The WSL-side lookup is Windows-only.
- **Windows Main Window Stays in the Taskbar When Shown From Other Entry Points** (#6348): After a silent startup or closing to the tray, the Windows main window is hidden with `skip_taskbar(true)`, and only the tray's "show" action reset that flag before `show()`. When the window was brought back another way it appeared without a taskbar button, and clicking minimize made it disappear completely. The main window's other entry points now call `set_skip_taskbar(false)` before showing it, matching the tray path: launching CC Switch again from a shortcut or the Start menu while it is already running, a `ccswitch://` deep link that focuses the main window, the URL-open event handler, and the database-recovery screen shown on a version mismatch.
- **"Hide AI Attribution" Also Hides Claude Code Session Links** (#7053): Claude Code added a separate `attribution.sessionUrl` setting for the claude.ai session links it puts in commits and pull requests created from web and Remote Control sessions, so clearing `commit` and `pr` no longer hid every attribution surface. The Claude editor's "Hide AI Attribution" quick toggle now writes `attribution: {commit: "", pr: "", sessionUrl: false}` and shows as checked only when all three are set that way, so a config with the older two-field shape now shows it unchecked. Unchecking still removes the whole `attribution` object. The toggle table in the zh/en/ja user manual is updated.
- **Tool Version Probes Fetch Only npm Dist-Tags and Time Out After 15 Seconds** (#7346; fixes #7339): The About card's latest-version probe for npm-distributed tools downloaded the full npm packument (`registry.npmjs.org/{package}`) — metadata for every past version, 14–25 MB uncompressed for fast-releasing packages such as Codex, OpenCode and OpenClaw — just to read its `dist-tags`, and it was the only latest-version probe without `LATEST_PROBE_TIMEOUT`, so it fell back to the shared client's 600 s total timeout. On slow links the cards sat on "loading" for minutes, and the large downloads starved the Hermes GitHub probe into "unknown". The probe now calls the dedicated `registry.npmjs.org/-/package/{package}/dist-tags` endpoint, whose body is the dist-tags object itself (tens of bytes to a few KB), escapes scoped names as `%2f` (`@openai%2fcodex`), and uses the same 15 s timeout as the GitHub and PyPI probes; a timeout, network error or 404 now shows "unknown" instead of hanging. The probe still reads only `latest` and the tool's prerelease tags.
- **WSL Tool Versions No Longer Pick Up the Distro Version From Shell Startup Output** (#7348; fixes #7347): On Windows, a tool installed inside WSL is probed by running `"${SHELL:-sh}" -lic '<tool> --version'` through `wsl.exe`, and the first `x.y.z` anywhere in stdout was taken as the version. A login and interactive shell runs the distro's startup files first and their output lands on the same stdout; on Ubuntu, `/etc/profile.d/update-motd.sh` prints the MOTD ("Welcome to Ubuntu 24.04.4 LTS …") once a day, so after the first probe of the day the Claude Code card showed `24.04.4` until a refresh. The probe now prints the sentinel `__CCSWITCH_VERSION__` before running the tool and parses only what follows its last occurrence — the last one, because the `-lic || -lc || -c` fallback chain can print it more than once, and matched as a substring so OSC escape sequences stuck to its front do not hide it. When the sentinel is missing because the shell failed before running the payload, the output is parsed as before, and tools that print their version to stderr still fall back to stderr.
- **Model List Fetch Works on Zhipu's Responses Endpoint** (#7330): Zhipu's OpenAI Responses endpoint (`https://open.bigmodel.cn/api/v1`, the base URL of the Zhipu GLM Codex preset) serves `/models` in the Codex remote-catalog shape (`models[].slug`) instead of the OpenAI/Anthropic shape (`data[].id`), so fetching models in the Codex provider form came back empty. The shared model-list parser now falls back to `models[].slug` when `data` is absent (those entries have no `owned_by`); when `data` is present the existing `data[].id`/`owned_by` handling is used unchanged, so OpenAI-compatible and Anthropic model lists behave as before. Endpoint derivation, auth headers, timeout and error handling are untouched, and a response with neither field still produces an empty list.
- **AICodeWith Codex-Family Endpoint Corrected to `/v1`**: AICodeWith serves its Responses endpoint at `https://api.aicodewith.ai/v1`; the `/chatgpt/v1` path published in the vendor's blog posts is a documentation error, confirmed by the vendor. The Codex preset (base URL and endpoint candidate) moves from `/chatgpt/v1` to `/v1`, and so do the Hermes (`codex_responses`), OpenClaw (`openai-responses`) and Pi (`openai-responses`) presets, which reuse the same Responses endpoint. Claude Code and Claude Desktop (root host), Gemini (`/gemini_cli`) and OpenCode (already on `/v1`) are unchanged.
- **Claude Desktop Offers the 1M Context Variant on DeepSeek V4 Routes**: The DeepSeek V4 family has a 1M context window, and every Codex catalog in the repo records 1048576 for these ids, but the Claude Desktop presets that pin them left `supports1m` off, so the 1M variant never appeared in Claude Desktop's model list. These presets now declare 1M on their routes: DeepSeek (`deepseek-v4-pro` for Sonnet/Opus, `deepseek-v4-flash` for Haiku), OpenCode Go (`deepseek-v4-flash`) and Baidu Qianfan Token Plan (`deepseek-v4-pro`); PPIO already declared it. The `[1m]` suffix is a marker local to Claude Desktop — translated to `supports1m` at the import boundary and stripped before upstream model matching — so nothing sent to the provider changes.
- **Provider Cards No Longer Expand Stale Usage Tiers When Script Usage Is Inactive**: A disabled React Query observer still returns the cached entry for its key, so a provider card whose usage script was turned off, or that was switched to the official-subscription template, kept the multi-plan chevron and the expanded tier list from an earlier script result; official provider cards were affected the same way. Whether a card can expand is now decided by the same condition that enables the script usage query (`scriptUsageActive`: usage script enabled, not an official provider, not the official-subscription template), and only an active script result with more than one plan can expand. Token Plan templates stay inline as before, and ordinary multi-plan script usage still expands and collapses.
- **Switching Apps Resets the Provider List Scroll Position** (#5211; supersedes #4397): The provider view reuses its scroll containers when you switch apps and only swaps the animated list inside them, so the previous app's `scrollTop`/`scrollLeft` carried over and switching away from a long, scrolled provider list could open the next app on what looked like an empty page. Before paint, both the page's `<main>` container and the provider-list container now reset to the top-left whenever the active app changes while the provider view is open, and the animated view wrapper is back in the flex-column layout, so the provider list is once again the container that scrolls.
- **Monochrome Preset Icons Use the Foreground Color in the Preset Selector**: Monochrome preset icons (drawn in `currentColor`) took on the preset button's `text-muted-foreground`, so the same icon looked mid-gray in the preset selector but near-black in the form's icon preview and on the provider card — most visibly on 9527CODE, whose 0.82-opacity base layer lightened the gray further. Unselected preset icons, and the icons in the universal preset row, now use `text-foreground`; a selected preset's icon still follows the button's `text-white`. Brand-colored icons are unchanged because their color is set inline.
- **Pi Providers Without an Icon Show Name Initials Instead of the Pi Logo** (#6826): A Pi provider saved with no icon from the user or its preset was stored with the `pi` app logo as its icon, so custom Pi cards all looked alike. The Pi form now saves an empty icon in that case, so the card shows the provider name's initials like other apps' custom providers. Pi providers saved earlier keep the stored `pi` icon until it is changed in the form.
- **zh-TW Pi Form Uses One Term for the Provider Key** (#7187): The zh-TW Pi form labels the field 供應商識別碼 and uses that term in its required-field message, but its duplicate-key message used 供應商標識, the term the Hermes, OpenCode and OpenClaw forms use for their own field. The Pi duplicate message now reads 該供應商識別碼已存在; `hermes.form.providerKeyDuplicate` stays as it is because its label is 供應商標識.

### Internal

- **CI Builds the Frontend and Limits Vitest to Source and Test Folders**: The CI frontend job now runs `pnpm build:renderer` (`vite build`) after the unit tests, and `vitest.config.ts` only collects tests from `{src,tests}/**/*.{test,spec}.{ts,tsx,js,jsx}`. A slow Pi form thinking-map test now starts from a provider with its model already set through `initialData` instead of clicking through the custom-preset flow.
- **Claude Desktop Linux Path Tests Run on Every Unix Host**: The Linux config-directory resolver and its three unit tests now compile under any unix test build, so they run on macOS as well as CI Ubuntu; Windows is excluded because the assertions use POSIX absolute paths. The provider-to-Claude Desktop profile sync integration test now also runs on Linux, with a Linux profile-path helper and `XDG_CONFIG_HOME` pinned under the temporary home, saved on setup and restored on drop.

### Upgrade notes

- **Database migration v18 → v19** (#7383): `mcp_servers` and `skills` each gain `enabled_mcode BOOLEAN NOT NULL DEFAULT 0`. The migration runs automatically on first launch. CC Switch first tries to back up the database, but a failed backup is only logged and does not stop the upgrade, so check that a backup exists before relying on it for a downgrade. Existing MCP servers and Skills start disabled for MiniMax Code, so nothing is written into `~/.minimax` until you turn them on. After running this version once, v3.20.3 and earlier refuse to open the database as too new — downgrading requires restoring that backup or another pre-upgrade copy of `~/.cc-switch/cc-switch.db`.
- **A MiniMax Code tab appears in the app switcher by default**, including for installs whose settings predate it. Hide it under Settings → app visibility if you don't use MiniMax Code.
- **Existing MiniMax Code data is picked up automatically**: custom providers already in `~/.minimax/config.yaml` are imported the first time the MiniMax Code page loads; an existing `~/.minimax/AGENTS.md` is imported into the prompt library at startup only when the prompt library is empty for every app (and the file is at most 32 KiB) — upgrading users who already have Claude, Codex or other prompts get no automatic import, and the file's content is instead saved as a backup library entry the first time they enable a MiniMax Code prompt; and the first usage sync backfills all existing `local_runtime_token_usage` history, so the dashboard's MiniMax Code totals include past usage right away.
- **MiniMax Code's data directory comes from environment variables only**: CC Switch reads `MINIMAX_DATA_DIR`, then `MAVIS_DATA_DIR`, from its own environment and otherwise uses `~/.minimax`. Settings has no directory override for it, so if MiniMax Code uses a custom directory, CC Switch must be launched with the same variable.
- **Model selection stays in MiniMax Code**: to remove or disable a provider or model that MiniMax Code's `defaultModel`/`defaultLightModel` currently points to, first choose another default in MiniMax Code. A save while MiniMax Code holds its config lock fails with a retry prompt instead of waiting.
- **Codex cards bound to a deleted ChatGPT account need one manual rebind** (#7395): nothing is rebound automatically — open the card's Choose account action and pick the new login. Until then, Codex takeover cannot be enabled for that card; if takeover was on when the app last exited, startup restore now fails the binding check and switches Codex takeover off, leaving the native `~/.codex/auth.json` untouched. Re-enable takeover after rebinding.
- **Codex API keys that were already erased are not restored** (#7434): the fix only stops future erasure. If a Codex provider's stored `OPENAI_API_KEY` was cleared by an earlier edit or switch, re-enter the key once, and its usage script too if that was reset as a consequence.
- **Re-check "Hide AI Attribution" on Claude providers that already use it** (#7053): the toggle now counts as on only when `attribution.sessionUrl` is `false` as well, so configs saved with the old `{commit: "", pr: ""}` shape show it unchecked after upgrading. Tick it again to add `sessionUrl: false`; existing configs are not rewritten automatically.
- **The enabled prompt adopts external edits when the Prompts list loads** (#7194): if an app's live prompt file (`CLAUDE.md`, `AGENTS.md`, …) differs from the enabled prompt's saved content and is not empty, opening the Prompts list overwrites the saved content with the file's. Inactive templates are not touched, and Pi is excluded.
- **Reasoning effort now follows the level you picked**: `/effort max` on `gpt-5.6`, `gpt-5.6-sol`, `gpt-5.6-terra`, `gpt-5.6-luna` and `gpt-6-astra` now requests the `max` tier instead of `xhigh` (#7531), and `/effort xhigh`, or any effort level on models mapped to `grok-4.6`/`grok-4.6-*`, now sends an effort where none was sent before (#7318). Reasoning-token usage and latency may rise accordingly.
- **One-time prompt-cache miss for the affected request shapes**: two groups of converted requests change their bytes once after upgrading, and the shape is stable from then on — Codex requests that carry an `additional_tools` carrier on lenient Chat or Anthropic upstreams (#7454), where the `content: null` system message disappears and the carried tools join `tools`, and requests whose tools lack a description on lenient upstreams that had accepted `"description": null` (#7319, #7378). Tools that do have a description serialize exactly as before.
- **`Ling-2.6-1T` is now a confirmed text-only model** for every provider using that id, not just the presets: with the proxy's media fallback on, images sent to it are replaced with the `[Unsupported Image]` marker before the request goes upstream.
- **Claude Desktop on Linux needs no migration**: switch to a Claude Desktop provider and restart Claude Desktop, the same as on the other platforms. A custom Flatpak build with narrower permissions than the bundled manifest must grant read/write access to `xdg-config/Claude` and `xdg-config/Claude-3p`; the Flatpak build always writes to the host `~/.config`, so if your Claude Desktop uses a custom `XDG_CONFIG_HOME`, use the native package.
- **Pi providers saved without an icon keep the Pi logo** (#6826): only providers saved from now on fall back to name initials. Change the icon in the form to update an existing card.
- **Preset changes apply only to newly created providers** — a stored card keeps the settings it was created with. In this release that covers: MiniMax CN (existing cards stay on `api.minimaxi.com`, which usage detection, the Codex native-Responses catalog and the `web_search` gate still recognize); BaiLing (existing cards keep `api.tbox.cn` and, outside Codex, `Ling-2.5-1T` — edit the base URL and model or re-add the preset); AICodeWith (edit existing Codex, Hermes, OpenClaw and Pi cards to `https://api.aicodewith.ai/v1` by hand); APIKEY.FUN (existing cards keep `api.apikey.fun`); the SudoCode.chat alternate endpoint `api.sudorelay.com` (seeded only on newly added Claude Code, Claude Desktop, Codex and Grok Build cards — add it by hand as a custom endpoint in the endpoint speed test); the Kimi For Coding K2.8 Preview catalog row (1M window, `low`/`high`/`max`), DeepSeek's `deepseek-flash` default with the text-only `deepseek-v4-pro` row, Hunyuan's `hy4-preview` and the Qwen open-weight rows (add the rows in the card's model catalog or re-add the preset); the Claude Desktop 1M variant on the DeepSeek, OpenCode Go and Baidu Qianfan Token Plan presets (tick "Declare 1M" on the route in the provider editor, or re-add the preset); and the Kimi Global presets (#7526) — existing Kimi cards keep their domestic hosts (`api.moonshot.cn` / `api.kimi.com`), so keys from the international kimi.ai platform should use the new Kimi Global / Kimi For Coding Global presets.
- **Codex catalog fixes reach Codex on the next provider switch**, when `config.toml` and the catalog file are regenerated: Chat-upstream cards stop advertising `supports_image_detail_original` (#7476); native-Responses cards on `stepfun.com`, `stepfun.ai`, `qianfan.baidubce.com`, `xf-yun.com` and `minimax.cn` get `web_search = "disabled"`; cards on `minimax.cn` get the native Responses catalog; and `Ling-2.6-1T` is declared text-only. Switch away and back once on affected cards. The proxy-side `original` → `auto` downgrade takes effect immediately, including for sessions already poisoned by an earlier image, so no rollout editing is needed.
- **Pricing**: `grok-4.7`, `glm-5.3-flashx`, `hy4-preview`, `qwen3.8-2.4t-a95b` and `qwen3.8-27b` are new seed rows inserted with `INSERT OR IGNORE` (a row you already added under the same id is kept), so the startup backfill re-prices historical requests under those ids that were recorded at $0; rows with a non-zero cost are left unchanged. The `deepseek-v4-pro` repair only returns the row to 1.32/3.96/0.044 if it is still exactly 0.3/1.2/0.006/0, the values v3.20.3 wrote; customized rows are left alone, but a row set to exactly those values by hand cannot be told apart and is reset too. V4 Pro costs recorded while v3.20.3 was installed are _not_ re-priced — the backfill only recalculates request rows whose recorded total cost is $0 or less and that have token usage — so every V4 Pro request logged under v3.20.3 keeps its Flash-price cost, and only requests after upgrading use the restored price. Grok 4.7 is costed at its <200K base tier; xAI bills prompts of 200K tokens and above at double ($4/$12), which the pricing table does not model.

## [3.20.3] - 2026-09-11

Development since v3.20.2 is a short, dense cycle: most of it is contributed correctness fixes on the local proxy and the Codex integration, closing issues that had been open for months, plus a round of preset and pricing maintenance. On the proxy, OpenAI-compatible upstreams that keep an empty `reasoning_content` placeholder in every chunk no longer flood Claude Code with empty Thought blocks (#7227), the Codex Responses-to-Chat converter no longer splits a commentary message from its tool calls into two assistant turns — which ended long agent tasks right after a progress update (#7280) — Claude Desktop's one-token model probe is clamped to the Responses API minimum so mapped models stop reporting "not available" (#7287), and Codex image generation under routing picks up three follow-up fixes for pasted full endpoints, mixed-case suffixes and streamed usage (#7177). Two data-integrity bugs are closed: every normal shutdown copied Claude's retry and timeout settings onto the Codex, Gemini and Grok Build proxy rows (#7210), and syncing a universal provider wiped its children's usage script, common-config opt-out and endpoint auto-select and pushed the card to the bottom of the list (#7212). Codex takeover now honors the proxy address when a card omits `model_provider` (#7263), Codex usage import detects growing rollouts on Windows NTFS through a persisted byte cursor (#7219), the tray shows the bound ChatGPT account's quota for managed Codex cards (#7267), and Claude Fable's weekly limit appears in the provider card and tray. The Claude provider editor gains a "Disable Artifact Tool" quick toggle for gateways that reject Claude Code's Artifact tool schema. On the preset side, Kimi's two Codex presets move to native Responses direct-connect, the aggregator Codex presets are refreshed to current catalogs, DashScope/Bailian is rebranded as 千问AI平台 on Qwen 3.8 (#7183), MiniMax defaults move to M3 (#7255), the bundled DeepSeek Codex catalog mirrors the vision-capable `deepseek-flash` (#7286), and the DeepSeek V4 family is repriced to the V4.1 Flash tier. This release does not change the database schema.

**Stats**: 22 commits | 62 files changed | +3,458 insertions | -802 deletions

### Added

- **"Disable Artifact Tool" Quick Toggle in the Claude Provider Editor**: Some third-party Anthropic-compatible gateways (DeepSeek among them) validate tool JSON Schemas with a strict regex checker and reject the Unicode property escapes (`\p{Cc}`, `\p{Cf}`, …) that Claude Code's Artifact tool emits once its `str_replace` database capability is rolled out — every request then fails with 400 `Invalid schema for function 'Artifact'`, independent of the model selected. A sixth checkbox next to the existing Claude quick toggles sets `env.CLAUDE_CODE_DISABLE_ARTIFACT="1"` on the provider, which keeps the Artifact tool out of the tools array entirely; unchecking removes the key like the other toggles do. Labels are added for zh/en/ja/zh-TW and the user manual's toggle table is updated in zh/en/ja.
- **Claude Fable Weekly Limit in the Provider Card and Tray**: The Claude OAuth usage API now reports model-scoped weekly limits in a top-level `limits[]` array (`kind: "weekly_scoped"` with `scope.model.display_name` and `percent`) instead of dedicated top-level windows; the parser only read the legacy windows, so the Fable limit never showed up. `limits[]` is now parsed into `seven_day_fable`, `seven_day_opus` and `seven_day_sonnet` — scoped rows override the legacy window of the same name, duplicates and malformed rows are skipped, and legacy windows, extra usage and unknown windows are preserved. The tray gives Fable its own label group so it is not merged into the weekly max value, and the "Fable" label is added in all four locales.
- **New Provider Preset: 千问AI平台 Token Plan** (#7183): the domestic Qwen Token Plan on `token-plan.cn-beijing.maas.aliyuncs.com`, added across Claude Code, Claude Desktop, Codex, Hermes, OpenClaw, OpenCode and Pi alongside the rebrand described under Changed.
- **Pricing Rows for `deepseek-flash` and `deepseek-v4-flash-vision-exp`**: `deepseek-flash` is DeepSeek's only currently recommended id and `deepseek-v4-flash-vision-exp` is the legacy vision name the official install script wrote through 1.2.0; both are served by V4.1 Flash and billed at its $0.30/$1.20 per million with $0.006 cache read. Neither was seeded before, and the `LIKE '{id}-%'` prefix fallback only matches longer ids, so requests under either id were silently billed at $0.

### Changed

### Fixed

- **Empty `reasoning_content` Placeholders No Longer Flood Claude Code With Empty Thought Blocks** (#7227; fixes #5028, #4404; supersedes #4869, #6421, #6576): Some OpenAI-compatible upstreams (GLM, Qwen, DeepSeek-V4-Pro via ModelScope/DashScope, Bailian, JD Cloud, …) keep a `reasoning_content: ""` placeholder in every content chunk instead of omitting the field. The reasoning branch of the OpenAI Chat-to-Anthropic SSE converter only checked for presence and shares the open-block state with the content branch, so every content chunk closed the open text block, opened an empty thinking block, then reopened a text block — N content chunks became 2N content blocks, half of them empty thinking blocks, which Claude Code rendered as one line per token with dozens of empty Thought blocks and bloated the session JSONL. Empty reasoning is now filtered before entering the branch, matching the guard the content branch and the non-streaming converter already had; two regression tests pin block index, type and order for both the placeholder shape and real reasoning.
- **Codex Agent Tasks No Longer Stop After a Progress Update on Chat Upstreams** (#7280; fixes #6529; supersedes #6530, #5895; also reported as #5860): The Codex Responses-to-Chat Completions converter emitted two consecutive assistant messages when one model turn contained a commentary message directly followed by `function_call` items; Chat upstreams imitate the text-only assistant message as a complete turn and return `finish_reason=stop` before the expected tool call. Pending tool calls are now merged into the directly adjacent assistant message when it carries no `tool_calls` yet, pending reasoning is attached per segment so parallel calls do not duplicate it, and the new-message path is kept for every other boundary shape (user/tool boundaries, prior tool-call batches, media flushes). The reasoning placeholder backfill still applies to coalesced calls without reasoning.
- **Claude Desktop Model Probes No Longer Fail on Responses Upstreams** (#7287; fixes #7103): The Responses API rejects `max_output_tokens` below 16, but Anthropic clients legitimately send tiny probe budgets — Claude Desktop's model-availability probe uses `max_tokens=1` — and the Anthropic-to-Responses conversion copied the value verbatim, so strict upstreams returned 400 and Claude Desktop reported the mapped model as unavailable under local routing. Values 1 through 15 are clamped up to 16 during conversion; 16 and above, 0 and non-integer values keep their pass-through semantics, normal session requests convert byte-for-byte as before, and the Codex OAuth path still strips `max_output_tokens` afterwards.
- **Codex Image Generation Under Routing: Pasted Full Endpoints, Mixed-Case Suffixes, Streamed Usage** (#7177; follow-up to #7036): The `/images/edits` route and the shared Images/Responses/Compact/Chat suffix table already shipped in v3.20.2; this round closes three gaps around them. A Codex card whose base URL was pasted as a complete `/chat/completions` or `/responses` endpoint with the full-URL switch off now derives the sibling Images and Alpha Search endpoints the same way the Chat path already tolerated, instead of sending standalone requests to `…/chat/completions/images/generations`. Suffix detection and the sibling rewrite match case-insensitively (`/v1/Images/Edits/`, `/v1/Responses/Compact/`) while preserving the original URL prefix, percent-encoding and query. And streaming Images usage is parsed from the `image_generation.completed` event's top-level `usage` (scanning past the `partial_image` events that carry none) before falling back to the Chat Completions stream parser, so streamed generations no longer record zero tokens.
- **Shutdown and Port Allocation No Longer Overwrite Per-App Proxy Settings** (#7210; fixes #7204): On normal exit the proxy's restore path called the legacy global proxy-config writer to clear the long-retired `live_takeover_active` flag; that writer reads the Claude row and runs an UPDATE without a WHERE clause, so every shutdown copied Claude's `max_retries` and three timeout fields onto the Codex, Gemini and Grok Build rows — and the UPDATE never carried the flag in the first place, so the step had no effect beyond the clobber. The ephemeral listen-port path did the same on every proxy start. The dead write-back is dropped (live-config restore, backup cleanup and health reset are unchanged) and the resolved ephemeral port is persisted through the global-config interface, which only touches the shared listen/logging columns; two regression tests seed distinct per-app settings for all four apps and assert they survive both paths.
- **Universal Provider Sync Keeps Its Children's Settings and Position** (#7212; fixes #7134): Syncing a universal provider regenerates its Claude/Codex/Gemini child providers. The child's `settings_config` was merged with the existing row, but `meta`, `created_at` and `sort_index` were taken from the generated object, which the universal provider never carries from the UI — so the UPDATE wiped the child's usage script, common-config opt-out, endpoint auto-select and other per-app settings to `{}` and reset the sort index to NULL, pushing the card to the bottom of the list as if it had been deleted and re-created. Existing children now keep those three fields; name, base URL, key, models, website and notes are still driven by the universal provider, and first-time creation still inherits the parent's metadata.
- **Codex Takeover Honors the Proxy When `model_provider` Is Omitted** (#7263; fixes #6256; refs #7217): When a Codex card's TOML has no `model_provider`, Codex falls back to its built-in `openai` provider, but takeover wrote the proxy address as a top-level `base_url` that Codex never reads, so requests bypassed the local proxy and went straight to `api.openai.com`. The missing selector is now treated as the built-in `openai` provider and the proxy address is written to `openai_base_url`; the existing legacy-reroute migration then turns it into a `cc-switch` custom provider table carrying the `PROXY_MANAGED` bearer, the same shape every other third-party takeover uses. Explicit provider selections are unchanged.
- **Codex Usage Import Detects Growing Rollouts on Windows** (#7219; fixes #6060; plus a follow-up): Codex keeps the rollout append handle open for the whole session, so on Windows NTFS the file mtime does not advance while the file grows and the pure-mtime gate skipped growing rollouts forever. The observed byte length is now persisted in the existing `session_log_sync.last_byte_offset` column for Codex rows and a file is skipped only when both mtime and size are unchanged; the parser splits records on newlines manually so an incomplete trailing record is retried on the next pass without advancing the line cursor. The follow-up counts the bytes of an incomplete tail as observed too: the parser had counted only fully consumed records toward the persisted length, so a rollout ending mid-record or in whitespace (a crashed session that was never resumed) always looked shorter than its file size and was fully reparsed on every sync pass — the line cursor still stops before the incomplete record so it is retried as soon as the file grows, while an unchanged file is skipped on the mtime+size gate.
- **Tray Shows the Bound ChatGPT Account's Quota for Managed Codex Cards** (fixes #7267): Since #6537 the tray deliberately dropped the usage suffix for Codex official cards bound to a managed ChatGPT account, because it only had an app-wide subscription cache fed by whatever login the Codex CLI holds (macOS Keychain first, then `auth.json`), which cannot represent account-scoped quota safely once several accounts are bound; the provider card queried the bound account, but that result never reached the tray, so users with multiple ChatGPT logins saw `Codex · <name>` with no quota at all. The usage cache gains an account-keyed Codex OAuth snapshot map that the quota query writes through to — transport errors keep the last good snapshot, auth/HTTP failures replace it so the tray hides an invalid quota instead of a stale one — and a tray refresh is scheduled on each write. A single `TrayUsageSource` decision is shared by the refresh and display paths: managed Codex cards read only their bound account's snapshot (never a provider-scoped or CLI snapshot as fallback), default to enabled when no usage toggle has been saved (matching the provider card), and the fixed official card takes the managed path too when it carries a binding. Rebinding a card switches to the new account's snapshot immediately and a late response for the previous account cannot overwrite the label.
- **DeepSeek Codex Catalog Mirrors the Vision-Capable `deepseek-flash`** (#7286; fixes #7283): The bundled DeepSeek official Codex catalog is refreshed to the vendor's current `models.json` (slug `deepseek-flash`, image input modality, `supports_image_detail_original`), and `deepseek-v4-flash` leaves the confirmed text-only registry: the legacy id is still accepted by DeepSeek and routed to the vision-capable V4.1 Flash, so both the proxy media sanitizer and the generated Codex catalog now fail open for it instead of replacing images with `[Unsupported Image]` or hiding image input from Codex.
- **Third-Party Token Plan DeepSeek V4 Rows Declared Text-Only** (follow-up to #7283): With the official endpoint routing `deepseek-v4-flash` to a vision model the id fails open everywhere, but Baidu Qianfan and Tencent Token Plan still host the text-only V4 deployments — Qianfan's Coding Plan doc states image input returns 400, and Tencent's 2026-09-10 plan rosters list V4 only. Their Codex preset rows (flash and pro families including `-0731`/`-0813`/`-202605`/`-202606`) now carry an explicit `inputModalities: ["text"]` declaration instead of relying on the registry, and a preset test also locks the official DeepSeek preset to stay undeclared (fail-open).

### Upgrade notes

- **No database migration**: the schema version stays at 18. The Codex byte cursor reuses the existing `session_log_sync.last_byte_offset` column.
- **Codex rollouts are re-parsed once after upgrading**: Codex rows have no stored byte length yet, so the first sync pass re-reads every rollout on every platform (CPU only; already-imported events are skipped by line offset, so nothing is counted twice). Later passes skip unchanged files.
- **Per-app proxy settings that were already overwritten are not restored**: #7210 stops the clobber but cannot recover the Codex, Gemini and Grok Build retry/timeout values that earlier shutdowns copied from Claude — check them once in the proxy settings and reset any that differ from what you configured.
- **Universal sync preserves child settings from now on**; settings a previous sync already wiped (usage script, common-config opt-out, endpoint auto-select, sort position) have to be re-entered once.
- **Codex cards without `model_provider` now route through the local proxy under takeover** (#7263) instead of silently going to `api.openai.com`, like every other third-party takeover.
- **Preset changes apply only to newly created providers** — a stored card keeps the settings it was created with. In this release that covers the Kimi Codex presets (existing Kimi cards keep their stored `openai_chat` format and keep working through routing; switch the card's upstream format to Responses or re-add the preset to connect directly — note that Kimi open platform Tier 0 keys are limited to 3 requests per minute, which is not enough for a multi-request tool loop), the aggregator Codex catalogs, the 千问AI平台 rebrand and Qwen 3.8 pins (including Pi's QwenCloud Token Plan protocol switch), the MiniMax M3 defaults, the Volcengine Doubao display name, and the text-only declarations on the Qianfan/Tencent Token Plan DeepSeek rows (an existing card on those presets still relies on the reactive strip-and-retry for images, or re-add the preset).
- **Codex catalog fixes reach Codex on the next provider switch**, when the catalog file is regenerated: the DeepSeek official catalog's `deepseek-flash` vision entry (#7286). Switch away and back once on the DeepSeek card.
- **Pricing**: `deepseek-flash` and `deepseek-v4-flash-vision-exp` are new seed rows, so the startup backfill re-prices historical requests under those ids that were recorded at $0. The `deepseek-v4-flash` / `-0731` / `-pro` repair only corrects rows still at the seeded peak-tier values (0.44/1.32/0.014 and 1.32/3.96/0.044); customized rows are left alone, and historical costs are _not_ re-priced. The V4 Pro change lands ahead of DeepSeek's 2026-09-14 cutover, so V4 Pro requests made before then are costed at the Flash price. `deepseek-chat` and `deepseek-reasoner` keep their previous values.
- **Anthropic clients probing a Responses upstream with `max_tokens` 1–15 now send 16**; nothing to configure.
- **Chat-upstream Codex cards see one prompt-cache miss after upgrading** (#7280): the merged commentary-plus-tool-call message changes the request bytes once; the shape is then stable turn to turn.
- **Managed Codex cards show quota in the tray by default** when no usage toggle has been saved, matching the provider card; turn the card's usage toggle off to hide it.

## [3.20.2] - 2026-09-07

**Stats**: 52 commits | 71 files changed | +10,483 insertions | -573 deletions

### Added

### Changed

- **September 2026 Repricing**: Sonnet 5 returns to $2/$10 — Anthropic's pricing page now states the introductory price is the standard price and the September 1 increase to $3/$15 will not occur — with a guarded repair correcting installs seeded at 3/15/0.30/3.75 while leaving user-customized rows alone (#7051). GPT-5.6 Sol, the bare `gpt-5.6` alias and its five effort-suffix rows move in lockstep from $5/$30 (cache read $0.50, write $6.25) to the promotional $4/$20 (cache read $0.40, write $5), available at least through 2026-11-21. Gemini 3.6 Flash drops from $1.50/$7.50/$0.15 to the same $0.75/$3.75/$0.075 introductory price Google lists for 3.8 Flash, through 2026-12-31. MiniMax M2, M2.1 and M2.5 all move to the official pay-as-you-go $0.30/$1.20 with $0.03 cache read and a $0.375 cache write that was previously recorded as zero. Every change ships as seed plus a repair entry guarded on the previous value, appended after the existing chain so older databases hop through the intermediate prices.

### Fixed

- **Grok Models Work Through xAI's Native Responses API Under Codex Routing** (#6917): A series of contributed fixes closes four independent failures on the native-Responses path to xAI. xAI rejected Codex Desktop's built-in tool schemas before sampling, so root `oneOf`/`anyOf` function parameters are collapsed on the request path (#6815), intersecting the union branches' required lists so a flattened `oneOf` does not force fields the chosen branch lacks. Grok emits whole-float JSON numbers that Codex's parser refuses as integers, so integral floats in completed `function_call` arguments are rewritten (exactly 2^64 is now refused rather than silently rewritten off by one). Codex's multi-agent mode injects `agent_message` mailbox items that xAI cannot deserialize, so every child spawn failed 422 before any tool ran — those items are rewritten into ordinary user messages with encrypted content flattened to text. And xAI 404s Codex's role SKUs such as `gpt-5.6-sol`, so unknown request models are remapped onto the provider's configured model (catalog slugs like `grok-4.5` and any `grok`-prefixed id pass through untouched), with the remap running before sanitization so a subagent landing on grok-4.5 also gets its unsupported sampling fields stripped. All of it sits behind one native-Responses gate in a dedicated module so it can be rebased or cherry-picked until upstream covers the same cases. The grok-4.5 xAI presets now declare low/medium/high/xhigh: probed on 2026-08-30, the endpoint accepts those four and rejects `max` with HTTP 400, and Codex does not clamp out-of-catalog efforts.
- **Switching to a Grok OAuth Codex Card Is No Longer Refused**: The v3.20.1 config-only switch refactor extended the keyless safety gate to every write path, which broke proxy-managed OAuth cards (xAI Grok OAuth): they are keyless by design — the local proxy injects the real token per request — yet their preset snapshot inherited the pre-0.149 template's `requires_openai_auth = true`, so the gate refused the switch as an official-login fallback. The snapshot is fixed rather than the gate exempted: the flag is forced to `false` on the active custom table for proxy-injected OAuth providers (xAI OAuth and GitHub Copilot; Codex OAuth is deliberately excluded because the official login _is_ its credential), hooked into the shared effective-provider builder so preflight, normal writes and proxy backup/takeover projections all see the same shape and Codex 0.149 resolves the provider as unauthenticated without reading `auth.json`. The preset now emits `false` at the source; stored cards self-heal on their next switch.
- **Takeover No Longer Traps Codex on the Login Screen After a Direct Third-Party Switch**: With official-login preservation off (the default), a direct switch to a third-party provider deletes `~/.codex/auth.json`; enabling proxy takeover afterwards rebuilt `config.toml` from the stored card, which still carried the pre-0.149 `requires_openai_auth = true`, so Codex ≥ 0.149 sat in the login screen even though the proxy's placeholder bearer token was in place — the same gap hit hot switches after `codex logout` mid-takeover. The takeover writer now stamps the active custom table's flag from the login state Codex itself would observe, mirroring the direct-switch plan: the auth mode is resolved exactly as Codex does (explicit `auth_mode` first, then personal access token, Bedrock API key, Bedrock access keys, `OPENAI_API_KEY`, ChatGPT) before checking the credential, so Bedrock credentials next to a stale API key are never promoted to an OpenAI login; the credentials store is decided before touching `auth.json` — keyring and auto stores are undecidable from disk and leave the card's flag alone, the ephemeral store is always signed out, and only the file store reads the file, where a missing, unreadable or corrupt file means signed out and no longer fails the takeover write. Proxy-injected OAuth cards keep their neutralized `false` regardless of what is on disk; the official passthrough and managed-official branches are untouched.
- **Duplicate Managed ChatGPT Accounts Are Rejected** (#7061; refs #7055): An ordinary managed-account login whose ChatGPT workspace _and_ stable user identity (the id_token subject) both match an existing account is refused with a localized message instead of creating a second row. The check runs under the storage lock so concurrent login completions cannot slip a duplicate through, and the refresh lock is now taken only for targeted re-auth so a rejected add leaves no lock entry behind. Distinct users in the same workspace remain supported.
- **GPT-6 Through Codex OAuth Takeover Is No Longer Rejected as "Requires a Newer Version of Codex"** (#7132; refs #7129): Requests for `gpt-6-astra` on the Claude-to-Codex OAuth route advertised Codex 0.144.1, below the model's 0.153.0 minimum client version, so ChatGPT's backend answered HTTP 400. The advertised version is now 0.153.4, and the originator/version constants are shared between generation and model discovery — the latter previously sent cc-switch's own package version and originator.
- **Parallel Tool Calls Restored for Claude Code on Codex OAuth** (#7024; fixes #5719): When the incoming Anthropic request carried no explicit value, Codex OAuth requests defaulted `parallel_tool_calls` to false, forcing Claude Code into one tool call per model turn. The default is now true (matching codex-rs), and Anthropic's `tool_choice.disable_parallel_tool_use` maps to the inverse Responses value so explicit serial execution is preserved. Carries #5722 forward.
- **Codex's Built-In Image Generation Works Under Routing** (#7036; fixes #5429, #6745; supersedes #5484): Codex's ImageGen tool calls the legacy OpenAI Images API, but the local proxy only registered Responses, Chat Completions, Compact and Alpha Search routes, so `/v1/images/generations` returned an empty 404. The generations aliases (bare, `/v1`, `/v1/v1`, `/codex/v1`) are now forwarded as a Codex standalone passthrough shared with Alpha Search, the Alpha Search full-URL rewrite is generalized to derive the sibling Images URL from full Responses/Compact/Chat URLs (an existing Images URL is kept, an opaque full URL fails closed), and the response's input/output tokens are recorded through the Codex usage parser. A follow-up adds `/images/edits`, which ImageGen switches to whenever it references existing images (explicit paths or the last N generated) and which still hit an empty local route; both routes share one suffix table so a provider configured with either as a complete URL derives the other.
- **Older Codex Builds Load the Catalog Again** (#6666; fixes #6661, #6709; supersedes #6710): Codex 0.144.5 through 0.148.0-alpha.15 declare `supports_parallel_tool_calls` as a required catalog field, while upstream removed it from its model info on 2026-08-14 — so a `models_cache.json` refreshed by a newer build lacks the field, and the ProxyChat catalog cloned from it was rejected by an older Codex on the same machine with "missing field". The field joins the required-field backfill and is filled from the bundled gpt-5.5 template (true); existing values are never overwritten, and newer builds ignore the extra key. Verified with real binaries: the old catalog is rejected by 0.147.0 and 0.148.0-alpha.15, the new one loads on both and on 0.148.0.
- **MCP Tools Visible Again on the DeepSeek Native Presets** (#6653; fixes #6647): The bundled official catalog declared `supports_search_tool = true` for deepseek-v4-pro and deepseek-v4-flash, and Codex gates deferred/namespaced MCP tools on that flag — so every MCP tool was hidden behind a `tool_search` DeepSeek's Responses API cannot serve, and none could ever be called. Both models now declare false and Codex lists MCP tools inline; hosted web search is gated by provider capabilities rather than this flag and is unaffected, and DeepSeek's server-side web search still works.
- **Vision Variants in the DeepSeek-Mirrored Catalog Are No Longer Declared Text-Only** (#6750; fixes #6725): A model slug absent from the bundled DeepSeek catalog cloned the flagship entry and inherited its text-only input modalities, so a vision variant such as `deepseek-v4-flash-vision-exp` lost image input. Unmatched slugs now resolve modalities through the same registry/fail-open logic as the non-vendor path; explicit user-set modalities still win and matched models keep the vendor's declaration verbatim. Separately, `glm-5.3` joins the confirmed text-only list (#6851) so its `[1M]` variant is recognized while `glm-5.3v` is not.
- **Kimi/Moonshot Through Codex Routing No Longer Fail 400 on Tool Schemas** (#6863; fixes #6867, also reported as #6614, #6834, #6861, #6976, #7000 and #7028; supersedes #5125, #6627): Moonshot's Chat Completions validator (`api.moonshot.cn`, `api.moonshot.ai` and the Kimi For Coding endpoint `api.kimi.com`) rejects a `$ref` that carries sibling keywords, and Codex Desktop's built-in tool schemas carry exactly that shape — so every desktop turn routed to Kimi failed. When the resolved upstream host is Moonshot/Kimi, each `$ref` with siblings is moved into `allOf` after the Responses-to-Chat conversion, with the siblings left in place; the traversal only enters schema-valued keywords and the rewrite is idempotent. Every other provider keeps byte-identical tool schemas, and the Codex-to-Anthropic path is untouched because Moonshot's Anthropic-compatible endpoint accepts the original shape.
- **Zhipu GLM Codex Presets Target Zhipu's Official Responses Endpoint** (#6957; fixes #6944): Zhipu documents three base URLs per site — Anthropic `/api/anthropic`, Chat `/api/coding/paas/v4`, Responses `/api/v1` — and warns the wrong one cannot use Coding Plan quota; Codex direct-connect speaks Responses, and the 400 `unknown variant custom` came from the Chat endpoint's strict legacy gateway. The Zhipu GLM and Zhipu GLM (en) presets switch to native Responses on `/api/v1` (shell-command edits, no freeform apply_patch) and mirror the official model list: glm-5.3 with a 1M window, low/high/max defaulting to max, plus glm-5-turbo on the CN site; glm-5.2 and the `none` level are dropped. A host fallback gives rows saved with a stale Chat format but a native Responses base URL the Responses catalog without a re-save (Chat-endpoint paths are excluded); vendor hosts are matched on DNS label boundaries so `z.ai` no longer captures `xyz.ai`; and `bigmodel.cn`, `z.ai` and the `glm` prefix join the Codex hosted web-search reject list.
- **Usage Stops Stalling After a Codex Resume** (#6905; fixes #6904): When a Codex thread is reverted, Codex mints a replacement rollout file named with two UUIDs (`rollout-<ts>-<threadId>_<rolloutId>.jsonl`), and every later resume of that thread appends to it; the file's root metadata keeps the original thread id, but the importer's consistency check compared that id against the filename's trailing UUID only — so every such file was permanently deferred and usage silently stopped accumulating from the moment the user resumed that thread (reproduced live: 152 unimported token-count events, the deferral warning repeating every 60-second cycle). The check now also accepts a metadata id matching the leading UUID of dual-segment filenames; single-UUID filenames keep the strict check, and ordinary sessions that were never reverted were never affected. The stored session id for such files is now the leading (logical thread) id rather than the trailing rollout id — the id the session list is keyed by — while the trailing id remains the request-id prefix that keeps dedup keys from colliding across segments of one thread.
- **Prompt Prefix Cache No Longer Broken on Every Turn** (#6941; fixes #6789): The Anthropic-to-OpenAI conversion merged every system message to the head of the conversation, but Claude Code injects `<total_tokens>` metadata as a mid-conversation system message on each turn — so the merge rewrote the prefix every turn and defeated the upstream's radix prefix cache. Top-level system blocks are still merged into one leading system message (byte-stable across turns), while system messages inside the message list now stay at their original position, unmerged and unreordered. The reporter measured cache-hit rates on OpenAI-format endpoints such as DeepSeek, GLM and Kimi falling from 99% to 20% before the fix.
- **Hermes "Latest Version" Reads GitHub Releases** (refs #6475, #6618, #7033; supersedes #6621): The tools panel asked PyPI, but upstream stopped publishing there after 0.19.0 (2026-07-20) and ships only through GitHub Releases — so users saw "latest 0.19.0" forever, often below their installed version, and the upgrade button never appeared. PyPI was never the channel cc-switch installs or upgrades Hermes through (the official install script and `hermes update` both use git), so the probe now queries GitHub Releases first and falls back to PyPI only when GitHub is unreachable or rate-limited. The semver is parsed from the release name (`Hermes Agent v0.21.0 (v2026.8.31)`) because the tag is calendar-versioned, calendar numbers are rejected on both paths so `2026.8.31` can never be reported as a permanent update, a PyPI fallback value is hidden when the local version already leads it, and both probes get a 15-second timeout instead of the shared client's 600 seconds, which stalled the Hermes card and the refresh/upgrade-all buttons when `api.github.com` hung.
- **Opus 5 and Sonnet 5 Appear in Claude Code's Model Menu Under Takeover** (#5882; fixes #5876): The stable role aliases takeover writes to Claude Code moved from `claude-opus-4-8`/`claude-sonnet-4-6` to `claude-opus-5`/`claude-sonnet-5`, matching the Claude Desktop default routes and preset defaults that had already moved. `opus-5` joins the adaptive-thinking classifier so the Bedrock thinking optimizer, which runs on the client alias before model mapping, keeps sending adaptive thinking instead of the removed `budget_tokens`. Routing is unaffected — the proxy maps client aliases by role keyword — and the aliases are rewritten the next time the proxy starts.
- **"Fetch Models" Works for the PPIO, JieKou and Novita Claude Presets** (#6870 and follow-up): All three serve the Anthropic-compatible API under one path but expose the OpenAI-compatible model list under `/openai/v1`, and every candidate derived from the base URL returned 404, so model discovery could never succeed. Each preset now pins an explicit models URL, which the form looks up by the card's base URL at fetch time — so existing cards still on the preset's default address get it without any change; a test that had locked the broken behavior in for JieKou was dropped.
- **Ghost "journal" Sessions Gone From the Claude Session List** (fixes #6042): Claude Code's workflow feature writes `journal.jsonl` files inside the session directory; the scanner only excluded `agent-*` files, so each journal parsed as an empty session titled "journal".
- **Update-Check Failures Show the Real Reason** (#6482): The updater plugin rejects with a plain string, so the `instanceof Error` check never matched and the actual failure (network error, rate limit, malformed manifest) was replaced by the generic fallback — and stopped in an unread context state. The recovered message now reaches the failure toast.
- **Proxy Address Masking No Longer Panics on Multi-Byte Characters** (#6908): The fallback used when the proxy URL fails to parse sliced the raw string at byte 20 and panicked when a multi-byte UTF-8 character straddled that offset — a CJK string pasted into the global proxy address was enough. The cut now snaps to the nearest character boundary.
- **Pi Duplicate-Key Error and Collapse Label Show Text Instead of Raw Keys** (#6768): The Pi backend's duplicate-key error mapped to a translation key that existed in none of the four locales, and the thinking-map toggle's accessible label was missing the same way; both are added to zh/en/ja/zh-TW and locked by the locale coverage test.
- **Screen Readers Get Names for Icon-Only Controls** (#7049; fixes #7048): Icon-only back buttons, the header local-routing switch, the project switcher popover, the Claude JSON editors and the existing-Skills import checkboxes now carry programmatic names, reusing existing strings where possible plus two short localized labels.
- **Usage Trend Token Axis Uses Compact Locale Formatting** (#7016): Tick labels were a fixed `<value/1000>k`, so a large day read as `1500k`; they now use the locale's compact notation (`1.5M`) with the axis width adjusted to fit.
- **Pricing Source Dropdown Fits Its Localized Labels** (#6980): The pricing model source selector in the usage cost settings left about 70 px for labels that need about 107 px in English and Japanese; it is widened and aligned to the adjacent input's height.

### Internal

- **Tests No Longer Write to the Real Claude Desktop Config on Windows** (#6078; fixes #6077): Claude Desktop config paths resolve from `LOCALAPPDATA`, which the test home override did not redirect, so the profile round-trip test wrote its `https://desktop.test` fixture into the developer's real config. `LOCALAPPDATA` now points at the isolated test home alongside `HOME` and `USERPROFILE`.
- **README Directory Trees Show the Real Locales Path** (#6100): All four READMEs listed `locales/` as a direct child of `src/`; it lives at `src/i18n/locales/`. Also fixes a "CLaude" typo in the Chinese README.
- **Housekeeping Around the xAI Series**: The namespace SSE restore helpers that lost their last caller when the xAI response path moved to the sanitize stream are deleted rather than allowed as dead code, the xAI request gate is thinned to a single forwarder call so upstream rebases conflict in one place, and the grok-4.5 frontend test expectations are aligned with the four-tier presets (the mismatch had left main's frontend checks red and dragged every PR's checks down with the same two failures).

### Upgrade notes

- **No database migration**: the schema version stays at 18.
- **Preset changes apply only to newly created providers** — a stored card keeps the settings it was created with. In this release that covers the Zhipu GLM presets (an existing Zhipu Codex card still points at the Chat endpoint and still fails on direct connect: re-import the preset to pick up `/api/v1`), the Tencent Pi presets' thinking control (re-import to get a working "off" and the corrected Kimi levels), the grok-4.5 xhigh tier, and the `minimax-m2.5` removal from the Tencent presets. The pinned models URLs for PPIO, JieKou and Novita are the exception: the form resolves them from the card's base URL, so existing cards on the default address need no change.
- **Codex catalog fixes reach Codex on the next provider switch**, when the catalog file is regenerated: DeepSeek MCP visibility (#6653), the `supports_parallel_tool_calls` backfill (#6666), vision modalities (#6750) and the glm-5.3 text-only entry (#6851). Switch away and back once on an affected card.
- **Codex OAuth via takeover now advertises Codex 0.153.4** to ChatGPT's backend; nothing to configure. If you use the Codex CLI directly rather than through cc-switch, GPT-6 needs Codex ≥ 0.153.0 on your side.
- **Adding a ChatGPT account that is already in the Auth Center** (same user, same workspace) is now refused; use the existing row's re-login instead. Different users in one workspace still coexist.
- **Grok OAuth cards self-heal on their next switch** (the `requires_openai_auth` flag is backfilled to `false`); no re-add needed.
- **Under takeover, `requires_openai_auth` on the active third-party table is now overridden on every takeover write** to match the login state Codex would observe, decided by its credentials store: with the file store (the default) the flag follows whether `auth.json` holds an official login; with the ephemeral store Codex always starts signed out, so the flag is written `false`; with the keyring or auto store the login state cannot be read from disk and the card's stored value is left alone.
- **Usage that a Codex resume had stalled is imported on the next scan** and dated when it happened, so dashboard totals for those days can jump. Session ids for reverted threads are recorded correctly from now on; rows already written under the rollout id are not rewritten.
- **Pricing**: the Sonnet 5 repair only corrects rows still at the seeded 3/15/0.30/3.75; a customized Sonnet 5 row is left alone, and historical Sonnet 5 costs are _not_ re-priced — costs are frozen at log time and the backfill only touches rows recorded at $0 (which is why Fable 5.1, GLM-5.3, GLM-5.3 Flash, GPT-6 Astra and Gemini 3.8 Flash history _is_ re-priced). The MiniMax M2 family gains a cache-write price that was previously zero, so those costs rise going forward. The promotional GPT-5.6 rate (through at least 2026-11-21) and the introductory Gemini 3.6/3.8 Flash rates (through 2026-12-31, then $1.50/$7.50/$0.15) have end dates the pricing table cannot express; a later release will re-seed them.
- **Image generation through Codex routing is counted by tokens but has no built-in price yet**: the image models have no pricing row, so their cost shows as $0 until one is added.
- **Hermes version probing degrades to "unknown"** rather than a misleading "latest 0.19.0" when GitHub is unreachable and the PyPI fallback is older than your installed build.
- **Mid-conversation system messages are now forwarded in place** to OpenAI-format upstreams instead of being merged to the front; this is what restores prefix-cache hits, and it matches what Claude Code sends natively. Two consequences: the first request after upgrading changes the prefix bytes, so the cache goes cold once and then recovers; and strict backends that require every system message at the head (the Nvidia/Qwen-style endpoints behind #1881, which answer `System message must be at the beginning`) will fail again on such turns — the removed merge had been introduced for them, and prefix stability and strict-backend compatibility cannot both hold in one global behavior. Report your upstream if it is one of those.

## [3.20.1] - 2026-08-28

This release is dominated by two Codex storylines. The first is an urgent compatibility break: Codex CLI 0.149 stopped letting custom providers inherit ambient credentials from `auth.json`, turning third-party switches made in the old default mode into 401 errors (#6744). Rather than patching around it, cc-switch now switches Codex providers config-only — the key travels in the provider's own `config.toml` table, `auth.json` returns to being purely the official ChatGPT login file — and a whole family of legacy config shapes 0.149 refuses to load is repaired on every switch, with a new preflight refusing unloadable shapes instead of reporting a "successful" switch Codex cannot start from. The second is account safety: two members of the same ChatGPT Team workspace no longer overwrite each other in the Auth Center (#6780, fixes #2245) — existing managed accounts need one re-login (see upgrade notes). Around them: provider edits now always reach the live config file (#6779), the Codex edit dialog no longer shows another provider's key (#6534), restores no longer wipe hand-written prompt files (#6810), the usage dashboard gains an auto/manual session-scan toggle plus an incremental byte-cursor scanner (a 12 MB active session file: 6.04 s → 9.3 ms) behind this release's schema migration (v17 → v18), and Otty joins the macOS terminal picker (#6620).

**Stats**: 26 commits | 66 files changed | +7,474 insertions | -1,000 deletions

### Added

- **Otty Terminal Support on macOS**: "Otty" joins the macOS terminal picker for session resume, provider terminals and tool commands. Launching first attempts a new tab in the existing Otty window via the Otty CLI, then a new Otty window; provider terminals and tool commands additionally fall back to Terminal.app on failure, while a failed session resume reports the error — including an explicit install hint when the Otty CLI is missing — and copies the command to the clipboard. CLI discovery probes the app bundle (system and per-user), Homebrew paths and PATH. The user manual's macOS terminal tables were corrected along the way — Kaku and Warp were already supported but missing from the lists. (#6620)
- **OpenCode Go Subscription Usage**: The usage-script Token Plan query now recognizes OpenCode Go and shows its 5-hour / weekly / monthly usage percentages with reset times in the usage card and tray, reusing the existing quota tiers. The endpoint is Bearer-auth only (the opposite of the inference side, which only accepts `x-api-key`); a valid key without a Go subscription reports a distinct message (HTTP 403) instead of a generic auth failure, a zero-percent window drops the upstream's placeholder reset time, and an unrecognized response shape reports an error instead of an empty card. Newly added OpenCode Go providers in Claude Code, Claude Desktop, Codex, OpenCode and Pi enable the query automatically. OpenCode Zen pay-as-you-go is deliberately not covered — that plan has no usage API upstream.
- **Auto/Manual Mode for Session-Log Scanning**: The usage dashboard gains an "Auto-Scan Session Logs" card with a switch (on by default, so existing behavior is unchanged). Turning it off stops all background session-log scanning, including the startup pass, and a "Sync Now" button appears as the manual entry point, reporting imported entries, files scanned and an error count in a toast. Proxy-takeover request accounting is real-time and never reads session files, so it keeps recording either way, and the startup cost backfill (which only patches existing rows) still runs in manual mode.

### Changed

- **Codex Third-Party Switching Is Config-Only**: Switching to a third-party Codex provider now writes the API key into the provider's own `[model_providers.*]` table in `config.toml` (as `experimental_bearer_token`, honored since Codex 0.48) and never writes the key into `auth.json`, which returns to being purely the official ChatGPT login file — Codex 0.149 stopped letting custom providers inherit ambient auth from `auth.json`, which had broken third-party switches made in the default mode (key written only to `auth.json`) with a 401. The "Keep official login for direct switches" toggle now has exactly one meaning: ON leaves the ChatGPT login completely untouched across third-party switches; OFF deletes `auth.json` instead of overwriting it with the API key (a failed deletion surfaces a warning that the official login is still on disk in the Codex config directory). Two safety gates now run on every third-party switch, not just in preservation mode: a key with no provider table to hold it, and a keyless config that would fall back to the official login (`requires_openai_auth = true` without its own credentials, or a bare `openai_base_url` reroute), are both refused up front with actionable errors — including third-party cards with an empty config, which previously rode silently in `auth.json`. `requires_openai_auth` on the active keyed third-party table is stamped on each direct switch to match the preservation toggle, so Codex's login screen agrees with what is actually on disk. (#6744, #6746)
- **TeamoRouter Presets Move to teamorouter.cn**: All eight app presets now point at `api.teamorouter.cn`, with the old `.com` endpoint registered as a selectable/speed-testable fallback candidate for Claude Code, Claude Desktop, Codex and Grok Build. Existing saved TeamoRouter providers keep whatever base URL they were saved with.

### Fixed

- **Same-Workspace ChatGPT Accounts No Longer Merge in the Auth Center**: Managed Codex OAuth accounts were keyed by `chatgpt_account_id`, which identifies a ChatGPT workspace rather than a person — two members of one Team workspace collapsed onto a single record, with the later login silently overwriting the earlier one's tokens and provider bindings pointing at whoever logged in last. Accounts are now identified locally with the OIDC subject kept as proof of user identity, so same-workspace logins coexist as separate rows. Requests routed through takeover are additionally validated against the live token of the bound account: a Codex session still holding a different member's login is refused with a "restart Codex" error instead of being forwarded under the wrong identity, and the outgoing workspace header always comes from the account binding rather than the client. Adopting a CLI-rotated refresh token and deleting `auth.json` on account removal both require provable ownership now, so cc-switch can no longer adopt or delete another workspace member's login. Every account row offers in-place re-login (bindings preserved), and cancelling or superseding a device login drops the pending flow inside cc-switch — an abandoned browser authorization can no longer be committed minutes later and silently overwrite an account. An id_token that is not a well-formed JWT yields no identity at all, so a malformed or truncated token can never stand in for a user. (#6780, #6831; fixes #2245)
- **Codex 0.149 Compatibility Repairs for Existing Configs**: A family of config shapes that made Codex 0.149 refuse to load — reported as "cc-switch says switched, Codex won't start" — are now repaired on every provider switch and takeover projection. Leftover `[model_providers.openai]` / `.ollama` / `.lmstudio` tables (written by older takeover projections; overriding a reserved id fails validation) are renamed losslessly to a cc-switch-owned id and normalized into a loadable shape; provider tables with no `name` are backfilled (0.149 rejects the whole config over any of them — Bedrock tables are deliberately left nameless because naming them breaks their built-in merge); legacy top-level `openai_base_url` reroutes carrying a usable API key are migrated into a proper custom provider table (a keyless reroute is refused by the switch-time safety gate instead); and a new preflight rejects table field combinations 0.149 cannot load, naming the offending table, instead of writing them out as a "successful" switch. Proxy takeover of a card routed at the built-in `openai` provider now uses the supported top-level knob instead of creating a reserved table, and takeover of `ollama`/`lmstudio`-routed cards fails with an explicit error. The reserved-id list now matches upstream exactly (case-sensitive; `amazon-bedrock-runtime` added, legacy `oss`/`ollama-chat` recognized as ordinary custom providers so their keys finally reach their tables), and inline `model_providers` tables receive the injected token instead of a dead top-level field.
- **A Refused Codex Switch No Longer Corrupts the Rejected Card**: Live-write validation now runs as a preflight before the current-provider pointer moves. Previously a write-layer refusal landed after `current` had already been committed, so the next switch backfilled the old live config into the refused provider's saved settings.
- **Provider Edits Always Reach the Live Config File** (#6779): A stale proxy-restore backup row — left behind by a crash or failed restore — made saves of the active provider (Claude Desktop excepted) take the takeover path, updating only the database and the backup row while the real config file silently kept the old endpoint and key, indefinitely. Ownership is now decided by a single predicate requiring actual evidence of takeover (a placeholder in the live file, or the proxy enabled and running with a backup, or an in-flight switch holding the per-app lock alongside a backup row); stale backup rows are refreshed to match the edited provider instead of hijacking the write. Universal provider saves now also re-project each generated child into the live config of any app where it is the active provider, and report per-app failures by name instead of claiming success.
- **Codex Edit Dialog No Longer Shows Another Provider's Key** (#6534; fixes #6414): With official-login preservation enabled, `auth.json` is a shared slot with no provider identity, and the edit dialog preferred it when seeding the form — so editing the active Codex provider could display, and on save persist, a key left behind by a different provider, making keys converge across cards sharing a base URL ("model not found" errors). The dialog now rebuilds the key from the provider's own bearer token in `config.toml`; official-category and OAuth-only providers are untouched, and a card whose `config.toml` carries no bearer token of its own — an older or hand-maintained shape, now that every third-party switch writes one — keeps seeding from the live `auth.json`, manual edits included, exactly as before.
- **Restores No Longer Wipe Unmanaged Prompt Files** (#6810; fixes #6778): A WebDAV/S3 download or backup import whose snapshot had no enabled prompt for an app truncated that app's live prompt file (`CLAUDE.md` / `AGENTS.md` / `GEMINI.md` / `SOUL.md`) to empty — destroying hand-written local content that was never part of the sync payload. Such a restore now leaves the file untouched; disabling the last prompt from the Prompts panel still clears it as before.
- **Recovery-Screen Exit Buttons Actually Quit the App**: The `process:allow-exit` capability was missing, so on v3.20.0 the Quit button on the "database version too new" recovery screen and the exit after a config-load failure were silently rejected by the IPC layer: the Quit button did nothing (closing the window still quit the app), and after a config-load failure the app carried on into the normal UI instead of exiting as intended. This was independently discovered and fixed first by SaladDay in #6567.
- **Claude Session-Log Scanning Correctness**: Three data-accuracy fixes landed with the incremental Claude scanner. A log line caught mid-write was permanently skipped by the old line-number cursor (the unfinished tail advanced the cursor, so the completed message was never imported) — the byte cursor only commits past complete lines, so the message is picked up next round. An externally truncated or rewritten session file is never replayed: re-importing entries whose detail rows the 30-day rollup has already pruned would permanently inflate totals, so the cursor is pinned at the new end of file and the skipped range is reported in the sync errors instead of silently dropped (truncation is caught by the cursor overrunning the file; same-size rewrites by a fingerprint of the bytes before the cursor). Mid-file read errors now keep committed progress, resume from the same spot next round, and are reported instead of returning a clean success; a failed cursor prefetch aborts the round instead of behaving like a first-ever scan and double-importing history.

### Performance

- **Incremental Byte-Cursor Scanning for Claude Session Logs**: Each scan round now seeks to the last committed byte offset and reads only what was appended, instead of re-reading changed files end to end — per the change's benchmark, a 12 MB active session file drops from a 6.04 s full parse to a 9.3 ms incremental read. Per-file cursors for Claude, Gemini, OpenCode, Grok Build and Pi are prefetched with a single table read per importer each round instead of one row lookup per file, and on the Claude path each file's imports plus its cursor advance now commit in one transaction. A frozen-snapshot replay over 1,017 session files (409 MB) produced aggregates identical to the old scanner. Requires a schema migration (v17 → v18) adding two nullable columns — the byte cursor and a tail fingerprint; existing line-number cursors are converted in place on the first scan without re-importing anything.
- **Pi Session Dedup Lookups Use the Identity Indexes** (#6667): The combined dedup query (an OR across two identity columns) could only constrain the data-source prefix, scanning the entire Pi portion of the ledger for every parsed record — so Pi imports got slower as usage history grew. It is now split into indexed point lookups with identical results, so import time no longer degrades with history size.

### Internal

- **CI: WSL2 Contract Test Runs From a Prebuilt Binary** (#6472): The Windows + WSL2 job now compiles the test binary once under a native TEMP and executes it directly with TEMP pointed at the WSL UNC path, so the run step can no longer trigger a re-link where `link.exe`/`mt.exe` fail to create manifest temp files (LNK1327). The scheduled nightly full-suite workflow is deliberately unchanged until it can be validated independently.

### Upgrade notes

- **Codex OAuth accounts need one re-login**: Every managed ChatGPT (Codex OAuth) account added before this release is quarantined until you click 重新登录 / Re-login on its row in the Auth Center — older records used the ChatGPT workspace ID as the account key and carry no separately recorded per-user identity, and an ordinary token refresh cannot prove which user an old record belongs to. Provider bindings are preserved; re-login updates the account in place. Use the row's Re-login button: signing in again through "Add account" creates a second row (logins no longer merge by workspace) and leaves the old row — and any provider bound to it — still quarantined. (#6780)
- **Codex releases older than 0.48 lose third-party authentication** under config-only switching: they never read the provider-table token field. Upgrade Codex if you are on a pre-0.48 build.
- With the "Keep official login for direct switches" toggle **OFF (the default), switching to a third-party Codex provider now deletes `auth.json`** rather than overwriting it with the API key. To get the ChatGPT login back, switch to an official provider bound to an Auth Center account (its login is written back from the stored account) — a card that follows the CLI's own login needs `codex login`. Turn the toggle ON to keep the official login across third-party switches.
- **Some previously "working" Codex cards are now refused at switch time**: third-party cards with an empty config (no table to hold the key), and keyless cards relying on `requires_openai_auth = true` or a bare `openai_base_url` reroute to borrow the official login. Add a proper `[model_providers.<id>]` entry or an API key to such cards.
- **Codex configs are rewritten on the next live write** where needed for 0.149: legacy `openai_base_url` reroutes with a usable key become a `[model_providers.cc-switch]` table, stale reserved tables are renamed to a cc-switch id, missing `name` fields are filled in, and `requires_openai_auth` on the active keyed third-party table is overridden on each switch to match the preservation toggle (a hand-set value on that table does not survive a switch).
- **Database schema migrates v17 → v18** on first launch (a byte-cursor and a tail-fingerprint column on `session_log_sync`). Downgrading afterwards hits the schema-too-new guard. Usage entries the old half-line bug had already skipped are not retroactively recovered — replaying them cannot be distinguished from re-importing already-rolled-up history.
- **Truncated or externally rewritten Claude session logs are skipped, permanently and by design**: the rewritten range is not replayed (that would double-count against pruned rollups) and the skip is reported in the sync result's error list.
- **Keys already cross-contaminated before the #6534 fix are not repaired automatically**: if Codex providers sharing a base URL converged on one key, re-enter the correct key on each affected card once.
- **Restore behavior change** (#6810): restoring a snapshot in which an app has no enabled prompt now preserves that app's live prompt file — the client keeps loading its old content even though the Prompts panel shows everything disabled. Enable and then disable a prompt from the panel (or edit the file yourself) if you want it cleared.
- **Universal provider saves can now fail loudly**: if a live config file cannot be written for an app whose active provider is the generated child, the save reports an error naming the app; the database record is still saved — retry the sync or switch that app's provider once.
- **Existing TeamoRouter providers keep `api.teamorouter.com`**: re-add from the preset or edit the base URL to move to `.cn`.
- **OpenCode Go usage auto-enables only for providers added after this release**: for an existing card, open its usage-script settings and pick the Token Plan template → OpenCode Go once.

## [3.20.0] - 2026-08-18

Development since v3.19.2 spans every subsystem, led by three structural additions. Pi becomes the ninth managed app (#6064): provider management over `~/.pi/agent/models.json` with 58 presets, a prompt library with system-prompt and slash-command editors, Skills, a session browser, and — behind a schema migration (`SCHEMA_VERSION` 16 → 17, the first new table since v12 introduced profiles) — session usage imported into the dashboard (#6463). Codex gains real multi-account ChatGPT management (#3879): sign in to several accounts in the Auth Center, bind each provider card to one of them or let it follow the CLI's own login, and switch between them like any other provider — with official cards deliberately leaving auto-failover so a retry can never bill a different account. And Claude Code's built-in WebSearch now works when routed to a Responses provider or the Codex OAuth backend, alongside proxy support for Codex's standalone Alpha Search endpoint (#5681). The urgent fix is for Windows-with-WSL users: v3.19.2's switch to `ReplaceFileW` failed on `\\wsl.localhost` paths with an error the fallback did not catch, so existing configurations could not be updated or switched (#6232) — this release repairs it and adds real WSL2 filesystems to CI (#6233). The same Windows wave overhauls CLI detection to read the registry PATH and standalone installer directories, fixing a five-issue family of "not installed" and stale-version reports (#6284), eliminates the white/black startup flash (#6252), and stops the MSI from writing a garbage registry key it had been writing since v3.4.0 (#6283). Codex reasoning control gets a full pass: per-model reasoning levels in the model catalog (#6228), vendor-documented tiers pre-filled across the presets, and corrected thinking-switch dialects for the aggregator platforms that had been receiving fields their gateways never accepted. A contributor's backup/sync audit lands as two hardening waves — SQL dumps that round-trip every value and refuse truncated imports (#6146), and restores that rebuild every derived file and run strictly one at a time (#6147). Rounding it out: a sweeping provider-form consistency pass, an IME fix that stops macOS Chinese/Japanese input from corrupting form fields (#6308), and DeepSeek V4 repriced to the vendor's new peak-tier rates.

**Stats**: 69 commits | 284 files changed | +53,108 insertions | -6,678 deletions

### Added

### Changed

### Fixed

- **Windows: Config Updates on WSL Paths Failed on v3.19.2**: v3.19.2 switched Windows atomic writes to `ReplaceFileW`, which the WSL filesystem rejects with `ERROR_NOT_SUPPORTED` (50) — but the rename fallback only engaged on NotFound, so any write replacing an existing live config on a `\\wsl.localhost` / `\\wsl$` path failed outright: existing providers could not be updated or switched (only the first-ever write of a config file, where the missing target already triggered the fallback, still worked). Error 50 now falls through to the rename path WSL accepts. Only v3.19.2 is affected; there is no in-app workaround on that version, so affected users should upgrade directly. (#6232, #6224, #6219, #6188, #6247)
- **Windows: CLI Detection Now Sees What Your Terminal Sees**: Version detection relied on the inherited process PATH plus a hardcoded directory list — probed in the wrong order. Three visible failure modes, one cause each: after an in-app self-update, the relaunched process inherits only the machine PATH and loses the user PATH, so user-installed CLIs read "not installed" until a full relaunch from the Start menu (#6061); winget's Claude Code, the standalone Codex installer and custom npm prefixes lived in directories never scanned (#6278, #6047, #4366); and hardcoded directories were probed before the PATH default, letting a stale `%APPDATA%\npm` shim mask the newer install actually on PATH — "updated but still shows the old version" (#4701). Detection now merges the registry PATH (user and machine, with `%VAR%` expansion) into the effective search path, scans the standalone installer directories, probes the PATH default first via an explicit `where.exe` invocation that skips Microsoft Store app aliases and never searches the current directory, and feeds the same merged PATH to install-conflict diagnosis and anchored upgrades. (#6284)
- **No More White/Black Flash at Startup**: The window was shown before the theme class was applied, so an unthemed page painted first. An inline pre-paint script now applies the persisted theme synchronously before the bundle loads on every platform, and on Windows the window additionally stays hidden until the page has finished loading. (#6252, #6182)
- **Windows Installer No Longer Writes a Garbage Registry Key**: The WiX template's `Software\{{manufacturer}}\{{product_name}}` used single backslashes, which Handlebars consumed as its escape sequence — so every MSI since v3.4.0 created a literal `HKCU\Software{{manufacturer}}{{product_name}}` key instead of the intended path. Both backslashes are doubled, matching every other key in the template. The stale key on already-installed machines is not cleaned up — see Upgrade notes. (#6283)
- **Proxy Takeover Restore No Longer Wipes the Official ChatGPT Login**: The takeover restore backup is a snapshot from when takeover started; if you ran `codex login` while takeover was active, every restore — stopping takeover, quitting the app, crash recovery — overwrote the fresh login with the pre-login snapshot, and automatic re-takeover on startup made the wipe repeat every restart. Restore now arbitrates: live login material always wins (only Codex itself can advance it, so it is always newer than the snapshot), and the backed-up third-party API key is preserved by demoting it into config.toml instead of clobbering auth.json. A login already destroyed by an earlier release is not restored — run `codex login` once. (#6277)
- **Environment Check No Longer Hangs on "Update All" or Conflict Diagnosis**: A refactor that shipped in v3.19.2 spawned the PATH-probe login shell into a background process group that still held the controlling terminal, so on an instance started from a terminal, job control stopped the shell with SIGTTIN and the untimed wait never returned — freezing the whole preflight. Even where that could not happen (a normally launched build has no controlling terminal), the path carried no deadline at all, Windows included, so one hung probe — a blocking `.zshrc`, a `--version` that never exits — froze the run just the same. Probes now run in a fully detached session with stdin nulled and a 10-second deadline that kills the whole process tree; a lost probe degrades that one tool's report instead of hanging the run, and the buttons show a spinner during the probe phase instead of appearing to ignore the click. (regression from #5522)
- **macOS IME Input No Longer Corrupts Provider Form Fields**: With a Chinese/Japanese input method, fast typing into provider form fields intermittently duplicated and reordered characters — in the reported reproduction, a 12-character value ballooned to 1,396 characters. Controlled inputs were writing parent state back into the DOM while the IME still owned the composition range, and the provider-key fields even ran their lowercase-and-strip normalization on every intermediate composition state. A shared IME-safe input now keeps composition text local until it commits, applies normalization only to the finished text, and force-commits pending text when focus leaves mid-composition (a WebKit window-switch path that never delivers `compositionend`). Applied to the shared name/notes/website fields of every app and the Hermes, OpenClaw and OpenCode field sets, where the corruption was reported. Values already saved corrupted stay corrupted — re-edit them once. (#6308, #6333, #6507)
- **Thinking-Switch Dialects Corrected for ModelScope, Novita and Nvidia**: All three aggregator presets declared the Zhipu-style `thinking:{type}` object none of these platforms documents: on ModelScope and Novita the toggle did nothing, and on Nvidia NIM the injected field could be rejected outright, since its per-model OpenAPI forbids unknown top-level fields. ModelScope and Novita now send the `enable_thinking` boolean their platforms document; Nvidia's switch is withdrawn entirely, because the real control is out of the parameter's reach. The platform inference table gained a ModelScope branch, so hand-created ModelScope providers with no stored declaration are corrected immediately; providers created from the old presets keep the wrong dialect until the preset is re-added.
- **StepFun Reasoning Effort Reaches step-3.7-flash**: The StepFun inference branch only granted effort to the 2603-suffixed models, so the effort selected in Codex was silently dropped for step-3.7-flash; it now passes through verbatim (low/medium/high), while the 2603 models keep their two-tier mapping and the suffix-less step-3.5-flash deliberately gets no effort field at all — StepFun documents no effort control for it, and no way to disable thinking anywhere in the family.
- **SiliconFlow and ModelScope Presets Pointed at Models That Do Not Exist**: A vendor-catalog audit found the SiliconFlow presets shipping a MiniMax id absent from both sites — the first request failed with 400 "Model does not exist" — and the ModelScope preset pointing at a GLM id unavailable on its free route. The presets now ship `Pro/MiniMaxAI/MiniMax-M2.5` (.cn), `MiniMaxAI/MiniMax-M3` (.com, with its real 1M window) and `ZhipuAI/GLM-5.2`, across all seven apps that carry these providers. One known leftover: OpenClaw's copies still carry the previous model's cost figures, pending a separate re-audit.
- **OpenCode Zen Reasoning Effort Reaches the Gateway**: With the OpenCode Go preset in routing mode, the reasoning level chosen in Codex never reached the gateway as chosen: on the GLM/Kimi/MiMo models the proxy fell back to model-vendor heuristics, dropped the level and sent a Zhipu-shaped field the gateway ignores, and on the DeepSeek models it sent the DeepSeek dialect's coerced value instead of the picked one. A platform rule for `opencode.ai` now sends top-level `reasoning_effort`, clamped per model to the tiers that model declares (via the per-model reasoning levels above), and sends nothing for models with no effort control rather than guessing. Existing providers need the preset re-added once to carry the per-model tier table — until then no effort field is sent at all. (#6123, #6112)
- **DeepSeek Cache-Hit Tokens Counted on the Chat Path**: Relays that forward only DeepSeek's documented `prompt_cache_hit_tokens` — without mirroring it into the OpenAI-style field — had their cache hits recorded as zero, overstating cost by pricing hit tokens as fresh input. The field now sits at the end of the standard fallback chain, on both the usage parser and the synthesized Codex usage. (#6126, #6073)
- **Grok Build Conversations No Longer Fail on a Missing Usage Field**: A Grok Build provider on a Chat Completions upstream failed with "missing field `input_tokens_details`" on every turn the upstream reported no cache tokens — with the reported GLM-5.2 upstream, which always sends `cached_tokens: 0`, that was every turn. The Chat→Responses usage translator only emitted that object when cache tokens were present, and the Grok client requires it; it is now always emitted, on the streaming path too. (#6423, #6140)
- **Usage Trend Tooltip and Highlight Agree Across Years**: On a range spanning multiple years, hovering highlighted a point from one year while the tooltip described another: the chart keyed its X axis on the localized MM/DD label, so buckets from different years shared one category value and the chart library's active-point lookup returned the first match — the highlight snapped to the earlier year's point while the tooltip followed the cursor (the plotted points themselves were always in the right place). The axis now keys on the backend's full bucket timestamp, with tick labels and tooltips resolved separately (and a year shown when the range crosses one). (#6337, #6302)
- **Zhipu Quota Tiers Reappear After the CREDIT_LIMIT Rename**: Zhipu renamed the quota entry type on the mainland endpoint from `TOKENS_LIMIT` to `CREDIT_LIMIT`; the parser filtered on the old value alone and dropped every tier, leaving the panel empty. Both values are accepted now. (#6160, #6153)
- **Grok 4.5 Cached Rate Corrected; Grok 4.6 and a DeepSeek Alias Priced**: `grok-4.5` had been seeded with grok-4.6's $0.50 cached-input rate; it is corrected to the actual $0.30, with a guarded repair for existing databases. `grok-4.6` is seeded at $2/$6 with $0.50 cache read — the base tier: xAI doubles every Grok 4.5/4.6 rate above a 200K prompt and the table has no tier column, so long-context Grok requests read at about half their billed cost. And `deepseek-v4-flash-0731` — a 4-digit date variant the id normalizer cannot strip, so it matched no pricing row and billed at $0 — gets its own row; previously-zero rows for it are backfilled at the current rate, so historical totals for that model rise.
- **SQL Backups Round-Trip Every Value, and Truncated Imports Are Rejected**: Four defects in the SQL dump/import cycle: TEXT values with non-UTF-8 bytes aborted the export while a NUL byte silently truncated the statement; REAL values lost their storage class (infinities, negative zero, integral REALs); AUTOINCREMENT high-water marks were re-derived from surviving rows instead of preserved; and a restore left the database's `auto_vacuum` mode downgraded, which the next launch repaired with a full VACUUM rebuild. All four are fixed. Validation also moved before table creation: a truncated SQL file — or one missing CC Switch's core tables — is now rejected with the live database untouched, where before schema migration could fabricate the missing tables and let partial data replace your database. A genuine export with no providers or MCP servers now imports instead of being refused. (#6146)
- **Backup Files Are Published Atomically and Never Deleted Out From Under a Restore**: A backup used to be created at its final name before any page was copied, with the copy result ignored — an interrupted copy became an apparently valid backup file. Backups are now built in a temp file, integrity-checked, and only then published without clobbering. Restores validate the whole image — integrity, schema tables, migrations — in a staging database before the live database is touched, so a corrupt or newer-schema backup fails cleanly instead of being discovered mid-replacement; and retention now protects both the backup being restored and the fresh safety snapshot, which a small retain-count setting could previously delete at exactly the wrong moment. (#6146)
- **Restoring a Backup Now Rebuilds What Depends on the Database**: Restoring a `.db` backup changed only the database — every app's live config file kept its pre-restore content until the next manual provider switch, and the post-import routine after SQL imports and cloud downloads ran against a throwaway state object whose cache invalidations reached nothing. All restore paths now project the restored database outward — the live configs of every managed app except Pi (whose `models.json` stays the source of truth and is re-imported on next launch), per-app prompt files, the runtime log level, and the tray's usage cache — and re-apply your local settings file and user-owned model-pricing overrides on top of the restored rows; one app failing no longer silently skips the rest. (#6147, #6129)
- **Sync, Restore and Skills Operations Run Strictly One at a Time**: WebDAV and S3 each held their own lock, so two transports could restore concurrently; the post-download projection ran outside any lock; manual imports and `.db` restores took no lock at all; and the Skills files shared no lock with the database rows they mirror, so a snapshot could capture the two mid-change. One global sync lock now serializes every path end-to-end, a Skills state lock keeps rows and files moving together, and auto-sync suppression starts only when a download actually begins rather than while it waits in queue — so local edits made during the wait are no longer silently swallowed. Session-log read cursors are also excluded from cloud snapshots now: they are absolute local file positions, and importing another machine's cursors desynced local usage ingestion. (#6147, #6129)
- **A Skill Whose Files Are Missing Shows as Updatable**: Update checks trusted the database-cached content hash without ever looking at the filesystem, so a skill whose files were gone — typically after a cross-machine database restore, which moves rows but not files — permanently reported "no update", and the only recovery was uninstall-reinstall. The check now verifies the skill's directory exists before trusting the cache; a missing directory surfaces as an available update whose install rebuilds the files. This covers repo-installed skills — locally created skills are not update-checked at all, so missing files there still need a manual re-add.
- **OpenClaw "Set as Default" Asks Which Model and Preserves Your Fallbacks**: Setting a provider as default always picked its first model and replaced whatever fallback chain `openclaw.json` contained with a synthetic one. Multi-model providers now get a picker, and the write merges into the existing default-model block, preserving fallbacks and unknown keys. (#6201)
- **A User-Owned Codex `model_catalog_json` Is No Longer Overwritten**: Switching providers unconditionally repointed `model_catalog_json` in `~/.codex/config.toml` at the app-generated catalog, discarding a custom catalog path. The pointer is now claimed only when absent or already CC Switch's own filename. Prevention only: a pointer already rewritten by an earlier version is not restored — see Upgrade notes. (#6087)
- **Restored Angle-Bracket Text in the Mirrored DeepSeek Codex Catalog**: The bundled mirror of DeepSeek's official Codex catalog had been extracted with HTML unescaping applied before tag stripping, so literal angle-bracket text inside four harness strings was swallowed as markup — mangling an instruction sentence and a markdown-link example in `base_instructions` and the message template of both models. The mirror is byte-faithful again, and existing DeepSeek native-Responses providers pick it up on their next switch with no re-save.
- **Volcengine Ark: the Agent Plan Preset Now Actually Targets Agent Plan**: The preset named for Agent Plan pointed at Coding Plan where it mattered — the endpoints and the invite link — and the two plans are separate subscriptions that do not share quota. It is split into two presets across six apps: Agent Plan on `/api/plan[/v3]` (native Responses on Codex) and Coding Plan on the old `/api/coding[/v3]`. Plan-quota detection is widened to recognize the Agent Plan endpoints, which takes effect immediately for stored providers; the presets themselves apply to newly created ones — an Agent Plan subscriber with an old provider should re-create it or edit the base URL. (#6070, #6448)

### Security

- **Model-Fetch Errors No Longer Echo Credentials**: A failed "fetch models" call could reflect the API key back into the visible error message, and masking elsewhere only engaged on secrets of eight or more characters. Fetch error bodies now pass through strict redaction that hides the key — and the custom header values this release newly lets you send — down to one character, for every app's provider form. The fetch itself also became format-aware for Pi: the credential header follows the provider's API format, and validated custom headers are supported, including header-only authentication. (#6064)

### Internal

- **CI Runs Only the Checks a Pull Request Affects**: A path-filter job classifies PRs into frontend/backend and skips the other side's jobs; docs-only PRs skip both. Pushes to main still run everything to keep shared caches warm, and any workflow edit runs the full matrix. The i18n labeler glob was also pointed at the real locales path, so the label fires for the first time.
- **Windows Backend Tests Run Against a Real WSL2 Filesystem**: The class of bug behind the v3.19.2 WSL write regression had no coverage — CI never touched a `\\wsl.localhost` path. Every PR that touches backend code now runs an atomic-write contract test against a real WSL2 distro on the Windows runner, and a nightly workflow runs the full backend suite against a WSL2-backed home (it takes 50+ minutes on the 9P filesystem, too slow per-PR). (#6233)

### Upgrade notes

- This release migrates the database schema from v16 to v17 (a new session-usage dedup ledger for the Pi importer); a pre-migration backup is created automatically. After running this version once, older CC Switch builds refuse to open the database — downgrading requires restoring that backup.
- Pi appears as a new app tab by default. On first launch, providers already written in `~/.pi/agent/models.json` are imported as manageable cards; the first usage sync scans all discoverable Pi sessions and backfills historical usage, so dashboard totals can jump. Pi's own login, default provider and default model are never touched. A Pi `sessionDir` configured as a relative path cannot be enumerated — set an absolute one for the session browser and usage import.
- If you are on v3.19.2 with a WSL-hosted config directory, existing configurations cannot be updated or switched on that version — upgrade directly to this release.
- Windows machines installed from any MSI between v3.4.0 and v3.19.2 keep a stale `HKCU\Software{{manufacturer}}{{product_name}}` registry key after upgrading; the fix does not delete it. Remove it manually with regedit if you want it gone — note that deleting it may trigger a one-time Windows Installer repair prompt, since it was registered as the install's key path.
- ChatGPT accounts signed in to the Auth Center before this release predate the persisted id_token and show a "Re-login required" badge; sign them in once more before binding them to a provider card. A ChatGPT login already wiped by the pre-fix takeover-restore bug is likewise not restored — run `codex login` once.
- If the built-in Codex official card was in your auto-failover queue, it is now filtered out and Auto mode will not start from an official card; pick a third-party Codex provider as the primary instead.
- On WSL or exFAT config directories, stopping Codex takeover now refuses the restore with a clear "filesystem does not support safe recovery" error instead of risking a half-written auth file. Nothing is deleted, but the pre-takeover credentials are not written back either — run `codex login` again afterwards, or keep the Codex directory on a filesystem that supports the safety probe.
- Preset changes apply only to newly created providers — a stored provider keeps the settings it was created with. That covers, in this release: the Volcengine Agent Plan endpoints, the ModelScope/Novita/Nvidia thinking dialects, Kimi reasoning effort, BytePlus native Responses, the SiliconFlow/ModelScope model-id replacements, OpenCode Go's direct connection and 1M context window, the pre-filled reasoning tiers, and RunAPI's new domain. Re-create the provider from the preset (or edit the relevant field) to pick these up. Exceptions that do apply to existing providers immediately: the Kimi passthrough change, the platform inference corrections (ModelScope, StepFun, opencode.ai) for providers without a stored reasoning declaration, quota detection for Volcengine Agent Plan endpoints, and the corrected DeepSeek vendor catalog on the provider's next switch.
- If an earlier version already rewrote `model_catalog_json` in `~/.codex/config.toml`, this release does not restore your original pointer — point it back at your own file once, and it will be left alone from then on. While it points at a user-owned file, CC Switch's per-provider model table (display names, context windows, reasoning levels) does not reach Codex.
- Saving an existing Grok Build provider through the form now pins its stored `api_backend` to `responses` — written to the live config immediately if it is the current provider, otherwise on the next switch to it; the upstream protocol is set via Advanced → Upstream Format instead.
- Text corrupted by the IME bug before this release stays corrupted in the database and live configs — re-edit the affected provider name/key/model fields once.
- DeepSeek V4 costs in the dashboard rise sharply going forward — roughly 3x on input, 4.5–4.7x on output, and 5x (Flash) to 12x (Pro) on cache reads; that is the vendor's new peak-tier list price, not an accounting change. Costs are frozen at log time, so history is not re-priced — except that previously-unpriced `deepseek-v4-flash-0731` rows are backfilled from $0, at the current peak-tier rate rather than what DeepSeek charged at the time, so those historical totals read high. Manually edited prices are never touched. Gemini 3.7 Flash is seeded at its introductory price, which the vendor lists through 2026.
- SQL backups exported by earlier versions keep their old fidelity loss — export a fresh backup if you rely on exact round-tripping. A truncated or table-missing SQL file is now rejected at import where an earlier version might have accepted it; and restoring a `.db` backup now rewrites the live config files of every managed app except Pi from the restored database, where it previously changed only the database.
- With WebDAV/S3 auto-sync enabled, project-profile edits now queue snapshot uploads they previously did not.
- Claude Code WebSearch requests carrying constraints the Responses API cannot represent (`blocked_domains`, non-direct callers, `response_inclusion`, or `max_uses` on Codex OAuth without forcing the tool) now fail with an explicit error instead of searching more broadly than asked; Chat-format upstreams still do not serve hosted WebSearch.
- If a Kimi endpoint starts returning thinking-related 400 errors after upgrading, first check the `thinking`/`reasoning_effort` fields the re-added presets now send — Moonshot's parameter page and its Codex integration guide disagree on whether kimi-k3 accepts `thinking`, and the presets follow the guide. Only a 400 demanding that thinking history be passed back would point at the removed history injection instead.

## [3.19.2] - 2026-08-06

Development since v3.19.1 is a correctness and hardening pass, with the management UI picking up its two most-requested conveniences. The headline fix is to Codex usage accounting: a rollout file that interleaves several cumulative token counters — a gateway replaying the same snapshot under different rate-limit buckets, or two genuinely distinct counters alternating — could record several times its true usage, and the importer now recognizes both shapes; replaying a real corpus of ~1,900 rollout files lands within 0.001% of an independently computed ideal recount (#3011). A six-part security hardening caps every unbounded read a contributor's audit surfaced — usage scripts, Grok session logs, catalog files, proxy response bodies and their decompression — and the deep-link import dialog now shows two credential fields it previously persisted without rendering. OMO setups regain a working integration on two fronts: when OMO's unified config (`~/.omo/omo.jsonc` or `omo.json`) exists, writes land inside it instead of the legacy file the runtime no longer reads, and the model pickers merge in whatever the installed OpenCode reports at runtime. The MCP, prompt and skill panels gain search, with bulk per-app toggles joining the MCP and skill lists; the Auth Center shows each ChatGPT account's subscription usage inline; and two write-path overhauls — batched SQL backups and batched Codex session imports — cut the worst restore, sync and reimport stalls on large databases.

**Stats**: 24 commits | 109 files changed | +12,340 insertions | -1,897 deletions

### Added

- **Search and Bulk Per-App Toggles in the Management Panels**: The MCP, prompt and skill panels gain a shared search box — Esc clears it, and it only intercepts the global back shortcut while non-empty — and the per-app count badges on the MCP and skill lists become three-state checkbox buttons that enable or disable an app across every listed entry at once. Bulk operations run sequentially rather than in parallel, because each app's live config is a single file and concurrent writes would overwrite each other; failures are collected and reported together. Deliberately, a bulk toggle acts on the full list, not the search-filtered subset. Two database-layer fixes ride along: MCP toggles moved from read-whole-row/save-whole-row to a single-column atomic UPDATE, closing a pre-existing lost-update race when two apps were toggled near-simultaneously, and skill updates re-confirm the record still exists with its install generation unchanged before writing, so a slow update task can no longer resurrect a just-uninstalled skill. The search index is an explicit whitelist — env values and headers are never part of the searchable text. (#5954, #5935)
- **Per-Account Subscription Usage in the Auth Center**: Settings → Auth Center now shows each ChatGPT (Codex OAuth) account's subscription usage inline, reusing the exact query the provider card footer already runs — shared by account id, cached for five minutes, fetched once on mount without polling. Frontend-only change. (#4887)
- **OMO Model Pickers Fed by the Runtime's Own Model List**: The OMO form's model selectors previously offered a static list; they now also run `opencode models` and merge in what the installed OpenCode actually reports. The helper process is sandboxed deliberately: project-level config discovery is disabled and the working directory is pinned to the OpenCode config dir, so opening a form can never execute a project's `.opencode/` plugins; it runs under a 20-second deadline, and on timeout the whole process tree is killed — process groups on macOS/Linux, `taskkill /T` on Windows, and an in-distro `timeout` for WSL installs. Any failure falls back to the static list with a warning toast. (#5522)
- **Built-In Pricing for Qwen3.8 Max**: `qwen3.8-max` is seeded insert-if-absent at $2/$6 per million input/output tokens, with $0.25 cache read and $2.50 cache write (125% of input, the official explicit context-cache rate). As always, a price you already customized is untouched. (#6053)

### Changed

### Fixed

- **Codex Usage Over-Counted When Token Counters Interleaved**: The Codex session importer derived usage deltas from a single high-water mark over cumulative totals, which double-counts when a rollout file interleaves counters — either a gateway replaying the same unchanged snapshot under a different rate-limit id, or two genuinely distinct cumulative counters alternating. Files from the field measured six to eight times their true usage. The importer now prefers each event's explicit last-turn usage and recognizes replayed snapshots by their full token signature; a snapshot is only deduplicated against the same source's own last signature or the immediately preceding token event, so a legitimate counter reset is never swallowed, and the total-only fallback keeps a single global baseline. Replaying a ~1,900-file / 1.7 GB real corpus lands within 0.001% of an independently computed ideal, and the residual differences are legitimate recoveries of counter resets the old code clamped away. Historical rows are deliberately not rewritten — see Upgrade notes. (#3011, #3015)
- **Dropped Chat Tool Calls Now Fail the Turn Instead of Faking Completion**: When a third-party Chat gateway returns tool calls without a function name, the Chat → Responses transform silently discarded them and still reported the turn as `completed` — Codex saw a successful turn with nothing left to do and ended its agent loop without any error, turning a diagnosable upstream failure into a silent stall. The transform now emits `response.failed` (streaming) or a transform error (non-streaming) when every tool call in a turn was dropped and none remains usable, gated on `status == "completed"` so that `finish_reason: length` truncation keeps its own `incomplete` semantics. All three drop sites log structured, content-free fields — call-id presence, argument byte counts, finish reason — so the upstream defect behind #4341 can finally be diagnosed from real traffic. Turns that still contain a valid tool call, text-only turns and truncated turns are unaffected. (#4341)
- **OMO Writes Went to a File OMO No Longer Reads**: OMO 4.19.3 unified its configuration into `~/.omo/omo.jsonc` (falling back to `omo.json`) and its migration renames the legacy per-app file away — after which CC Switch, which only knew the legacy path, kept writing a file outside OMO's config chain, so provider switches appeared to succeed but never took effect. CC Switch now detects the unified file and writes the OpenCode section inside OMO's `"[opencode]"` key — and only there, because OMO validates its root schema strictly and discards the entire file over any unknown root key. Edits preserve the document as JSON5: comments, key order and line endings survive, nothing is written when nothing changed, and every write is verified by re-parsing the output and comparing it semantically against the intended result — if the round-trip would corrupt the document, the write is refused and the file left untouched rather than saved corrupted (see Upgrade notes for the one known trigger). The same change also hardened atomic file writes on Windows for every managed app, replacing the remove-then-rename sequence — which had a brief window where the target file did not exist — with `ReplaceFileW`. (#5945)
- **GitHub Copilot Takeover Left Modern Claude Code Logged Out**: Current Claude Code releases show a confirmation dialog for an unrecognized API key, defaulting to "No (recommended)" — so the `ANTHROPIC_API_KEY` placeholder that Copilot takeover wrote left users in an unauthenticated session unless they overrode the default. Takeover now writes the `ANTHROPIC_AUTH_TOKEN` placeholder instead, which enters the session without any prompt; a provider whose credential field explicitly selects `ANTHROPIC_API_KEY` in the form's advanced options keeps the old behavior. The Copilot forwarding path also gains the `[1M]` context-marker strip that the other forwarding paths already had, so a `claude-*[1M]` model id no longer reaches GitHub's API verbatim. (#5832)
- **Hermes Prompts Were Written to a File Hermes Never Reads**: Hermes loads its persona file `SOUL.md` from `~/.hermes/` and never looks for `AGENTS.md` there — that name is project-level context discovered from the working directory upward. CC Switch's prompt management wrote `~/.hermes/AGENTS.md` from the day Hermes support was added, so enabling a Hermes prompt produced a dead file. Prompts now read and write `~/.hermes/SOUL.md`, and the existing back-fill still applies: a SOUL.md you wrote yourself is imported into the database before being replaced. (#5777)
- **Skill Installs Failed on Repos With a Same-Name Wrapper Directory**: Installing ast-grep's official skill failed with a missing-SKILL.md error: the repository keeps a wrapper directory named like the skill, with the real skill nested below it, and the resolver returned the first directory whose name matched. Source resolution is now anchored on SKILL.md itself — a directory without one is never selected — which also stops update checks against such repositories from reporting a permanent phantom update. (#4141)
- **skills.sh Installs of Nested Skills Produced 404 Documentation Links**: The skills.sh discovery flow reports only a skill's basename; installation resolved the real nested directory, but the stored README link was still derived from the basename guess, yielding a 404. The link is now built from the directory the installer actually resolved. The fix is install-only — records written by earlier versions keep their broken link until the skill is reinstalled, see Upgrade notes. (#6111)
- **Header Actions Clipped When Every App Was Enabled**: With all app tabs, the profile switcher and the takeover toggles visible, the header overflowed and clipped the add-provider button. Primary actions now live in a fixed cluster, and the app switcher is width-aware: apps that no longer fit collapse into a "more" popover, with the active app always kept visible.
- **Idle GPU Use From the Route Status Heartbeat**: The route status indicator's pulse animation ran even when the window was unfocused, keeping the GPU ticking for a purely decorative effect. Window focus now gates the heartbeat through a data attribute and CSS — an unfocused window freezes the animation at full opacity, and reduced-motion preferences disable it entirely. Data polling is unchanged; only the decoration pauses. (#5767)

### Security

- **Every Unbounded Read on the Audit's List Is Now Capped, and the Deep-Link Dialog Shows Two Fields It Used to Hide**: A six-part hardening pass. Usage scripts — which can arrive via deep link or a synced database — ran on an unlimited JS runtime, so a `while(true)` hung the backend thread forever; the runtime now enforces a 5-second interrupt, a 16 MiB memory limit and a 256 KiB stack. Grok session-log collection skips files over 50 MiB, bounds directory recursion at 16 levels and no longer follows symlinks, so a symlink cycle under `~/.grok/sessions` can no longer overflow the stack. A `model_catalog_json` entry naming the cc-switch catalog file used to be trusted on filename alone, wherever its absolute path led; it must now resolve inside the Codex config directory — re-checked after `canonicalize`, so a symlink cannot escape — and catalog reads are capped at 32 MiB. Proxy response bodies collected in full — non-streaming responses, error bodies and full-body validation paths — are capped at 128 MiB, enforced as chunks arrive so the connection is dropped the moment the limit is crossed rather than after the fact; streaming paths, passthrough and streamed transforms alike, are never buffered in full and carry no total-size cap. Decompression is budgeted at the decoder's read side across gzip, deflate, zstd and brotli, so a compression bomb cannot expand unchecked; an oversized body maps to a distinct 502 rather than being mistaken for a retryable network error. Finally, the deep-link provider import dialog parsed and persisted `usageAccessToken` and `usageUserId` without ever rendering them; both now display — the token masked — before you approve the import. (#5919)

### Performance

- **SQL Backups Export in Batches and Restore in One Transaction**: Two separate costs, one per direction. The dump wrote one INSERT per row, so importing a large backup made SQLite parse, prepare and finalize tens of thousands of individual statements (the dump itself already ran inside one transaction); dumps now emit multi-row INSERTs batched at 200 rows / 1 MB, cutting the statement count by two orders of magnitude and the file size roughly 4×. Separately, after every WebDAV/S3 sync import the tables that stay local are restored row by row, and each row ran as its own implicit transaction — one full journal write-and-fsync cycle per row, which is what made the periodic auto-sync freeze the app on large databases; that restore now runs inside a single transaction. Old single-row exports still import, and the new format stays within limits every shipped SQLite accepts, so backups exchange cleanly across app versions in both directions. This likely alleviates the cross-machine import hangs reported in #2100 — feedback there is welcome. (#6122)
- **Full Codex Usage Reimports Are ~3× Faster, More on Windows**: A full reimport — triggered by importing a pre-v16 SQL backup, a cursor mismatch after a cross-machine restore, or a manual rebuild — pegged one CPU core for minutes on large corpora: every token event was written in its own autocommit transaction, paying a full journal create/fsync/delete cycle per row, and every archived file re-ran a cursor-inheritance query that could not use an index. Token events now commit in batches of 1,000 with the connection lock released between batches so UI queries can interleave; the sync cursor advances in the same transaction as the final batch, so a crash can never leave the cursor ahead of the data; cursors and model pricing are preloaded once per pass; and the hot statements are prepared once and cached. A real corpus of 1,920 rollout files / 1.7 GB reimports in 11.1s instead of 36.3s on macOS (release build); Windows pays several milliseconds of fsync per row, so the absolute win there is an order of magnitude larger. Equivalence was verified by replaying the corpus before and after the change: all 82,000 imported rows byte-identical across every exported column, with identical import/skip counts.

### Docs

- **The Codex DeepSeek Routing Guide Now Matches v3.19.1's Direct Connection**: The guide used DeepSeek as its worked example for local Chat routing, which v3.19.1 made obsolete by moving the preset to native Responses. All three languages are updated, and the v3.19.1 release notes' pointer to the guide was corrected.

### Internal

- **CI Installs pnpm Through Corepack**: The workflows previously installed pnpm ad hoc; they now enable Corepack and respect the `packageManager` pin in `package.json`, so CI and local installs resolve the same pnpm version. CONTRIBUTING documents the behavior, including that a contributor's first `pnpm` invocation after `corepack enable` downloads and pins the declared version. (#5919)

### Upgrade notes

- No database schema migration in this release — `SCHEMA_VERSION` stays at 16, so no pre-migration backup is triggered.
- The Codex interleaved-counter fix corrects accounting going forward only: historical rows are deliberately not rewritten, and no automatic rebuild runs. If your dashboard shows implausibly high Codex figures and your rollout files carry the interleaved pattern, trigger a manual Codex usage rebuild after upgrading — this release's import batching makes that rebuild roughly 3× faster than it would have been. Most installations are unaffected: outside the interleaved pattern, the old and new algorithms agree to within a fraction of a percent.
- skills.sh nested skills installed before this release keep their broken README link; uninstalling and reinstalling the skill rewrites it. Updating the skill in place does not.
- The first WebDAV/S3 sync after upgrading re-uploads `db.sql`, because the dump format changed and the sync protocol hashes it as an opaque artifact — a benign, one-time retransfer.
- The Copilot `AUTH_TOKEN` placeholder applies when takeover next rewrites the live config — switching providers or restarting takeover. If you explicitly set the credential field to `ANTHROPIC_API_KEY` in the provider form's advanced options, that choice is honored unchanged.
- Unified OMO config detection is by file presence, not version: when `~/.omo/omo.jsonc` (or `omo.json`) exists, CC Switch edits it in place; when neither exists, it keeps writing the legacy OpenCode-level file as before. Known limitation: if that file contains block comments (`/* … */`), writes are refused with an error to protect the document — line comments (`//`) are unaffected. Remove block comments to switch providers until the upstream JSON5 writer is fixed.
- Bulk app toggles in the management panels act on the entire list, not the search-filtered subset.
- Proxy responses that must be buffered — non-streaming responses and error bodies — now fail with a 502 when they exceed 128 MiB instead of being forwarded; pass-through streaming responses are unaffected. Normal LLM responses are megabytes at most, so this should only trigger on a malfunctioning upstream; note that this class of failure terminates the request and does not trip failover to the next address.

## [3.19.1] - 2026-07-31

Development since v3.19.0 is a maintenance pass rather than a feature wave — and the first release in this project's history that deletes more than it adds. Three Chinese Codex gateways move onto native Responses and no longer need local routing takeover: DeepSeek connects straight to `api.deepseek.com` and brings with it a general mechanism for mirroring a vendor's own model catalog verbatim, so the GPT-5 harness and the freeform `apply_patch` registration stay self-consistent instead of collapsing into the neutral template; Volcengine's Ark Coding Plan follows now that the official documentation confirms `/api/coding/v3` serves Responses; and Tencent Hunyuan's TokenHub joins as a new preset. The correctness sweep covers four failures visible in the field: Claude Desktop usage has been counted twice since v3.18.0, once as a proxy row and once as an imported session row (#5938); switching back to the built-in official Codex provider left a third-party key in `auth.json`, so Codex authenticated to the official endpoint with the wrong credential and returned 401 without ever falling through to its login screen; `grok update` failed from Settings with a bare `os error 2` because a GUI-launched app cannot see node; and Grok Build's proxy takeover returned 404 on any non-Responses backend while every request minted a fresh session id (#5677). Rounding it out, nine interface strings that rendered as Simplified Chinese in every language are localized and the Traditional Chinese About page gains the thirty tool-manager strings it was missing, eight models that silently billed at zero gain built-in prices, deep-link import confirmations mask more and truncate less, and 3,166 lines of superseded code plus four npm dependencies are removed.

**Stats**: 12 commits | 71 files changed | +2,324 insertions | -3,680 deletions

### Added

- **Official Vendor Model Catalogs Mirrored for Native Responses Providers**: Codex reads model capabilities from a catalog file, and CC Switch generated every provider's catalog from a neutral template — which is right for an aggregator, but strips capabilities a vendor's own integration depends on. A vendor whose published catalog is bundled with the app is now mirrored verbatim instead. DeepSeek is the first: `src-tauri/src/resources/codex_deepseek_catalog_template.json` carries its `deepseek-v4-flash` and `deepseek-v4-pro` entries with `apply_patch_tool_type: "freeform"`, `web_search_tool_type: "text"`, `supports_search_tool: true`, the low/high/max reasoning levels, and the 17,644-character GPT-5 harness in `base_instructions` and `model_messages` — which has to travel together with the freeform tool registration, because the harness instructs the model to use `apply_patch`. The gate is deliberately narrow: the provider must resolve to the native-Responses profile **and** its `base_url` must be on `deepseek.com`. Matching is by host only and never by model brand, because these entries grant capabilities that an aggregator reselling the same model may not implement. Explicit per-model overrides in the provider's own catalog still win, and an unrecognised model id clones the flagship entry while keeping its own slug. Every other provider profile emits exactly the catalog it did before.
- **Tencent Hunyuan (TokenHub) Codex Preset**: A "Tencent Hunyuan" entry joins the Codex preset picker under the Opensource Official category, between Bailian and StepFun. It writes `https://tokenhub.tencentmaas.com/v1` with `wire_api = "responses"` and the `disable_response_storage = true` that TokenHub requires, declares `hy3` and `hy3-preview` at a 256K context window (rather than accepting Codex's 128K default), and marks both text-only so `view_image` payloads are never sent to a model that cannot read them. Because it is a native Responses provider, Codex talks to the gateway directly and no local routing is needed; the generated catalog uses the neutral native template, which pins `shell_type = "shell_command"` and drops the freeform `apply_patch` registration that native gateways reject. The address manager and latency test see two candidates from the start — the primary `.com` host and the official `.cn` backup. The region-scoped international site is deliberately excluded, since API keys do not carry across sites. Note that the API key must be a TokenHub key created with the Hy3 scope; Coding Plan and Token Plan subscription keys do not work against this endpoint.
- **Built-In Pricing for Eight Models That Billed at Zero**: `gpt-5.3-codex-spark`, `gemini-3.5-flash-lite`, `kimi-k2.7-code-highspeed` (2x its `kimi-k2.7-code` base, matching Kimi's Turbo pattern), `glm-5-turbo`, `glm-5v-turbo` and `qwen3.6-flash` had no row in the built-in pricing table and could not be reached by the prefix fallback, so every request against them was recorded at zero cost. Two more rows, bare `claude-opus-4-6` and `claude-sonnet-4-6`, close a subtler gap: model-id resolution strips a date suffix but never adds one, so a log row carrying the undated id matched nothing at all. All eight are seeded insert-if-absent, so a price you already customized is untouched.
- **Grok Build Joins the Failover Tabs and the Environment-Conflict Check**: The failover settings gain a fourth tab for Grok Build alongside Claude Code, Codex and Gemini, and the startup environment-conflict banner now detects a shell-exported `XAI_API_KEY` or `GROK_DEFAULT_MODEL` — variables that silently override whatever provider is selected. Detection distinguishes exact names from prefixes, so CC Switch's own `GROK_BIN_DIR` and `GROK_HOME` are not reported.

### Changed

- **DeepSeek and Volcengine Ark Coding Plan Connect to Codex Directly, Without Local Routing**: Both presets were declared OpenAI Chat, which made them takeover-required: the provider card carried the "needs routing" badge, switching with the proxy off raised the routing prompt, and every request travelled Codex → local proxy → Responses-to-Chat conversion → upstream. Both vendors now publish official Codex integrations confirming their endpoints serve the Responses API — DeepSeek's `api.deepseek.com` and Volcengine's `/api/coding/v3` — so both presets declare native Responses, the badge and the prompt disappear, and Codex connects straight to the gateway. The generated `config.toml` is unchanged in both cases, since it already emitted `wire_api = "responses"`; what changes is the catalog profile and, for DeepSeek, the context window, which moves from 1,000,000 to the vendor's own 1,048,576. BytePlus deliberately stays on Chat routing until the international site's documentation is verified separately. The Volcengine preset also gained a comment recording a billing rule worth knowing: the pay-as-you-go `/api/v3` endpoint must never be added to this preset's backup addresses, because it bills separately instead of drawing down plan quota.
- **Catalog `displayName` and `contextWindow` Are Now Explicit-Only**: Both fields previously carried local defaults — the model id and a 128,000-token window — applied before a vendor value could be consulted, so a mirrored catalog would have had its 1M window overwritten with 128K. They are now optional, with the fallbacks applied one level down at entry construction, which makes "left blank" mean "keep whatever the vendor declared". Providers that set the fields explicitly, and every non-mirrored profile, emit identical catalogs to before.

### Fixed

- **Claude Desktop Usage Was Counted Twice**: Claude Desktop traffic through the local gateway landed in the usage dashboard once as a proxy row and once more as an imported transcript row, so its tokens, cost and request counts read roughly double. The regression shipped in v3.18.0: proxy dedup ids were scoped as `session:{app_type}:{provider_id}:{message_id}` for every app except `claude`, which put `claude-desktop` in its own namespace while the transcript importer kept writing the same Claude message under the bare `session:{message_id}` shape with `app_type = 'claude'`. All three dedup defenses failed at once — the primary-key convergence that lets a proxy row absorb an existing session row, the write-side fingerprint probe, and the read-side filter, the latter two both comparing `app_type` with strict equality. The two apps now share the bare namespace again, and the two comparisons are widened by a one-way rule where a `claude` session row can be absorbed by a `claude-desktop` proxy row but never the reverse. Because the read-side filter is also what daily rollups aggregate through, already-stored duplicates stop being counted without any row being rewritten or deleted — see Upgrade notes for the retention limit on that. For Codex, Gemini and OpenCode the widened comparison collapses to the previous exact match, and quota checks keep strict app matching. (#5938, #5951)
- **Switching Back to the Official Codex Provider Stranded You on a 401 With No Login Screen**: With Codex API-key preservation off (the default), switching to a third-party provider writes that vendor's key into `~/.codex/auth.json`. Switching afterwards to a built-in official provider — whose stored credentials are empty — took the config-only write path, so `config.toml` was replaced while the third-party `OPENAI_API_KEY` stayed on disk. Codex then authenticated to the official endpoint with a foreign key and got 401, and because `auth.json` existed it never fell through to its own login screen, leaving no way out from inside the app. After a successful switch to an official Codex provider, CC Switch now deletes an `auth.json` that contains only an `OPENAI_API_KEY` with no first-class credential beside it — OAuth tokens, a personal access token, an agent identity or a Bedrock key all mark the file as real and leave it untouched, while metadata such as `auth_mode`, `last_refresh` or an account id can no longer shield a stale key. Deleting rather than writing `{}` is deliberate: an empty object resolves to ChatGPT mode without tokens and errors at bootstrap, whereas a missing file yields the login screen. The cleanup runs only after the outgoing provider has been backfilled into the database, so the removed key is preserved and comes back when that provider is selected again. Live-config reads were relaxed in the same change so the post-cleanup state — no `auth.json`, an existing `config.toml` — is no longer reported as "Codex is not installed".
- **Grok Build Upgrades From Settings Failed With a Bare `os error 2`**: Upgrading Grok Build from Settings → About failed with `Error: No such file or directory (os error 2)` and nothing else. The cause is an asymmetry between how CC Switch probes tools and how it runs them: probing goes through a login shell, which sources the user's rc files and therefore sees nvm, Homebrew and Volta, while lifecycle scripts ran under a non-login shell inheriting the narrow PATH a GUI app is launched with. That normally does not matter, because anchored commands invoke binaries by absolute path — but grok 0.2.112 moved self-update onto npm distribution, so `grok update` now spawns `npm view` and `npm i -g` internally, and npm resolves node through its own shebang. The inner spawn returned ENOENT, which grok surfaced as the bare error. Lifecycle commands on macOS and Linux now run with the login shell's real PATH merged ahead of the inherited one, read through `/usr/bin/env` rather than by echoing the variable, because fish stores PATH as a list and would emit space-separated segments. Native Grok's update additionally chains the official xAI installer as a fallback — deliberately not `npm i -g`, which shares both of the primary's failure modes; the installer is the only node-free path, lands in the same location, and rewrites the CLI's own `installer` setting back to `internal`, healing users whom an earlier npm fallback had moved onto npm distribution.
- **Grok Build Proxy Takeover Returned 404, and Every Request Looked Like a New Session**: Enabling takeover on a Grok Build provider whose API format was OpenAI Chat or Anthropic produced an immediate 404 with no failover and no usage record — takeover rewrote the base URL and key but left the backend field alone, so the CLI posted to a route the proxy does not register. Takeover now also pins the backend to Responses; the per-provider downgrade to Chat Completions still happens inside the forwarder, and the forced value reverts with the whole live config when the proxy stops. Separately, proxy session extraction recognised only Codex and OpenAI clients, so every Grok Build turn minted a fresh session id marked as not client-provided, which suppressed prompt-cache key injection and per-session grouping in the usage dashboard. Grok's own headers are now read — the conversation id first, then the session id, ignoring the per-request id — under a distinct `grokbuild_` prefix so its rows cannot collide with Codex's. (#5677)
- **Nine Interface Strings Rendered as Simplified Chinese in Every Language**: Nine strings appeared in Simplified Chinese regardless of the selected language, English and Japanese included. Each call site used the inline-default form with a Chinese literal, but the key existed in none of the four locale files — and i18next resolves a key through the language chain before it considers an inline default, so the English fallback never engaged and the Chinese literal won everywhere. The affected strings cover the Grok Build provider form's validation toast, the failover tooltip shown when an app is not yet taken over, the warning raised when stopping Claude Desktop routing while another app holds takeover and the reason line that explains why routing must start, the duplicate-provider id read failure, the empty Codex common-config error, the routing service's stop and stop-failed toasts, and the "unpriced" cost label the usage tables show for a request that carries tokens but computes to zero. All nine now exist in Chinese, English, Japanese and Traditional Chinese. (#5960)
- **The Traditional Chinese About Page Fell Back to English in the Tool Manager**: With the interface set to Traditional Chinese, the tool management section of the About page rendered in English — version rows, install and update buttons, result toasts, the install-conflict diagnosis and the entire upgrade-confirmation dialog. The panel was built out across three earlier changes that added labels to Chinese, English and Japanese only, and because i18next falls back to English rather than failing, thirty missing keys were invisible in testing. This gap shipped in every release from v3.16.0 through v3.19.0. All thirty strings are now translated, the install hint was brought in line with the other locales, and a new locale test asserts that every tool-management label exists in all four languages with matching interpolation variables, so this class of drift fails the suite instead of shipping. (#5943)
- **Seeded Model Prices Disagreed With Vendor List Prices**: Costs are frozen at log time from the built-in pricing table, so a stale seed quietly mis-bills every subsequent request. Four rows were corrected: `deepseek-chat` and `deepseek-reasoner` are now legacy aliases of V4 Flash at $0.14/$0.28 per million input/output with $0.0028 cache read (from $0.27/$1.10 and $0.55/$2.19); `minimax-m3` halves to $0.30/$1.20, the official standard tier; and `gpt-5.6-luna` drops 80% to $0.20/$1.20 while `gpt-5.6-terra` drops 20% to $2/$12, following OpenAI's 2026-07-30 price cut, with `gpt-5.6-sol` deliberately unchanged and the family's cache-write ratio preserved. The repairs rewrite a row only when all four of its cost columns still hold the exact previous built-in values, so a price you edited yourself — or one set by models.dev sync — is never touched.

### Security

- **Deep-Link Import Confirmations Mask More and Truncate Less**: A continuation of the `ccswitch://` confirmation hardening in v3.19.0. Config previews are now built by one shared module that masks secrets recursively through nested TOML tables and JSON objects, which fixes two opposite defects: a Grok Build import rendered no configuration preview at all, while a Codex import printed embedded `api_key` values in the clear. The 300-character truncation on the configuration preview is gone — the full document now renders inside a scrollable box, closing the last place the confirmation could hide part of what it was about to write. Masking itself is stricter everywhere it is used, including the MCP import confirmation: the sensitive-name matcher gained `AUTHORIZATION`, `COOKIE` and `CREDENTIAL` alongside exact matches for `AUTH` and `BEARER`, masked values reveal four leading characters instead of eight, and a value of eight characters or fewer is now replaced entirely rather than shown. Finally, the frontend Base64 decoder no longer trims surrounding whitespace, which could discard a `+` that URL decoding had turned into a space — the same class of frontend/backend decoder divergence fixed in v3.19.0, where the dialog shows one thing and the importer writes another.

### Internal

- **Superseded Code Removed: 3,166 Lines, Fourteen Modules and Four Dependencies**: A deletion pass over code that had no caller. On the Rust side it drops the provider icon inference table, a placeholder health checker, a second never-wired SSE implementation with its own stream and non-stream handlers, two unused proxy session types, and four unreferenced usage parsers along with a dead cost-calculation entry point — the live billing path, its auto-detecting parsers and session id extraction are untouched. Twenty-two `#[allow(dead_code)]` suppressions, which are why the compiler never flagged any of it, go with them. On the front end, fourteen modules with no importer are deleted, including a prompt form modal and a repository manager both superseded by panel rewrites, a duplicate proxy config hook, a circuit-breaker panel that never had an importer in the project's history, and three schema files; their strings are removed identically from all four locales. The Tauri commands behind them are deliberately kept. Four unused npm dependencies are dropped. Two icon-extraction scripts that regenerated the hand-curated icon index are removed, and the index header now states that automatic regeneration is intentionally unsupported. A companion change consolidates proxy status and takeover state onto a single React Query layer — a second, parallel set of hooks over the same commands had zero call sites, so its query keys never had an observer and the invalidations aimed at them were no-ops. Query key strings are byte-identical and the surviving hook keeps its existing poll behavior. (#5916, #5928)

### Upgrade notes

- No database schema migration in this release — `SCHEMA_VERSION` stays at 16, so no pre-migration backup is triggered.
- Claude Desktop's double-counted usage corrects itself retroactively, but only within the detail-row retention window. The fix suppresses duplicate rows at query time rather than rewriting or deleting anything, so every affected day whose detail rows are still present recovers its correct total on next launch. Detail rows older than 30 days are aggregated into daily rollups and pruned, and a day already rolled up by a build without this fix keeps its inflated figure permanently. The regression entered with v3.18.0 (2026-07-21).
- The eight newly priced models are re-costed retroactively where possible: startup backfills requests that were logged with zero cost, so dashboard totals for those models will rise. Rows already rolled up and pruned stay at zero. The four repriced models work the other way — backfill only touches zero-cost rows, so requests already logged keep the old rate and only new requests bill at the new one; historical and current spend for the same model will differ. Manual price edits, models.dev sync values and deletion tombstones are re-applied after seeding and always win.
- Preset changes apply only to newly created providers. A DeepSeek or Volcengine Ark Coding Plan provider already saved keeps its stored API format, keeps requiring local routing, and keeps its old catalog; re-create it from the preset, or switch the API format in the provider form, to get the direct connection. A provider that is already on native Responses with a `deepseek.com` base URL picks up the mirrored official catalog on its next switch without any re-save, because the gate reads the live configuration.
- `deepseek-v4-pro` cannot be used over the direct connection yet. It stays listed in the preset, and in the mirrored vendor catalog, but DeepSeek has not opened its Codex integration for that model — early August 2026 by their own estimate — so selecting it while the provider is on native Responses fails upstream. Use `deepseek-v4-flash`, which is the preset default and unaffected. To use pro today, switch that provider's API format back to OpenAI Chat and enable local routing takeover: that is the path DeepSeek took before this release, and the proxy's Responses-to-Chat conversion serves pro exactly as it did.
- The mirrored DeepSeek catalog declares a minimum Codex client version of 0.144.0, which CC Switch does not verify — the freeform `apply_patch` registration it carries needs that release or newer. The generated catalog file also grows to roughly 75 KB for the two mirrored models, since each carries the full harness text.
- Because DeepSeek, Volcengine Ark Coding Plan and Tencent Hunyuan no longer require takeover, their traffic can bypass the local proxy entirely, and per-request proxy usage accounting does not see it. The usage itself is neither lost nor indistinguishable — Codex session-log import still records it — but that path carries no provider identity: all Codex usage that did not go through the local proxy is grouped under a single `Codex (Session)` entry, official-subscription consumption included. So a provider moving from routed to direct also moves its usage out from under its own name. Model attribution is unaffected: every row keeps its model id, and the usage panel's per-model table still separates `deepseek-v4-flash`, `hy3`, `ark-code-latest` and the official GPT models into their own rows with their own token and cost figures. Keep local routing takeover enabled only if you need the provider dimension specifically — for instance to compare the same model across several aggregators.
- The stale Codex `auth.json` cleanup is gated on the incoming provider carrying the explicit official category and on the outgoing provider being backfilled successfully. An official entry created by hand without that category, or a switch whose backfill failed, still leaves the residue behind.
- Enabling proxy takeover on a Grok Build provider now rewrites its backend to Responses in the live configuration. The stored provider row is untouched and the live file is restored from its backup when the proxy stops.
- On macOS and Linux, every tool install and update triggered from Settings → About now runs with the login shell's PATH merged ahead of the inherited one, so a binary a lifecycle script resolves by name may resolve differently than before; each action also spawns one extra shell to read that PATH, which executes the user's interactive startup files. Windows is unchanged. Users on grok 0.2.112 or later may see two enumerated installations — the native one plus a global npm package that `grok update` created itself; they are kept in sync upstream and report the same version.
- Environment-conflict detection for Claude Code, Codex and Gemini moved from substring to prefix matching, so variables that merely contain an app's name — `MY_ANTHROPIC_API_KEY`, `OLD_GEMINI_API_KEY` — are no longer reported as conflicts.
- Deep-link import confirmations now reveal less of each secret than before: four leading characters instead of eight, and values of eight characters or fewer are masked entirely.

## [3.19.0] - 2026-07-30

Development since v3.18.0 is headlined by a security-hardening wave and a proxy correctness fix with immediate field impact. On the security side (#5811 and follow-ups): skill installs from GitHub repositories are hardened against zip-slip and repository-coordinate path traversal with hard archive limits; a Gemini common-config credential leak is closed and a one-time startup cleanup scrubs keys that already leaked into other providers' configs; imported SQL backups now run under a SQLite authorizer that denies `ATTACH` and every other statement that can reach outside the import database; common-config snippet handling no longer follows `__proto__` into the global prototype; terminal launch escapes project paths with POSIX single quotes so a directory name can no longer inject commands; and `ccswitch://` import confirmations show every argument, env var, URL, and the complete usage-script body — nothing hidden by truncation, nor by a Base64 variant the dialog could not decode, credential-shaped values masked — flag risky values, and import usage scripts disabled by default. On the proxy side, tool-result images are lifted out of stringified tool text and re-emitted as native media on every conversion bridge, ending the ~9,000× token inflation that pushed Codex sessions past their context window after a few screenshots (#4465, #5663). Usage statistics gain opt-in automatic price sync from models.dev with a persistent local override file (#5734), plus coverage of Grok CLI's official OAuth mode imported from session logs and SuperGrok subscription quota on provider cards. Rounding it out: in-app updates are served from a Cloudflare R2 mirror at `dl.ccswitch.io` with GitHub as fallback, Codex usage import reuses parsed parent rollouts across forked sessions (#5626), preset defaults advance to Claude Opus 5, GPT-5.6 Sol, and Gemini 3.6 Flash, the OpenClaw Kimi For Coding base URL is corrected, and the GPT-in-Claude-Code routing guide is now available in English and Japanese.

**Stats**: 38 commits | 132 files changed | +14,926 insertions | -1,415 deletions

### Added

### Changed

### Fixed

- **Tool-Result Images No Longer Blow Up Context Through the Proxy**: When a client read an image through a tool call — Codex's `view_image`, or any MCP tool that returns a picture — the proxy's protocol conversion serialized the entire image block into the text of the tool message, so the upstream tokenized the base64 payload as prose: roughly 9,000× inflation, where a single 113 KB PNG cost over 100,000 prompt tokens, and because Codex replays the whole history every turn, two or three screenshots were enough to push a session past the context limit and wedge it behind repeated 400s (#4465, #5663). The proxy now lifts media payloads out of tool results and re-emits them as native content on every conversion bridge — images everywhere, files and audio where the target protocol supports them: the two Chat bridges (Claude→Chat and Codex Responses→Chat) carry image, file, and audio parts, leaving a short marker in the tool message and attaching the media as a synthetic user message right after the tool batch, while Claude→Responses restores native `input_image` parts, Codex/GrokBuild→Anthropic rebuilds proper Anthropic image blocks, and Claude→Gemini uses multimodal `functionResponse.parts` on Gemini 3 (with `inlineData` parts for older models), accepting only inline base64 images. Detection covers typed Responses blocks, Anthropic `source` blocks, MCP `data`+`mimeType` results, and whole-string image data URLs, reached through arrays and nested `content` wrappers including inside JSON-encoded tool outputs; once an output is identified as media-bearing, residual data URLs and raw base64 blobs anywhere inside it are collapsed to a placeholder — bare base64 on its own is never treated as media. Tool results with no media keep their exact previous byte-for-byte representation on all bridges, so prompt-cache prefixes are unaffected, and the emitted media parts carry no `cache_control` markers that strict upstreams such as GLM and Qwen reject. An end-to-end run against Kimi K3 held a replayed turn at roughly 12k input tokens with a 99% cache hit, versus more than 85k of base64 text per replay before.
- **Unsupported-Image Fallback Now Reaches Images Buried in Tool Results**: The Unsupported Image Fallback setting replaces image blocks with a marker when a provider is text-only or the upstream rejects images, but it could only see images that were still structured blocks — tool-result images already flattened into base64 text were invisible to it, so a text-only upstream failed outright with no way to recover. The media sanitizer now detects and strips media inside tool outputs symmetrically on every path, so both the pre-send strip and the retry-after-rejection path can heal these turns; and because that check now looks inside tool results, a regression test pins that the reactive retry still fires only on genuine modality rejections — a context-length 400 is left alone rather than retried.
- **Grok Build Costs Overstated by the Cost Backfill**: The routine that recomputes missing costs treated only Codex and Gemini as providers whose reported input token counts already include cache reads. Grok Build uses the same convention, so any Grok Build row repaired by the backfill was priced on the full input count with cache reads billed a second time. The cache-inclusive provider set is now defined in one place and shared by the routing logger, the cost calculator, and the backfill, so the three can no longer disagree.
- **Hand-Edited Config Files No Longer Crash the App or Silently Swallow Edits**: A `~/.codex/config.toml` in which `mcp_servers` exists but is not a table made MCP sync panic mid-switch, after the database and live-config writes had already committed — leaving a half-applied switch; non-table values are now normalised to an empty table with a logged warning, in both the Codex and GrokBuild writers. Inline-table forms (valid TOML) had the mirrored problem: MCP removal silently did nothing while the UI reported success, and a `base_url` edit was written at a level Codex never reads — both now handled. An `opencode.json` whose root, `provider`, or `mcp` section is an array or scalar no longer panics; such files are rejected with an error rather than rebuilt, so the user's own settings are not destroyed. (#5811)
- **Proxy Transforms Survive Malformed Upstream Responses**: A non-object `message` or `content_block` in an Anthropic SSE stream, or a buffered body that is a top-level JSON array or scalar (what a gateway that ignores `stream: true` returns), could abort the local proxy instead of producing an error; the stream now bails out with a proper failed event. A malformed `content_block` header is additionally recovered as a text block — sanitising it to an empty object stopped the panic but silently dropped everything that followed — so the deltas after a garbled header come through, with a warning logged. (#5811)
- **OpenClaw Kimi For Coding Base URL Corrected**: The OpenClaw preset pointed at `https://api.kimi.com/v1`, the general platform endpoint, rather than the endpoint the Kimi For Coding subscription is served from, so the preset did not work with a coding-plan key. The base URL is now `https://api.kimi.com/coding/v1`, with the form placeholder and default updated to match.

### Security

- **Gemini Common Config No Longer Leaks Credentials, With a One-Time Cleanup**: The Gemini common-config extractor stripped only `GEMINI_API_KEY` and `GOOGLE_GEMINI_BASE_URL` from the shared snippet and copied every other `env` entry verbatim — but `GOOGLE_API_KEY` is a first-class Gemini credential, so one account's key (along with anything else credential-shaped) was deep-merged into every other Gemini provider using the common config and sent to that provider's base URL, which may be a third-party relay. The extractor now skips any key matching the same credential-pattern matcher the Claude extractor already uses, and the frontend snippet validator was aligned so a hand-edited snippet cannot put a key straight back. Because a Gemini snippet is never re-extracted once it exists, a one-time startup cleanup also scrubs credentials that already leaked — from the snippet, from every provider they were merged into, and from `~/.gemini/.env`, matching by key *and* value so a provider's own same-named key with a different value survives. (#5811)
- **Skill Repository Install Hardening**: Installing or browsing skills from a GitHub repository could write files outside the intended directory: archive entries were joined onto the destination path without normalisation (zip-slip), and repository coordinates were never validated, so a branch like `../../../releases/download/v1/evil` retargeted the download at an arbitrary release asset — and since skill repositories can arrive via an untrusted `ccswitch://` deeplink and are enabled by default, merely opening the Skills panel could trigger the download. Skill `directory` values from restored backups, sync snapshots, and import-from-apps were likewise joined raw, letting uninstall `remove_dir_all` outside the managed skills directory. Every sink now validates the directory name, repository owner/name/branch are whitelisted at the single download convergence point, and extraction is capped (10,000 entries, 512 MB written, 128 MB download, 4 KB symlink targets, self-referential symlinks rejected), with the new errors localized in all four languages. (#5811)
- **Deep-Link Import Confirmations Show the Whole Payload (Credentials Masked) and Flag Risky Values**: The `ccswitch://` MCP import confirmation previously rendered a single truncated `Command:` line and showed neither `args`, `url`, nor `env` — so a link carrying `command: "sh"` with `args: ["-c", "curl …|sh"]` and an `LD_PRELOAD` variable displayed as a harmless `sh`, yet was written to the live MCP files on confirm. The dialog now renders command, each argument, URL, and env vars on separate lines that wrap instead of truncating, so nothing is clipped out of view (env values whose name contains TOKEN, KEY, SECRET, or PASSWORD are shown masked, as a prefix plus asterisks), and highlights values that warrant a second look: shell interpreters invoked with inline-command flags, env vars that change how a process loads code (`LD_*`, `DYLD_*`, `NODE_OPTIONS`, `PYTHONPATH`, `PATH`, proxy vars), and endpoints pointing at loopback, private-range, or cloud-metadata addresses. The markers are advisory and never block an import — a local Ollama endpoint is ordinary usage. The provider confirmation gains the same treatment, and the "will be written immediately" warning is now shown unconditionally instead of being gated on a link-controlled field.
- **Usage Scripts From Deep Links Arrive Disabled and Their Code Is Shown**: A usage-query script imported through a deep link is JavaScript that runs on every usage query, and it was previously possible to acquire one without ever seeing it: the backend treated the mere presence of code as a decision to enable it, and the dialog showed only an Enabled/Disabled badge. Scripts now default to disabled — a link must explicitly carry `usageEnabled=true` — and the confirmation displays the complete decoded script in a scrollable code block with a warning that it will execute once enabled. Decoding failures fall back to displaying the raw payload, so a malformed script can never read as "there is no script".
- **URL-Safe Base64 Payloads Could Blank the Confirmation Dialog Entirely**: The two entries above make the confirmation show more; this one is about the confirmation showing *nothing*. The backend accepts four Base64 variants including the URL-safe alphabet (RFC 4648 §5), while the frontend's `atob` accepts only the standard one and, on failure, returned its input unchanged instead of signalling an error — so for the same payload the backend decoded and imported successfully while the frontend held an undecodable string. Usage scripts and system prompts rendered as opaque Base64, and MCP configs were worse: `JSON.parse` threw, the component swallowed it, and the dialog rendered **"0 servers" with an empty list while the backend wrote the real entry into the live MCP files**. Substituting a single `/` for `_` in the payload was enough — the dialog went blank, the import stayed fully functional, and the complete-payload display added above was defeated along with it. The frontend decoder now normalises the URL-safe alphabet before decoding, so the confirmation always matches what will be imported, and the shared decoder gained its first unit tests — with in-test preconditions asserting each sample really exercises the URL-safe path rather than happening to encode identically under both alphabets. Affected every release from v3.8.0 onward; see Upgrade notes for what to check.
- **SQL Import Rejects Statements That Reach Outside the Import Database**: Importing a database backup validated only the file's header comment and then handed the entire text to `execute_batch`, so a crafted backup could `ATTACH DATABASE` and create a SQLite file anywhere the user can write — a side effect that landed even when the import as a whole failed, and one reachable through WebDAV/S3 sync snapshots too. A SQLite authorizer is now installed for the duration of the external batch only, denying `ATTACH`/`DETACH`, `VACUUM`, virtual-table creation, and any action SQLite reports as unknown (fail-closed), with PRAGMAs limited to the two the exporter actually emits.
- **Prototype Pollution in Common-Config Snippet Handling**: The three walkers that apply, remove, and compare common-config snippets all followed `__proto__` into the global `Object.prototype`, so a malicious snippet — reachable via WebDAV/S3 sync, since the `settings` table is overwritten by whatever the remote sends — could write attacker-chosen values onto the global prototype the moment a provider form was opened. All three walkers now skip `__proto__`, `constructor`, and `prototype`; the "common config applied" comparison also now requires own properties, fixing a visible quirk where `{"__proto__":{}}` counted as a subset of every config.
- **Command Substitution via Project Directory Names on Terminal Launch**: Resuming a session in an external terminal built the `cd` line with double-quote escaping, which stops spaces but not `$(…)`, backticks, or `$VAR` — and the value is the real project path recorded in the CLI's session history, which may legitimately contain those characters. Any project folder named that way executed the embedded command in the user's terminal on Resume. The three launchers that build a shell line — Terminal.app, iTerm, and kitty — now use POSIX single-quote escaping, where nothing expands, including through the AppleScript quoting layer; Ghostty, WezTerm/Kaku, and Alacritty were already safe because they pass the directory as its own argument.
- **GrokBuild Credential Resolution No Longer Substitutes Environment Secrets**: GrokBuild credential extraction fell back to the process-wide `XAI_API_KEY` whenever the configured `env_key` variable was unset, silently sending a different account's key to whatever base URL the config pointed at; credentials now come only from an explicit inline `api_key` or the exact variable named by `env_key`. Deep-link import no longer resolves environment variables into a plaintext `api_key`, and a link whose only credential is an `env_key` name is rejected with a message to add the provider manually. As a side effect, base-URL resolution was decoupled from credential resolution, fixing a macOS quirk where a missing credential also blanked the base URL shown in the UI and used by usage scripts. (#5811)

### Docs

- **Claude Code GPT Routing Guide Now in English and Japanese**: The local-routing guide for running GPT-family models inside Claude Code, previously Chinese-only, is now fully ported to English and Japanese, covering both integration paths end to end (a third-party OpenAI Responses gateway with an API key, and a ChatGPT Plus/Pro subscription via the Codex device-code OAuth flow). Both routing guides were retitled to name the models they are about — "Using GPT Models in Claude Code with CC Switch" and "Using Claude Models in Codex with CC Switch" — and every cross-link, including the v3.18.0 release notes in all three languages, now points readers at their own-language copy.
- **Corrected the Deep-Link `usageEnabled` Default in the User Manual**: The deep-link reference in all three user manuals claimed `usageEnabled` defaults to `true`; it actually defaults to `false`, matching the importer. The manuals now state the correct default and document that the script body is shown in full before import and stays disabled until explicitly enabled.
- **Security Policy Documents the Threat Model and Reporting Scope**: `SECURITY.md` gained a bilingual threat model with explicit in-scope and out-of-scope lists, so reports are triaged by who controls the input rather than which API a value eventually reaches: the bundled WebView renderer is declared a trusted component (with the four independently checkable facts backing that and the triggers that would void it), while deep-link payloads, WebDAV/S3 restore data, imported files, upstream API responses, and inbound requests to the local proxy are all named as untrusted and in scope. The same reasoning is recorded as a doc comment on the terminal-launch command.

### Internal

- **Release Assets Mirrored to Cloudflare R2 for ccswitch.io Downloads**: Release automation mirrors every installer to an R2 bucket behind `dl.ccswitch.io` and generates the manifest the ccswitch.io download page consumes — per-file SHA-256 checksums, sizes, and the release's real publish date — with immutable caching for versioned assets, a five-minute TTL on the root manifest, and pruning beyond the five most recent versions. Forks without the R2 credentials skip the sync entirely.
- **Skill ZIP Extraction Tests No Longer Hijack TMPDIR**: Two cleanup-guard tests pointed the process-global `TMPDIR` at a scratch directory and asserted it ended up empty, so any concurrently running test that created a temp directory randomly failed the assertion on Ubuntu and macOS CI. The extraction now takes its temp base explicitly through a test seam and the tests use a private directory; the shipped code path is unchanged.

### Upgrade notes

## [3.18.0] - 2026-07-21

**Stats**: 52 commits | 217 files changed | +21,452 insertions | -6,285 deletions

### Added

### Changed

### Fixed

- **Codex Fork/Sub-Agent Rollouts No Longer Import Replayed Parent History**: Fixes the v3.17.0 usage inflation where forking a Codex task or spawning a sub-agent in copy mode re-counted the parent conversation's token history as new usage — reports showed single days jumping by billions of tokens, duplicated parent/child rows that were byte-identical, and empty forks carrying usage they never consumed. Fork and sub-agent rollout files begin by replaying the parent thread's history, and the previous parser located the takeover boundary heuristically (first `thread_settings_applied` event, object-shaped `subagent` source markers): the boundary landed too early when the parent's own settings changes appeared in the replay, and was missed entirely for the current string-shaped source format, importing the whole replayed parent history. The parser now identifies a fork only by explicit parent identity — `forked_from_id` on the child's `session_meta` or `source.subagent.thread_spawn.parent_thread_id`, with a conflict between the two deferring the file — anchors each thread's identity to the rollout filename UUID, loads the parent rollout's own pre-fork token-count sequence, and strips the child's replayed prefix by aligning token signatures against it, so replayed events only restore the cumulative baseline and are never inserted as rows. Sub-agent logs that carry no replayed history are now counted as live usage, fixing the opposite-direction undercount where real sub-agent consumption was skipped as suspected replay. (#5335, #5433, #5381)
- **Proxy Usage Logging Is Now Idempotent With Stable Response-Scoped Keys**: When a terminal usage event carried no message id — the norm for Codex `/responses` traffic through the local proxy — the dedup key fell back to a random UUID, so every retry or replay of the same upstream response minted a fresh key and `INSERT OR REPLACE` stacked a new row each time; one reporter's database held the same usage combination 2,078 times. The parser now derives the key from the response envelope itself — the Codex `response.completed` event's `response.id` (`response.created` ids are discarded), Chat Completions `chatcmpl` ids, and the Gemini `responseId` — scoped as `session:{app_type}:{provider_id}:{id}` so the same response replayed against a different provider during failover still bills once per provider without cross-provider collisions (Claude keeps the bare `session:{id}` shape so proxy rows continue to converge with session-log imports). When no envelope id exists at all, the fallback is a deterministic SHA-256 over the response's usage semantics rather than a random UUID — an identical replay must collide into the same key for dedup to work — and the final database write is a guarded insert-if-absent within the dedup window instead of an unconditional REPLACE. (#5496)
- **Usage Page No Longer Freezes During Large Session Imports**: Opening the usage page while a big import ran could lock up the UI: every inserted row fired a refresh notification, each notification made the frontend re-run all ~10 usage queries, and those queries contended with the importer for the single database connection while it parsed rollout files tens of megabytes large line by line — on duplicate-inflated databases the row storm compounded all three. Session sync now notifies the frontend once per completed sync pass instead of once per row, all session importers are serialized behind a single-flight lock (a manual "sync now" queues behind the running pass instead of racing it), the blocking parse work runs on a dedicated blocking thread so it no longer starves the async runtime driving the UI's commands, and the 60-second background tick skips missed runs instead of bursting to catch up.
- **Codex 0.144.5+ No Longer Fails to Start on CC Switch-Generated Model Catalogs**: codex ≥ 0.144.5 parses external model catalogs strictly and rejects the whole file when an entry is missing `supports_reasoning_summaries` — so both the Codex CLI and desktop app failed to launch, and deleting the generated catalog didn't help because any provider save regenerated it the same way. The root cause is that CC Switch clones its catalog template from the machine-shared `models_cache.json`, whose field set is whatever the last-writing codex process produced — a coexisting older codex build kept rewriting the cache without the field the newer parser requires. Generated catalogs now backfill parser-required fields from the bundled static template, only when absent (dynamic values always win), and deliberately do not backfill optional capability fields whose "missing = parser default" semantics must survive.
- **Windows: No More Console Flash or UI Freeze When Switching Providers**: Switching providers or toggling takeover on Windows flashed a transient console window and froze the UI for up to ~2 seconds. Three causes, three fixes: the `codex debug models --bundled` probe launches `codex.cmd` through `cmd.exe`, which in a GUI-subsystem app spawns its own console — the child process is now created with `CREATE_NO_WINDOW`; the model-catalog template was regenerated on every switch — it is now cached process-wide after the first successful load (failures stay retryable so a bad first probe cannot poison the cache), so the Codex CLI starts at most once per app run; and `switch_provider` was a synchronous command running on the main thread — it is now async with the real work on a blocking thread, still serialized by the per-app switch lock. The freeze fix benefits all platforms; the console-flash fix is Windows-specific.
- **Codex Tool Schemas With Null, Missing, or Union Parameter Types Are Accepted by Strict Upstreams**: Built-in Codex tools such as `codex_app__automation_update` declare `parameters: null` (or `type: null`), which strict OpenAI-compatible upstreams like DeepSeek reject with a 400 for the entire request, killing tool-using sessions routed through the proxy. The Responses→Chat bridge now normalizes every tool's parameters to a `type:"object"` schema — null or missing parameters (including the nested-form missing case) become `{"type":"object","properties":{}}`, a non-object `type` (including `type: null`) is coerced to `"object"` in place, and top-level `oneOf` union schemas get a root `type:"object"` added while their branches are preserved untouched. The same object-type guarantee was extended to the Codex→Anthropic tool path's `input_schema`. Existing `properties`/`required` are never dropped. (#4706, #5315; issues #4705, #4783)
- **Reasoning Models Keep Their Thinking Across Multi-Turn Codex Chat Conversations**: With a reasoning model (e.g. kimi-k2-thinking) behind the proxy's Responses→Chat bridge, multi-turn history mangled the thinking: each turn's `reasoning` item was glued onto the tail of the _previous_ assistant message, leaving the following assistant turn with no `reasoning_content` — models would visibly break off mid-conversation. Responses semantics place reasoning _before_ the message it belongs to, so the bridge now attaches reasoning forward to the assistant message or tool call that follows it; genuine trailing reasoning back-attaches only at the true tail (end of input, or a turn boundary such as an incoming user message — where it was previously silently discarded), appending to any embedded reasoning already present, and pending reasoning is always consumed at boundaries so it can never leak across a user turn into a later assistant message. (#5508)
- **Streamed Parallel Tool Calls Keep Their IDs and Their Order**: Two bugs in the Chat→Responses streaming bridge corrupted parallel tool calls from upstreams that split identity across chunks: a continuation delta carrying an empty `id` overwrote the real `call_id` (the Codex client then saw `call_id:""` and couldn't match tool results to calls), and tool calls were emitted the moment they individually became ready, so a later index whose name arrived early could jump ahead of an earlier one — reordering parallel calls. Empty ids are now ignored, and emission goes through a consecutive-index gate that releases tool calls strictly in Chat `index` order, waiting on any not-yet-identified earlier index; no fake call id is ever synthesized mid-stream (only as a last resort at stream finalization, which also skips nameless calls defensively and still emits sparse indexes). (#5310)
- **Managed-OAuth Providers Are Reliably Flagged as Needing Local Routing**: The "needs routing" badge and switch-time warning were derived from the provider's API format, which is the wrong signal for managed-OAuth providers (Copilot, Codex OAuth, xAI) whose credential is injected by the proxy regardless of upstream format — a managed provider on a native format got no warning and failed silently without takeover. Routing need is now decided by a single shared predicate: official providers never need routing, managed-OAuth providers always do, and format-based rules apply only to the remaining cases per app. The switch-time gate also checks the right readiness signal per app: per-app takeover for most apps (the old gate looked only at a global proxy-running flag, missing the case where the proxy runs but the current app is not taken over), while Claude Desktop keeps watching the proxy process itself — the backend's takeover status has no Claude Desktop field, so a uniform per-app gate would have left Desktop warning forever. Claude Desktop provider forms now force proxy mode and lock the model-mapping toggle for every managed-OAuth type, not just xAI. Localized in all four locales (zh/en/ja/zh-TW).
- **Tool Updates Work When Node Lives in nvm/fnm/mise Under a GUI Launch**: Anchored npm update and repair commands invoked npm by absolute path, but npm's launcher resolves `node` via its `#!/usr/bin/env node` shebang against PATH — and a GUI-launched app inherits only the system PATH, not the user's version-manager directories, so updates silently failed for tools installed via nvm/fnm/mise. Every anchored npm invocation now prefixes PATH with npm's own sibling `bin` directory, so both npm and its shebang resolve to the same Node install; the Codex self-repair (uninstall + reinstall) path is covered too.
- **Deleted Default Skill Repositories Stay Deleted**: Default Skill repositories were re-seeded on every startup by a "supplement missing defaults" pass, so a default repo the user deleted silently returned on the next launch. Seeding is now one-time per database, tracked by a settings flag; databases that already contain repositories at upgrade time get the flag set without any re-seeding, so existing selections are untouched. (#5356)
- **First-Run Tray Language Follows the System Locale**: Before any language was chosen in settings, the tray menu was hardcoded to Simplified Chinese even on English/Japanese/Traditional-Chinese systems where the main UI correctly followed the OS locale — tray and UI disagreed until the user switched language once. The tray now derives its first-run language from the OS locale with the same precedence rules as the frontend (including `zh-TW`/`zh-HK`/`zh-Hant` → Traditional Chinese); an explicitly chosen language always wins, and unreadable locales fall back to Chinese as before. (#4355)
- **Failed Live-Config Imports Show the Real Error and Refresh the List**: Every failed "import from live config" produced an empty error toast, because Tauri's `invoke` rejects with the backend's error _string_ while the handler read `.message` off it; the actual backend message is now shown (with a localized generic fallback), and the provider list is refreshed even on failure so side effects committed before the error are visible immediately.
- **OpenClaw Preset Model Costs Corrected to Official List Prices**: Fifteen OpenClaw preset entries carried cost values in the wrong unit or unconverted currency — the `cost` field is USD per million tokens, but e.g. `glm-5.1` was listed at `0.001/0.001` (≈1000× undervalued, so its usage showed near-zero cost) while `deepseek-v4-pro` carried unconverted CNY values (overvalued). All entries now carry official list prices in $/M; subscription-plan and free-tier endpoints deliberately show list prices too, so plan users see the standard value of their usage. Providers created from these presets going forward get the corrected values; previously added providers keep the config they were created with.
- **AiHubMix Icon on the Codex Preset**: The Codex app's AiHubMix preset was the only one missing its brand icon fields and rendered a generic icon; it now matches the other apps.
- **Two Missing Locale Keys Backfilled in All Four Locales**: The Codex "needs routing because it uses Anthropic Messages format" toast rendered its reason fragment in Chinese inside an otherwise-localized sentence because `proxyReasonAnthropicMessages` existed in no locale file, and the provider-form key-status loading label had shipped only as a hardcoded default since April; both now exist in zh/en/ja/zh-TW.

### Docs

### Internal

- **Backend CI Now Covers Linux, Windows, and macOS**: Backend checks previously ran only on Ubuntu, so Windows/macOS-gated code paths were never compiled or tested in CI — the matrix now spans all three platforms, with the platform-gated tests repaired to pass everywhere (TOML literal-string path escapes, stale anchored-update expectations, and skill tests honoring the test home-directory override). No shipped behavior changes. (#5138)

### Upgrade notes

- Upgrading from v3.17.0 runs three schema migrations (v13 → v16): v14 rebuilds the `proxy_config` table to admit Grok Build (existing per-app proxy settings are carried over and a `grokbuild` row is added), v15 adds Grok Build enablement columns to the MCP-server and Skills tables, and v16 triggers the Codex usage rebuild described next.
- Schema v16 performs a one-time automatic rebuild of Codex session usage on first launch after upgrading: the database is backed up under `backups/`, `codex_session` data and cursors are reset, and the normal startup sync re-imports everything with the corrected parser. Expect seconds for typical data; the heaviest dataset measured (1,801 rollout files / 1.5 GB) took about 65 seconds. Later launches are incremental as before.
- The rebuild recomputes usage from the rollout JSONL files, so history whose source log was already deleted cannot be reconstructed.
- Fork files whose parent rollout is missing are deferred and reported instead of guessed; restoring the parent log and running “Rebuild Codex Usage” imports them later.
- Historical proxy-source duplicate rows are permanently retained — the migration rebuilds only session-sourced data, and no cleanup pass for past proxy inflation exists; the idempotent logger prevents new duplicates from this point on.
- The xAI Grok OAuth integration reuses the official Grok CLI's public OAuth client identity and scopes (`client_id b1a00492-073a-47ea-816f-4c329264a828`, scope including `grok-cli:access`) rather than a CC Switch-registered application. xAI may not support this use, and it could lead to account restriction or suspension — use at your own risk. The feature is entirely opt-in; nothing changes unless you add an xAI provider. On first login it creates `~/.cc-switch/xai_oauth_auth.json` (refresh tokens only, `0600` on Unix; access tokens are held in memory) and contacts `auth.x.ai` and `api.x.ai` through the configured outbound proxy, with no local callback port.
- Diagnostic logs are no longer cleared at startup and now persist across restarts (up to ~100 MB of rotated runtime logs plus ~15 MB of crash logs). Log files written by earlier versions are not retroactively scrubbed and may contain API keys, tokens, or URLs with credentials — review pre-upgrade logs before sharing them publicly.
- Installing or reinstalling Grok Build now prefers the official xAI installer, fetching `x.ai/cli/install.sh` (or `install.ps1` on Windows) at install time, with npm as fallback; existing npm installs keep updating via npm.
- New built-in pricing rows (`grok-4.5`, `kimi-k3`, `k3`) are appended automatically on next launch via insert-if-absent; user-edited pricing rows are never overwritten.

## [3.17.0] - 2026-07-13

**Stats**: 69 commits | 172 files changed | +21,067 insertions | -2,464 deletions

### Added

- **Project Profiles for One-Click, Snapshot-Based Config Switching**: You can now save the current provider, MCP, Skills, and prompt state as a named "project" and re-apply it in one click from a new header switcher or the tray Projects submenu, so moving between per-project setups no longer means toggling each dimension by hand; it covers Claude Code, Claude Desktop, and Codex (Claude Desktop's only cc-switch-managed dimension is its provider, so its snapshots capture just that and leave the other dimensions untouched on apply). Projects are global shared entities, but capture and switching are per scope — Claude Code, Claude Desktop, and Codex each keep their own `current_profile_id_<scope>` marker and only touch their own payload slots, so picking a project on the Codex tab never disturbs the Claude config (slots use `Option` to distinguish "never captured" from "captured empty", preventing cross-side accidental disable). Applying is best-effort: `ProfileService::apply` (in `services/profile.rs`) reuses the existing switch primitives — provider switch, then minimal MCP/Skills toggle diffs, then prompt enable — and any dangling reference or per-item failure becomes a warning instead of rolling back. Switching first autosaves the leaving project's current state for the active scope, so a project always holds the configuration you last left it in, which is why there is no manual "update snapshot from current state" button. Before applying, proxy takeover is unconditionally disabled per app in the scope, the frontend invalidates takeover status, and the proxy server is stopped when the switch leaves no takeovers active so Claude Desktop's local-route master toggle reads off. Backed by a new `profiles` table introduced by the v11→v12 schema migration, wired into `commands/profile.rs`, `database/dao/profiles.rs`, the tray, and `components/profiles/`, localized in all four locales (zh/en/ja/zh-TW), with integration tests covering roundtrip, dangling refs, bidirectional autosave, and proxy-takeover teardown.
- **Setting to Show or Hide the Project Switcher on the Main Page**: The header project switcher can now be turned off from a new "Show project switcher" toggle under the Homepage Display section of Settings, for users who don't use projects and prefer a cleaner header. It defaults to on (`show_profile_switcher` / `showProfileSwitcher`) so existing users keep the current behavior, and disabling it only hides the header control on every tab — projects and the tray Projects submenu remain fully usable. Localized in all four locales.
- **Route Codex Official ChatGPT Sessions Through Proxy Takeover**: CC Switch can now route a Codex session authenticated with a ChatGPT subscription (native OAuth or API-key login, no stored API key) through the local proxy, so official-account traffic gets the same proxy routing, format conversion, and usage accounting that third-party providers already receive. The built-in `codex-official` "OpenAI Official" seed is restored if it was deleted (idempotent `ensure_codex_official_provider` command wired into the add-provider flow) and is now selectable during takeover from the provider panel and tray, with the provider card badge reading "Official Account Routing" while routing and "Codex Sign-in" otherwise; only that fixed seed qualifies (`is_codex_official_provider` / `official_provider_supports_proxy_takeover`, mirrored in the frontend `supportsOfficialProxyTakeover`), so copied UUID-based official entries stay blocked and still show "No Routing Support". Instead of writing an `OPENAI_API_KEY = PROXY_MANAGED` placeholder into `auth.json`, the official route projects a dedicated `cc-switch-official` `model_provider` into `config.toml` with `requires_openai_auth = true`, `wire_api = "responses"`, `supports_websockets = false`, and `base_url` pointing at the local proxy (`apply_codex_official_proxy_route`), so Codex forwards its own ChatGPT authorization to the proxy's `/responses` endpoint and the `codex-official` row never stores a credential (its `auth` stays `{}`). The forwarder passes the client's `Authorization` header through unchanged to the fixed first-party endpoint (`CHATGPT_CODEX_BASE_URL`, now shared by the Codex and Claude adapters), rejects a missing header or a stale `PROXY_MANAGED` placeholder with an actionable error (finish the ChatGPT login / restart Codex or start a new session), and treats official `401`/`403` and auth errors as non-retryable so failover never silently moves the conversation to another account or pollutes the circuit breaker. The native login is never overwritten — takeover preserves OAuth or API-key material into the backup (falling back to live `auth.json` when the backup is missing), config transforms in `codex_config.rs`/`services/proxy.rs` now fail closed instead of swallowing errors, and stale managed placeholders left in other provider tables are cleaned; the `preserveCodexOfficialAuthOnSwitch` setting copy was updated to clarify that takeover routing always preserves the official login and the toggle now only governs direct (non-routing) third-party switches.
- **GPT-5.6 Context Window for Claude Code Codex Takeover**: When Claude Code is routed to a ChatGPT Codex (Codex OAuth) backend via proxy takeover, CC Switch now injects `CLAUDE_CODE_MAX_CONTEXT_TOKENS` and `CLAUDE_CODE_AUTO_COMPACT_WINDOW` set to `372000` into the effective live `settings.json`, so Claude Code stops assuming its default 200K window for the unrecognized GPT model id and auto-compacts before the upstream rejects an oversized prompt. 372000 matches the ChatGPT Codex catalog window for gpt-5.6 — the catalog lists a ~353K effective budget, not the 1.05M API spec — and Claude Code's built-in output reserve and compact buffer then keep the actual compact trigger below that budget. The defaults are gated on every configured model env key (`ANTHROPIC_MODEL`, the haiku/sonnet/opus/fable defaults, and `CLAUDE_CODE_SUBAGENT_MODEL`) starting with `gpt-5.6`: gpt-5.5's upstream catalog oscillates between 272K and 372K and must not inherit them; any non-gpt-5.6 or mixed mapping is skipped (and any value a legacy shared snippet dragged in is stripped), while an explicit user value always wins. The Codex OAuth presets for both Claude Code and Claude Desktop bump their default routes to the gpt-5.6 family (haiku → `gpt-5.6-luna`, main/sonnet/opus → `gpt-5.6`), the custom Codex `config.toml` template default model moves to gpt-5.6, and the Claude Code preset ships both context env keys pinned at 372000 (see the corresponding Changed entry on preset-pinned context windows). On switch-away backfill the injected values are stripped as the mirror-inverse of the injection conditions so program defaults never harden into per-provider explicit values, and both keys are held out of the shared Claude common-config snippet (`services/provider/mod.rs` strip list plus a guard in `live.rs`) because context limits must follow the actual upstream model; six Rust integration tests cover injection, user overrides, legacy-snippet strip, non-gpt5.6 skip, and the backfill round-trip. (openai/codex#31860)
- **GPT-5.6 Sol/Terra/Luna Pricing With 1.25x Cache-Write Rate**: The usage dashboard now costs GPT-5.6 traffic using seeded pricing for the three tiers — Sol at 5 / 30 / 0.50, Terra at 2.50 / 15 / 0.25, and Luna at 1 / 6 / 0.10 USD per million input / output / cache-read tokens — cross-checked against OpenAI's pricing page and OpenRouter. Unlike GPT-5.5 and earlier, whose cache writes are seeded at zero, the 5.6 family bills prompt-cache writes at 1.25x the uncached input rate, so cache-write is seeded at 6.25 / 3.125 / 1.25 for Sol / Terra / Luna. The seed set also adds the bare `gpt-5.6` id as the official Sol alias plus effort-suffix variants (`-low`, `-medium`, `-high`, `-xhigh`, `-minimal`), all priced at Sol rates and mirroring the gpt-5.5 accounting shape. Rows are applied through the seed+repair dual-write path in `src-tauri/src/database/schema.rs`: a `repair_current_model_pricing` branch corrects the earlier zero cache-write seeds for the three tiers in existing databases, matching only rows still holding the exact old input/output/cache-read/cache-write values so user-customized prices survive, and no `SCHEMA_VERSION` bump is required.
- **Native Anthropic Messages Protocol as Codex Upstream**: Codex providers can now target a gateway that only exposes the native Anthropic Messages protocol (`/v1/messages`) via a new `anthropic` value on the upstream-format selector in the Codex form; the local proxy performs bidirectional Responses↔Anthropic request, response, and streaming conversion (new `transform_codex_anthropic` / `streaming_codex_anthropic` modules). The form adds an auth-field selector — `ANTHROPIC_AUTH_TOKEN` sends `Authorization: Bearer` (default) and `ANTHROPIC_API_KEY` sends `x-api-key`, mutually exclusive — an optional Claude Code client-impersonation toggle (`impersonateClaudeCode`, off unless explicitly enabled, spoofing User-Agent / `anthropic-beta` / `x-app` / system-prompt first line and dropping Codex/OpenAI fingerprint headers), and a per-provider `maxOutputTokens` override (Codex omits `model_max_output_tokens`, so without it the path falls back to a conservative 8192 that can truncate long or thinking-heavy replies). The bridge injects standard 5-minute ephemeral `cache_control` so system/tools/history are cached rather than resent at full price, defers stripping the `[1m]` long-context marker until after catalog matching and re-emits the `context-1m-2025-08-07` beta header, gates extended thinking on the trailing turn only so history-resending sessions don't permanently lose it after the first tool call, disables native `web_search` for this profile, drops `tool_choice` when no tools survive filtering, treats a base URL already ending in `/v1/messages` as a full endpoint, and reports truncated streams as incomplete/failed instead of completed. (#5071)
- **Default Model Field for Codex Provider Form**: The Codex provider form now exposes the top-level `model` key of `config.toml` as an editable field, so users can point an existing provider at a newly released model (e.g. `gpt-5.6`) without waiting for a preset update — preset changes only affect newly added providers, while existing ones keep their saved TOML. The field syncs bidirectionally with the TOML editor (mirroring the base-URL pattern), suggests models from the mapping catalog unioned with the provider's `/models` endpoint, offers a one-click "add to mapping" action when the value falls outside a non-empty catalog, and is hidden for official providers. Save-time catalog sync now backfills the first mapping row into the top-level `model` only when the field was left empty, so an explicit value always wins over the implicit row-0 fallback; model names and `base_url` are written with TOML basic-string escaping and control characters are stripped from field input, since `/models` ids are remote data and unescaped interpolation could inject `config.toml` lines such as a forged `[mcp_servers.*]`. The strict model-line matcher (`src/utils/providerConfigUtils.ts`) recognizes escaped output, empty strings, and single-quoted literals to keep extract/set round-trips stable, and the fetched model list is invalidated (with an in-flight sequence guard) whenever request identity changes — base URL, full-URL toggle, API key, or custom User-Agent — so the dropdown never shows a previous provider's models.
- **Switch-Time Common-Config Autosync Now Covers Codex**: When switching away from a Codex provider with `common_config_enabled`, the service now re-extracts the shareable portion of its live `config.toml` into the stored common-config snippet — the same live-to-snippet sync that previously ran only for Claude — so preferences you tweak directly in the running Codex config propagate to every opted-in provider and a removed key isn't silently re-injected on the next switch. Codex was gated out before because its TOML extractor leaked provider-specific and injected content; `extract_codex_common_config` now strips top-level `model`, `model_provider`, `base_url`, and `wire_api`, the entire `[model_providers]` table, `mcp_servers` and the legacy `[mcp.servers]` form, the top-level `experimental_bearer_token` fallback (which would otherwise leak the API key into the shared snippet), the `model_catalog_json` catalog pointer, and the injected `web_search = "disabled"` sentinel, while keeping a user-set `web_search` value as a shareable preference. The sync in `services/provider/mod.rs` is scoped strictly to Claude and Codex (Gemini is still excluded), skipped when the snippet was explicitly cleared, and all failures are warn-only and never block the switch; the autosync-before-strip ordering also self-heals stale snippet values previously baked into provider snapshots, since the re-extracted snippet matches the live values and the value-match strip removes them on the same switch.
- **Claude Subagent Model Configuration**: Claude providers can now pin a dedicated sub-agent model through a new "Subagent" row in the provider form, writing the `CLAUDE_CODE_SUBAGENT_MODEL` env key so Claude Code's spawned sub-agents run on a chosen (typically cheaper or faster) model. The row supports the `[1M]` marker but has no display-name field — it renders a "Not shown in /model" placeholder since the sub-agent model never appears in the `/model` menu — and the "quick set" button now fills it alongside the other tiers. On the proxy takeover path (`services/proxy.rs`), `CLAUDE_CODE_SUBAGENT_MODEL` is added to `CLAUDE_MODEL_OVERRIDE_ENV_KEYS` so it is written when a provider configures it and stale values are cleared when a provider omits it, and the model mapper (`proxy/model_mapper.rs`) gains a `subagent_model` field that passes a request through unchanged when its model (comparing with the 1M suffix stripped) matches the configured sub-agent model, instead of collapsing it to the default-model fallback. The key is also excluded from the shared Claude common-config snippet in `services/provider/mod.rs` so it can't leak across providers, and `modelRoleSubagent` / `modelNoDisplayName` labels were added in all four locales (zh/en/ja/zh-TW). (#4830)
- **1M Context Checkbox on the Claude Fallback Model Field**: The Claude provider form's fallback model field (`ANTHROPIC_MODEL`, the "default/fallback model") now carries the same 1M checkbox that the role-specific Sonnet/Opus/Fable rows already had, so a fallback model backed by a 1M-token window can declare it instead of silently being treated as 200K. Checking the box appends the `[1M]` marker to the fallback model id and unchecking strips it, reusing the shared `hasClaudeOneMMarker` / `setClaudeOneMMarker` / `stripClaudeOneMMarker` helpers, and the checkbox is a no-op when the model field is empty. The marker is written in the documented uppercase form (`[1M]`), which Claude Code parses case-insensitively. This is a frontend-only change to `ClaudeFormFields.tsx`. (#5124, fixes #3679)
- **Zhipu (智谱) Team Plan Quota Query Support**: Added quota-query support for Zhipu's team plan (团队套餐), which the personal-plan query could not reach: it hits the same `open.bigmodel.cn` quota endpoint with `?type=2` and requires two extra request headers, `bigmodel-organization` and `bigmodel-project`, so `detect_provider` cannot tell it apart from the personal plan by base URL alone. The usage-script modal gains a "Zhipu GLM Team" template with organization-ID and project-ID inputs (preserved when switching templates), and the backend routes on an explicit `coding_plan_provider == "zhipu_team"` identifier threaded through the usage script, IPC command, and background query path; the new `query_zhipu_team` in `services/coding_plan.rs` pins the CN site, appends `?type=2`, and shares response parsing (`zhipu_quota_from_body` / `parse_zhipu_token_tiers`) with the personal plan. All three of API key + organization ID + project ID are required — missing any one returns a NotFound that prompts the user to complete them (identifier match is case-insensitive) — and new copy was added across all four locales (zh/en/ja/zh-TW). (#5128)
- **OpenCode Provider Form Gains Headers and Per-Model Token-Limit Editors**: The OpenCode provider form now exposes two previously unreachable config fields as structured editors: a Headers section for the provider's `options.headers` (arbitrary HTTP headers like `HTTP-Referer` or `X-Title` sent with provider requests) with add/remove rows and case-insensitive duplicate-name rejection that reverts the input on conflict, and per-model Token Limits (Context and Output number inputs writing `model.limit.context` / `model.limit.output`, where clearing the field removes it and negative or non-finite values are rejected while valid ones are truncated to integers). The Extra Options block was reworked into a collapsible section (its i18n label stays "Extra Options") that auto-expands when options already exist. Both the headers and extra-options editors switched their placeholder draft keys to colon-bearing prefixes (`draft-header:` / `draft-option:`) — a code comment notes a colon is invalid in an HTTP field name so a draft key cannot collide with a legitimate header, and the same technique now guards option keys — and those drafts are stripped on save, fixing a bug where the old filter discarded any real option key literally starting with `option-` (the former placeholder prefix). New i18n keys were added across all four locales (zh/en/ja/zh-TW), and `aria-label`s were added for the header add/remove and model-details toggle controls in `OpenCodeFormFields.tsx`; the headers state and draft-stripping logic live in `useOpencodeFormState.ts`. (#2907)
- **Tencent Hunyuan Hy3 Model Pricing**: Seeded pricing for Tencent's Hunyuan Hy3 (released 2026-07-06, 256K context) so its usage is billed instead of showing $0. The rows are added to `seed_model_pricing` in `schema.rs` under both the `hunyuan-hy3` and `hy3` ids, since the upstream billing id isn't yet confirmed and one of the two should match logged usage. Prices follow Tencent's launch-day list rate (CNY 1 / 4 / 0.25 per Mtok input / output / cache-hit), converted at 1 USD ≈ 7.14 to $0.14 / $0.56 / $0.035, with `cache_write` left at `0` because no write rate is published. Hy3 actually uses input-length tiered billing (<16K / 16-32K / ≥32K) but the single-price table holds the lowest tier, so long-context requests are under-billed until this is revisited against the official billing page. Being a brand-new model it is seed-only, applied on next app start via `ensure_model_pricing_seeded` with no `SCHEMA_VERSION` bump.

### Changed

### Fixed

- **Align Codex OAuth Client Identity to Fix 404s on Newest ChatGPT Models**: The newest ChatGPT-gated subscription models (e.g. `gpt-5.6-luna`) now resolve correctly when routed through the local proxy takeover with an official Codex OAuth account, instead of returning a misleading `404 Model not found` even though the account had access. ChatGPT's Codex backend performs model cohort routing by the `originator`+`version` header pair, and cc-switch previously identified takeover requests as `originator: cc-switch` with no version, landing them in a cohort where `gpt-5.6-luna` resolved to an undeployed internal engine. The `CodexOAuth` auth strategy in `proxy/providers/claude.rs` now sends `originator: codex_cli_rs` paired with `version: 0.144.1`, matching the real Codex CLI and satisfying luna's `minimal_client_version` requirement of `0.144.0`. Both headers must be sent together (dropping either re-triggers the 404), and the `CODEX_OAUTH_CLIENT_VERSION` constant must be bumped whenever a newer target model raises the minimum. A direct HTTP A/B test against the live backend confirmed the old identity 404ed while the aligned identity completed successfully, so no WebSocket transport workaround is required.
- **Fail Closed on Responses Upstream Failures Instead of Returning Empty Replies**: When the proxy bridges an Anthropic-format client (Claude Code / Claude Desktop pointed at a Responses gateway) to an OpenAI Responses upstream, a semantic upstream failure that arrives inside an HTTP 2xx body — a `{status:"failed"|"cancelled"}` object, an `error` envelope, or a `response.failed`/`error` SSE event before any output — is now surfaced as a real error so failover can select a different provider, instead of being converted into a silent, empty `end_turn`. The forwarder validates buffered/JSON bodies (`validate_responses_success_response`) and primes streaming responses up to 256 KB (`validate_responses_stream_start`) while still inside the retry loop, and the streaming converter emits an Anthropic `error` event then ignores every event after a terminal so a late delta cannot synthesize a spurious `message_start`. Streams that end cleanly after partial text now finalize as an explicit `max_tokens`-style incomplete turn with content blocks closed in protocol order, whereas a stream cut off mid tool-call or mid-reasoning (partial JSON or a missing thinking signature) yields a `stream_truncated` error rather than a corrupt turn, and on the Codex→Anthropic direction a truncated tool call is reported `incomplete` instead of `completed`. Gateways that ignore `stream:true` and return a single whole JSON document (even without a JSON content-type) are now recognized and expanded into a full Anthropic SSE lifecycle, and malformed client-supplied history is raised as an `InvalidRequest` — a `NonRetryable` category — so it fails fast instead of retrying across every provider. Touches `forwarder.rs`, `streaming_responses.rs`, `streaming_codex_anthropic.rs`, `transform_responses.rs`, and `transform_codex_anthropic.rs`.
- **Preserve Reasoning, Tool Results, and System Roles Across the Responses/Anthropic Bridge**: Content and token accounting that crosses the Responses↔Anthropic bridge in multi-turn tool loops is now preserved instead of being dropped or corrupted. Encrypted Responses `reasoning` items round-trip losslessly by being carried inside a versioned bridge-owned Anthropic thinking `signature` (or a `redacted_thinking` `data` field, prefixed `ccswitch-openai-reasoning-v1:`) and restored on replay, orphaned reasoning-only assistant turns are discarded so they cannot brick the next request with a missing-following-item error, and the streaming converter now consumes the official `response.reasoning_summary_text.*` / `response.reasoning_text.*` event vocabulary (keeping `response.reasoning.*` as a compatibility alias), tracks concurrent items by stable id/output-index, emits the signature before closing the block, and recovers tool arguments from `*.done` / `output_item.done` events when a gateway skips deltas. Non-streaming Responses→Anthropic tool calls with empty arguments normalize to `{}`, invalid arguments in an incomplete turn degrade to `{}` with a warning, and invalid arguments on a completed response are rejected, while on the Codex→Anthropic request path malformed or non-object arguments raise a non-retryable `InvalidRequest`, incomplete historical tool calls are dropped, and only signed thinking blocks are re-encoded as encrypted reasoning. Structured tool results now keep their `is_error` flag, text, base64/URL images, and PDF/`input_file` documents in both directions instead of collapsing to a canonical JSON string, and historical `system`/`developer` messages are hoisted into Anthropic `system` rather than being silently demoted to user turns. For accounting, usage from a successful upstream request is recorded even when the subsequent conversion fails, and the Codex→Anthropic bridge keeps standard 5-minute prompt caching on by default while honoring the dedicated `cache_injection` sub-switch. Touches `reasoning_bridge.rs`, `transform_responses.rs`, `transform_codex_anthropic.rs`, `streaming_responses.rs`, `handlers.rs`, and `forwarder.rs`.
- **Account for Cache-Write Tokens in Proxy Usage and Cost**: Prompt-cache write tokens are now billed correctly on the proxy usage dashboard. The parser reads cache writes from OpenAI/Codex-style usage details (`input_tokens_details.cache_write_tokens` and `prompt_tokens_details.cache_write_tokens`) and preserves them through every response-usage conversion path — Chat→Responses, Responses→Anthropic, Anthropic→Responses, and OpenAI/Chat→Anthropic (`transform_codex_chat.rs`, `transform_responses.rs`, `transform_codex_anthropic.rs`, `transform.rs`, `streaming.rs`) — so cache creation is no longer dropped when a request crosses a format boundary. Because a Codex/Gemini provider's reported `input_tokens` is inclusive of both cache reads and cache writes, the cost calculator now subtracts both before applying the input rate; previously only reads were removed, so cache-write tokens were double-charged at both the input rate and the cache-creation rate. To keep historical rows accurate across this shift, a new `input_token_semantics` column (schema v13; `0` legacy = subtract reads only, `1` total-inclusive = subtract reads and writes, `2` fresh = no subtraction) records how each row's `input_tokens` was stored, so the cost backfill subtracts reads only for pre-existing rows and reads-plus-writes for new total-inclusive rows, while daily rollups are normalized to fresh input and stamped `2`. v12 databases gain the column on both `proxy_request_logs` and `usage_daily_rollups` via `migrate_v12_to_v13`, and Claude-style rows stay fresh input with no subtraction.
- **Stronger Prompt-Cache Breakpoint Injection on the Proxy Bridge**: On the proxy paths that inject Anthropic `cache_control` breakpoints — the `codex_responses_to_anthropic` takeover bridge and the Bedrock native optimizer — the injector now spends its four-breakpoint budget more effectively so long, tool-heavy conversations keep hitting the prompt cache instead of re-sending system, tools, and history at full price every turn. Beyond marking the tools tail, system tail, and the latest cacheable message, it now adds a second older user anchor (`msgs-prior-user`) when at least four messages exist and budget remains, keeping the stable prefix inside Anthropic's 20-block lookback from the newest breakpoint. Injection is short-circuited unless both the optimizer master switch (`enabled`) and the `cache_injection` sub-switch are on, `thinking`/`redacted_thinking` blocks are never chosen as cache targets, and injected markers use Anthropic's standard 5-minute TTL. Caller-owned breakpoints are preserved verbatim — never deleted, reordered, or rewritten — and when a caller already ships more than the supported four, the injector logs a warning, adds no automatic breakpoints, and leaves the markers in place (`cache_injector.rs`, `forwarder.rs`).
- **Kimi For Coding's 256K Context Window Now Takes Effect**: The Kimi For Coding preset's standalone `CLAUDE_CODE_AUTO_COMPACT_WINDOW=262144` (added in #4401 and shipped in 3.16.4) never actually applied, because Claude Code caps unrecognized non-Claude model ids at a 200K window and resolves the compact window as `min(model window, value)`, clamping 262144 back down to 200K. The preset now pairs it with `CLAUDE_CODE_MAX_CONTEXT_TOKENS` (both pinned to 262144) and explicitly routes the endpoint's `kimi-for-coding` alias across `ANTHROPIC_MODEL` and all three tier keys (`ANTHROPIC_DEFAULT_HAIKU/SONNET/OPUS_MODEL`), since Claude Code ignores both context envs for `claude-`-prefixed ids — the non-Claude alias is what unlocks the enlarged window. For already-saved providers, `build_effective_settings_with_common_config` in `services/provider/live.rs` injects the same two context defaults (262144) into the effective live settings at switch time for any provider whose `ANTHROPIC_BASE_URL` is the Kimi coding endpoint (`https://api.kimi.com/coding`), with a mirror-inverse strip on backfill so an injected default never hardens into stored provider config and an explicit user value always wins. Because the alias routing lives only in the preset and not in the injection, a provider saved from the old preset — which set neither the alias nor `CLAUDE_CODE_MAX_CONTEXT_TOKENS` — stays effectively at 200K until the preset is re-applied. Three tests cover backfill injection, user-override preservation, and injected-only strip.
- **Deleted Codex MCP Servers No Longer Resurrected on Provider Activation**: MCP servers are owned by the database `mcp_servers` table and the `[mcp_servers]` section in Codex's live `config.toml` is only a projection re-synced after every write, but switching away used to bake that projection into the stored provider snapshot — so a server you deleted in the app came back to life the next time you activated that provider, and per-entry reconcile (which only knows rows still in the DB) could never clean up the orphan. Switch-away backfill now strips `[mcp_servers]` (and the legacy `[mcp.servers]` form) from the stored settings via `strip_codex_mcp_servers_from_settings`, and any snapshot already polluted self-heals the next time you switch away from it. One user-visible consequence: a hand-written `[mcp_servers.*]` section in a Codex provider's config is stripped out of the stored snapshot the first time you switch away, so going forward define Codex MCP servers through the MCP manager (the DB `mcp_servers` table) rather than by hand-editing the provider config.
- **Codex MCP Sync Fails Closed on an Unparseable config.toml**: When writing a single MCP server into Codex, `sync_single_server_to_codex` silently fell back to an empty `toml_edit` document if the existing `config.toml` failed to parse and then wrote the whole file back — wiping every other section (`model`, `model_providers`, comments) and leaving only the one synced `[mcp_servers.<id>]` entry, a destructive fallback left behind when an earlier fix (`3a548152`) hardened only the removal path. The sync path now returns an `McpValidation` error and leaves the file untouched, matching the fail-closed behavior already used on the read/validate path, so a temporarily malformed config can no longer be silently truncated to a single MCP table.
- **MCP Operations Now Report Per-App Failures Instead of Silently Blocking Others**: Importing MCP servers from apps used to swallow every importer error with `unwrap_or(0)`, so a corrupt Codex `config.toml` surfaced only as "imported 0 servers" with no hint anything went wrong; `import_from_all_apps` now imports each app (claude/codex/gemini/opencode/hermes) best-effort and, when any fail, reports an aggregated error naming the failing apps alongside the count that did import, with the frontend refreshing the server list on settle so partially-imported servers still appear. On the projection side `sync_all_enabled` iterated every app with `?`, so one app's unparseable live file (e.g. a broken `~/.claude.json` that passes the existence gate but fails to parse) blocked every app behind it in iteration order and bubbled a false "switch failed" back even though the target app's live file and the database were already updated; switch and save now re-project only the target app through the new `sync_enabled_for_app` and degrade projection failure to a warning, while config-import and cloud-restore keep the all-apps sweep but collect failures best-effort. Toggling `unify_codex_session_history`, which rewrites the current official provider's live `config.toml` in full and drops the `[mcp_servers]` projection, now re-projects Codex MCP through that same target-only path so enabled servers no longer silently vanish until the next provider switch. In every degraded case the projection self-heals on the next switch or MCP toggle.
- **Codex Common-Config Form Preserves Comments and Key Order**: Toggling "use common config" in the Codex provider form used to route the merge through the frontend `smol-toml` implementation, which re-serialized the whole document (parse → deep-merge → stringify): comments were dropped, keys were reordered, and empty parent table headers like `[model_providers]` were synthesized — the long-standing "config.toml keeps getting reordered" symptom. The merge now runs on a backend command backed by the same `merge_toml_table_like` / `remove_toml_table_like` used to write live configs, so the form preview and the live write share one merge semantic and hand-written formatting survives edit-time merges, and the frontend helper was deleted outright so the pattern can't come back. Because the operations are now async, a landing result is discarded unless it is still current: a per-hook sequence number covers rapid toggle/save races so an earlier merge resolving after a later removal can't flip the switch back (last operation wins), and a config-baseline check keeps a stale merge from clobbering a TOML the user hand-edited while the merge was in flight, with the checkbox self-healing via the existing inference effect.
- **Inject a Single Auth Placeholder on Managed Claude Takeover**: Switching the managed Claude provider from a third-party endpoint (DeepSeek/MiMo/…) to a Codex-managed provider wrote both `ANTHROPIC_API_KEY` and `ANTHROPIC_AUTH_TOKEN` as `PROXY_MANAGED` into `~/.claude/settings.json`, so Claude Code warned "Both ANTHROPIC_AUTH_TOKEN and ANTHROPIC_API_KEY set - auth may not work as expected" on every run — an accretion artifact of the original API-key insert (#1049, Copilot) and the later `ANTHROPIC_AUTH_TOKEN` preservation that avoided a login prompt (#3784), which added the token without removing the key. The `ManagedAccount` branch of `apply_claude_takeover_fields_for_provider` now clears all token keys and injects exactly one placeholder: `ANTHROPIC_AUTH_TOKEN` for Codex-managed providers and `ANTHROPIC_API_KEY` for Copilot; local-proxy auth is unaffected because the forwarder resolves the `PROXY_MANAGED` placeholder from either header. Because enabling takeover short-circuits (`return Ok(())`) when the live config already matches the current proxy, users upgrading with an existing double-key `settings.json` may need to toggle Claude routing off and back on once (or switch providers) to trigger the rewrite. (#4919, #5095)
- **Skip Reachability Probes for Official Providers**: Health/connectivity checks no longer derive an unauthenticated probe target from an official provider's runtime adapter defaults. Batch `stream_check_all_providers` now skips any entry whose `category` is `official`, and `StreamCheckService::resolve_base_url` returns an explicit error for official providers instead of falling back to a first-party endpoint (e.g. `https://chatgpt.com/backend-api/codex`) and probing it without credentials — a request that is meaningless and always fails. The connectivity-check button is already hidden for these providers in `ProviderCard.tsx`, so this is defense-in-depth that also matters now that the built-in Codex official provider participates in takeover; a regression test covers the Codex official provider so a future adapter change cannot silently reintroduce the probe.
- **Usage and Quota Queries Reject Transient Transport Failures So Retry and Keep-Last-Good Work**: Usage and quota queries frequently showed spurious "query failed" states that a manual refresh could not clear, because every transport-level failure — including read-timeouts mid-body — was folded into `Ok(success:false)`, so react-query's retry never fired and the failure body poisoned the cache as if it were real data. The `balance`, `coding_plan`, and `subscription` services now return `Err` for send failures and body-read failures, reading the body via `bytes()` before `serde_json::from_slice` (reqwest's `json()` wraps read errors as `Decode`, which made error-kind checks on it dead code), while auth/4xx/parse errors stay `Ok(success:false)` and surface immediately; the script path maps transient `AppError` keys (`request_failed` / `read_response_failed`) to `Err`, Volcengine gains a `Transient` call variant, HTTP 429 is now classified transient alongside 5xx, and expired-credential retries propagate the transient error instead of rewriting it as "OAuth token has expired". The command layer skips snapshot persistence, the `usage-cache-updated` emit, and tray refresh on `Err` so the cache bridge cannot overwrite retained data. On the frontend, `resolveDisplayUsage` (generalized to subscription quotas via a new options object carrying a `rejected` flag) re-anchors stale success data retained by react-query across rejections to `dataUpdatedAt` so it expires through the same 10-minute keep-last-good window instead of masking a longer outage indefinitely, `useSubscriptionQuota` / `useCodexOauthQuota` gain keep-last-good with per-scope snapshot reset, rejected queries with no displayable value synthesize a failure placeholder carrying the real error message so the footer keeps a retry entry point, and `UsageScriptModal` surfaces string rejections via `extractErrorMessage`. (#3820)
- **Codex Sub-Agent Session Usage Now Counted in Local Statistics**: Token usage from Codex sub-agent (spawned agent) sessions was missing from local usage statistics because the parser keyed each session's synthetic `request_id` on `session_meta.session_id`, but a sub-agent's log carries the parent thread's `session_id` while its own unique identity lives in the `id` / `thread_id` field — so multiple sub-agents under one parent collapsed onto colliding request IDs and were dropped as duplicates. `session_usage_codex.rs` now extracts a unique `thread_id` per file (preferring `id` / `thread_id` over `session_id`) and prefixes request IDs with `codex_session:thread-v1:<thread_id>:<index>`, giving each sub-agent distinct rows. Because fork/sub-agent logs first replay the parent thread's history before the takeover event, the parser detects a history-snapshot boundary (via `forked_from_id` / `subagent` source markers plus a `thread_settings_applied` or `inter_agent_communication` event) and uses the replayed `token_count` events only to restore the cumulative baseline instead of double-counting them as new usage. Archived logs under `archived_sessions/` inherit the sync cursor from their original path by filename suffix, so re-parsing an archived copy imports only appended usage rather than re-importing the whole thread; the fix ships with unit tests covering identity extraction, replay-baseline accounting, distinct request IDs, and archived-cursor inheritance. (#5187)
- **Codex Free-Plan 30-Day Quota Window Now Renders in Footer and Tray**: Codex free accounts are metered on a rolling 30-day secondary window (`limit_window_seconds = 2,592,000`) instead of the weekly window paid plans use, and although the backend already mapped this to the tier name `30_day`, neither the frontend `TIER_I18N_KEYS` whitelist nor the tray's `TIER_LABEL_GROUPS` month group recognized it — so `SubscriptionQuotaView` filtered the tier out and, since it is the only surviving tier for a free account, the quota footer rendered nothing while the tray's `format_subscription_summary` returned `None` and showed no quota at all. A single-sourced `TIER_THIRTY_DAY` ("30_day") constant now ties together the backend `window_seconds_to_tier_name` mapping (which maps `2_592_000` explicitly), the tray's month ("m") group, and the frontend whitelist (`30_day → subscription.thirtyDay`), with the `thirtyDay` label added to all four locales (zh/en/ja/zh-TW). Two regression tests lock in the window-seconds-to-tier mappings and assert that a 30-day-only Codex account still renders in the tray, guarding the invariant that any tier visible in the footer must not leave the tray blank. (#3651, #4886)
- **Usage Dashboard Refresh Interval Persists Across Restarts**: The usage dashboard's auto-refresh cadence was component-local state that reset to 30s on every restart, so a user who chose a different interval (off, 5s, 10s, or 60s) had to re-select it each session. The dashboard now reads and writes the choice through a new `usageDashboardRefreshIntervalMs` app setting: `UsageDashboard` takes `refreshIntervalMs` / `onRefreshIntervalChange` props wired from `SettingsPage` to the persisted settings, initializes from the saved value (normalized to a known option, falling back to the 30s default for unrecognized values), and applies changes optimistically — invalidating the usage queries immediately — while rolling back the selection if the save fails. The field is added to the Rust `AppSettings` struct, the TypeScript `Settings` type, and the zod settings schema, and three component tests cover mount-from-saved, persist-on-change, and rollback-on-failure. (#5057)
- **Exclude Fable Tier Model Env Keys From the Shared Claude Common Config**: Fable is Claude's fourth model-mapping tier (added in v3.16.3), but its `ANTHROPIC_DEFAULT_FABLE_MODEL` / `ANTHROPIC_DEFAULT_FABLE_MODEL_NAME` env keys were missing from the provider-specific exclusion list, so a provider's Fable model pin could leak into the shared common-config snippet and then be injected into other providers on the next switch. Both keys are now stripped in `extract_claude_common_config` alongside the haiku/sonnet/opus pins, guarded by a regression test. The same commit also completes Fable's proxy-takeover support: the two keys are added to `CLAUDE_MODEL_OVERRIDE_ENV_KEYS` (now 12 entries) and the takeover writes a stable `claude-fable-5` role alias (`CLAUDE_TAKEOVER_FABLE_MODEL`), reapplying it when the provider configures Fable and clearing stale values otherwise, mirroring the other three tiers; when Fable is unconfigured no alias is written and the mapper falls back fable→opus. (#5206, fixes #4272)
- **Default Missing Tool Schema Types and Restore the API Key Field for Uncategorized Providers**: Two provider-facing fixes. First, when a client sends a tool whose Anthropic `input_schema` omits the top-level `type` or is an empty `{}`, the proxy passed the schema through the shared `clean_schema` helper without filling in the missing type, producing an OpenAI `parameters` object that strict gateways reject. `clean_schema` (defined once in `transform.rs` and reused by the Responses converter via `super::transform::clean_schema`, so both the Anthropic→OpenAI Chat and Responses paths pick up the change) now defaults a missing root `type` to `"object"` — adding an empty `properties: {}` only when properties is also absent — and applies the defaulting only to the root schema via a new `is_root` flag threaded through a `clean_schema_inner` helper, so nested sub-schemas (an `anyOf` string/null union, an `items`-only array) are preserved unchanged rather than having a spurious `type: "object"` forced onto them. Second, editing a provider with no category (a historically imported or hand-built custom provider) hid the Claude API key input, because `useApiKeyState` only showed and auto-created the field in add mode with a defined non-official category; the gate now keys off category alone, showing and populating the field for any provider that isn't `official` or `cloud_provider` — including the undefined-category edit case — while `official` (OAuth-only, input disabled) and `cloud_provider` (which use dedicated auth fields rather than an Anthropic key) stay conservative. New unit and hook tests cover both converters and the uncategorized/official/cloud-provider key paths. (#5069)
- **Media Fallback for Volcano GLM 5.2 Text-Only Image 400s**: When the local proxy takes over a Volcano Coding Plan provider running GLM 5.2, image blocks in a request no longer produce a dead 400 — the rectifier's media fallback in `src-tauri/src/proxy/media_sanitizer.rs` now covers GLM 5.2 on both its preventive and reactive paths. Preventively, the text-only model registry gains `glm-5.2` as an exact tail match (deliberately not a prefix, so a future multimodal `glm-5.2v` variant following Zhipu's 4v/5v naming keeps its images), stripping image blocks before they reach the text-only endpoint. Reactively, because the gateway's error `Model only support text input` never mentions image/vision/media and drops the third-person `s`, a new self-evident phrase list (`only support text` / `only supports text`) now asserts a modality rejection on its own and bypasses the `mentions_image` gate that previously discarded the error before the fallback hints could run; the old `only supports text` hint is folded into that list. Regression tests exercise the verbatim #5025 error body, the `glm-5.2[1M]` mapped-model form, and a `glm-5.2v` negative assertion. (#5025)
- **Display Renamed Codex Session Titles**: Sessions renamed inside Codex now show their renamed titles in the session manager instead of silently falling back to the original first-message text. The scanner (`src-tauri/src/session_manager/providers/codex.rs`) loads thread titles from Codex's `session_index.jsonl` and `state_5.sqlite` — resolving the DB path from `sqlite_home` / `CODEX_SQLITE_HOME` through a new shared `codex_state_db` module that deduplicates path resolution previously copy-pasted with the history-migration code — and prefers a stored thread title over the first user message when building each session's display title. The read-only title query adds a `busy_timeout` so a lookup during a concurrent Codex write no longer fails immediately with `SQLITE_BUSY` and drops back to the first message, and the `title == first_user_message` check is pushed into a NULL-safe SQL `WHERE` clause (matching Codex's `distinct_thread_metadata_title` semantics) so the potentially large `first_user_message` column no longer crosses into Rust. (#4927)
- **Live Config Edits for OpenCode, OpenClaw, and Hermes Now Sync Into the Database on Startup**: The startup auto-import for the live-config-managed apps previously skipped any provider whose id already existed in the database, so edits made directly to the OpenCode, OpenClaw, or Hermes (`~/.hermes/config.yaml`) live files — a changed base URL, an added or renamed model — were never picked up after the first import and silently diverged from the app's stored copy. The `import_{opencode,openclaw,hermes}_providers_from_live` functions in `services/provider/live.rs` now look up each existing provider and, when its live `settings_config` differs, rewrite the stored provider from the live file (OpenCode additionally refreshes the display name from the live `name`, falling back to the existing name rather than the id); the returned count now covers both new imports and updates, and the startup log line changed from "Imported N" to "Synced N". The sync runs on every launch from `lib.rs::run()`, is a no-op when nothing changed, and is fully non-fatal — a provider that vanishes mid-import or a DB lookup error is warned and skipped, and users with no live file still take the quiet `Ok(0)` path. (#4712, #5098)
- **OpenCode Session Resume Command Updated to Current CLI Syntax**: The Session Manager displayed and copied `opencode session resume <id>` as the resume command for OpenCode sessions, which is not the OpenCode CLI's current resume syntax, so pasting the copied command would not resume the session. Both the SQLite-scanned (`scan_sessions_sqlite`) and JSON-parsed (`parse_session`) session paths in `session_manager/providers/opencode.rs` now emit `opencode -s <id>` to match the CLI's actual resume flag. (#2359)

### Docs

### Internal

- **Harden Release Supply Chain**: Added a `.github/CODEOWNERS` that, together with branch protection's Code Owners rule, requires owner review before any PR merges to `main` (with `/.github/` and `/src-tauri/` pinned explicitly alongside the global `*` fallback, all to `@farion1231`), gated the release job behind a `release` environment in `release.yml` so signing secrets unlock only after manual approval, and removed `.github` from `.gitignore` so the previously untracked `labeler.yml` and `workflows/labeler.yml` are now versioned.
- **Settle pnpm Build-Script Approvals**: Approved `esbuild` (via `onlyBuiltDependencies`) and ignored `msw` (via `ignoredBuiltDependencies`) in `pnpm-workspace.yaml` so pnpm 10.13+ stops appending `allowBuilds` placeholders to the file on every install.
- **Platform-Gate the Desktop-Scope Assertion in the Profile Roundtrip Test**: The `profile_roundtrip` integration test's Claude Desktop assertion is now `cfg`-gated to macOS/Windows to match the already cfg-gated desktop switch, so on Linux CI (where desktop live writes error) it expects the seeded `d1` instead of `d2` and no longer panics, poisons the shared test mutex, and cascades into two more failures.

## [3.16.5] - 2026-07-01

**Stats**: 36 commits | 93 files changed | +5,678 insertions | -2,804 deletions

### Added

### Changed

### Fixed

### Docs

## [3.16.4] - 2026-06-27

**Stats**: 53 commits | 126 files changed | +8,149 insertions | -1,016 deletions

### Added

### Changed

### Fixed

- **Copilot/Codex OAuth Requests Now Honor the Global Proxy**: `CopilotAuthManager` and `CodexOAuthManager` hardcoded `Client::new()` at construction, so their auth flows (token exchange, `/models` listing, model-vendor checks, device-code and OAuth-refresh requests) ignored the configured global proxy and connected directly. With Copilot the direct connection returned zero Claude models, breaking live model resolution and causing the upstream to reject requests with `400 model_not_supported`. Both managers now fetch the shared client per request via `crate::proxy::http_client::get()`, so they follow the global proxy URL and pick up runtime proxy changes. Fixes #2016, #2931. (#4583)
- **Compressed Request and Error Body Decompression**: Codex Desktop sends zstd-compressed request bodies when authenticated against the Codex backend, which broke local proxy routing because the handlers parsed the raw compressed bytes with `serde_json` directly. The proxy now decompresses request bodies (gzip/br/deflate plus new zstd support, including stacked codings like `gzip, zstd`) before JSON parsing across the three Codex handlers and strips the stale `content-encoding`/`content-length`/`transfer-encoding` headers so the forwarder regenerates them. Upstream non-2xx error bodies are decompressed the same way, so compressed rate-limit and auth details are no longer dropped and hidden from the client. Fixes #3764, #3696. (#3817)
- **DeepSeek Endpoint `thinking: disabled` 400 Errors**: DeepSeek's Anthropic-compatible endpoint rejects requests where `thinking.type=disabled` coexists with effort parameters, returning HTTP 400, which broke Claude Code 2.1.166+ sub-agents (Workflow/Dynamic Workflow) that hardcode `thinking: disabled`. Rather than overriding the client's intent, the proxy now strips the conflicting `output_config.effort` / `reasoning_effort` parameters for the official DeepSeek endpoint, since sub-agents don't need to display reasoning. (#4239)
- **Reverted Anthropic System-Message Hoisting**: Reverts #3775's hoisting of `role=system` messages out of `messages[]` into the top-level `system` field for Anthropic-compatible providers. DeepSeek's endpoint accepts inline system messages natively, and the rewrite altered the request prefix; leaving the messages in place preserves the prompt prefix and avoids a suspected cache hit-rate regression (refs #4297). The unrelated Windows test fixes and the tool-thinking-history normalization from #3775 are kept. (#3775)
- **Chat Tool Calls with Missing Function Names**: Some upstreams send empty or absent function names in streaming tool-call deltas, which previously produced invalid Codex Chat output items (or an `unknown_tool` fallback). Accumulated tool-call state is no longer overwritten by empty deltas, and tool calls that never receive both a `call_id` and a valid name are skipped at finalization across the streaming, non-streaming, and legacy `function_call` paths. (#4159)
- **Restored Cached Codex Tool Call Fields**: When Codex sends a follow-up Chat request referencing `previous_response_id`, its `function_call` items can arrive carrying only `call_id`. The history enrichment previously refilled only `reasoning`/`reasoning_content`, leaving the function `name`, `arguments`, `status`, and related fields empty; it now restores all cached tool-call fields from history so the call is reconstructed correctly for the Chat upstream. (#4160)
- **Duplicate Codex base_url Entries in config.toml**: Writing the Codex `base_url` into `config.toml` only replaced or removed a single matching assignment per section, so a section that already contained multiple `base_url` lines kept the extras and accumulated duplicates. `setCodexBaseUrl` now collapses all matches in the target section or top level (replacing the first and removing the rest), and the TOML `base_url` regex handles escaped quotes. (#4316)
- **CODEX_SQLITE_HOME State DB Probing for History Migration**: The Codex session-history migration only scanned `~/.codex/state_5.sqlite` and the `config.toml` `sqlite_home` location, so when Codex's SQLite state was relocated via the `CODEX_SQLITE_HOME` env var the state DB was never scanned and its threads kept their old provider bucket. The shared `codex_state_db_paths` helper used by both the third-party and unified-session migrations now falls back to `CODEX_SQLITE_HOME` (config `sqlite_home` still takes precedence).
- **Provider Terminals Respect the User's Shell**: Launching a provider terminal on macOS/Linux hardcoded `bash`, so zsh/fish users' rc files never loaded. The launchers now detect the user's default shell from `$SHELL` (falling back to `/bin/zsh` on macOS, `/bin/bash` on Linux) and exec into it with clean-start flags, while the launch scripts themselves run through POSIX `sh` for portability (e.g. fish, NixOS where `/bin/sh` may not exist). (#4140, fixes #1546)
- **Claude MCP Path Honors Custom Config Dir**: When a custom Claude config directory is configured, MCP server reads and writes now resolve to that directory's MCP file instead of the default location, keeping MCP state isolated per profile. The previous copy-on-access migration of the legacy file was removed in favor of resolving the override path directly. (#3431)
- **Preset Search Results Clickable After Searching**: After searching in the Add Provider preset selector, results could no longer be clicked or selected. The `requestAnimationFrame` `select()` that raced with typing (and ate the first character, e.g. "gateway" -> "ateway") is removed, input autofocus is restored for the open-by-click path, and refocus is wired up for the Ctrl/Cmd+F shortcut while the box is open. The provider-list typing guard is also scoped to the Ctrl/Cmd+F branch so Escape still closes the search panel. (#4315)
- **Skills Browser and Provider Card Display Fixes**: Fixed several display and interaction issues: the repo-manager action stays available while browsing skills.sh and Refresh stays available even when a repo returns no results; long provider names and website URLs on the provider card now truncate instead of overflowing; the OMO model-variant dropdown truncates its selected label with a full-text tooltip; and Select menu items show a checkmark on the active option. (#4323)
- **Settings Scroll Resets on Tab Switch**: Switching tabs in the Settings dialog kept the previous tab's scroll position, sometimes landing partway down the new tab; the scroll container now resets to the top whenever the active tab changes. (#4165)

### Docs

## [3.16.3] - 2026-06-14

Development since v3.16.2 focuses on getting usage accounting right end-to-end — billing route-takeover and format-conversion traffic by the real upstream model and pricing basis (schema v11), counting Claude Code Workflow sub-agent sessions, folding Claude Desktop into the Claude view, refreshing the model pricing seed, and reworking the usage dashboard with global provider/model filters, brand-icon toolbars, and far more resilient quota queries — while hardening the proxy (mislabeled SSE bodies, Codex image rectification, OAuth token and takeover-residue recovery, Hermes duplicate YAML keys), reworking provider configuration (a custom User-Agent override, a unified Codex advanced section, searchable preset selection, a Fable 5 tier, and refreshed Kimi/Unity2/Volcengine/MiniMax presets), and smoothing the update, About-panel, and provider-health experiences.

**Stats**: 59 commits | 130 files changed | +10,223 insertions | -4,232 deletions

### Added

### Changed

### Fixed

- **Route-Takeover Traffic Billed by the Real Upstream Model**: When a request was routed to a different upstream (env model mapping, Claude Desktop routes, Copilot normalization, Codex chat override), the proxy used to attribute and price usage by whatever model the upstream echoed back, recording kimi/glm tokens as `claude-*` and overstating cost roughly 5–25×. The forwarder now captures the real outbound model, attributes usage by upstream-echo then outbound then client alias, persists the actual pricing basis on every row (schema v11), and keeps that basis through cost backfill and 30-day rollup pruning; Claude Desktop traffic is now logged under its own `app_type` so its pricing overrides apply.
- **Usage Metering on Format-Conversion Proxy Paths**: Audited and fixed token/cache accounting across the proxy's format-conversion paths (Chat, Responses, and Gemini converted to Anthropic). The proxy now records the actually returned model, injects `stream_options.include_usage` so OpenAI-compatible upstreams emit usage in streaming, excludes `cache_read` and `cache_creation` from input on Claude←OpenAI paths to stop double-billing cache tokens, subtracts cached Gemini prompt tokens, still records fully-cached requests, and skips synthetic all-zero usage that previously inflated request counts (#2774).
- **In-App Update No Longer Hangs on Restart**: Installing an update from within the app no longer freezes on the "restarting" screen, leaving the new version installed but requiring a manual force-quit. The download-install-restart chain now runs entirely in the backend (a new `install_update_and_restart` command) with platform-aware install ordering and single-instance-lock teardown before re-exec, instead of depending on the old WebView to keep running JS after the app bundle was already swapped; exit requests are also classified so restart requests fall through to Tauri's default flow rather than deadlocking on the window-state plugin mutex (#4069, #4074).
- **Codex Upgrade No Longer Breaks the Install**: Upgrading Codex from the Settings "About" tab no longer leaves it throwing "Missing optional dependency @openai/codex-…" errors. The upgrade chain previously ran `codex update` first, which on an npm install is a bare reinstall that reports success even when the per-platform binary fails to land; Codex is now removed from the self-update-first path and a runnable check triggers an uninstall+reinstall self-heal (scoped to npm-managed installs) that actually re-lands the missing platform binary.
- **Codex OAuth Auth Token Preserved on Proxy Takeover**: Enabling proxy takeover for a Codex provider no longer strips the `ANTHROPIC_AUTH_TOKEN` placeholder, which previously broke Claude Code's login on hot-switches, fresh installs, and configs already stripped by older releases. The placeholder is now injected unconditionally for managed (non-Copilot) Codex providers, including URL-only ones; GitHub Copilot behavior (API_KEY only) is unchanged (#3789, #3784).
- **Takeover-Residue Recovery Across Config-Dir Switches**: Restarting the app after changing the config directory while proxy takeover is active no longer leaves Claude/Codex/Gemini pointed at a dead local proxy. The old instance now restores the taken-over live files before restarting, the first-run import refuses to persist a takeover placeholder as a provider, and SSOT restore validates that the current provider's config is free of placeholders before writing it back (#4076).
- **Mislabeled SSE Bodies in Format-Transform Fallback**: Requests routed through Claude/Codex format conversion no longer fail with an opaque 422 "Failed to parse upstream response" when a MaaS gateway force-streams a `stream:false` request and returns an SSE body under a non-SSE Content-Type. The proxy now sniffs for SSE on parse failure, aggregates the chunks into a single JSON, and runs the existing converter so clients still get a valid non-stream response; remaining parse failures are enriched with content-type, encoding, and body-snippet diagnostics, and deflate decoding now tries zlib before raw (#2234).
- **Duplicate YAML Keys in Hermes Config**: Hermes config writes no longer accumulate duplicate top-level keys (e.g. `mcp_servers`) that caused "Failed to parse Hermes config as YAML: duplicate entry with key" errors. Section replacement now strips all stale occurrences from the remainder instead of degrading into appends, the dedup safety net handles both LF and CRLF line endings, and healing keeps the last (newest) occurrence to match Hermes's own last-wins PyYAML semantics (#3267, #3633, #2973, #2529, #3310, #3762).
- **Usage Query Resilience and Error Clarity**: Usage cards no longer flip to red on a single transient blip: queries now retry once and keep showing the last successful result for up to 10 minutes on network/timeout/5xx failures, while deterministic failures (auth, empty key, unknown provider, 4xx) surface immediately and clear the snapshot so a stale quota can't resurface after credentials change. Native balance/coding-plan/subscription timeouts were raised from 10s to 15s for slow cross-border endpoints, and coding-plan now returns explicit "API key is empty" / "Unknown coding plan provider" errors instead of a blank failure.
- **Usage Script Provider Credential Resolution**: Custom JS-script usage queries resolved `{{apiKey}}` / `{{baseUrl}}` by guessing env fields only, so providers that store credentials elsewhere (e.g. Codex's `auth.OPENAI_API_KEY` plus `config.toml` base_url) always got empty values and failed despite being fully configured. Script queries and the test/preview now reuse the same per-app credential resolver as the native balance path, with explicit non-empty script values still taking precedence (#1479).
- **Claude Code Workflow Sub-Agent Usage Counted**: Local (no-proxy) session-log usage accounting missed Claude Code Workflow sub-agent traffic, under-counting overall usage by roughly 4.1% (concentrated in workflow/subagent transcripts). The scanner now descends into the deeper `subagents/workflows/wf_*/` transcript directories, and the parser no longer drops billable assistant messages that lack a `stop_reason` but already incurred input/cache token cost; dedup is unchanged so no usage is double-counted.
- **Codex Image Rectifier for /responses Text-Only Upstreams**: Codex `/responses` requests carrying images and routed to text-only OpenAI-chat models (e.g. DeepSeek `deepseek-v4-flash`) no longer fail with HTTP 400 "unknown variant `image_url`". The media rectifier now also covers the Codex adapter, scanning the responses `input` for `input_image` blocks so it can proactively strip images for known text-only models and reactively retry with images replaced on upstream image-unsupported errors.
- **Zhipu Coding-Plan Quota Window Mislabeling**: The Zhipu coding-plan view no longer swaps the 5-hour and weekly quota buckets in the final hours of each weekly cycle. The two windows are now classified by the explicit `unit` field (3 = 5-hour, 6 = weekly) instead of by sorting reset-time ascending, which mislabeled them exactly when users check their weekly quota most; the old reset-time heuristic remains as a fallback (#3036).
- **Duplicate Provider Terminal Sessions on macOS**: Launching a provider terminal on macOS no longer opens an extra empty window alongside the command session; Terminal.app uses `launch` (not `activate`) on cold start and Ghostty uses an initial-command so a single session opens, with a fallback retained if the AppleScript path fails (#4156).
- **Claude Desktop Model-Mapping Placeholders**: The Claude Desktop model-mapping form previously showed mismatched example brands across the menu display name and request model columns (DeepSeek vs Kimi), implying a display name maps to an unrelated model. Both placeholders are now derived from each row's role so they stay brand-consistent, with the lightweight Haiku tier using a flash example.
- **Popovers Behind Fullscreen Panels**: Popovers and tooltips such as the provider preset search no longer render behind fullscreen panels and appear unresponsive on click; their z-index is raised above the fullscreen overlay while staying below modal dialogs.
- **ToggleRow Icon Shrinking**: Toggle row icons no longer shrink or distort when paired with long descriptions, keeping the icon at a fixed size next to multi-line text.

### Docs

- **Release Notes Contributor Mentions**: Restored contributor mentions in the v3.16.1 and v3.16.2 release notes across all three locales.

## [3.16.2] - 2026-06-07

Development since v3.16.1 focuses on broadening data portability and usage observability — S3-compatible cloud sync, OpenCode session usage import, and an opt-in official-subscription quota template — while hardening Codex Chat Completions routing (stream truncation, `tool_choice` / custom-tool / reasoning-token edge cases, file and audio attachments, and a Codex CLI models endpoint), strengthening proxy robustness (ephemeral ports, takeover/placeholder restore, system-message normalization, clearer upstream errors, and a text-only image fallback), fixing coding-plan quota lookups (Zhipu, MiniMax) and several Windows/macOS issues, adding the CherryIN and ZenMux providers, and refreshing the user manual.

**Stats**: 41 commits | 132 files changed | +11,116 insertions | -1,636 deletions

### Added

### Changed

- **Usage Dashboard Hero Redesign**: Restructured the Usage Dashboard hero and summary cards into a more compact layout, consolidating the real-token total, request count, and cost into a single top row (#3426).
- **SSSAiCode Endpoint Refresh**: Updated the SSSAiCode preset's website, signup, and API base URLs to the `sssaicodeapi.com` domain and refreshed its endpoint nodes (default `node-hk.sssaicodeapi.com`, plus `node-hk.sssaiapi.com` and `node-cf.sssaicodeapi.com`) across all seven app presets.

### Fixed

- **Codex Chat Truncated Stream Detection**: When a Chat Completions upstream ends a stream without a `finish_reason` or `[DONE]`, CC Switch no longer reports it as a normal completion — it finalizes normally only when the stream truly finished, emits an incomplete (`max_output_tokens`) response when partial output was produced, and emits a failed `stream_truncated` event when nothing was produced. Late-arriving reasoning is also attached to still-active streamed tool calls.
- **Codex Chat `tool_choice` Without Tools**: The Responses-to-Chat converter now drops `tool_choice` and `parallel_tool_calls` whenever the resulting tools array is absent or empty, so strict OpenAI-compatible upstreams (vLLM, enterprise gateways) no longer reject the request with "When using `tool_choice`, `tools` must be set." (#3640).
- **Codex Custom Tool Metadata Over Chat Routing**: Custom Codex tools (such as the freeform `apply_patch` tool) now preserve their full original definition — including format and grammar metadata — as a compact, order-stable JSON block in the generated Chat function description instead of a generic placeholder, keeping them usable on Chat Completions upstreams (#3644).
- **Codex Chat `reasoning_tokens` in Usage**: The Chat-to-Responses usage conversion now always includes `output_tokens_details.reasoning_tokens` (defaulting to 0), even when a provider omits `completion_tokens_details` or returns it as a non-object, satisfying the Codex CLI's strict requirement and avoiding repeated parse failures and retries (#3514).
- **Codex Cross-Turn Reasoning for Custom and Search Tools**: The cross-turn reasoning cache in Codex Chat history now covers the full tool-call set (`function_call`, `custom_tool_call`, `tool_search_call`) and their outputs, so `apply_patch` and tool-search calls keep their `reasoning_content` when restored via `previous_response_id`.
- **Ephemeral Proxy Port Resolution**: When the proxy listens on port 0 (OS-assigned), takeover now starts the proxy first to learn the real port and writes it into the Live configs and database, so client URLs no longer point at a broken `:0` address; the Claude Desktop gateway URL is rejected if no concrete port has been resolved.
- **Proxy Placeholder Backup/Restore Loop**: If a previous proxy stop left the proxy placeholders in Live, taking over again no longer overwrites a good backup with the proxy config, and restore no longer writes the placeholder back to Live — both paths detect the placeholder state and rebuild Live from the current provider, fixing cases where the proxy toggle became a no-op and clients stayed pinned to the local proxy (#3689).
- **Official Provider Block Under Proxy Takeover**: While Local Routing takeover is active, only providers explicitly categorized as official are blocked from switching, instead of also disabling custom providers whose endpoint lives in metadata or whose fields are unfilled. The disabled Enable button now shows a lighter hint tooltip in place of the red "Blocked" badge.
- **Localhost Listen Address Normalization**: Saving the proxy with a listen address of `localhost` now normalizes it to `127.0.0.1` before persisting, avoiding binding inconsistencies (#3016).
- **Anthropic System Message Normalization**: For Anthropic-format providers, system-role entries inside the `messages` array are collapsed and merged into the top-level `system` field (preserving order and any existing top-level system), preventing strict upstreams from rejecting non-leading system messages; OpenAI Chat routing is untouched (#3775).
- **Claude Desktop 1M-Context Model Routing**: Claude Desktop appends a `[1m]` marker to the model name when the 1M-context beta is active (e.g. `claude-opus-4-8[1m]`). The proxy now strips that suffix before route lookup so exact, alias, legacy, and role-keyword matching resolve correctly, fixing `route_unknown` (HTTP 400) failures when switching to a 1M-capable model mid-conversation.
- **Codex 413 Error Clarity**: When a Codex upstream gateway rejects an oversized request with HTTP 413, the proxy now returns a dedicated message identifying it as the provider's server-side body-size limit (not a CC Switch limit) with recovery steps (run `/compact`, drop large logs or inline images, or ask the provider to raise its limit), instead of echoing the raw upstream HTML page.
- **Proxy Panel Error Detail**: When toggling proxy takeover fails, the proxy panel toast now includes the underlying backend error detail instead of only a generic failure message (#3656).
- **Copilot Infinite-Whitespace Threshold**: Raised the streaming infinite-whitespace abort threshold from 20 to 500 consecutive whitespace characters, so legitimate tool calls with deeply indented code arguments are no longer falsely aborted while still catching the real Copilot infinite-whitespace bug (#2647).
- **Subscription Tier Tray Rendering**: Fixed tray and quota rendering for official subscription tiers via a unified tier-to-label mapping: Claude/Codex no longer drop the seven-day window, Gemini Pro/Flash/Flash-Lite tiers no longer leak raw machine names, and multi-window plans (e.g. Opus + Sonnet) now display the worst utilization instead of the first match.
- **Inflated Claude Stream Input Tokens**: Some Anthropic-compatible streaming providers (e.g. Qwen, MiniMax) report the full context as `input_tokens` in `message_start`, double-counting the cached portion and artificially lowering the displayed cache hit rate. The parser now prefers a smaller positive `input_tokens` from `message_delta` and adopts the paired cache counts from the same usage block; native Claude and OpenRouter-converted paths are unchanged.
- **Zhipu Quota Query Endpoint Routing**: The Zhipu coding-plan quota lookup was hard-coded to `api.z.ai`, so users on the mainland China preset (`open.bigmodel.cn`) could not retrieve usage when the international endpoint was unreachable. The quota request now routes to the host matching the user's configured base URL (#3702).
- **MiniMax Balance API and Pricing**: Adapted MiniMax coding-plan quota to its new balance API (which returns remaining-percent fields instead of usage counts that broke the old parser and left the tray blank), filtered out non-coding models (e.g. video), handled plans without a weekly limit, and seeded default pricing for MiniMax M3 (#3518).
- **GLM Coding Plan Endpoints and Model Fetch**: Corrected the ZhiPu / Z.AI GLM Coding Plan presets to the `/api/coding/paas/v4` endpoints across Codex, OpenCode, OpenClaw, and Hermes, and taught the model-list probe to query `{base}/models` for base URLs that already end in a `/v{N}` segment (keeping `/v1/models` as a fallback), so the Fetch Models button no longer 404s on versioned endpoints (#3524).
- **Codex Model Catalog Path Portability**: Codex now writes only the relative filename `cc-switch-model-catalog.json` to `config.toml` instead of an absolute path (Codex CLI resolves it from the config directory), fixing the model catalog breaking on WSL and symlinked setups where the absolute path could not be translated (#3614).
- **APINebula OpenCode SDK**: The APINebula OpenCode preset now loads `@ai-sdk/openai-compatible` instead of `@ai-sdk/openai`, so requests use the OpenAI Chat Completions format the relay expects rather than the Responses API.
- **Windows Tray Icon Residue on Exit**: Quitting CC Switch on Windows could leave a dead tray icon until hovered; the app now removes the tray icon before exiting so it disappears cleanly (#3797).
- **Windows Taskbar Icon**: Set an explicit Windows AppUserModelID at runtime and stamped the installer's desktop and start-menu shortcuts with the same ID and product icon, so CC Switch shows the correct icon and groups properly in the taskbar (#3457).
- **Windows Subdirectory Skill Updates**: Normalized backslash path separators to forward slashes when scanning installed skills on Windows, so skills nested in subdirectories (e.g. `skills/my-skill`) are matched by the update check instead of being silently skipped (#3430).
- **macOS Input Auto-Capitalization**: Disabled autocomplete, autocorrect, autocapitalize, and spellcheck on the shared text Input component so macOS no longer auto-capitalizes or auto-corrects the first letter typed into configuration fields (#3626).
- **Codex VS Code Session Previews**: Codex session previews for requests sent from VS Code could show selection or open-file content instead of the prompt when a markdown heading preceded the injected request. Both the backend title and frontend preview now match the last "## My request for Codex:" heading (the IDE injects the real request as the final section) (#3593).
- **VS Code Wording in Chinese UI**: Corrected the "Apply to Claude Code plugin" description in the Simplified and Traditional Chinese locales to write "VS Code" properly instead of "Vscode", aligning with the English and Japanese strings (#3228).

### Docs

## [3.16.1] - 2026-06-01

Development since v3.16.0 focuses on hardening Codex provider switching and Local Routing takeover: preserving official OAuth auth and model catalogs across normal switches, hot-switches, backup restore, and edit flows; restoring Codex Chat tool/plugin compatibility over Chat Completions upstreams; improving Codex proxy diagnostics and CLI discovery; and documenting DeepSeek routing.

**Stats**: 23 commits | 62 files changed | +5,603 insertions | -1,113 deletions

### Added

- **Codex Official Auth Preservation Setting**: Added an opt-in setting that keeps the official ChatGPT / Codex OAuth login in `auth.json` when switching third-party Codex providers, while moving third-party provider tokens into `config.toml` when enabled.
- **Codex DeepSeek Routing Guides**: Added localized DeepSeek routing guides for Codex in English, Chinese, and Japanese, with screenshots covering provider routing requirements, Codex provider setup, and Local Routing takeover.

### Changed

### Fixed

- **Codex Provider Edit Dialog Under Takeover**: The Codex provider edit form now shows an explicit notice and storage-aware auth / config hints clarifying that it displays the stored provider config (not the proxy-managed live `auth.json` / `config.toml`), so the official OAuth token is no longer mistaken as lost while takeover is active. The dialog also treats takeover as active regardless of whether the proxy server is currently running.
- **Codex OAuth Auth During Proxy Takeover**: Fixed multiple preserve-mode takeover paths that could clear or overwrite the official ChatGPT / Codex OAuth `auth.json`. Takeover detection now recognizes `PROXY_MANAGED` in `config.toml`, cleanup only removes placeholder bearer tokens, config-only takeover writes are used consistently, and mis-categorized third-party providers no longer trigger the official-provider auth overwrite path. Provider sync and switching now treat the restore backup and live placeholders as the takeover-ownership signal (instead of the lagging `enabled` / proxy-running flags) and serialize switch/takeover per app, so a just-activated or proxy-stopped takeover can no longer be overwritten by a normal live write.
- **Codex Model Catalog Data Loss**: Fixed cases where Codex `modelCatalog` could be wiped by live-config backfill, active-provider edit dialogs, provider switches, or proxy takeover-off restore. Snapshot backups now keep existing `model_catalog_json` pointers, provider-rebuilt backups regenerate the catalog projection from the database source of truth, active edit dialogs prefer the DB catalog over lossy Live reconstruction, and provider switches always refresh the generated catalog JSON.
- **Codex Chat Tools Over Chat Completions Routing**: Restored Codex `tool_search`, loaded namespace tools, custom tools, and tool outputs when third-party Codex providers are routed through Chat Completions. Non-streaming and streaming Chat responses now map back to the right Responses item types, including native `response.custom_tool_call_input.*` events for custom-tool streaming.
- **Codex Proxy Error Diagnostics**: Codex forwarding failures now return richer JSON errors with provider, model, endpoint, upstream status, stable `cc_switch_*` codes, and HTTP statuses aligned with the canonical `ProxyError` response mapping.
- **Codex Native Balance / Coding-Plan Queries**: Fixed native usage and plan lookups so each app resolves the correct provider credentials instead of leaking assumptions from another app surface.
- **Codex CLI Discovery and Catalog Projection**: Fixed third-party Codex catalog projection that could fail when the Codex CLI was not reachable through one narrow PATH lookup, by adding multi-platform CLI discovery plus a bundled GPT-5.5 model-catalog template fallback.
- **Claude Desktop Official Provider Creation**: Fixed adding the Claude Desktop Official provider when the official category/config path was selected.
- **Anthropic Tool Thinking History for Kimi / Moonshot**: Added Kimi and Moonshot to the Anthropic-compatible tool-thinking history normalizer so later turns can replay reasoning and tool-call context correctly.
- **Windows Tool Version Probing**: Fixed Windows version checks that could misquote `.cmd` / `.bat` commands and decode localized command output as mojibake, causing working tools to appear as "installed but not runnable".

## [3.16.0] - 2026-05-29

**Stats**: 101 commits | 221 files changed | +27,063 insertions | -3,052 deletions

### Highlights

### Added

### Changed

### Fixed

- **Codex Chat Error Responses Converted to Responses Envelope**: The Codex Chat-to-Responses bridge previously passed upstream error bodies through untouched, leaving Codex clients unable to recognize MiniMax `base_resp`, raw OpenAI Chat errors, or plain-text / HTML error pages. Errors are now regularized into the standard `{error: {message, type, code, param}}` envelope with the original HTTP status preserved; non-JSON bodies are wrapped and truncated to 1KB at a UTF-8 char boundary. Also fixed a pre-existing append-vs-insert bug that emitted a duplicate `Content-Type` header on rewritten JSON bodies.
- **Codex Mid-Stream System Messages Collapsed**: MiniMax's OpenAI-compatible endpoint strict-rejects any non-leading `system` message (error 2013). All `system` fragments are now collapsed into a single leading message (joined in original order), losslessly for permissive backends too.
- **Codex Model Catalog Wiped After Restart**: Editing the active Codex provider triggered a live read that omitted `modelCatalog`, so a subsequent save silently destroyed user-configured model mappings. Live reads now reverse-parse the on-disk catalog projection to round-trip the same shape the save path writes.
- **Codex Model Catalog Infinite Render Loop**: Broke a bidirectional sync cycle between the catalog table and its parent state that caused severe UI jittering when adding or editing entries.
- **Codex Chat Preserves User-Selected Catalog Model**: A model the client selects from the catalog (e.g. via `/model`) is no longer overwritten by `config.toml`'s default model.
- **Codex Chat Reasoning and Cache Stability**: Restored a unique call-id fallback when Codex omits or rewrites `previous_response_id`, stopped deriving cache identity from `previous_response_id`, and canonicalized parseable JSON string payloads in tool conversions for stable prefix-cache reuse.
- **Codex Chat Streaming Usage Recovered**: The Responses-to-Chat conversion now injects `stream_options.include_usage` (merging into any client-provided `stream_options`) when a request is streaming, so OpenAI-compatible upstreams like Kimi and MiniMax emit the trailing usage chunk again. Previously their streamed token / cost / cache stats were recorded as zero on the Codex Chat path.
- **Codex Chat Tool-Call Reasoning Backfill**: Thinking models like Kimi/Moonshot and DeepSeek reject an assistant message that carries `tool_calls` without a non-empty `reasoning_content`. When cross-turn history recovery misses (proxy restart, ambiguous `call_id`, or a turn with no upstream reasoning), a placeholder `reasoning_content` is now backfilled in a final pass — genuine trailing reasoning still attaches first — so the request no longer fails with `reasoning_content is missing in assistant tool call message`.
- **Managed-Account Claude Takeover Auth**: Managed-account providers (GitHub Copilot / Codex OAuth) now drop token env keys and write only the `ANTHROPIC_API_KEY` placeholder when taking over Claude Live config, with an outbound guard that refuses to send the `PROXY_MANAGED` placeholder upstream.
- **Claude Desktop Profile Sync During Takeover**: Claude Desktop profile data is now synced during proxy takeover, model routes align with the Claude Code three-role tiers, and the Cowork egress profile has been corrected (#3157, #3172).
- **Managed-Account Takeover Model Fields**: Local Routing now sources takeover model fields from the target provider on managed accounts instead of carrying stale model values.
- **DeepSeek Anthropic Tool Thinking History**: Normalized DeepSeek Anthropic-compatible tool-thinking history so later turns can replay reasoning / tool-call context without malformed messages (#3203).
- **Claude-Compatible Empty Tool Calls in Streams**: Fixed a Claude-compatible streaming edge case where an empty `tool_calls` array reset block state and broke streamed responses (#2915).
- **MiMo Reasoning for Claude Code Proxy**: Added MiMo `reasoning_content` support on the Claude Code proxy path (#2990).
- **Gemini Native Tool-Call Robustness**: Fixed `functionResponse.name` resolution (422) and `thought_signature` replay (400) for synthesized tool-call IDs in long multi-turn sessions (#2814).
- **Session Log Subagent Token Accounting**: `collect_jsonl_files()` now scans subagent JSONL logs that were previously missed, so subagent token usage is counted in session cost (session-log mode only) (#2821).
- **Usage Dashboard / Sync Stability**: Fixed a Codex usage-sync panic on non-ASCII model names, custom usage-script summaries, and missing real-time refresh after usage rollups (#3027, #3129).
- **ZhiPu Coding-Plan Quota Tier Ordering**: When the 5-hour bucket is at 0% utilization, ZhiPu's API omits `nextResetTime`; the old `i64::MAX` sentinel sorted those entries last, letting the weekly bucket incorrectly claim the five-hour slot. Tiers now sort so a missing `nextResetTime` maps to the five-hour bucket, so tray and usage quota display stays correct for ZhiPu coding plans.
- **Skills Install by Key**: Installing from skills.sh search results now uses the unique key instead of the directory name, so skills that share a directory name install the correct one (#2784); also fixed a skill sync copy fallback (#2791).
- **Usage Price Input Precision**: Reduced the price input step to 0.0001 so sub-cent costs like DeepSeek cache reads can be entered (#2793, closes #2503).
- **Ghostty Clean Window Launch**: Ghostty now opens a single clean window instead of cloning existing tabs, and other terminals open a new window via `open -na` (#2801, closes #2798).
- **Tool Version and Update Reliability**: Version probing no longer masks unrunnable installs, prerelease tools are handled correctly in version checks, batch updates run per tool, install / update buttons stay locked during preflight, anchored upgrade branches enforce absolute paths, and WSL installer paths use native Unix installers when needed.
- **Codex mise Detection**: Fixed Codex mise environment detection (#2822).
- **Codex Archived Sessions**: Codex archived sessions are now included in session discovery (#2861).
- **Codex Chat Empty Tool Arguments**: Empty tool-call argument payloads are coerced to `{}` during Codex Chat conversion so upstreams and clients receive valid JSON.
- **Claude Provider Deeplink Imports**: Importing Claude providers through deeplinks now preserves custom environment fields (#2928).
- **OMO Recommended Models**: Synced OMO recommended models with upstream defaults and improved Fill Recommended feedback.
- **ShengSuanYun Model IDs Prefixed for Routing**: ShengSuanYun (胜算云) presets now carry the vendor prefixes the upstream gateway requires — `anthropic/…`, `google/…`, and `openai/…` (e.g. `anthropic/claude-sonnet-4.6`, `google/gemini-3.1-pro-preview`) — across the Claude Code, Claude Desktop, Codex, Gemini, OpenCode, and OpenClaw presets, including the Claude Code routing env (`ANTHROPIC_MODEL` / `ANTHROPIC_DEFAULT_{HAIKU,SONNET,OPUS}_MODEL`), so they resolve to valid upstream models instead of failing to route.
- **About Version Check**: Version checks now handle prerelease tool versions without misclassifying update state.
- **App Switcher Text Clipping**: Removed a fixed width constraint that clipped app-switcher text (#3161).
- **useEffect Race Condition**: Added an active-flag pattern to App.tsx effects to prevent listener leaks on unmount, and guarded against storing `undefined` language in localStorage (#2827).

### Removed

### Docs

- **Codex Chat Provider Support**: Documented Chat Completions routing, provider support, reasoning auto-detection, and Local Routing guidance in the changelog and user manual.
- **Settings Manual Refresh**: Updated settings documentation for the new managed tool lifecycle and Hermes installer behavior.
- **Claude Desktop Guide**: Added localized Claude Desktop guide pages and screenshots for provider setup, import, model mapping, and Local Routing context.
- **Installation Docs**: Updated installation docs and READMEs to recommend the official Homebrew cask and refreshed the v3.15.0 release-note imposter-site warning wording across locales.

## [3.15.0] - 2026-05-16

Development since v3.14.1 focuses on a dedicated Claude Desktop surface with third-party provider switching through a proxy gateway, a large reverse-proxy hardening pass (reliability, retries, cache, takeover, Gemini/Vertex/Codex paths), expansion of the third-party provider preset catalog (BytePlus / Volcengine / ClaudeAPI / ClaudeCN / RunAPI / RelaxyCode / PatewayAI / Baidu Qianfan), role-based model mapping with a 1M context flag, Codex OAuth live model discovery, and a long tail of usage, OAuth, Codex, and session quality-of-life fixes.

**Stats**: 127 commits | 211 files changed | +17,980 insertions | -2,748 deletions

### Highlights

### Added

### Changed

### Fixed

- **OpenAI Responses API Usage Parsing Robustness**: Hardened `build_anthropic_usage_from_responses()` and the Responses → Anthropic SSE translator so a missing or malformed upstream `usage` no longer produces `"usage": null` in `message_delta`. This unblocks strict Anthropic clients (notably the VSCode Claude Code extension) that crashed with "Cannot read properties of null (reading 'output_tokens')" against providers such as Codex OAuth and DashScope's `compatible-mode/v1/responses` endpoint. Added OpenAI field-name fallbacks (`prompt_tokens` / `completion_tokens`), null/empty/partial object handling, and preserved cache token fields even when input/output tokens are missing (#2422).
- **Proxy Reliability Patches (P0–P3)**: Multiple rounds of routing, lifecycle, retry, and rectifier patches across the request-forwarder paths; extracted a shared `handle_rectifier_retry_failure` helper and a shared `auth_header_value` helper across provider adapters.
- **Proxy: Pooled HTTPS Connection Reuse**: Non-Anthropic backends now reuse pooled HTTPS connections instead of opening a fresh TLS session per request, materially reducing per-request latency.
- **Proxy: Forward Client HTTP Method**: The proxy forwards the client's actual HTTP method instead of hard-coding `POST`, so non-POST upstream endpoints (e.g. GET `/v1/models`) work correctly.
- **Proxy: Per-Attempt Counters and `max_retries` Wiring**: Client-request counters moved out of the per-attempt loop, and `AppProxyConfig.max_retries` is now correctly wired into the request forwarder.
- **Proxy: Failover Decision Refinements**: Refined failover decision logic in the forwarder so retryable / unretryable errors are classified more accurately.
- **Proxy: Takeover Detection Tightening**: Tightened takeover detection and use fallback restore when disabling takeover so leftover state no longer strands a provider.
- **Proxy: Anthropic ↔ OpenAI `tool_choice` Mapping**: Anthropic `tool_choice` is now correctly mapped to the OpenAI Chat nested form during format conversion.
- **Proxy: Gemini Request Model Extraction**: Gemini request model is now correctly extracted from the URI path (not the body) so transformed traffic reports the right model.
- **Proxy: Auth Header Error Handling**: `get_auth_headers` now returns `Result` instead of panicking on bad credentials.
- **Proxy: IPv6 Listen Address Validation**: The Proxy panel now accepts IPv6 listen addresses.
- **Proxy: Codex / Responses Cache Hit Rate**: Improved cache hit rate for Codex and OpenAI Responses requests by stabilizing cache key derivation; only emit `prompt_cache_key` when a real client-provided session identity is available so unrelated conversations no longer collapse onto a single key; canonicalize (sort) JSON keys in outgoing request bodies and `tool_call` arguments / `tool_result` content for byte-identical prefix-cache reuse; thread `session_id` into the usage logger for request correlation.
- **Proxy: JSON Schema Underscore Fields Preserved**: Private-parameter filtering now preserves underscore-prefixed field names inside JSON Schema name maps such as `properties`, `patternProperties`, `definitions`, and `$defs`, so user-defined schema keys like `_id` and `_meta` survive the filter.
- **Proxy: Read Tool Empty Pages**: Drop empty pages from `Read` tool inputs so providers don't reject the request (#2472).
- **Proxy: Per-Request Hot-Path Trim**: Trimmed per-request hot-path work and database wait time.
- **Proxy: Real Provider Model Names Under Takeover**: The Claude Code menu now exposes the real provider model names when running under takeover, instead of a stale alias.
- **Proxy: Zero Usage in Final Message Delta**: The final `message_delta` event always includes a usage block (even when zero) so strict Anthropic clients no longer crash on `null` (#2485).
- **Proxy: Streaming `message_delta` Deduplication**: Deduplicated streaming `message_delta` events that some upstreams emit twice (#2366).
- **Proxy: Scoped `reasoning_content` Preserved for Tool Calls**: Tool-call paths now correctly preserve the scoped `reasoning_content` field during transformation; Kimi / Moonshot OpenAI Chat compatibility paths keep the field while generic OpenAI-compatible requests stay free of it (#2367).
- **Proxy: Vertex AI Full URL Preserved**: Full Vertex AI URLs are no longer truncated during proxy forwarding (#2415).
- **Proxy: Leading Billing Header Stripped from System Content**: Strips the leading billing-header content that some upstreams prepend to the system message (#2350).
- **Proxy: Claude Auth Strategy from `ANTHROPIC_*` Env Var**: The Claude auth strategy is now derived from the actual `ANTHROPIC_*` env variable name rather than an opaque heuristic.
- **Third-Party Claude Providers: Disable Model Test**: Model probing is now disabled for third-party Claude providers where the gateway doesn't implement `/v1/models` consistently.
- **Model-Fetch: `/models` Subpath for Anthropic-Compatible Providers**: `/models` discovery now works for Anthropic-compatible subpath providers.
- **Copilot: Claude Model ID Resolution Against Live `/models`**: Copilot-backed providers now resolve Claude model IDs against the live `/models` list to avoid stale ID mismatches.
- **Codex: Skip `environment_context` Injection When Extracting Session Title**: Session title extraction no longer pulls in `environment_context` noise (#2439).
- **Codex: Hide Subagent Sessions**: Codex subagent sessions are now hidden from the main session list (#2445).
- **Codex Startup Live Import Duplication**: Fixed a duplicate-import bug in the Codex startup live-import path (#2590).
- **Codex Provider Switch History Drift**: Switching the active Codex provider no longer changes existing session history (#2349).
- **Codex Usage Log Message**: Corrected a misleading log message for Codex session usage (#2473).
- **Claude: Persist Max Effort via Env**: `max` effort now correctly persists via the env variable on restart (#2493).
- **Claude Desktop: Match Proxy Model Route Without `[1M]` Suffix**: Route matching no longer requires the legacy `[1M]` suffix.
- **Claude Desktop: Provider Form Focus Loss**: Fixed an input that lost focus while editing in the Claude Desktop provider form.
- **Claude Desktop: Spurious Proxy-Stopped Status Alert**: Removed an alert that fired spuriously when the proxy was intentionally stopped.
- **Claude Desktop: Empty Toolbar Capsule Hidden**: Hides the empty toolbar capsule when Claude Desktop is the active app.
- **UI: Monitor Badge Icon Centering**: Centered the Monitor badge icon in the app switcher.
- **Linux: Theme Selection Segfault**: Prevented selecting a theme from causing a segfault on Linux (#2502).
- **Terminal: iTerm Fallback on Cold Launch**: Prevented iTerm from being selected as a fallback on cold launch when not actually present (#2448).
- **Config: Sort JSON Keys Alphabetically**: Config writes now sort JSON keys alphabetically for deterministic output (#2469).
- **Import Existing Side-Effect Free**: Made "import existing" side-effect free (#2429).
- **Coding Plan: Zhipu Weekly Tier by Reset Time**: Corrected the Zhipu weekly tier name to match the actual reset time (#2420).
- **DashScope: Usage Parsing Robustness**: Hardened DashScope usage parsing so a malformed payload no longer crashes the VSCode Claude Code extension (#2425).
- **Usage: Prevent Double-Counting Between Proxy and Session-Log Sources**: Deduplicated usage records sourced from both the proxy and session logs.
- **Usage: Cache Cost Semantics + Pricing Warn Storm**: Corrected cache-cost semantics and silenced a noisy pricing warning storm that fired on every request.
- **CI: Frontend Formatting and Linux Clippy Restored**: Restored frontend formatting and Linux clippy checks in CI.
- **Proxy Test Helper Clippy Warning**: Fixed a clippy warning in the proxy test helper.

### Removed

### Docs

## [3.14.1] - 2026-04-23

Development since v3.14.0 focuses on Codex OAuth stability, tray usage visibility, Skills import/install reliability, Gemini session restore paths, and simplifying Hermes configuration health handling.

**Stats**: 13 commits | 48 files changed | +1,883 insertions | -808 deletions

### Added

- **Tray Usage Visibility**: System tray submenus now show cached usage for the current Claude / Codex / Gemini provider, including subscription and script-based usage summaries with utilization color markers. Tray-triggered refreshes are throttled, limited to visible apps, and synchronized back into React Query so the main window and tray share fresh usage data (#2184).
- **Tray Coding-Plan Usage (Kimi / Zhipu / MiniMax)**: System tray now renders 5-hour + weekly window usage for Chinese coding-plan providers using the same `🟢 h12% w80%` two-window layout as official subscription badges (worst utilization drives the emoji). Creating a Claude provider whose `ANTHROPIC_BASE_URL` matches a known coding-plan host now auto-injects `meta.usage_script`, so the tray lights up without opening the Usage Script modal. Existing `usage_script` values are preserved on update.
- **Codex OAuth FAST Mode**: Added an explicit FAST mode toggle for Codex OAuth-backed Claude providers. When enabled, converted Responses requests send `service_tier="priority"` for lower latency; the toggle stays off by default to avoid unexpectedly increasing ChatGPT quota consumption (#2210).

### Changed

- **Session and Settings Layout Polish**: Hardened the scroll-area viewport with width containment to fix horizontal overflow, and tightened app bottom spacing plus settings footer spacing so long session/settings views fit more cleanly (#2201).

### Removed

- **Hermes Config Health Scanner**: Removed the in-app Hermes config health scanner, warning banner, `scan_hermes_config_health` command, `HermesHealthWarning` type, and `HermesWriteOutcome.warnings` payload. CC Switch now keeps the Hermes surface focused on active provider display, provider switching defaults, memory editing, and launching the Hermes Web UI for deep configuration.

### Fixed

- **Codex OAuth Cache Routing**: Stabilized ChatGPT Codex reverse-proxy cache identity by using client-provided session IDs for `prompt_cache_key` and Codex session headers, preserving explicit cache keys, and avoiding generated UUID cache churn (#2218).
- **Codex OAuth Responses SSE Aggregation**: Non-streaming Anthropic clients now receive JSON even when the ChatGPT Codex upstream forces OpenAI Responses SSE; CC Switch aggregates the upstream SSE events before running the non-streaming transform (#2235).
- **Codex OAuth Stream Check Parity**: Stream checks now build Codex OAuth test requests with the same `store: false`, encrypted reasoning include, and provider FAST mode setting as production proxy requests (#2210).
- **Codex Model Extraction**: Replaced first-line regex matching with TOML parsing when reading Codex config models, so multiline TOML is handled correctly (#2227).
- **Model Quick-Set / One-Click Config**: Model quick-set updates now apply against the latest provider form config, preventing stale state from making one-click configuration fail (#2249).
- **Skills Import Duplicates**: The Skills import dialog disables actions while import is pending and the installed-skills cache deduplicates imported results by ID, preventing double-clicks from adding duplicate installed entries (#2139, #2211).
- **Root-Level Skill Repos**: Skill install and update flows now consistently resolve three source patterns: direct nested paths, install-name recursive search, and repository-root `SKILL.md` sources (#2231).
- **Gemini Session Restore Paths**: Gemini session scanning now reads `.project_root` metadata so restore flows can pass the original project directory when available (#2240).
- **Provider Hover Names**: Provider icons now expose the provider name on hover for inline SVG, image URL, and fallback initials render paths (#2237).

## [3.14.0] - 2026-04-21

Development since v3.13.0 focuses on onboarding Hermes Agent as a first-class managed app, rolling out Claude Opus 4.7 across the preset matrix, adding a Gemini Native API proxy, and sharpening session, usage, and proxy workflows.

**Stats**: 100 commits | 219 files changed | +20,548 insertions | -3,569 deletions

### Added

### Changed

- **"Local Proxy Takeover" → "Local Routing"**: Unified terminology across UI copy, README, and docs in all three locales. Functional behavior is unchanged.
- **Hermes `Auto` api_mode Removed**: Users must now pick an explicit protocol; new deeplinks default to `chat_completions`. Eliminates URL-based heuristic surprises.
- **Hermes Provider Form**: Added an API mode dropdown and per-provider model editor; bound per-provider models to the top-level `model:` when switching active providers.
- **Hermes Deep Config Delegation**: Deep YAML knobs are now delegated to the Hermes Web UI via a direct launch action, rather than duplicated in the CC Switch form.
- **`ANTHROPIC_REASONING_MODEL` Removed from Claude Quick-Set**: Decoupled the reasoning capability from model selection; the legacy field is no longer surfaced in the quick-set form.
- **Per-Provider Proxy Config Removed**: Consolidated into global Local Routing; the provider-level proxy toggle and associated storage are gone.
- **Unified Toolbar Icon Button Width**: Normalized icon-button widths across Claude / Codex / Gemini / OpenCode / OpenClaw / Hermes panels for a consistent header look.
- **Rust Toolchain Pinned to 1.95**: Adopted clippy 1.95 suggestions across the workspace and pinned the toolchain to prevent nightly drift.
- **Tray Menu ID Constant**: The tray identifier moved from the hardcoded string `"main"` to a `TRAY_ID` constant (`"cc-switch"`) across all call sites.
- **Copilot Request Classification**: Refined request routing inside the Copilot optimizer to further reduce unnecessary premium interaction consumption.
- **Usage Script Intranet Support**: Removed private-IP / suspicious-hostname blocking from usage scripts, unblocking enterprise intranet, Docker, and self-hosted API endpoints. Built-in templates still enforce HTTPS (except localhost) and same-origin checks; custom templates remain user-controlled with those request-URL checks skipped.
- **Failover Queue Notes**: Provider notes now appear in failover queue selectors and queue rows for easier identification across multi-provider queues.
- **Hermes Toolbar Layout**: Swapped the Hermes Web UI button from `ExternalLink` to `LayoutDashboard` (clicking may spawn `hermes dashboard` rather than just opening a URL), and moved MCP to the final toolbar slot so Hermes matches the Claude / Codex / Gemini / OpenCode layout.

### Fixed

- **Header Auto-Compact Latching After Maximize**: The toolbar no longer stays compacted after maximize/restore; compaction now reevaluates on size changes.
- **Hermes YAML Pollution & OAuth MCP Auth Drop**: Round-tripping through CC Switch no longer drops OAuth MCP `auth` blocks or pollutes unrelated YAML keys; guard tests added via `tests/hermes_roundtrip.rs`.
- **Hermes Active Provider Display**: Hermes UI now correctly surfaces the active provider and wires add / enable / remove actions.
- **Hermes Provider Persistence**: Providers persist under `custom_providers:` so `api_mode` and `model` survive restarts and config reloads.
- **Codex `cache_control` Preservation**: Preserve `cache_control` when merging system prompts during Codex format conversion (#1946).
- **Claude Prompt Cache Key Leak**: Stopped sending prompt cache keys during Claude chat conversions (#2003).
- **Proxy Hop-by-Hop Header Stripping**: Strip hop-by-hop response headers (Connection, Keep-Alive, Transfer-Encoding, etc.) per RFC 7230.
- **Permissive Proxy CORS Removed**: Removed the permissive CORS layer from the proxy (#1915).
- **Copilot Premium Consumption**: Further reduced unnecessary Copilot premium interaction consumption during pass-through traffic.
- **Backend Error Details in Proxy Toast**: Surface backend error payload details in proxy-related toast messages instead of a generic failure string.
- **Usage Log Deduplication**: Deduplicated proxy and session-log usage records so the same request is no longer double-counted; synced the request log time range with the dashboard's 1d / 7d / 30d selector.
- **Common Config Checkbox Persistence**: Checkbox state for Claude / Codex / Gemini common-config toggles now persists correctly across reopens.
- **Claude Plugin `settings.json` Sync**: Editing the current provider now syncs back to `settings.json` for the Claude plugin path.
- **Google Official Gemini Env Preservation**: Saving the Google Official Gemini provider no longer clobbers the `env` block.
- **OpenCode JSON5 Parser for Trailing Commas**: OpenCode config reads now tolerate trailing commas via a JSON5 parser.
- **Preset Refreshes**: Refreshed stale context windows for DeepSeek and Claude 1M; refreshed stale model IDs; backfilled Hermes model lists; fixed the Nous endpoint and replaced the Hermes placeholder icon with Nous brand artwork; pruned unused official Hermes presets.
- **Auto-Expand Collapsed Messages on Search Hit**: Collapsed messages now auto-expand when a search match lands inside hidden content.
- **Unknown Subscription Quota Tiers Hidden**: Provider cards no longer render unknown subscription quota tiers.
- **Weekly Limit Label Unified**: Aligned the weekly_limit tier label with the official 7-day naming across locales.
- **Root-Level Skill Repo Install**: Fixed skill installation when the repository root itself is a skill.
- **Session ID Parsing Clippy**: Removed a redundant closure in session ID parsing (clippy warning).
- **Usage Log Stat Dedup**: Deduplicated proxy-sourced and session-log-sourced usage records for accurate totals.
- **Stream Check Default Models Refresh**: Updated stream-check default probe models to match each vendor's current lineup.
- **Skills Import Sync**: Imported Skills are now immediately synced into enabled app directories instead of only being recorded in the database, so the UI no longer shows "installed" while the target app directory is missing the skill.
- **Ghostty Session Restore**: Fixed Ghostty session restore launch by using shell execution with `--working-directory`, avoiding `cwd` escaping issues when the path contains spaces or special characters.
- **Hermes Health Check Borrowing OpenClaw Schema**: Hermes providers were routed through `check_additive_app_stream` (the OpenClaw dispatcher), which reads camelCase `baseUrl` / `apiKey` / `api` and surfaced "OpenClaw provider is missing baseUrl" even when every Hermes field was filled. Introduced `check_hermes_stream` with Hermes-specific extractors that map `api_mode` (`chat_completions` / `anthropic_messages` / `codex_responses`) to the matching `check_claude_stream` `api_format`, and returns `bedrock_converse` as unsupported. `api_mode` is now resolved before URL / API key extraction, so `bedrock_converse` users see the real cause rather than a misleading "missing base_url".
- **Usage Query Modal for Hermes & OpenClaw**: `getProviderCredentials` now reads flat `settingsConfig` fields for Hermes (snake_case `base_url` / `api_key`) and OpenClaw (camelCase `baseUrl` / `apiKey`), so the "official balance" template auto-selects for matching providers like SiliconFlow. Also refactored the BALANCE and TOKEN_PLAN test paths to reuse the precomputed `providerCredentials` instead of re-reading `env.ANTHROPIC_*` directly, fixing the "empty key" error for non-Claude apps even when the key was configured.

### Docs

### Breaking

- **Hermes requires explicit `api_mode`**: The `Auto` mode is gone; imported or deeplinked providers default to `chat_completions`. Users with prior `Auto` configs will be prompted to pick a protocol.
- **`ANTHROPIC_REASONING_MODEL` removed from Claude quick-set**: The legacy field is no longer exposed; existing settings are cleaned up automatically.
- **Per-provider proxy configuration removed**: Migrate to the global Local Routing setting. Existing per-provider proxy values are ignored.
- **Database schema bumped v9 → v10**: Adds `enabled_hermes` columns to `mcp_servers` and `skills` (auto-migrated with `DEFAULT 0`; no data loss).
- **Pricing table reseeded (v8 → v9)**: The `model_pricing` table is cleared and reseeded on first launch to pick up new models and corrected prices.
- **XCodeAPI preset removed**: Users of the XCodeAPI preset should switch to another provider.

---

## [3.13.0] - 2026-04-10

Development since v3.12.3 focuses on quota visibility, provider workflow upgrades, stronger proxy compatibility, and lower-overhead tray / session workflows.

### Added

### Changed

- **Tray Menu Organization**: Reworked the tray menu into per-app submenus to prevent overflow and make background provider switching scale better with larger provider lists.
- **Proxy Forwarding Stack**: Refactored proxy forwarding onto a Hyper-based client with transparent header forwarding, improved endpoint rewriting, and better support for dynamic upstream endpoints.
- **OAuth Auth Center UI Polish**: Tightened the Auth Center copy, layout, and icon presentation so the Codex OAuth login flow feels cleaner and less cluttered.
- **Provider Key Lifecycle & Live Sync**: Reworked additive provider create / rename / duplicate flows so live config writes, cleanup, and rollback stay consistent across OpenCode / OpenClaw and takeover scenarios.
- **Codex OAuth Defaults**: Updated the Codex OAuth preset to the GPT-5.4 model family.

### Fixed

- **Copilot Authentication & Proxy Compatibility**: Fixed GitHub Copilot authentication regressions, corrected enterprise / dynamic endpoint handling, repaired clipboard verification-code copying on macOS and Linux, and fixed Responses routing when Copilot-backed Claude providers target OpenAI models.
- **Streaming Parser Compatibility**: Fixed SSE parsing to accept fields with optional spaces, improving compatibility with non-strict streaming implementations.
- **UTF-8 Stream Chunk Boundaries**: Fixed intermittent garbled output (U+FFFD replacement characters) in Claude Code when multi-byte UTF-8 sequences such as Chinese characters or emoji were split across TCP stream chunks via the Copilot reverse proxy, by preserving incomplete trailing bytes across chunks in all four SSE streaming paths instead of lossy decoding.
- **Fragmented System Prompt Normalization**: Fixed strict OpenAI-compatible chat backends (Nvidia, Qwen-style) rejecting requests when converted Claude payloads contained multiple system messages, by merging system content into a single leading system message during the Anthropic → OpenAI chat transformation.
- **Provider Switch State Corruption**: Serialized per-app provider switches to prevent concurrent failover or hot-switch operations from leaving `is_current`, settings state, and live backup state out of sync.
- **Claude Takeover Live Config Drift**: Fixed provider edits while Claude takeover is active so live settings remain aligned with the latest provider state without breaking takeover restore behavior.
- **WebDAV Password Retention & Validation**: Fixed the WebDAV password field so saved credentials remain visible after refresh and treated `MKCOL 405` responses correctly during connection validation.
- **Provider Card Action States**: Fixed additive-mode highlight behavior, aligned usage display layout across provider cards, replaced hard proxy-switch blocking with a warning path, and disabled unsupported test / usage actions for Copilot and Codex OAuth cards.
- **Usage Accuracy & Pricing**: Fixed MiniMax quota math and 0%→100% progression, corrected CNY→USD pricing plus missing model definitions, improved Gemini session-log syncing, and resolved session-based usage entries being shown as unknown providers.
- **Usage Editor & Skills UI Regressions**: Fixed usage query fields being reset while editing extractor code, corrected broken `skills.sh` links and empty descriptions, and fixed auto-query defaults plus number-input clearing in usage configuration.
- **Chinese Skills Terminology**: Unified Skills-related labels across settings panels in the `zh` locale so storage and sync options use consistent wording.
- **Environment & Preset Compatibility**: Added Bun global bin detection in CLI scan, adapted to the oh-my-openagent rename with backward compatibility, corrected the OpenCode `kimi-for-coding` preset, gated Gemini keychain parsing to macOS, and fixed an OpenClaw serializer panic on empty collections.
- **Linux UI Unresponsive on Startup**: Fixed a bug where the window UI (including native title bar buttons) couldn't receive clicks on Linux until the user manually maximized and restored the window. Root causes: (1) Tauri webview did not acquire keyboard focus after `show()` on Linux, so the first click was consumed by X11/Wayland click-to-activate (Tauri #10746, wry #637); (2) GTK surface's input region failed to renegotiate on the `visible:false → show()` path under some WebKitGTK/compositor combinations, leaving the entire window unresponsive. Mitigations: set `WEBKIT_DISABLE_COMPOSITING_MODE=1` at startup, and added a new `linux_fix::nudge_main_window` helper that performs `set_focus` + a ±1px no-op resize ~200ms after show, equivalent to a visually invisible "maximize-and-restore". Wired into all window-re-show paths (normal startup, deeplink, single_instance, tray `show_main`, lightweight exit).
- **Linux Drag Region on Header**: Removed `data-tauri-drag-region` from the top header bar on Linux to avoid triggering `gtk_window_begin_move_drag` paths affected by Tauri #13440 under Wayland. macOS drag behavior is preserved.
- **OpenCode / OpenClaw Stream Check Edge Cases**: Fixed custom-header passthrough, OpenClaw custom auth-header detection, Bedrock error messaging, and OpenCode default `baseURL` fallback handling in Stream Check.
- **Duplicate Toast on Provider Switch**: Fixed double toast notifications (proxy-required warning followed by switch-success) when switching to Copilot, ChatGPT, or OpenAI-format providers with the proxy not running.
- **Session Search Accuracy & Chinese Support**: Fixed session search result truncation across providers and switched FlexSearch tokenizer to full mode for proper Chinese substring matching.
- **Adaptive Thinking Reasoning Effort**: Fixed `resolve_reasoning_effort()` mapping adaptive thinking to `xhigh` instead of incorrectly using `high` in OpenAI format conversions.
- **Thinking Model Fallback Display**: Fixed the Claude provider form showing an empty Thinking model field after saving only a main model by applying read-only fallback to ANTHROPIC_MODEL.
- **Auth Tab Localization**: Fixed missing i18n translation keys for the settings auth tab label across all locale bundles.
- **Schema Migration Guard**: Fixed database migrations failing when skills or model_pricing tables did not exist by adding table-existence checks before ALTER and UPDATE operations.

### Docs

---

## [3.12.3] - 2026-03-24

Major release adding GitHub Copilot reverse proxy support, macOS code signing & Apple notarization, intelligent reasoning effort mapping for o-series models, skill backup/restore lifecycle, proxy gzip compression, and critical fixes for WebDAV password safety, tool message parsing, and dark mode.

**Stats**: 36 commits | 107 files changed | +9,124 insertions | -802 deletions

### Added

- **GitHub Copilot Reverse Proxy**: Full GitHub Copilot integration as a Claude Code provider via OAuth Device Code flow; includes multi-account management, automatic token refresh, Anthropic ↔ OpenAI format conversion, real-time model list fetching, and usage statistics (#930)
- **Copilot Auth Center**: New Auth Center panel in Settings for managing GitHub accounts globally, with per-provider account binding via `meta.authBinding`
- **Tool Search Toggle**: Added `ENABLE_TOOL_SEARCH` env var support for Claude 2.1.76+; exposed as a checkbox in the provider Common Config editor (#930)
- **Reasoning Effort Mapping**: Two-tier `resolve_reasoning_effort()` for OpenAI o-series and GPT-5+ models — explicit `output_config.effort` takes priority, falling back to thinking `budget_tokens` thresholds (<4 000→low, 4 000–16 000→medium, ≥16 000→high); covers both Chat Completions and Responses API paths with 17 unit tests
- **OpenCode SQLite Backend**: Added SQLite session storage support for OpenCode alongside existing JSON backend; dual-backend scan with SQLite priority on ID conflicts, atomic session deletion, and path validation (#1401)
- **Skill Auto-Backup**: Skill files are automatically backed up to `~/.cc-switch/skill-backups/` before uninstall, with metadata preserved in `meta.json`; old backups pruned to keep at most 20
- **Skill Backup Restore & Delete**: Added list/restore/delete commands for skill backups; restore copies files back to SSOT, saves the DB record, and syncs to the current app with rollback on failure
- **macOS Code Signing & Notarization**: CI now imports an Apple Developer ID certificate, signs the universal binary, submits for Apple notarization, and staples the ticket to both `.app` and `.dmg`; a hard-fail verification step (`codesign --verify` + `spctl -a` + `stapler validate`) gates the release for both artifacts
- **Codex 1M Context Window Toggle**: One-click checkbox in Codex config editor to set `model_context_window = 1000000` with auto-populated `model_auto_compact_token_limit = 900000`; unchecking removes both fields
- **Disable Auto-Upgrade Toggle**: Added `DISABLE_AUTOUPDATER` env var checkbox in the Claude Common Config editor to prevent Claude Code from auto-upgrading

### Changed

### Fixed

- **WebDAV Password Silent Clear**: Fixed WebDAV password being silently wiped when ProviderList or UsageScriptModal saved settings by stripping `webdavSync` from frontend payloads and adding backend backfill logic in `merge_settings_for_save()` to preserve existing passwords
- **Tool Message Parsing**: Fixed tool_use/tool_result message classification across Claude (tool_result content blocks), Codex (function_call/function_call_output payloads), and Gemini (array content + toolCalls extraction) session providers (#1401)
- **Dark Mode Selector**: Changed Tailwind `darkMode` from `["selector", "class"]` to `["selector", ".dark"]` to ensure correct dark mode activation (#1596)
- **Copilot Request Fingerprint**: Unified Copilot request fingerprint headers across all API call sites to prevent User-Agent leakage and stream check mismatches
- **o-series Responses API Tokens**: Kept Responses API on the correct `max_output_tokens` field for o-series models instead of incorrectly injecting `max_completion_tokens`
- **Provider Form Double Submit**: Prevented duplicate submissions on rapid button clicks in provider add/edit forms (#1352)
- **Ghostty Session Restore**: Fixed Claude session restore in Ghostty terminal (#1506)
- **Skill ZIP Import Extension**: Added `.skill` file extension support in ZIP import dialog (#1240, #1455)
- **Skill ZIP Install Target App**: ZIP skill installs now use the currently active app instead of always defaulting to Claude
- **OpenClaw Active Card Highlight**: Fixed active OpenClaw provider card not being highlighted (#1419)
- **Responsive Layout with TOC**: Improved responsive design when TOC title exists (#1491)
- **Import Skills Dialog White Screen**: Added missing TooltipProvider in ImportSkillsDialog to prevent runtime crash when opening the dialog
- **Panel Bottom Blank Area**: Replaced hardcoded `h-[calc(100vh-8rem)]` with `flex-1 min-h-0` across all content panels to eliminate bottom gap caused by mismatched offset values

### Docs

- **Pricing Model ID Normalization**: Added documentation section explaining model ID normalization rules (prefix stripping, suffix trimming, `@`→`-` replacement) in EN/ZH/JA user manuals (#1591)
- **macOS Signed & Notarized**: Removed all `xattr` workaround instructions and "unidentified developer" warnings from README, README_ZH, installation guides (EN/ZH/JA), and FAQ pages (EN/ZH/JA); replaced with "signed and notarized by Apple" messaging

---

## [3.12.2] - 2026-03-12

Post-v3.12.1 work focuses on Common Config safety during proxy takeover and more reliable Codex TOML editing.

**Stats**: 5 commits | 22 files changed | +1,716 insertions | -288 deletions

### Added

- **Empty State Guidance**: Improved first-run experience with detailed import instructions and a conditional Common Config snippet hint for Claude/Codex/Gemini providers

### Changed

- **Proxy Takeover Restore Flow**: Proxy takeover hot-switch and provider sync now refresh the restore backup instead of overwriting live config files, rebuilding effective provider settings with Common Config applied so rollback preserves the real user configuration
- **Codex TOML Editing Engine**: Refactored Codex `config.toml` updates onto shared section-aware TOML helpers in Rust and TypeScript, covering `base_url` and `model` field edits across provider forms and takeover cleanup
- **Common Config Initialization Lifecycle**: Startup now auto-extracts Common Config snippets from clean live configs before takeover restoration, tracks explicit "snippet cleared" state, and persists a one-time legacy migration flag to avoid repeated backfills

### Fixed

- **Common Config Loss During Takeover**: Fixed cases where proxy takeover could drop Common Config changes, overwrite live configs during sync, or produce incomplete restore snapshots when switching providers
- **Codex Restore Snapshot Preservation**: Fixed Codex takeover restore backups so existing `mcp_servers` blocks survive provider hot-switches instead of being discarded; changed MCP backup preservation from wholesale table replacement to per-server-id merge so provider/common-config MCP updates win on conflict while live-only servers are retained
- **Cleared Snippet Resurrection**: Fixed startup auto-extraction recreating Common Config snippets that users had intentionally cleared
- **Codex `base_url` Misplacement**: Fixed Codex `base_url` extraction and editing to target the active `[model_providers.<name>]` section instead of appending to the file tail or confusing `mcp_servers.*.base_url` entries for provider endpoints

---

## [3.12.1] - 2026-03-12

### Patch Release

**Stats**: 19 commits | 56 files changed | +1,429 insertions | -396 deletions

### Added

#### Provider Presets

- **StepFun**: Added StepFun (阶跃星辰) provider presets including the step-3.5-flash model across supported applications (#1369, thanks @hengm3467)

#### OpenClaw Enhancements

- **Input Type Selection**: Added input type selection dropdown for model Advanced Options in OpenClaw configuration form (#1368, thanks @liuxxxu)
- **authHeader Field**: Added optional `authHeader` boolean to OpenClawProviderConfig for vendor-specific auth header support (e.g. Longcat), and refactored form state to reuse the shared type

### Changed

### Fixed

#### Common Config & UI

- **Common Config Modal Loop**: Fixed an infinite reopen loop in the Common Config modal and added draft editing support to prevent data loss during edits
- **Toolbar Compact Mode (Windows)**: Fixed toolbar compact mode not triggering on Windows due to left-side overflow (#1375, thanks @zuoliangyu)
- **Session Search Index**: Fixed session search index not syncing with query data, causing stale list display after session deletion

#### Sync & Data

- **WebDAV Provider Health FK**: Fixed foreign key constraint failure when restoring `provider_health` table during WebDAV sync

#### Provider & Preset

- **Longcat authHeader**: Added missing `authHeader: true` to Longcat provider preset (#1377, thanks @wavever)
- **OpenClaw Tool Permissions**: Aligned OpenClaw tool permission profiles with upstream schema (#1355, thanks @bigsongeth)
- **X-Code API URL**: Corrected X-Code API URL from `www.x-code.cn` to `x-code.cc`

#### i18n & Localization

- **Stream Check Toast**: Fixed stream check toast i18n interpolation keys not matching translation placeholders
- **Proxy Startup Toast**: Fixed proxy startup toast not interpolating address and port values (#1399, thanks @Mason-mengze)
- **OpenCode API Format Label**: Renamed OpenCode API format label from "OpenAI" to "OpenAI Responses" for accuracy

---

## [3.12.0] - 2026-03-09

### Feature Release

This release restores the **Model Health Check (Stream Check)** UI, adds **OpenAI Responses API** format conversion, introduces the **Bedrock Optimizer** for thinking + cache injection, expands provider presets (Ucloud, Micu, X-Code API, Novita, Bailian For Coding), overhauls **OpenClaw config panels** with a JSON5 round-trip write engine, enhances **WebDAV sync** with dual-layer versioning, and delivers a comprehensive **i18n audit** fixing 69 missing keys alongside 20+ bug fixes.

**Stats**: 56 commits | 221 files changed | +20,582 insertions | -8,026 deletions

### Added

#### Stream Check (Model Health Check)

- **Restore Stream Check UI**: Brought back the model health check (Stream Check) panel for testing provider endpoint availability with live streaming validation
- **First-Run Confirmation**: Added a confirmation dialog on first use of Stream Check to inform users about the feature's purpose and network requests
- **OpenAI Chat Format Support**: Stream Check now supports `openai_chat` api_format, enabling health checks for providers using OpenAI-compatible endpoints

#### OpenAI Responses API

- **Responses API Format Conversion**: New `api_format = "openai_responses"` option enabling Anthropic Messages ↔ OpenAI Responses API bidirectional conversion for providers that implement the Responses API
- **Responses API Deduplication**: Deduplicated and improved the Responses API conversion logic, consolidating shared transformation code

#### Bedrock Optimizer

- **Bedrock Request Optimizer**: PRE-SEND optimizer that injects thinking parameters and cache control blocks into AWS Bedrock requests, enabling extended thinking and prompt caching on Bedrock endpoints (#1301)

#### OpenClaw Enhancements

- **JSON5 Round-Trip Write Engine**: Overhauled OpenClaw config panels with a JSON5 round-trip write engine that preserves comments, formatting, and ordering when saving configuration changes
- **Config Panel Improvements**: Redesigned EnvPanel as a full JSON editor, added `tools.profile` selection to ToolsPanel, introduced OpenClawHealthBanner for config validation warnings, and added legacy timeout migration support in Agents Defaults
- **Agent Model Dropdown**: Replaced text inputs with dropdown selects for OpenClaw agent model configuration, offering a curated list of available models
- **User-Agent Toggle**: Added a User-Agent header toggle for OpenClaw, defaulting to off to avoid potential compatibility issues with certain providers

#### Provider Presets

#### WebDAV Sync

- **Dual-Layer Versioning**: Added protocol v2 + db-v6 dual-layer versioning to WebDAV sync, enabling backward-compatible sync format evolution and automatic migration detection
- **Auto-Sync Confirmation**: Added a confirmation dialog when toggling WebDAV auto-sync on/off to prevent accidental changes

#### Usage & Data

- **Daily Rollups & Auto-Vacuum**: Added usage daily rollups for aggregated statistics, incremental auto-vacuum for storage management, and sync-aware backup that coordinates with WebDAV sync cycles
- **UsageFooter Extra Fields**: Added extra field display in UsageFooter component for normal mode, showing additional usage metadata (#1137)

#### Session Management

- **Session Deletion**: Added session deletion with per-provider cleanup and path safety validation, allowing users to remove individual conversation sessions

#### UI & Config

- **Auth Field Selector**: Restored Claude provider auth field selector supporting both AUTH_TOKEN and API_KEY authentication modes
- **Failover Toggle**: Moved failover toggle to display independently on the main page with a confirmation dialog for enabling/disabling
- **Common Config Auto-Extract**: Auto-extract Common Config Snippets from live configuration files on first run, seeding initial common config without manual setup
- **New Provider Page Improvements**: Improved the new provider page with API endpoint and model name fields (#1155)

### Changed

#### Architecture

- **Common Config Runtime Overlay**: Common Config is now applied as a runtime overlay during provider switching instead of being materialized (merged) into each provider's stored config. This preserves the original provider config in the database and applies common settings dynamically at write time
- **First-Run Auto-Extract**: On first run, Common Config Snippets are automatically extracted from the current live configuration files, eliminating the need for manual initial setup

### Fixed

#### Proxy & Streaming

- **OpenAI Streaming Conversion**: Fixed OpenAI ChatCompletion → Anthropic Messages streaming conversion that could produce malformed events under certain response structures
- **Codex /responses/compact Route**: Added support for Codex `/responses/compact` route in proxy forwarding (#1194)
- **Codex Common Config TOML Merge**: Fixed Codex Common Config to use structural TOML merge/subset instead of raw string comparison, correctly handling key ordering and formatting differences
- **Proxy Forwarder Failure Logs**: Improved proxy forwarder failure logging with more descriptive error messages

#### Provider & Preset

- **X-Code Rename**: Renamed "X-Code" provider to "X-Code API" for consistency with the official branding
- **SSSAiCode Missing /v1**: Added missing `/v1` path to SSSAiCode default endpoint for Codex and OpenCode
- **AICoding URL Fix**: Removed `www` prefix from aicoding.sh provider URLs to match the correct domain
- **New Provider Page Input Handling**: Fixed the new provider page so API endpoint / model fields handle line-break deletion correctly and added the missing `codexConfig.modelNameHint` i18n key for zh/en/ja

#### Platform

- **Cache Hit Token Statistics**: Fixed missing token statistics for cache hits in streaming responses (#1244)
- **Minimize-to-Tray Auto Exit**: Fixed issue where the application would automatically exit after being minimized to the system tray for a period of time (#1245)

#### i18n & Localization

- **Comprehensive i18n Audit**: Added 69 missing i18n keys and fixed hardcoded Chinese strings across the application, improving localization coverage for all three languages (zh/en/ja)
- **Model Test Panel i18n**: Corrected i18n key paths for model test panel title and description
- **JSON5 Slash Escaping**: Normalized JSON5 slash escaping and added i18n support for OpenClaw panel labels

#### UI

- **Skills Count Display**: Fixed skills count not displaying correctly when adding new skills (#1295)
- **Endpoint Speed Test**: Removed HTTP status code display from endpoint speed test results to reduce visual noise
- **Outline Button Text Tone**: Aligned outline button text color tone with usage refresh control for visual consistency (#1222)

### Performance

- **OpenClaw Config Write Skip**: Skip backup and atomic write when OpenClaw configuration content is unchanged, avoiding unnecessary I/O operations

### Documentation

### Maintenance

- **Periodic Maintenance Timer**: Consolidated periodic maintenance timers into a unified scheduler, combining vacuum and rollup operations into a single timer
- **OpenClaw Save Toast**: Removed backup path display from OpenClaw save toasts for cleaner notification messages

---

## [3.11.1] - 2026-02-28

### Hotfix Release

This release reverts the Partial Key-Field Merging architecture introduced in v3.11.0, restoring the proven "full config overwrite + Common Config Snippet" mechanism, and fixes several UI and platform compatibility issues.

**Stats**: 8 commits | 52 files changed | +3,948 insertions | -1,411 deletions

### Reverted

- **Restore Full Config Overwrite + Common Config Snippet** (revert 992dda5c): Reverted the partial key-field merging refactoring from v3.11.0 due to critical issues — non-whitelisted custom fields were lost during provider switching, backfill permanently stripped non-key fields from the database, and the whitelist required constant maintenance. Restores full config snapshot write, Common Config Snippet UI and backend commands, and 6 frontend components/hooks

### Changed

- **Proxy Panel Layout**: Moved proxy on/off toggle from accordion header into panel content area, placed directly above app takeover options, ensuring users see takeover configuration immediately after enabling the proxy
- **Manual Import for OpenCode/OpenClaw**: Removed auto-import on startup; empty state now shows an "Import Current Config" button, consistent with Claude/Codex/Gemini behavior

### Fixed

- **"Follow System" Theme Not Auto-Updating**: Delegated to Tauri's native theme tracking (`set_window_theme(None)`) so the WebView's `prefers-color-scheme` media query stays in sync with OS theme changes
- **Compact Mode Cannot Exit**: Restored `flex-1` on `toolbarRef` so `useAutoCompact`'s exit condition triggers correctly based on available width instead of content width
- **Proxy Takeover Toast Shows {{app}}**: Added missing `app` interpolation parameter to i18next `t()` calls for proxy takeover enabled/disabled messages
- **Windows Protocol Handler Side Effects**: Disabled environment check and one-click install on Windows to prevent unintended protocol handler registration

---

## [3.11.0] - 2026-02-26

### Feature Release

This release introduces **OpenClaw** as the fifth supported application, a full **Session Manager** for browsing conversation history across all apps, an independent **Backup Management** panel, **Oh My OpenCode (OMO)** integration, and 50+ other features, fixes, and improvements across 147 commits.

**Stats**: 147 commits | 274 files changed | +32,179 insertions | -5,467 deletions

### Added

#### OpenClaw Support (New Application)

- **OpenClaw Integration**: Full management support for OpenClaw as the fifth application in CC Switch, including provider switching, configuration panels (Env / Tools / Agents Defaults), Workspace file management (HEARTBEAT / BOOTSTRAP / BOOT), daily memory files, and additive overlay mode
- **OpenClaw Provider Presets**: 13+ built-in provider presets with brand icon and complete i18n (zh/en/ja)
- **OpenClaw Form Fields**: Dedicated provider form with providerKey input, model allowlist auto-registration, and default model button
- **OpenClaw Config Panels**: Env editor, Tools editor, and Agents Defaults editor backed by JSON5 read/write (`openclaw_config.rs`)

#### Session Manager

- **Session Manager**: Browse and search conversation history for Claude Code, Codex, Gemini CLI, OpenCode, and OpenClaw with table-of-contents navigation and in-session search
- **Session App Filter**: Auto-filter sessions by current app when entering the session page
- **Session Performance**: Parallel directory scanning and head-tail JSONL reading for faster session list loading

#### Backup Management

- **Backup Panel**: Independent backup management panel with configurable backup policy (max count, auto-cleanup) and backup rename support
- **Periodic Backup**: Hourly automatic backup timer during runtime
- **Pre-Migration Backup**: Automatic backup before database schema migrations with backfill warning
- **Delete Backup**: Delete individual backup files with confirmation dialog
- **Backup Time Fix**: Use local time instead of UTC for backup file names

#### Oh My OpenCode (OMO)

- **OMO Integration**: Full Oh My OpenCode config file management with agent model selection, category configuration, and recommended model fill
- **OMO Slim**: Lightweight oh-my-opencode-slim mode support with OmoVariant parameterization
- **OMO Cross-Exclusion**: Enforce OMO ↔ OMO Slim mutual exclusion at the database level

#### Workspace

- **Daily Memory Search**: Full-text search across daily memory files with date-sorted display
- **Clickable Paths**: Directory paths in workspace panels are now clickable; renamed “Today's Note” to “Add Memory”
- **Workspace Files Panel**: Manage bootstrap markdown files for OpenClaw (HEARTBEAT / BOOTSTRAP / BOOT types)

#### Provider Presets

#### Proxy & Network

- **Thinking Budget Rectifier**: New rectifier for thinking budget parameters with dedicated module (`thinking_budget_rectifier.rs`)
- **WebDAV Auto Sync**: Automatic periodic sync with large file protection mechanism

#### UI & UX

- **Theme Animation**: Circular reveal animation when toggling between light and dark themes
- **Claude Quick Toggles**: Quick toggle switches in the Claude config JSON editor for common settings
- **Dynamic Endpoint Hint**: Context-aware hint text in endpoint input based on API format selection
- **AppSwitcher Auto Compact**: Automatically collapse to compact mode based on available width, with smooth transition animation
- **App Transition**: Fade-in/fade-out animation when switching between OpenClaw and other apps
- **Silent Startup Conditional**: Show silent startup option only when launch-on-startup is enabled

#### Settings & Environment

- **First-Run Confirmation**: Confirmation dialogs for proxy and usage features on first use
- **Local Proxy Toggle**: `enableLocalProxy` setting to control proxy UI visibility on the home page
- **Environment Check**: More granular local environment detection (installed CLI tool versions, Volta path detection)

#### Usage & Pricing

- **Usage Dashboard Enhancement**: Auto-refresh control, robust formatting, and request log table improvements
- **New Model Pricing**: Added pricing data for claude-opus-4-6 and gpt-5.3-codex with incremental data seeding

### Changed

#### Architecture

- **Partial Key-Field Merging (⚠️ Breaking, reverted in v3.11.1)**: Provider switching now uses partial key-field merging instead of full config overwrite, preserving user's non-provider settings (plugins, MCP, permissions). The "Common Config Snippet" feature has been removed as it is no longer needed. Removes 6 frontend files and ~150 lines of backend dead code (#1098)
- **Manual Import**: Replaced auto-import on startup with manual “Import Current Config” button in empty state, reducing ~47 lines of startup code
- **OMO Variant Parameterization**: Eliminated ~250 lines of OMO/OMO Slim code duplication via `OmoVariant` struct with STANDARD/SLIM constants
- **OMO Common Config Removal**: Removed the two-layer merge system for OMO common config (-1,733 lines across 21 files)

#### Code Quality

- **ProviderForm Decomposition**: Extracted ProviderForm.tsx from 2,227 lines to 1,526 lines by splitting into 5 focused modules (opencodeFormUtils, useOmoModelSource, useOpencodeFormState, useOmoDraftState, useOpenclawFormState)
- **Shared MCP/Skills Components**: Extracted AppCountBar, AppToggleGroup, and ListItemRow shared components to eliminate duplication across MCP and Skills panels
- **OpenClaw TanStack Query Migration**: Migrated Env, Tools, and AgentsDefaults panels from manual useState/useEffect to centralized TanStack Query hooks

#### Settings Layout

- **Proxy Tab**: Split Advanced tab into dedicated Proxy tab (local proxy, failover, rectifiers, global outbound proxy); moved pricing config to Usage dashboard as collapsible accordion. SettingsPage reduced from ~716 to ~426 lines with 5-tab layout: General | Proxy | Advanced | Usage | About
- **Data Section Split**: Split data accordion into Import/Export and Cloud Sync sections for better discoverability

#### Terminal & Config

- **Unified Terminal Selection**: Consolidated terminal preference to global settings; added WezTerm support and terminal name mapping (iterm2 → iterm)
- **OpenClaw Agents Panel**: Primary model field set to read-only; detailed model fields (context window, max tokens, reasoning, cost) moved to advanced options
- **Claude Model Update**: Updated Claude model references from 4.5 to 4.6 across all provider presets

### Fixed

#### Critical

- **Windows Home Dir Regression**: Restored default home directory resolution on Windows to prevent providers/settings “disappearing” when `HOME` env var differs from the real user profile directory (Git/MSYS environments); auto-detects v3.10.3 legacy database location
- **Linux White Screen**: Disabled WebKitGTK hardware acceleration on AMD GPUs (Cezanne/Radeon Vega) to prevent EGL initialization failure causing blank screen on startup
- **OpenAI Beta Parameter**: Stopped appending `?beta=true` to OpenAI Chat Completions endpoints, fixing request failures for Nvidia and other `apiFormat=”openai_chat”` providers
- **Health Check Auth Mode**: Health check now respects provider's auth_mode setting instead of always using x-api-key header

#### Provider & Preset

#### OMO / OMO Slim

- **OMO Slim Category Checks**: Added missing omo-slim category checks across add/form/mutation paths
- **OMO Slim Cache Invalidation**: Invalidate OMO Slim query cache after provider mutations to prevent stale UI state
- **OMO Recommended Models**: Synced agent/category recommended models with upstream sources; fixed provider/model format to pure model IDs
- **OMO Fill Feedback**: Added toast feedback when “Fill Recommended” button silently fails
- **OMO Last-Provider Restriction**: Removed last-provider deletion restriction for OMO/OMO Slim plugins
- **OpenCode Model Validation**: Reject saving OpenCode providers without at least one configured model

#### OpenClaw

- **OpenClaw P0-P3 Fixes**: Fixed 25 missing i18n keys, replaced key={index} with stable crypto.randomUUID(), excluded openclaw from ProxyToggle/FailoverToggle, added deep link merge_additive_config(), unified serde(flatten) naming, added directory existence checks, removed dead code, added duplicate key validation
- **OpenClaw Robustness**: Fixed EnvPanel visibleKeys using entry key names instead of array indices; added NaN guards; validated provider ID and model before import
- **OpenClaw i18n Dedup**: Merged duplicate openclaw i18n keys to restore provider form translations

#### Platform

- **Window Flash**: Prevented window flicker on silent startup (Windows)
- **Title Bar Theme**: Title bar now follows dark/light mode theme changes
- **Skills Path Separator**: Fixed path separator matching for skill installation status on Windows (supports both `/` and `\`)
- **WSL Conditional Compilation**: Added `#[cfg(target_os = “windows”)]` to WSL helper functions to eliminate dead_code warnings on non-Windows platforms

#### UI

- **Toolbar Clipping**: Removed toolbar height limit that was clipping AppSwitcher
- **Update Badge**: Show update badge instead of green check when a newer version is available
- **Session Button Visibility**: Only show Session Manager button for Claude and Codex apps
- **Directory Spacing**: Added vertical spacing between directory setting sections
- **Dark Mode Cards**: Unified SQL import/export card styling in dark mode
- **OpenClaw Scroll**: Enabled scrolling for OpenClaw configuration panel content

#### i18n & Localization

- **Session Manager i18n**: Replaced hardcoded Chinese strings with i18n keys for relative time, role labels, and UI elements
- **OpenClaw Default Model Label**: Renamed “Enable/Default” to “Set as Default / Current Default” with wider button
- **Daily Memory Sort**: Sort daily memory files by filename date (YYYY-MM-DD.md) instead of modification time
- **Backup Name i18n**: Use local time for backup file names

#### Other

- **Skill Doc URL**: Use actual branch from download_repo for documentation URL; switched from /tree/ to /blob/ pointing to SKILL.md
- **OpenCode Install Detection**: Added install.sh priority paths (OPENCODE_INSTALL_DIR > XDG_BIN_DIR > ~/bin > ~/.opencode/bin) with path dedup and cross-platform executable candidates
- **Provider Auto-Import**: Removed auto-import side effect from useProvidersQuery queryFn; users now trigger import manually via empty state button
- **Manual Backup Validation**: Treat missing database file as error during manual backup to prevent false success toast

### Performance

- **Session Panel Loading**: Parallel directory scanning and head-tail JSONL reading for Codex, OpenClaw, and OpenCode session providers
- **Query Cache Cleanup**: Removed unnecessary TanStack Query cache overhead for Tauri local IPC calls

### Documentation

### Maintenance

- **Pre-Release Cleanup**: Removed debug logs, fixed clippy warnings, added missing Japanese translations, and formatted code
- **UI Exclusions**: Hidden MCP, Skills, proxy/pricing, stream check, and model test panels for OpenClaw where not applicable

---

## [3.10.3] - 2026-01-30

### Feature Release

This release introduces a generic API format selector, pricing configuration enhancements, and multiple UX improvements.

### Added

### Changed

- **API Format Migration**: Migrate api_format from settings_config to ProviderMeta to prevent polluting ~/.claude/settings.json
- **DeepSeek max_tokens**: Remove max_tokens clamp from proxy transform layer
- **Terminal Functions**: Consolidate redundant terminal launch functions
- **Home Dir Utility**: Consolidate get_home_dir into single public function
- **Kimi/Moonshot**: Upgrade provider presets to k2.5 model

### Fixed

---

## [3.10.2] - 2026-01-24

### Patch Release

This maintenance release adds skill sync options and includes important bug fixes.

### Added

### Fixed

- **Prompts**: Clear prompt file when all prompts are disabled
- **OpenCode**: Preserve extra model fields during serialization
- **Provider Form**: Backfill model fields when editing Claude provider

---

## [3.10.1] - 2026-01-23

### Patch Release

This maintenance release includes important bug fixes for Windows platform, UI improvements, and code quality enhancements.

### Added

- **Provider Icons**: Updated RightCode provider icon with improved visual design

### Changed

- **Proxy Rectifier**: Changed rectifier default state to disabled for better stability
- **Window Settings**: Reordered window settings and updated default values for improved UX
- **UI Layout**: Increased app icon collapse threshold from 3 to 4 icons
- **Code Quality**: Simplified `RectifierConfig` implementation using `#[derive(Default)]`

### Fixed

- **Windows Platform**:
  - Fixed terminal window closing immediately after execution on Windows
  - Corrected OpenCode config path resolution on Windows
- **UI Improvements**:
  - Fixed ProviderIcon color validation to prevent black icons from appearing
  - Unified layout padding across all panels for consistent spacing
  - Fixed panel content alignment with header constraints
- **Code Quality**: Resolved Rust Clippy warnings and applied consistent formatting

---

## [3.10.0] - 2026-01-21

### Feature Release

This release introduces OpenCode support and brings improvements across proxy, usage tracking, and overall UX.

### Added

- **OpenCode Support** - Manage OpenCode providers, MCP servers, and Skills, with first-launch import and full internationalization (#695)
- **Global Proxy** - Add global proxy settings for outbound network requests (#596)
- **Claude Rectifier** - Add thinking signature rectifier for Claude API (#595)
- **Health Check Enhancements** - Configurable prompt and CLI-compatible requests for stream health check (#623)
- **Per-Provider Config** - Support provider-specific configuration and persistence (#663)
- **App Visibility Controls** - Show/hide apps and keep tray menu in sync (Gemini hidden by default)
- **Takeover Compact Mode** - Use a compact AppSwitcher layout when showing 3+ visible apps
- **Keyboard Shortcut** - Press `ESC` to quickly go back/close panels (#670)
- **Terminal Improvements** - Provider-specific terminal button, `fnm` path support, and safer cross-platform launching (#564)
- **WSL Tool Detection** - Detect tool versions in WSL with additional security hardening (#627)
- **Skills Presets** - Add `baoyu-skills` preset repo and auto-supplement missing default repos

### Changed

- **Proxy Logging** - Simplify proxy log output (#585)
- **Pricing Editor UX** - Unify pricing edit modal with `FullScreenPanel`
- **Advanced Settings Layout** - Move rectifier section below failover for better flow
- **OpenRouter Compat Mode** - Disable OpenRouter compatibility mode by default and hide UI toggle

### Fixed

- **Auto Failover** - Switch to P1 immediately when enabling auto failover
- **Provider Edit Dialog** - Fix stale data when reopening provider editor after save (#654)
- **Deeplink** - Support multiple endpoints and prioritize `GOOGLE_GEMINI_BASE_URL` over `GEMINI_BASE_URL` (#597)
- **MCP (WSL)** - Skip `cmd /c` wrapper for WSL target paths (#592)
- **Usage Templates** - Add variable hints and validation fixes; prevent config leaking between providers (#628)
- **Gemini Timeout Format** - Convert timeout params to Gemini CLI format (#580)
- **UI** - Fix Select dropdown rendering in `FullScreenPanel`; auto-apply default icon color when unset
- **Usage UI** - Auto-adapt usage block offset based on action buttons width (#613)
- **Provider Endpoint** - Persist endpoint auto-select state (#611)
- **Provider Form** - Reset baseUrl and apiKey states when switching presets

---

## [3.9.1] - 2026-01-09

### Bug Fix Release

This release focuses on stability improvements and crash prevention.

### Added

- **Crash Logging** - Panic hook captures crash info to `~/.cc-switch/crash.log` with full stack traces (#562)
- **Release Logging** - Enable logging for release builds with automatic rotation (keeps 2 most recent files)
- **AIGoCode Icon** - Added colored icon for AIGoCode provider preset

### Fixed

- **Proxy Panic Prevention** - Graceful degradation when HTTP client initialization fails due to invalid proxy settings; falls back to no_proxy mode (#560)
- **UTF-8 Safety** - Fix potential panic when masking API keys or truncating logs containing multi-byte characters (Chinese, emoji, etc.) (#560)
- **Default Proxy Port** - Change default port from 5000 to 15721 to avoid conflict with macOS AirPlay Receiver (#560)
- **Windows Title** - Display "CC Switch" instead of default "Tauri app" in window title
- **Windows/Linux Spacing** - Remove extra 28px blank space below native titlebar introduced in v3.9.0
- **Flatpak Tray Icon** - Bundle libayatana-appindicator for tray icon support on Flatpak (#556)
- **Provider Preset** - Correct casing from "AiGoCode" to "AIGoCode" to match official branding

---

## [3.9.0] - 2026-01-07

### Stable Release

This stable release includes all changes from `3.9.0-1`, `3.9.0-2`, and `3.9.0-3`.

### Added

### Changed

- **Usage Terminology** - Rename "Cache Read/Write" to "Cache Hit/Creation" across all languages (#508)
- **Model Pricing Data** - Refresh built-in model pricing table (Claude full version IDs, GPT-5 series, Gemini ID formats, and Chinese models) (#508)
- **Proxy Header Forwarding** - Switch to a blacklist approach and improve header passthrough compatibility (#508)
- **Failover Behavior** - Bypass timeout/retry configs when failover is disabled; update default failover timeout and circuit breaker values (#508, #521)
- **Provider Presets** - Update default model versions and change the default Qwen base URL (#517)
- **Skills Management** - Unify Skills management architecture with SSOT + React Query; improve caching for discoverable skills
- **Settings UX** - Reorder items in the Advanced tab for better discoverability
- **Proxy Active Theme** - Apply emerald theme when proxy takeover is active

### Fixed

- **Security** - Security fixes for JavaScript executor and usage script (#151)
- **Usage Timezone & Parsing** - Fix datetime picker timezone handling; improve token parsing/billing for Gemini and Codex formats (#508)
- **Windows Compatibility** - Improve MCP export and version check behavior to avoid terminal popups
- **Windows Startup** - Use system titlebar to prevent black screen on startup
- **WebView Compatibility** - Add fallback for crypto.randomUUID() on older WebViews
- **macOS Autostart** - Use `.app` bundle path to prevent terminal window popups
- **Database** - Add missing schema migrations; show an error dialog on initialization failure with a retry option
- **Import/Export** - Restrict SQL import to CC Switch exported backups only; refresh providers immediately after import
- **Prompts** - Allow saving prompts with empty content
- **MCP Sync** - Skip sync when the target CLI app is not installed
- **Common Config (Codex)** - Preserve MCP server `base_url` during extraction and remove provider-specific `model_providers` blocks
- **Proxy** - Improve takeover detection and stability; clean up model override env vars when switching providers in takeover mode (#508)
- **Skills** - Skip hidden directories during discovery; fix wrong skill repo branch
- **Settings Navigation** - Navigate to About tab when clicking update badge
- **UI** - Fix dialogs not opening on first click and improve window dragging area in `FullScreenPanel`

---

## [3.9.0-3] - 2025-12-29

### Beta Release

Third beta release with important bug fixes for Windows compatibility, UI improvements, and new features.

### Added

- **Universal Provider** - Support for universal provider configurations (#348)
- **Provider Search Filter** - Quick filter to find providers by name (#435)
- **Keyboard Shortcut** - Open settings with Command+comma / Ctrl+comma (#436)
- **Xiaomi MiMo Icon** - Added MiMo icon and Claude provider configuration (#470)
- **Usage Model Extraction** - Extract model info from usage statistics (#455)
- **Skip First-Run Confirmation** - Option to skip Claude Code first-run confirmation dialog
- **Exit Animations** - Added exit animation to FullScreenPanel dialogs
- **Fade Transitions** - Smooth fade transitions for app/view/panel switching

### Fixed

#### Windows
- Wrap npx/npm commands with `cmd /c` for MCP export
- Prevent terminal windows from appearing during version check

#### macOS
- Use .app bundle path for autostart to prevent terminal window popup

#### UI
- Resolve Dialog/Modal not opening on first click (#492)
- Improve dark mode text contrast for form labels
- Reduce header spacing and fix layout shift on view switch
- Prevent header layout shift when switching views

#### Database & Schema
- Add missing base columns migration for proxy_config
- Add backward compatibility check for proxy_config seed insert

#### Other
- Use local timezone and robust DST handling in usage stats (#500)
- Remove deprecated `sync_enabled_to_codex` call
- Gracefully handle invalid Codex config.toml during MCP sync
- Add missing translations for reasoning model and OpenRouter compat mode

### Improved

### Stats

- 35 commits since v3.9.0-2
- 5 files changed in test/lint fixes

---

## [3.9.0-2] - 2025-12-20

### Beta Release

Second beta release focusing on proxy stability, import safety, and provider preset polish.

### Added

### Changed

- **Proxy (OpenRouter)** - Switched OpenRouter to passthrough mode for native Claude API

### Fixed

- **Import/Export** - Restrict SQL import to CC Switch exported backups only; refresh providers immediately after import
- **Proxy** - Respect existing Claude token when syncing; add fallback recovery for orphaned takeover state; remove global auto-start flag
- **Windows** - Add minimum window size to Windows platform config
- **UI** - Improve About section UI (#419) and unify header toolbar styling

### Stats

- 13 commits since v3.9.0-1

---

## [3.9.0-1] - 2025-12-18

### Beta Release

This beta release introduces the **Local API Proxy** feature, along with Skills multi-app support, UI improvements, and numerous bug fixes.

### Major Features

#### Local Proxy Server
- **Local HTTP Proxy** - High-performance proxy server built on Axum framework
- **Multi-app Support** - Unified proxy for Claude Code, Codex, and Gemini CLI API requests
- **Per-app Takeover** - Independent control over which apps route through the proxy
- **Live Config Takeover** - Automatically backs up and redirects CLI configurations to local proxy

#### Auto Failover
- **Circuit Breaker** - Automatically detects provider failures and triggers protection
- **Smart Failover** - Automatically switches to backup provider when current one is unavailable
- **Health Tracking** - Real-time monitoring of provider availability
- **Independent Failover Queues** - Each app maintains its own failover queue

#### Monitoring
- **Request Logging** - Detailed logging of all proxy requests
- **Usage Statistics** - Token consumption, latency, success rate metrics
- **Real-time Status** - Frontend displays proxy status and statistics

#### Skills Multi-App Support
- **Multi-app Support** - Skills now support both Claude and Codex (#365)
- **Multi-app Migration** - Existing Skills auto-migrate to multi-app structure (#378)
- **Installation Path Fix** - Use directory basename for skill installation path (#358)

### Added
- **Provider Icon Colors** - Customize provider icon colors (#385)
- **Deeplink Usage Config** - Import usage query config via deeplink (#400)
- **Error Request Logging** - Detailed logging for proxy requests (#401)
- **Closable Toast** - Added close button to switch notification toast (#350)
- **Icon Color Component** - ProviderIcon component supports color prop (#384)

### Fixed

#### Proxy Related
- Takeover Codex base_url via model_provider
- Harden crash recovery with fallback detection
- Sync UI when active provider differs from current setting
- Resolve circuit breaker race condition and error classification
- Stabilize live takeover and provider editing
- Reset health badges when proxy stops
- Retry failover for all HTTP errors including 4xx
- Fix HalfOpen counter underflow and config field inconsistencies
- Resolve circuit breaker state persistence and HalfOpen deadlock
- Auto-recover live config after abnormal exit
- Update live backup when hot-switching provider in proxy mode
- Wait for server shutdown before exiting app
- Disable auto-start on app launch by resetting enabled flag on stop
- Sync live config tokens to database before takeover
- Resolve 404 error and auto-setup proxy targets

#### MCP Related
- Skip sync when target CLI app is not installed
- Improve upsert and import robustness
- Use browser-compatible platform detection for MCP presets

#### UI Related
- Restore fade transition for Skills button
- Add close button to all success toasts
- Prevent card jitter when health badge appears
- Update SettingsPage tab styles (#342)

#### Other
- Fix Azure website link (#407)
- Add fallback to provider config for usage credentials (#360)
- Fix Windows black screen on startup (use system titlebar)
- Add fallback for crypto.randomUUID() on older WebViews
- Use correct npm package for Codex CLI version check
- Security fixes for JavaScript executor and usage script (#151)

### Improved
- **Proxy Active Theme** - Apply emerald theme when proxy takeover is active
- **Card Animation** - Improved provider card hover animation
- **Remove Restart Prompt** - No longer prompts restart when switching providers

### Technical
- Implement per-app takeover mode
- Proxy module contains 20+ Rust files with complete layered architecture
- Add 5 new database tables for proxy functionality
- Modularize handlers.rs to reduce code duplication
- Remove is_proxy_target in favor of failover_queue

### Stats
- 55 commits since v3.8.2
- 164 files changed
- +22,164 / -570 lines

---

## [3.8.0] - 2025-11-28

### Major Updates

- **Persistence architecture upgrade** - Moved from single JSON storage to SQLite + JSON dual-layer; added schema versioning, transactions, and SQL import/export; first launch auto-migrates `config.json` to SQLite while keeping originals safe.
- **Brand new UI** - Full layout redesign, unified component/ConfirmDialog styles, smoother animations, overscroll disabled; Tailwind CSS downgraded to v3.4 for compatibility.
- **Japanese language support** - UI now localized in Chinese/English/Japanese.

### Added

### Fixed

- **Custom endpoints loss** - Switched provider updates to `UPDATE` to avoid cascade deletes from `INSERT OR REPLACE`.
- **Gemini config writing** - Correctly writes custom env vars to `.env` and keeps auth configs isolated.
- **Provider validation** - Handles missing current provider IDs and preserves icon fields on duplicate.
- **Linux rendering** - Fixed WebKitGTK DMA-BUF rendering and preserved user `.desktop` customizations.
- **Misc** - Removed redundant usage queries; corrected DMXAPI auth token field; restored missing deeplink translations; fixed usage script template init.

### Technical

- **Database modules** - Added `schema`, `backup`, `migration`, and DAO layers for providers/MCP/prompts/skills/settings.
- **Service modularization** - Split provider service into live/auth/endpoints/usage modules; deeplink parsing/import logic modularized.
- **Code cleanup** - Removed legacy JSON-era import/export, unused MCP types; unified error handling; tests migrated to SQLite backend and MSW handlers updated.

### Migration Notes

- First launch auto-migrates data from `config.json` to SQLite and device settings to `settings.json`; originals kept; error dialog on failure; dry-run supported.

### Stats

- 51 commits since v3.7.1; 207 files changed; +17,297 / -6,870 lines. See [release-note-v3.8.0](docs/release-notes/v3.8.0-en.md) for details.

---

## [3.7.1] - 2025-11-22

### Fixed

- **Skills third-party repository installation** (#268) - Fixed installation failure for skills repositories with custom subdirectories (e.g., `ComposioHQ/awesome-claude-skills`)
- **Gemini configuration persistence** - Resolved issue where settings.json edits were lost when switching providers
- **Dialog overlay click protection** - Prevented dialogs from closing when clicking outside, avoiding accidental form data loss (affects 11 dialog components)

### Added

- **Gemini configuration directory support** (#255) - Added custom configuration directory option for Gemini in settings
- **ArchLinux installation support** (#259) - Added AUR installation via `paru -S cc-switch-bin`

### Improved

- **Skills error messages i18n** - Added 28+ detailed error messages (English & Chinese) with specific resolution suggestions
- **Download timeout** - Extended from 15s to 60s to reduce network-related false positives
- **Code formatting** - Applied unified Rust (`cargo fmt`) and TypeScript (`prettier`) formatting standards

### Reverted

- **Auto-launch on system startup** - Temporarily reverted feature pending further testing and optimization

---

## [3.7.0] - 2025-11-19

### Major Features

#### Gemini CLI Integration

#### MCP v3.7.0 Unified Architecture

- **Unified management panel** - Single interface for Claude/Codex/Gemini MCP servers
- **SSE transport type** - New Server-Sent Events support alongside stdio/http
- **Smart JSON parser** - Fault-tolerant parsing of various MCP config formats
- **Extended field support** - Preserve custom fields in Codex TOML conversion
- **Codex format correction** - Proper `[mcp_servers]` format (auto-cleanup of incorrect `[mcp.servers]`)
- **Import/export system** - Unified import from Claude/Codex/Gemini live configs
- **UX improvements**
  - Default app selection in forms
  - JSON formatter for config validation
  - Improved layout and visual hierarchy
  - Better validation error messages

#### Claude Skills Management System

- **GitHub repository integration** - Auto-scan and discover skills from GitHub repos
- **Pre-configured repositories**
  - `ComposioHQ/awesome-claude-skills` (curated collection)
  - `anthropics/skills` (official Anthropic skills)
  - `cexll/myclaude` (community, with subdirectory scanning)
- **Lifecycle management**
  - One-click install to `~/.claude/skills/`
  - Safe uninstall with state tracking
  - Update checking (infrastructure ready)
- **Custom repository support** - Add any GitHub repo as a skill source
- **Subdirectory scanning** - Optional `skillsPath` for repos with nested skill directories
- **Backend architecture** - `SkillService` (526 lines) with GitHub API integration
- **Frontend interface**
  - SkillsPage: Browse and manage skills
  - SkillCard: Visual skill presentation
  - RepoManager: Repository management dialog
- **State persistence** - Installation state stored in `skills.json`
- **Full i18n support** - Complete Chinese/English translations (47+ keys)

#### Prompts (System Prompts) Management

- **Multi-preset management** - Create, edit, and switch between multiple system prompts
- **Cross-app support**
  - Claude: `~/.claude/CLAUDE.md`
  - Codex: `~/.codex/AGENTS.md`
  - Gemini: `~/.gemini/GEMINI.md`
- **Markdown editor** - Full-featured CodeMirror 6 editor with syntax highlighting
- **Smart synchronization**
  - Auto-write to live files on enable
  - Content backfill protection (save current before switching)
  - First-launch auto-import from live files
- **Single-active enforcement** - Only one prompt can be active at a time
- **Delete protection** - Cannot delete active prompts
- **Backend service** - `PromptService` (213 lines) with CRUD operations
- **Frontend components**
  - PromptPanel: Main management interface (177 lines)
  - PromptFormModal: Edit dialog with validation (160 lines)
  - MarkdownEditor: CodeMirror integration (159 lines)
  - usePromptActions: Business logic hook (152 lines)
- **Full i18n support** - Complete Chinese/English translations (41+ keys)

#### Deep Link Protocol (ccswitch://)

- **Protocol registration** - `ccswitch://` URL scheme for one-click imports
- **Provider import** - Import provider configurations from URLs or shared links
- **Lifecycle integration** - Deep link handling integrated into app startup
- **Cross-platform support** - Works on Windows, macOS, and Linux

#### Environment Variable Conflict Detection

- **Claude & Codex detection** - Identify conflicting environment variables
- **Gemini auto-detection** - Automatic environment variable discovery
- **Conflict management** - UI for resolving configuration conflicts
- **Prevention system** - Warn before overwriting existing configurations

### New Features

#### Provider Management

- **DouBaoSeed preset** - Added ByteDance's DouBao provider
- **Kimi For Coding** - Moonshot AI coding assistant
- **BaiLing preset** - BaiLing AI integration
- **Removed AnyRouter preset** - Discontinued provider
- **Model configuration** - Support for custom model names in Codex and Gemini
- **Provider notes field** - Add custom notes to providers for better organization

#### Configuration Management

- **Common config migration** - Moved Claude common config snippets from localStorage to `config.json`
- **Unified persistence** - Common config snippets now shared across all apps
- **Auto-import on first launch** - Automatically import configs from live files on first run
- **Backfill priority fix** - Correct priority handling when enabling prompts

#### UI/UX Improvements

- **macOS native design** - Migrated color scheme to macOS native design system
- **Window centering** - Default window position centered on screen
- **Password input fixes** - Disabled Edge/IE reveal and clear buttons
- **URL overflow prevention** - Fixed overflow in provider cards
- **Error notification enhancement** - Copy-to-clipboard for error messages
- **Tray menu sync** - Real-time sync after drag-and-drop sorting

### Improvements

#### Architecture

- **MCP v3.7.0 cleanup** - Removed legacy code and warnings
- **Unified structure** - Default initialization with v3.7.0 unified structure
- **Backward compatibility** - Compilation fixes for older configs
- **Code formatting** - Applied consistent formatting across backend and frontend

#### Platform Compatibility

- **Windows fix** - Resolved winreg API compatibility issue (v0.52)
- **Safe pattern matching** - Replaced `unwrap()` with safe patterns in tray menu

#### Configuration

- **MCP sync on switch** - Sync MCP configs for all apps when switching providers
- **Gemini form sync** - Fixed form fields syncing with environment editor
- **Gemini config reading** - Read from both `.env` and `settings.json`
- **Validation improvements** - Enhanced input validation and boundary checks

#### Internationalization

- **JSON syntax fixes** - Resolved syntax errors in locale files
- **App name i18n** - Added internationalization support for app names
- **Deduplicated labels** - Reused providerForm keys to reduce duplication
- **Gemini MCP title** - Added missing Gemini MCP panel title

### Bug Fixes

#### Critical Fixes

- **Usage script validation** - Added input validation and boundary checks
- **Gemini validation** - Relaxed validation when adding providers
- **TOML quote normalization** - Handle CJK quotes to prevent parsing errors
- **MCP field preservation** - Preserve custom fields in Codex TOML editor
- **Password input** - Fixed white screen crash (FormLabel → Label)

#### Stability

- **Tray menu safety** - Replaced unwrap with safe pattern matching
- **Error isolation** - Tray menu update failures don't block main operations
- **Import classification** - Set category to custom for imported default configs

#### UI Fixes

- **Model placeholders** - Removed misleading model input placeholders
- **Base URL population** - Auto-fill base URL for non-official providers
- **Drag sort sync** - Fixed tray menu order after drag-and-drop

### Technical Improvements

#### Code Quality

- **Type safety** - Complete TypeScript type coverage across codebase
- **Test improvements** - Simplified boolean assertions in tests
- **Clippy warnings** - Fixed `uninlined_format_args` warnings
- **Code refactoring** - Extracted templates, optimized logic flows

#### Dependencies

- **Tauri** - Updated to 2.8.x series
- **Rust dependencies** - Added `anyhow`, `zip`, `serde_yaml`, `tempfile` for Skills
- **Frontend dependencies** - Added CodeMirror 6 packages for Markdown editor
- **winreg** - Updated to v0.52 (Windows compatibility)

#### Performance

- **Startup optimization** - Removed legacy migration scanning
- **Lock management** - Improved RwLock usage to prevent deadlocks
- **Background query** - Enabled background mode for usage polling

### Statistics

- **Total commits**: 85 commits from v3.6.0 to v3.7.0
- **Code changes**: 152 files changed, 18,104 insertions(+), 3,732 deletions(-)
- **New modules**:
  - Skills: 2,034 lines (21 files)
  - Prompts: 1,302 lines (20 files)
  - Gemini: ~1,000 lines (multiple files)
  - MCP refactor: ~3,000 lines (refactored)

### Strategic Positioning

v3.7.0 represents a major evolution from "Provider Switcher" to **"All-in-One AI CLI Management Platform"**:

1. **Capability Extension** - Skills provide external ability integration
2. **Behavior Customization** - Prompts enable AI personality presets
3. **Configuration Unification** - MCP v3.7.0 eliminates app silos
4. **Ecosystem Openness** - Deep links enable community sharing
5. **Multi-AI Support** - Claude/Codex/Gemini trinity
6. **Intelligent Detection** - Auto-discovery of environment conflicts

### Notes

- Users upgrading from v3.1.0 or earlier should first upgrade to v3.2.x for one-time migration
- Skills and Prompts management are new features requiring no migration
- Gemini CLI support requires Gemini CLI to be installed separately
- MCP v3.7.0 unified structure is backward compatible with previous configs

## [3.6.0] - 2025-11-07

### ✨ New Features

### 🔧 Improvements

- **Configuration Directory Switching**
  - Introduced unified post-change sync utility (`postChangeSync.ts`)
  - Auto-sync current providers to new directory when changing Claude/Codex config directories
  - Perfect support for WSL environment switching
  - Auto-sync after config import to ensure immediate effectiveness
  - Use Result pattern for graceful error handling without blocking main flow
  - Distinguish "fully successful" and "partially successful" states for precise user feedback
- **UI/UX Enhancements**
  - Provider cards: Unique icons and color identification
  - Unified border design system across all components
  - Drag interaction optimization: Push effect animation, improved handle icons
  - Enhanced current provider visual feedback
  - Dialog size standardization and layout consistency
  - Form experience: Optimized model placeholders, simplified provider hints, category-specific hints
- **Complete Internationalization Coverage**
  - Error messages internationalization
  - Tray menu internationalization
  - All UI components internationalization
- **Usage Display Moved Inline** - Usage display moved next to enable button

### 🐛 Bug Fixes

- **Configuration Sync**
  - Fixed `apiKeyUrl` priority issue
  - Fixed MCP sync-to-other-side functionality failure
  - Fixed sync issues after config import
  - Prevent silent fallback and data loss on config error
- **Usage Query**
  - Fixed auto-query interval timing issue
  - Ensure refresh button shows loading animation on click
- **UI Issues**
  - Fixed name collision error (`get_init_error` command)
  - Fixed language setting rollback after successful save
  - Fixed language switch state reset (dependency cycle)
  - Fixed edit mode button alignment
- **Configuration Management**
  - Fixed Codex API Key auto-sync
  - Fixed endpoint speed test functionality
  - Fixed provider duplicate insertion position (next to original provider)
  - Fixed custom endpoint preservation in edit mode
- **Startup Issues**
  - Force exit on config error (no silent fallback)
  - Eliminate code duplication causing initialization errors

### 🏗️ Technical Improvements (For Developers)

**Backend Refactoring (Rust)** - Completed 5-phase refactoring:

- **Phase 1**: Unified error handling (`AppError` + i18n error messages)
- **Phase 2**: Command layer split by domain (`commands/{provider,mcp,config,settings,plugin,misc}.rs`)
- **Phase 3**: Integration tests and transaction mechanism (config snapshot + failure rollback)
- **Phase 4**: Extracted Service layer (`services/{provider,mcp,config,speedtest}.rs`)
- **Phase 5**: Concurrency optimization (`RwLock` instead of `Mutex`, scoped guard to avoid deadlock)

**Frontend Refactoring (React + TypeScript)** - Completed 4-stage refactoring:

- **Stage 1**: Test infrastructure (vitest + MSW + @testing-library/react)
- **Stage 2**: Extracted custom hooks (`useProviderActions`, `useMcpActions`, `useSettings`, `useImportExport`, etc.)
- **Stage 3**: Component splitting and business logic extraction
- **Stage 4**: Code cleanup and formatting unification

**Testing System**:

- Hooks unit tests 100% coverage
- Integration tests covering key processes (App, SettingsDialog, MCP Panel)
- MSW mocking backend API to ensure test independence

**Code Quality**:

- Unified parameter format: All Tauri commands migrated to camelCase (Tauri 2 specification)
- `AppType` renamed to `AppId`: Semantically clearer
- Unified parsing with `FromStr` trait: Centralized `app` parameter parsing
- Eliminate code duplication: DRY violations cleanup
- Remove unused code: `missing_param` helper function, deprecated `tauri-api.ts`, redundant `KimiModelSelector` component

**Internal Optimizations**:

- **Removed Legacy Migration Logic**: v3.6 removed v1 config auto-migration and copy file scanning logic
  - ✅ **Impact**: Improved startup performance, cleaner code
  - ✅ **Compatibility**: v2 format configs fully compatible, no action required
  - ⚠️ **Note**: Users upgrading from v3.1.0 or earlier should first upgrade to v3.2.x or v3.5.x for one-time migration, then upgrade to v3.6
- **Command Parameter Standardization**: Backend unified to use `app` parameter (values: `claude` or `codex`)
  - ✅ **Impact**: More standardized code, friendlier error prompts
  - ✅ **Compatibility**: Frontend fully adapted, users don't need to care about this change

### 📦 Dependencies

- Updated to Tauri 2.8.x
- Updated to TailwindCSS 4.x
- Updated to TanStack Query v5.90.x
- Maintained React 18.2.x and TypeScript 5.3.x

## [3.5.0] - 2025-01-15

### ⚠ Breaking Changes

- Tauri commands only accept the `app` parameter (`claude`/`codex`); removed `app_type`/`appType` compatibility.
- Frontend types are standardized to `AppId` (removed `AppType` export); variable naming is standardized to `appId`.

### ✨ New Features

- **MCP (Model Context Protocol) Management** - Complete MCP server configuration management system
  - Add, edit, delete, and toggle MCP servers in `~/.claude.json`
  - Support for stdio and http server types with command validation
  - Built-in templates for popular MCP servers (mcp-fetch, etc.)
  - Real-time enable/disable toggle for MCP servers
  - Atomic file writing to prevent configuration corruption
- **Configuration Import/Export** - Backup and restore your provider configurations
  - Export all configurations to JSON file with one click
  - Import configurations with validation and automatic backup
  - Automatic backup rotation (keeps 10 most recent backups)
  - Progress modal with detailed status feedback
- **Endpoint Speed Testing** - Test API endpoint response times
  - Measure latency to different provider endpoints
  - Visual indicators for connection quality
  - Help users choose the fastest provider

### 🔧 Improvements

- Complete internationalization (i18n) coverage for all UI components
- Enhanced error handling and user feedback throughout the application
- Improved configuration file management with better validation
- Added new provider presets: Longcat, kat-coder
- Updated GLM provider configurations with latest models
- Refined UI/UX with better spacing, icons, and visual feedback
- Enhanced tray menu functionality and responsiveness
- **Standardized release artifact naming** - All platform releases now use consistent version-tagged filenames:
  - macOS: `CC-Switch-v{version}-macOS.tar.gz` / `.zip`
  - Windows: `CC-Switch-v{version}-Windows.msi` / `-Portable.zip`
  - Linux: `CC-Switch-v{version}-Linux.AppImage` / `.deb`

### 🐛 Bug Fixes

- Fixed layout shifts during provider switching
- Improved config file path handling across different platforms
- Better error messages for configuration validation failures
- Fixed various edge cases in configuration import/export

### 📦 Technical Details

- Enhanced `import_export.rs` module with backup management
- New `claude_mcp.rs` module for MCP configuration handling
- Improved state management and lock handling in Rust backend
- Better TypeScript type safety across the codebase

## [3.4.0] - 2025-10-01

### ✨ Features

- Enable internationalization via i18next with a Chinese default and English fallback, plus an in-app language switcher
- Add Claude plugin sync while retiring the legacy VS Code integration controls (Codex no longer requires settings.json edits)
- Extend provider presets with optional API key URLs and updated models, including DeepSeek-V3.1-Terminus and Qwen3-Max
- Support portable mode launches and enforce a single running instance to avoid conflicts

### 🔧 Improvements

- Allow minimizing the window to the system tray and add macOS Dock visibility management for tray workflows
- Refresh the Settings modal with a scrollable layout, save icon, and cleaner language section
- Smooth provider toggle states with consistent button widths/icons and prevent layout shifts when switching between Claude and Codex
- Adjust the Windows MSI installer to target per-user LocalAppData and improve component tracking reliability

### 🐛 Fixes

- Remove the unnecessary OpenAI auth requirement from third-party provider configurations
- Fix layout shifts while switching app types with Claude plugin sync enabled
- Align Enable/In Use button states to avoid visual jank across app views

## [3.3.0] - 2025-09-22

### ✨ Features

- Add “Apply to VS Code / Remove from VS Code” actions on provider cards, writing settings for Code/Insiders/VSCodium variants _(Removed in 3.4.x)_
- Enable VS Code auto-sync by default with window broadcast and tray hooks so Codex switches sync silently _(Removed in 3.4.x)_
- Extend the Codex provider wizard with display name, dedicated API key URL, and clearer guidance
- Introduce shared common config snippets with JSON/TOML reuse, validation, and consistent error surfaces

### 🔧 Improvements

- Keep the tray menu responsive when the window is hidden and standardize button styling and copy
- Disable modal backdrop blur on Linux (WebKitGTK/Wayland) to avoid freezes; restore the window when clicking the macOS Dock icon
- Support overriding config directories on WSL, refine placeholders/descriptions, and fix VS Code button wrapping on Windows
- Add a `created_at` timestamp to provider records for future sorting and analytics

### 🐛 Fixes

- Correct regex escapes and common snippet trimming in the Codex wizard to prevent validation issues
- Harden the VS Code sync flow with more reliable TOML/JSON parsing while reducing layout jank
- Bundle `@codemirror/lint` to reinstate live linting in config editors

## [3.2.0] - 2025-09-13

### ✨ New Features

- System tray provider switching with dynamic menu for Claude/Codex
- Frontend receives `provider-switched` events and refreshes active app
- Built-in update flow via Tauri Updater plugin with dismissible UpdateBadge

### 🔧 Improvements

- Single source of truth for provider configs; no duplicate copy files
- One-time migration imports existing copies into `config.json` and archives originals
- Duplicate provider de-duplication by name + API key at startup
- Atomic writes for Codex `auth.json` + `config.toml` with rollback on failure
- Logging standardized (Rust): use `log::{info,warn,error}` instead of stdout prints
- Tailwind v4 integration and refined dark mode handling

### 🐛 Fixes

- Remove/minimize debug console logs in production builds
- Fix CSS minifier warnings for scrollbar pseudo-elements
- Prettier formatting across codebase for consistent style

### 📦 Dependencies

- Tauri: 2.8.x (core, updater, process, opener, log plugins)
- React: 18.2.x · TypeScript: 5.3.x · Vite: 5.x

### 🔄 Notes

- `connect-src` CSP remains permissive for compatibility; can be tightened later as needed

## [3.1.1] - 2025-09-03

### 🐛 Bug Fixes

- Fixed the default codex config.toml to match the latest modifications
- Improved provider configuration UX with custom option

### 📝 Documentation

- Updated README with latest information

## [3.1.0] - 2025-09-01

### ✨ New Features

- **Added Codex application support** - Now supports both Claude Code and Codex configuration management
  - Manage auth.json and config.toml for Codex
  - Support for backup and restore operations
  - Preset providers for Codex (Official, PackyCode)
  - API Key auto-write to auth.json when using presets
- **New UI components**
  - App switcher with segmented control design
  - Dual editor form for Codex configuration
  - Pills-style app switcher with consistent button widths
- **Enhanced configuration management**
  - Multi-app config v2 structure (claude/codex)
  - Automatic v1→v2 migration with backup
  - OPENAI_API_KEY validation for non-official presets
  - TOML syntax validation for config.toml

### 🔧 Technical Improvements

- Unified Tauri command API with app_type parameter
- Backward compatibility for app/appType parameters
- Added get_config_status/open_config_folder/open_external commands
- Improved error handling for empty config.toml

### 🐛 Bug Fixes

- Fixed config path reporting and folder opening for Codex
- Corrected default import behavior when main config is missing
- Fixed non_snake_case warnings in commands.rs

## [3.0.0] - 2025-08-27

### 🚀 Major Changes

- **Complete migration from Electron to Tauri 2.0** - The application has been completely rewritten using Tauri, resulting in:
  - **90% reduction in bundle size** (from ~150MB to ~15MB)
  - **Significantly improved startup performance**
  - **Native system integration** without Chromium overhead
  - **Enhanced security** with Rust backend

### ✨ New Features

- **Native window controls** with transparent title bar on macOS
- **Improved file system operations** using Rust for better performance
- **Enhanced security model** with explicit permission declarations
- **Better platform detection** using Tauri's native APIs

### 🔧 Technical Improvements

- Migrated from Electron IPC to Tauri command system
- Replaced Node.js file operations with Rust implementations
- Implemented proper CSP (Content Security Policy) for enhanced security
- Added TypeScript strict mode for better type safety
- Integrated Rust cargo fmt and clippy for code quality

### 🐛 Bug Fixes

- Fixed bundle identifier conflict on macOS (changed from .app to .desktop)
- Resolved platform detection issues
- Improved error handling in configuration management

### 📦 Dependencies

- **Tauri**: 2.8.2
- **React**: 18.2.0
- **TypeScript**: 5.3.0
- **Vite**: 5.0.0

### 🔄 Migration Notes

For users upgrading from v2.x (Electron version):

- Configuration files remain compatible - no action required
- The app will automatically migrate your existing provider configurations
- Window position and size preferences have been reset to defaults

#### Backup on v1→v2 Migration (cc-switch internal config)

- When the app detects an old v1 config structure at `~/.cc-switch/config.json`, it now creates a timestamped backup before writing the new v2 structure.
- Backup location: `~/.cc-switch/config.v1.backup.<timestamp>.json`
- This only concerns cc-switch's own metadata file; your actual provider files under `~/.claude/` and `~/.codex/` are untouched.

### 🛠️ Development

- Added `pnpm typecheck` command for TypeScript validation
- Added `pnpm format` and `pnpm format:check` for code formatting
- Rust code now uses cargo fmt for consistent formatting

## [2.0.0] - Previous Electron Release

### Features

- Multi-provider configuration management
- Quick provider switching
- Import/export configurations
- Preset provider templates

---

## [1.0.0] - Initial Release

### Features

- Basic provider management
- Claude Code integration
- Configuration file handling
