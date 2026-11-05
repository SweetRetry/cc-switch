# Upstream 同步记录

本仓库从 [farion1231/cc-switch](https://github.com/farion1231/cc-switch) 分叉，删掉了本地代理、路由与故障转移、云同步、账号中心、会话管理、通用供应商和 Skills 仓库发现，只保留 Claude Code、Codex、OpenCode、Pi、Antigravity 五个应用。这份文档记录 upstream 跟到了哪里，以及每个提交跟不跟、为什么。

Last reviewed: `02a136413bacb7ba33a94c89ecbed527666d4e23` (upstream v4.0.25-15，2026-11-05)

Fork point: `42ef63471f0ed879913f8de0d0c7e3e580293193` (upstream v4.0.20-50，2026-10-26)

## 怎么跟进

1. 运行 `scripts/upstream-sync/pending.sh`。它从上面的 `Last reviewed` 开始列出 upstream 新提交，标出每个提交是否只碰到我们已删除的文件（SKIP），以及其余部分能否干净打上（CLEAN 或 CONFLICT）。
2. 按下面的取舍标准逐个判断。CLEAN 且要跟的，用 `scripts/upstream-sync/port.sh <hash>...` 打上。它保留原作者，并在 message 里记下 upstream hash 和跳过的文件。CONFLICT 的手工移植，commit message 写明 `Ported from upstream <hash>`。
3. 把结论记进下面的表，更新 `Last reviewed`。

取舍标准：
- 跟。问题在我们保留的代码里确实存在的 bugfix，以及性能和数据（定价表、预设失效）上的优化。
- 不跟。产品功能迭代，已删除模块里的改动，赞助商、release、CI 的调整。

## 已跟进

| upstream | 内容 | 方式 | PR |
| --- | --- | --- | --- |
| `ddcb1117` | Codex TOML 识别 `[[array-of-tables]]` 表头 | port.sh | #1 |
| `779063c1` | Agy 用量记录延迟和首 token 时间 | port.sh | #1 |
| `fcd8f3bd` | 定位 mise 安装的 claude CLI | port.sh | #1 |
| `6c998b4d` | 过大的凭据用 argv 写入 Keychain | port.sh | #1 |
| `e49d12a5` | 环境检查不再拉起 OpenCode Desktop | port.sh | #1 |
| `c7188667` `e35eef5d` `4e31203c` | Codex bounded fork 的用量能进统计 | port.sh | #1 |
| `d8339d6a` | 图标选择器避开 macOS 红绿灯 | port.sh | #1 |
| `f75cb1b6` | 轻量模式下第二次启动唤回主窗口 | port.sh | #1 |
| `9bd8fe51` | Windows 首选 PowerShell 时用 pwsh | port.sh | #1 |
| `32db0e57` | MiniMax 周额度耗尽后仍显示周窗口 | port.sh | #1 |
| `f0252817` | 定价表加入 GPT-6.1 Terra | port.sh | #1 |
| `b696f890` | Pi 的 MiniMax M3.1-Flash 思考级别 | port.sh | #1 |
| `c70d61de` | Linux AppImage 不再打包 libwayland-client | port.sh | #1 |
| `91a76cfd` `98777515` | 等数据库锁的同步命令移出 UI 线程 | 手工移植 | #2 |
| `f8f487b1` | 托盘面板不等数据先显示 | 手工移植 | #2 |
| `ef7b77de` | smol-toml 升级到 1.9.1（CVE-2026-85730） | 重新生成 lockfile | #3 |
| `ed494fbc` | OpenCode V2 连通性检查读 `settings.baseURL` | 手工解决冲突 | #3 |
| `51fce968` | Kimi 预设默认模型改为 kimi-k3.1-pro | 只取 Kimi 部分 | #3 |
| `3817c2b2` | 供应商表单的配置编辑器互相覆盖 | 手工移植 | #3 |

## 待跟进

看用户群决定，都需要手工移植。

| upstream | 内容 | 什么情况下跟 |
| --- | --- | --- |
| `1cc2c732` | Pi MCP 同步规则。没装 Pi 时不再创建 `~/.pi/agent/mcp.json`，SSE 服务器不再被导入启用 | Pi 是重点支持的应用 |
| `153db16e` | Windows 关闭 WebView2 自动填充，避免表单值被改掉 | 有 Windows 用户 |

## 不跟进（有判断的）

已删除模块里的提交（代理、DeepSeek Harness、Kimi 与 MiniMax Code 与 omp 应用、Claude Desktop、账号中心、WebDAV、会话、Skills 发现等）不逐条列出。下面是看过代码后决定不跟的。

| upstream | 原因 |
| --- | --- |
| `aa42a93d` | Codex 配额保护依赖已删除的代理 forwarder |
| `0b274ec3` | 修代理记录和会话记录的重复计数，我们没有代理记录 |
| `7569b27a` | 只由 MiniMax Code 和 DSH 表单触发 |
| `7e02e494` | 修的 `codexChatReasoning` 在我们这里不存在 |
| `0103f4c8` | Qwen 旧域名仍可用，upstream 也留作备用 |
| `9941a645` | Codex OAuth 刷新和 Gemini `.env`，两者的 UI 都已删除 |
| `67cce7ad` `0133facc` | 依赖账号中心的绑定流程 |
| `a62203bb` `7f82b85b` | 视觉细节 |
| `2186b305` | 只是一句提示文案 |
| `69b41cdb` | 只影响用 Pi 官方 subagent 扩展的人，少算一部分用量 |
| `869c0b27` | 非当前供应商的余额旧一点，只是显示 |
| `e78f641c` | 坏掉的 CLI 在应用页显示不一致，罕见且只是显示 |
| `5c14e917` | 只在只能走代理的网络里有用。我们已删全局代理设置，后端和 WebView 都走系统代理 |
| `e55d8a21` | 只影响 MyDockFinder 这类第三方托盘宿主 |
| `c1fb9eec` | Linux 托盘图标路径，upstream 未说明原因，没有相关问题报告 |
| `832fbe65` | 只修一个不稳定的测试，上 CI 时再拿 |
| `50a51b86` `fc9b17cb` `ca58c031` `cc4ce038` | 性能优化，没测量过也没有卡顿反馈；主要卡顿已在 #2 解决 |
| `51fce968` 其余部分 | Grok 默认模型升到 4.7，旧版仍可用 |
| 预设新增与域名迁移 | 产品迭代，按需再看 |

## 已知测试问题

- `src-tauri/tests/skill_sync.rs` 有 4 个用例在分叉后的分支上稳定失败，与同步无关，尚未排查。
- `src-tauri/tests/mcp_commands.rs` 在全量 `cargo test` 里偶发失败 4 个，单独运行通过。
