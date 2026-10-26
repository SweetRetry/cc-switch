import { describe, expect, it } from "vitest";
import {
  APP_IDS,
  orderAppIds,
  isAdditiveAppId,
  SKILLS_APP_IDS,
  MCP_APP_IDS,
} from "@/config/appConfig";

describe("appConfig provider lifecycle", () => {
  it.each(["opencode", "pi"])("classifies %s as additive", (appId) => {
    expect(isAdditiveAppId(appId)).toBe(true);
  });

  it.each(["claude", "codex", "agy"])(
    "does not classify %s as additive",
    (appId) => {
      expect(isAdditiveAppId(appId)).toBe(false);
    },
  );
});

// Antigravity shares management UI, but has independent configuration and no CCS proxy.
describe("Antigravity capabilities", () => {
  it("supports skills and MCP with direct provider switching", () => {
    expect(SKILLS_APP_IDS).toContain("agy");
    expect(MCP_APP_IDS).toContain("agy");
    expect(isAdditiveAppId("agy")).toBe(false);
  });
});

describe("orderAppIds", () => {
  it("falls back to the default order when nothing is saved", () => {
    expect(orderAppIds(undefined)).toEqual(APP_IDS);
    expect(orderAppIds([])).toEqual(APP_IDS);
  });

  it("keeps the saved order and drops unknown or repeated ids", () => {
    const saved = [...APP_IDS].reverse();
    expect(orderAppIds(["future-app", ...saved, "claude"])).toEqual(saved);
  });

  it("puts an app missing from the saved order after its default predecessor", () => {
    expect(orderAppIds(["pi", "claude", "codex", "opencode"])).toEqual([
      "pi",
      "agy",
      "claude",
      "codex",
      "opencode",
    ]);
    expect(orderAppIds(APP_IDS.filter((app) => app !== "claude"))[0]).toBe(
      "claude",
    );
  });
});
