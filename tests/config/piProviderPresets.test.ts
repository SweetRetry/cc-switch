import { describe, expect, it } from "vitest";
import {
  getPiModelCatalogReference,
  piModelCatalog,
} from "@/config/piModelCatalog";
import { piProviderPresets } from "@/config/piProviderPresets";

describe("Pi provider presets", () => {

  it("uses distinct managed keys instead of shadowing Pi-native providers", () => {
    const keys = piProviderPresets.map((preset) => preset.providerKey);

    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.every((key) => key.startsWith("cc-switch-"))).toBe(true);
  });

  it("only supplies configuration defaults, never a second gateway decision", () => {
    for (const preset of piProviderPresets) {
      expect("allowGateway" in preset).toBe(false);
      expect(preset.settingsConfig.baseUrl).toMatch(/^https?:\/\//);
      expect(preset.settingsConfig.api).not.toBe("");
      expect(preset.settingsConfig.apiKey).toBe("");
      expect(preset.settingsConfig.models.length).toBeGreaterThan(0);
      const modelIds = preset.settingsConfig.models.map((model) => model.id);
      expect(new Set(modelIds).size).toBe(modelIds.length);
      for (const model of preset.settingsConfig.models) {
        expect(model.id).not.toBe("");
        expect(model.name).not.toBe("");
        expect(typeof model.reasoning).toBe("boolean");
        expect(model.input.length).toBeGreaterThan(0);
        expect(model.input.every((input) => ["text", "image"].includes(input)));
        expect(model.contextWindow).toBeGreaterThan(0);
        expect(model.maxTokens).toBeGreaterThan(0);
        const reference = getPiModelCatalogReference(model);
        if (!reference) {
          throw new Error(`${preset.name}/${model.id} has no catalog profile`);
        }
        expect(piModelCatalog).toHaveProperty(reference.catalogKey);
        expect(JSON.parse(JSON.stringify(model))).not.toHaveProperty(
          "catalogKey",
        );
      }
    }
  });

  // #7859: 官方 V4.1 Flash 识图；2026-10-25 起官方预设只留 Flash
  it("declares image input for official DeepSeek V4.1 Flash", () => {
    const models =
      piProviderPresets.find((preset) => preset.name === "DeepSeek")
        ?.settingsConfig.models ?? [];
    const input = (id: string) =>
      models.find((model) => model.id === id)?.input;

    expect(models.map((model) => model.id)).toEqual(["deepseek-flash"]);
    expect(input("deepseek-flash")).toEqual(["text", "image"]);
  });

  // #7956: 火山各套餐端点不同，Agent Plan 曾误用 Coding Plan 的端点
  it("points each Volcengine plan at its own Ark endpoint", () => {
    const endpoints = Object.fromEntries(
      piProviderPresets
        .filter((preset) => preset.family === "volcengine")
        .map((preset) => [preset.planKey, preset.settingsConfig.baseUrl]),
    );

    expect(endpoints).toEqual({
      agentPlan: "https://ark.cn-beijing.volces.com/api/plan/v3",
      codingPlan: "https://ark.cn-beijing.volces.com/api/coding/v3",
      payg: "https://ark.cn-beijing.volces.com/api/v3",
    });
  });
});
