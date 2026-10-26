import { describe, expect, it } from "vitest";
import { resolveProviderIcon } from "./providerIcon";

describe("resolveProviderIcon", () => {
  it("preserves a selected vendor icon on a supported app", () => {
    expect(resolveProviderIcon("codex", "grok", "")).toBe("grok");
    expect(resolveProviderIcon("claude", "anthropic", "currentColor")).toBe(
      "anthropic",
    );
  });
  it("normalizes the selected icon and falls back for empty names", () => {
    expect(resolveProviderIcon("pi", "  openai  ")).toBe("openai");
    expect(resolveProviderIcon("opencode", "  ", "")).toBeUndefined();
  });
});
