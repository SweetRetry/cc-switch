import { describe, expect, it } from "vitest";
import {
  opencodePresetModelSources,
  piPresetModelSources,
} from "@/config/presetModelMetadata";
import { resolveModelMetadata } from "@/lib/modelMetadata";

describe("preset model metadata sources", () => {
  it("carries a reviewed Pi thinking map with the protocol it depends on", () => {
    const [source, id, metadata] = piPresetModelSources()
      .flatMap((source) =>
        [...source.models].map(
          ([id, metadata]) => [source, id, metadata] as const,
        ),
      )
      .find(([, , metadata]) => metadata.piThinking?.compat !== undefined)!;
    expect(
      resolveModelMetadata(id, {
        baseUrl: source.baseUrl,
        presets: piPresetModelSources(),
      })?.piThinking,
    ).toEqual(metadata.piThinking);
  });

  it("reads OpenCode limits from the preset for the same address", () => {
    expect(
      resolveModelMetadata("kimi-k2.6", {
        baseUrl: "https://api.moonshot.cn/v1",
        presets: opencodePresetModelSources(),
      }),
    ).toMatchObject({
      contextWindow: 262144,
      maxOutputTokens: 262144,
      inputModalities: ["text", "image"],
    });
  });
});
