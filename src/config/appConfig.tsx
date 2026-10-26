import React from "react";
import type { AppId } from "@/lib/api/types";
import type { PiFamilyAppId } from "@/lib/api/pi";
import type { VisibleApps } from "@/types";
import { ClaudeIcon, CodexIcon } from "@/components/BrandIcons";
import { ProviderIcon } from "@/components/ProviderIcon";

export interface AppConfig {
  label: string;
  icon: React.ReactNode;
  activeClass: string;
  badgeClass: string;
}

export const APP_IDS: AppId[] = ["claude", "codex", "opencode", "pi", "agy"];

export const DEFAULT_VISIBLE_APPS: VisibleApps = {
  claude: true,
  codex: true,
  opencode: true,
  pi: true,
  agy: true,
};

/** Ignore removed apps in old settings and keep at least one supported app visible. */
export function normalizeVisibleApps(
  saved?: Partial<VisibleApps>,
): VisibleApps {
  const visible = { ...DEFAULT_VISIBLE_APPS };
  for (const app of APP_IDS) {
    visible[app] = saved?.[app] ?? true;
  }
  if (!APP_IDS.some((app) => visible[app])) visible.claude = true;
  return visible;
}

export function isSupportedAppId(value: string): value is AppId {
  return (APP_IDS as readonly string[]).includes(value);
}

/**
 * 应用页和侧栏的应用顺序：先按用户拖出来的顺序（`settings.appOrder`，不认识的 ID 忽略），
 * 没在里面的应用（比如新版本加的）插回默认顺序里它前一个应用的后面。
 */
export function orderAppIds(saved: readonly string[] | undefined): AppId[] {
  if (!saved?.length) return [...APP_IDS];
  const known = new Set<string>(APP_IDS);
  const ordered: AppId[] = [];
  for (const id of saved) {
    if (known.has(id) && !ordered.includes(id as AppId)) {
      ordered.push(id as AppId);
    }
  }
  APP_IDS.forEach((app, index) => {
    if (ordered.includes(app)) return;
    const previous = APP_IDS.slice(0, index)
      .reverse()
      .find((id) => ordered.includes(id));
    ordered.splice(previous ? ordered.indexOf(previous) + 1 : 0, 0, app);
  });
  return ordered;
}

/** App IDs shown in Skills panels. */
export const SKILLS_APP_IDS: AppId[] = [
  "claude",
  "codex",
  "opencode",
  "pi",
  "agy",
];

export type AdditiveAppId = Extract<AppId, "opencode" | "pi">;

export const ADDITIVE_APP_IDS: AdditiveAppId[] = ["opencode", "pi"];

export function isAdditiveAppId(appId: string): appId is AdditiveAppId {
  return (ADDITIVE_APP_IDS as string[]).includes(appId);
}

/** Pi 供应商表单和用量脚本使用同一个应用标识。 */
export const PI_FAMILY_APP_IDS: PiFamilyAppId[] = ["pi"];

export function isPiFamilyApp(appId: string): appId is PiFamilyAppId {
  return (PI_FAMILY_APP_IDS as string[]).includes(appId);
}

/**
 * 切换只替换关键字段的应用：供应商编辑器显示「切到这个供应商之后配置文件的样子」，由后端
 * `ProviderService::editor_view` 投影。
 */
export const EDITOR_VIEW_APP_IDS: AppId[] = ["claude", "codex"];

export function usesEditorView(appId: AppId): boolean {
  return EDITOR_VIEW_APP_IDS.includes(appId);
}

/** 支持 MCP 同步的应用。 */
export type McpAppId = Extract<
  AppId,
  "claude" | "codex" | "opencode" | "pi" | "agy"
>;
export const MCP_APP_IDS: McpAppId[] = [
  "claude",
  "codex",
  "opencode",
  "pi",
  "agy",
];

export function isMcpAppId(appId: string): appId is McpAppId {
  return (MCP_APP_IDS as string[]).includes(appId);
}

export function usesGeminiStyleForm(appId: string): boolean {
  return appId === "agy";
}

export const APP_ICON_MAP: Record<AppId, AppConfig> = {
  claude: {
    label: "Claude",
    icon: <ClaudeIcon size={14} />,
    activeClass:
      "bg-orange-500/10 ring-1 ring-orange-500/20 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400",
    badgeClass:
      "bg-orange-500/10 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20 border-0 gap-1.5",
  },
  codex: {
    label: "Codex",
    icon: <CodexIcon size={14} />,
    activeClass:
      "bg-green-500/10 ring-1 ring-green-500/20 hover:bg-green-500/20 text-green-600 dark:text-green-400",
    badgeClass:
      "bg-green-500/10 text-green-700 dark:text-green-300 hover:bg-green-500/20 border-0 gap-1.5",
  },
  opencode: {
    label: "OpenCode",
    icon: (
      <ProviderIcon
        icon="opencode"
        name="OpenCode"
        size={14}
        showFallback={false}
      />
    ),
    activeClass:
      "bg-indigo-500/10 ring-1 ring-indigo-500/20 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400",
    badgeClass:
      "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 border-0 gap-1.5",
  },
  pi: {
    label: "Pi",
    icon: <ProviderIcon icon="pi" name="Pi" size={14} showFallback={false} />,
    activeClass:
      "bg-fuchsia-500/10 ring-1 ring-fuchsia-500/20 hover:bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400",
    badgeClass:
      "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 hover:bg-fuchsia-500/20 border-0 gap-1.5",
  },
  agy: {
    label: "Antigravity",
    icon: (
      <ProviderIcon
        icon="antigravity"
        name="Antigravity"
        size={14}
        showFallback={false}
      />
    ),
    activeClass:
      "bg-sky-500/10 ring-1 ring-sky-500/20 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300",
    badgeClass:
      "bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 border-0 gap-1.5",
  },
};

export function getAppLabel(appId: string): string {
  return APP_ICON_MAP[appId as AppId]?.label ?? appId;
}
