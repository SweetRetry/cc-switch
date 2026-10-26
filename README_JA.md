<div align="center">

# CC Switch

### Pi、Claude Code、Codex、Antigravity（AGY）、OpenCode の管理ツール

**ワンクリックで API プロバイダを切り替え、MCP・Skills・プロンプトを一元管理。JSON / TOML / YAML の設定ファイルを手作業で編集する必要はもうありません。**

[![Version](https://img.shields.io/github/v/release/farion1231/cc-switch?color=blue&label=version)](https://github.com/farion1231/cc-switch/releases)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/farion1231/cc-switch/releases)
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%202-orange.svg)](https://tauri.app/)
[![Downloads](https://img.shields.io/github/downloads/farion1231/cc-switch/total)](https://github.com/farion1231/cc-switch/releases/latest)

<a href="https://trendshift.io/repositories/15372" target="_blank"><img src="https://trendshift.io/api/badge/repositories/15372" alt="farion1231%2Fcc-switch | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
<a href="https://www.star-history.com/#farion1231/cc-switch&Date"><picture><source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/badge?repo=farion1231/cc-switch&theme=dark" /><img alt="Star History Rank" src="https://api.star-history.com/badge?repo=farion1231/cc-switch" width="196" height="55" /></picture></a>

### 🌐 唯一の公式サイト：**[ccswitch.io](https://ccswitch.io)**

[English](README.md) | [中文](README_ZH.md) | 日本語 | [Deutsch](README_DE.md) | [Changelog](CHANGELOG.md)


</div>

## 対応アプリ

この版はこの 5 つのアプリに対応します。Claude Code と Codex は直接接続、ルーティング、集約モードに対応します。OpenCode と Pi は複数プロバイダを管理できます。Antigravity はプロバイダとアカウントを管理できます。

- Pi
- Claude Code
- Codex
- Antigravity (AGY)
- OpenCode

## ダウンロード & インストール

### システム要件

- **Windows**: Windows 10 以上
- **macOS**: macOS 12 (Monterey) 以上
- **Linux**: x86_64 または ARM64、glibc 2.35 以上と WebKitGTK 4.1 が必要（例：Ubuntu 22.04+、Debian 12+、最近の Fedora）。RHEL / Rocky / Alma 8–9 は現在未対応

### Windows ユーザー

[Releases](../../releases) ページから最新版の `CC-Switch-v{version}-Windows.msi` インストーラー、またはポータブル版 `CC-Switch-v{version}-Windows-Portable.zip` をダウンロード。ARM 版 Windows では `CC-Switch-v{version}-Windows-arm64.msi` または `CC-Switch-v{version}-Windows-arm64-Portable.zip` をダウンロードしてください。

### macOS ユーザー

**方法 1: Homebrew でインストール（推奨）**

```bash
brew install --cask cc-switch
```

アップデート:

```bash
brew upgrade --cask cc-switch
```

**方法 2: 手動ダウンロード**

[Releases](../../releases) から `CC-Switch-v{version}-macOS.dmg`（推奨）または `.zip` をダウンロード。Apple Silicon と Intel Mac の両方でネイティブに動作する Universal ビルドです。

> **注意**: CC Switch の macOS 版は Apple によるコード署名と公証が完了しているため、そのままインストールして開けます。

### Arch Linux ユーザー

**paru でインストール（推奨）**

```bash
paru -S cc-switch-bin
```

### Linux ユーザー

[Releases](../../releases) から最新版の Linux ビルドをダウンロード：

- `CC-Switch-v{version}-Linux-x86_64.deb` / `-Linux-arm64.deb`（Debian/Ubuntu）
- `CC-Switch-v{version}-Linux-x86_64.rpm` / `-Linux-arm64.rpm`（WebKitGTK 4.1 を提供する Fedora などの RPM 系ディストリビューション）
- `CC-Switch-v{version}-Linux-x86_64.AppImage` / `-Linux-arm64.AppImage`（上記のシステム要件を満たすディストリビューション）

> **Flatpak**：公式リリースには含まれていません。`.deb` から自分でビルドできます — 手順は [`flatpak/README.md`](flatpak/README.md) を参照してください。

## クイックスタート

サイドバーでアプリを選び、プロバイダを追加して有効にします。MCP、Skills、プロンプト、セッション、使用量はサイドバーから管理できます。インストールと更新はアプリ画面で行います。

## License

MIT.
