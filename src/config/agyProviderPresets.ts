import type { ProviderCategory } from "@/types";
import type { PresetFamilyFields } from "./presetFamilies";

/**
 * Gemini 预设供应商的视觉主题配置
 */
export interface AgyPresetTheme {
  /** 图标类型：'gemini' | 'generic' */
  icon?: "gemini" | "generic";
  /** 背景色（选中状态），支持 hex 颜色 */
  backgroundColor?: string;
  /** 文字色（选中状态），支持 hex 颜色 */
  textColor?: string;
}

export interface AgyProviderPreset extends PresetFamilyFields {
  name: string;
  nameKey?: string; // i18n key for localized display name
  websiteUrl: string;
  apiKeyUrl?: string;
  settingsConfig: object;
  baseURL?: string;
  model?: string;
  description?: string;
  category?: ProviderCategory;
  endpointCandidates?: string[];
  theme?: AgyPresetTheme;
  // 图标配置
  icon?: string; // 图标名称
  iconColor?: string; // 图标颜色
}

export const agyProviderPresets: AgyProviderPreset[] = [
  {
    name: "Google Official",
    websiteUrl: "https://ai.google.dev/",
    apiKeyUrl: "https://aistudio.google.com/apikey",
    settingsConfig: {
      env: {},
    },
    description: "Google 官方 Gemini API (OAuth)",
    category: "official",
    theme: {
      icon: "gemini",
      backgroundColor: "#4285F4",
      textColor: "#FFFFFF",
    },
    icon: "gemini",
    iconColor: "#4285F4",
  },
];

export function getGeminiPresetByName(
  name: string,
): AgyProviderPreset | undefined {
  return agyProviderPresets.find((preset) => preset.name === name);
}

export function getGeminiPresetByUrl(
  url: string,
): AgyProviderPreset | undefined {
  if (!url) return undefined;
  return agyProviderPresets.find(
    (preset) =>
      preset.baseURL &&
      url.toLowerCase().includes(preset.baseURL.toLowerCase()),
  );
}
