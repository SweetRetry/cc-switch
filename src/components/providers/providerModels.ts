import type { TFunction } from "i18next";
import type { AppId } from "@/lib/api";
import type { Provider } from "@/types";
import { getOpencodeDeclaredModels } from "@/components/providers/forms/helpers/opencodeFormUtils";
import { extractCodexModelName } from "@/utils/providerConfigUtils";

/**
 * 供应商配了哪些模型。各应用的形态不同：
 * - Claude：主模型加 Sonnet / Opus / Fable / Haiku / 子代理的角色映射，只列配了的
 * - Codex：模型目录，第一条是默认
 * - OpenCode / Pi：模型列表
 * - Antigravity：一个模型
 */
export type ProviderModels =
  | { kind: "roles"; rows: { key: string; label: string; model: string }[] }
  | {
      kind: "list";
      models: { id: string; name?: string }[];
      defaultId?: string;
    };

const CLAUDE_ROLES = [
  { key: "ANTHROPIC_MODEL", label: "providerDetail.mainModel" },
  {
    key: "ANTHROPIC_DEFAULT_SONNET_MODEL",
    label: "providerForm.modelRoleSonnet",
  },
  { key: "ANTHROPIC_DEFAULT_OPUS_MODEL", label: "providerForm.modelRoleOpus" },
  {
    key: "ANTHROPIC_DEFAULT_FABLE_MODEL",
    label: "providerForm.modelRoleFable",
  },
  {
    key: "ANTHROPIC_DEFAULT_HAIKU_MODEL",
    label: "providerForm.modelRoleHaiku",
  },
  {
    key: "CLAUDE_CODE_SUBAGENT_MODEL",
    label: "providerForm.modelRoleSubagent",
  },
] as const;

const text = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

export function describeProviderModels(
  app: AppId,
  provider: Provider,
  t: TFunction,
): ProviderModels {
  const config = provider.settingsConfig as Record<string, any>;
  switch (app) {
    case "claude":
      return {
        kind: "roles",
        rows: CLAUDE_ROLES.flatMap(({ key, label }) => {
          const model = text(config?.env?.[key]);
          return model ? [{ key, label: t(label), model }] : [];
        }),
      };
    case "codex": {
      const catalog: unknown[] = Array.isArray(config?.modelCatalog?.models)
        ? config.modelCatalog.models
        : [];
      const models = catalog.flatMap((entry) => {
        const item = entry as { model?: unknown; displayName?: unknown };
        const id = text(item.model);
        return id ? [{ id, name: text(item.displayName) }] : [];
      });
      const top = extractCodexModelName(config?.config);
      if (models.length === 0 && top) models.push({ id: top, name: undefined });
      return { kind: "list", models, defaultId: top ?? models[0]?.id };
    }
    case "opencode":
      return {
        kind: "list",
        models: getOpencodeDeclaredModels(provider.id, config),
      };
    case "pi": {
      const list: unknown[] = Array.isArray(config?.models)
        ? config.models
        : [];
      return {
        kind: "list",
        models: list.flatMap((entry) => {
          const item = entry as { id?: unknown; name?: unknown };
          const id = text(item.id);
          return id ? [{ id, name: text(item.name) }] : [];
        }),
      };
    }
    case "agy": {
      const id =
        text(config?.config?.model?.name) ?? text(config?.env?.GEMINI_MODEL);
      return { kind: "list", models: id ? [{ id }] : [] };
    }
  }
}

/** 列表行副标题用的那一个模型；没配时返回 undefined，由调用方写「应用默认」。 */
export function primaryModelOf(app: AppId, provider: Provider, t: TFunction) {
  const described = describeProviderModels(app, provider, t);
  if (described.kind === "roles") return described.rows[0]?.model;
  return described.defaultId ?? described.models[0]?.id;
}
