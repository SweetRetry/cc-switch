<div align="center">

# CC Switch

### Der Manager für Pi, Claude Code, Codex, Antigravity (AGY) und OpenCode

**API-Anbieter mit einem Klick wechseln und MCP, Skills und Prompts zentral verwalten — ohne JSON-, TOML- oder YAML-Konfigurationsdateien von Hand zu bearbeiten.**

[![Version](https://img.shields.io/github/v/release/farion1231/cc-switch?color=blue&label=version)](https://github.com/farion1231/cc-switch/releases)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/farion1231/cc-switch/releases)
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%202-orange.svg)](https://tauri.app/)
[![Downloads](https://img.shields.io/github/downloads/farion1231/cc-switch/total)](https://github.com/farion1231/cc-switch/releases/latest)

<a href="https://trendshift.io/repositories/15372" target="_blank"><img src="https://trendshift.io/api/badge/repositories/15372" alt="farion1231%2Fcc-switch | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
<a href="https://www.star-history.com/#farion1231/cc-switch&Date"><picture><source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/badge?repo=farion1231/cc-switch&theme=dark" /><img alt="Star History Rank" src="https://api.star-history.com/badge?repo=farion1231/cc-switch" width="196" height="55" /></picture></a>

### 🌐 Die einzige offizielle Website: **[ccswitch.io](https://ccswitch.io)**

[English](README.md) | [中文](README_ZH.md) | [日本語](README_JA.md) | Deutsch | [Changelog](CHANGELOG.md)


</div>

## Unterstützte Anwendungen

Diese Ausgabe unterstützt diese fünf Anwendungen. Claude Code und Codex bieten direkte Verbindungen, Routing und Aggregation. OpenCode und Pi verwalten mehrere Anbieter. Antigravity bietet Anbieter- und Kontoverwaltung.

- Pi
- Claude Code
- Codex
- Antigravity (AGY)
- OpenCode

## Download & Installation

### Systemanforderungen

- **Windows**: Windows 10 und höher
- **macOS**: macOS 12 (Monterey) und höher
- **Linux**: x86_64 oder ARM64 mit glibc 2.35+ und WebKitGTK 4.1 — z. B. Ubuntu 22.04+, Debian 12+ und aktuelle Fedora-Versionen; RHEL / Rocky / Alma 8–9 werden derzeit nicht unterstützt

### Windows-Nutzer

Laden Sie das neueste Installationsprogramm `CC-Switch-v{version}-Windows.msi` oder die portable Version `CC-Switch-v{version}-Windows-Portable.zip` von der Seite [Releases](../../releases) herunter. Unter Windows on ARM laden Sie `CC-Switch-v{version}-Windows-arm64.msi` oder `CC-Switch-v{version}-Windows-arm64-Portable.zip` herunter.

### macOS-Nutzer

**Methode 1: Installation über Homebrew (empfohlen)**

```bash
brew install --cask cc-switch
```

Aktualisieren:

```bash
brew upgrade --cask cc-switch
```

**Methode 2: Manueller Download**

Laden Sie `CC-Switch-v{version}-macOS.dmg` (empfohlen) oder `.zip` von der Seite [Releases](../../releases) herunter. Es handelt sich um einen Universal-Build, der nativ auf Apple-Silicon- und Intel-Macs läuft.

> **Hinweis**: CC Switch für macOS ist von Apple code-signiert und notarisiert. Sie können es direkt installieren und öffnen.

### Arch-Linux-Nutzer

**Installation über paru (empfohlen)**

```bash
paru -S cc-switch-bin
```

### Linux-Nutzer

Laden Sie den neuesten Linux-Build von der Seite [Releases](../../releases) herunter:

- `CC-Switch-v{version}-Linux-x86_64.deb` / `-Linux-arm64.deb` (Debian/Ubuntu)
- `CC-Switch-v{version}-Linux-x86_64.rpm` / `-Linux-arm64.rpm` (Fedora und andere RPM-Distributionen mit WebKitGTK 4.1)
- `CC-Switch-v{version}-Linux-x86_64.AppImage` / `-Linux-arm64.AppImage` (jede Distribution, die die obigen Systemanforderungen erfüllt)

> **Flatpak**: Nicht in den offiziellen Releases enthalten. Sie können es selbst aus dem `.deb` bauen — eine Anleitung finden Sie unter [`flatpak/README.md`](flatpak/README.md).

## Schnellstart

Wählen Sie eine Anwendung in der Seitenleiste, fügen Sie einen Anbieter hinzu und aktivieren Sie ihn. MCP, Skills, Prompts, Sitzungen und Nutzung sind über die Seitenleiste erreichbar. Installation und Updates finden Sie auf der Apps-Seite.

## License

MIT.
