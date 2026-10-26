import { describe, expect, it } from "vitest";
import {
  ONE_CLICK_INSTALL_COMMANDS,
  TOOL_NAMES,
} from "@/components/apps/useToolManagement";
import { KNOWN_APP_TYPES } from "@/types/usage";
import {
  UNINSTALL_METHODS,
  uninstallCommandsFor,
} from "@/components/apps/toolUninstallCommands";

describe("managed application scope", () => {
  it("offers only the five supported clients for installation and usage", () => {
    expect(TOOL_NAMES).toEqual(["claude", "codex", "opencode", "pi", "agy"]);
    expect(KNOWN_APP_TYPES).toEqual([
      "claude",
      "codex",
      "opencode",
      "pi",
      "agy",
    ]);
  });

  it("keeps copied installation commands within the supported clients", () => {
    expect(ONE_CLICK_INSTALL_COMMANDS.match(/^# .+$/gm)).toEqual([
      "# Claude Code",
      "# Codex",
      "# OpenCode",
      "# Pi",
      "# Antigravity CLI",
    ]);
    expect(ONE_CLICK_INSTALL_COMMANDS).not.toMatch(
      /hermes|gemini-cli|openclaw|@oh-my-pi|@minimax|kimi-code|@xai/,
    );
  });

  it("offers manual uninstall commands only for supported clients", () => {
    const tools = new Set(
      Object.keys(UNINSTALL_METHODS).flatMap((method) =>
        uninstallCommandsFor(
          method as keyof typeof UNINSTALL_METHODS,
          () => "macos",
        ).map(({ tool }) => tool),
      ),
    );
    expect([...tools].sort()).toEqual([
      "agy",
      "claude",
      "codex",
      "opencode",
      "pi",
    ]);
  });
});
