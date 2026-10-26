import { describe, expect, it } from "vitest";
import { opencodeProviderPresets } from "@/config/opencodeProviderPresets";
import { piProviderPresets } from "@/config/piProviderPresets";

// TeamoRouter 有两套预设：原 GPT 预设走 OpenAI 兼容协议，Claude 预设走
// Anthropic 原生协议（/v1/messages），两者并存、互不覆盖。
const CLAUDE_MODELS = [
  "claude-opus-5-5",
  "claude-sonnet-5-5",
  "claude-fable-5-1",
];

function find<T extends { name: string }>(list: T[], name: string): T {
  const preset = list.find((item) => item.name === name);
  if (!preset) throw new Error(`Missing preset: ${name}`);
  return preset;
}

describe("TeamoRouter Claude presets", () => {
  it("uses @ai-sdk/anthropic for OpenCode with a /v1 root", () => {
    const preset = find(opencodeProviderPresets, "TeamoRouter Claude");
    expect(preset.settingsConfig.npm).toBe("@ai-sdk/anthropic");
    expect(preset.settingsConfig.options?.baseURL).toBe(
      "https://api.teamorouter.cn/v1",
    );
    expect(Object.keys(preset.settingsConfig.models ?? {})).toEqual(
      CLAUDE_MODELS,
    );
  });

  it("uses a distinct Pi provider key and an Anthropic root", () => {
    const gpt = find(piProviderPresets, "TeamoRouter");
    const preset = find(piProviderPresets, "TeamoRouter Claude");
    expect(preset.providerKey).toBe("cc-switch-teamo-router-claude");
    expect(preset.providerKey).not.toBe(gpt.providerKey);
    expect(preset.settingsConfig.api).toBe("anthropic-messages");
    expect(preset.settingsConfig.baseUrl).toBe("https://api.teamorouter.cn");
    expect(preset.settingsConfig.models.map((model) => model.id)).toEqual(
      CLAUDE_MODELS,
    );
  });
});
