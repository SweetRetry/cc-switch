<div align="center">

# CC Switch

### The manager for Pi, Claude Code, Codex, Antigravity (AGY) and OpenCode

**Switch API providers in one click and manage MCP, Skills, and Prompts in one place — no more hand-editing JSON / TOML / YAML config files.**

[![Version](https://img.shields.io/github/v/release/farion1231/cc-switch?color=blue&label=version)](https://github.com/farion1231/cc-switch/releases)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/farion1231/cc-switch/releases)
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%202-orange.svg)](https://tauri.app/)
[![Downloads](https://img.shields.io/github/downloads/farion1231/cc-switch/total)](https://github.com/farion1231/cc-switch/releases/latest)

<a href="https://trendshift.io/repositories/15372" target="_blank"><img src="https://trendshift.io/api/badge/repositories/15372" alt="farion1231%2Fcc-switch | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
<a href="https://www.star-history.com/#farion1231/cc-switch&Date"><picture><source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/badge?repo=farion1231/cc-switch&theme=dark" /><img alt="Star History Rank" src="https://api.star-history.com/badge?repo=farion1231/cc-switch" width="196" height="55" /></picture></a>

### 🌐 The Only Official Website: **[ccswitch.io](https://ccswitch.io)**

English | [中文](README_ZH.md) | [日本語](README_JA.md) | [Deutsch](README_DE.md) | [Changelog](CHANGELOG.md)


</div>

## Supported applications

This edition supports only these five applications. Claude Code and Codex connect directly to the selected provider. OpenCode and Pi support multiple providers. Antigravity supports provider and account management.

- Pi
- Claude Code
- Codex
- Antigravity (AGY)
- OpenCode

## Download & Installation

### System Requirements

- **Windows**: Windows 10 and above
- **macOS**: macOS 12 (Monterey) and above
- **Linux**: x86_64 or ARM64 with glibc 2.35+ and WebKitGTK 4.1 — e.g. Ubuntu 22.04+, Debian 12+, and recent Fedora releases; RHEL / Rocky / Alma 8–9 are not supported yet

### Windows Users

Download the latest `CC-Switch-v{version}-Windows.msi` installer or `CC-Switch-v{version}-Windows-Portable.zip` portable version from the [Releases](../../releases) page. On Windows on ARM, download `CC-Switch-v{version}-Windows-arm64.msi` or `CC-Switch-v{version}-Windows-arm64-Portable.zip`.

### macOS Users

**Method 1: Install via Homebrew (Recommended)**

```bash
brew install --cask cc-switch
```

Update:

```bash
brew upgrade --cask cc-switch
```

**Method 2: Manual Download**

Download `CC-Switch-v{version}-macOS.dmg` (recommended) or `.zip` from the [Releases](../../releases) page. It's a Universal build that runs natively on both Apple Silicon and Intel Macs.

> **Note**: CC Switch for macOS is code-signed and notarized by Apple. You can install and open it directly.

### Arch Linux Users

**Install via paru (Recommended)**

```bash
paru -S cc-switch-bin
```

### Linux Users

Download the latest Linux build from the [Releases](../../releases) page:

- `CC-Switch-v{version}-Linux-x86_64.deb` / `-Linux-arm64.deb` (Debian/Ubuntu)
- `CC-Switch-v{version}-Linux-x86_64.rpm` / `-Linux-arm64.rpm` (Fedora and other RPM distros that ship WebKitGTK 4.1)
- `CC-Switch-v{version}-Linux-x86_64.AppImage` / `-Linux-arm64.AppImage` (any distro meeting the requirements above)

> **Flatpak**: Not included in official releases. You can build it yourself from the `.deb` — see [`flatpak/README.md`](flatpak/README.md) for instructions.

## Quick start

Choose an application in the sidebar, add a provider, and select it. Manage MCP servers, skills, prompts, sessions and usage from the sidebar. Application installation and updates are available on the Apps page.

## License

MIT © Jason Young
