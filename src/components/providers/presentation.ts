import type { TFunction } from "i18next";
import type { Provider } from "@/types";
import type { AppId } from "@/lib/api";
import { isPiFamilyApp } from "@/config/appConfig";
import {
  isOfficialAccount,
  providerNeedsRouting,
} from "@/utils/providerCapabilities";

/** 供应商卡片的状态、操作和徽标。 */
export type CardTone = "direct";

export type ChipTone = "outline" | "direct" | "success" | "warning" | "danger";

export interface CardChip {
  key: string;
  label: string;
  tone: ChipTone;
  title?: string;
}

export interface CardMenuOption {
  key: string;
  label: string;
  detail?: string;
  onSelect: () => void;
}

/** 「更多」菜单里跟当前模式有关的一项。 */
export interface CardMenuItem {
  key: string;
  label: string;
  /** 不能点的原因：照常列出来，原因写在名字下面 */
  disabledReason?: string;
  onSelect: () => void;
  /** 展开成子菜单选一项（OpenClaw / OpenCode 的「设为默认」选默认模型） */
  submenu?: { title: string; options: CardMenuOption[] };
}

export interface CardButton {
  key: string;
  label: string;
  onClick: () => void;
  /** 不能点的原因：按钮照常画出来，原因挂在按钮的说明卡上 */
  disabledReason?: string;
}

export interface CardPresentation {
  /** 当前那张：模式色边框 + 淡底；共存式应用的默认那家（OpenClaw / OpenCode / Kimi 默认、Hermes 当前）也用 direct */
  tone?: CardTone;
  /** 主操作位换成状态文字（使用中 / 当前默认 / 已添加） */
  status?: { label: string; dot: CardTone | "muted" };
  buttons: CardButton[];
  /** 「更多」菜单最前面、跟当前模式有关的操作（OpenCode 的「设为默认」） */
  menuItems?: CardMenuItem[];
  chips: CardChip[];
  /** 整卡淡一些（不能用于当前模式的官方订阅、Hermes 托管） */
  dim?: boolean;
  /** 编辑 / 删除不可用的原因（当前那家不能删、Hermes 托管只能在 Web UI 改…） */
  editDisabledReason?: string;
  deleteDisabledReason?: string;
}

export interface ProviderSection {
  key: string;
  title?: string;
  help?: { title: string; body: string };
  emptyText?: string;
  items: { provider: Provider; presentation: CardPresentation }[];
}

export interface DirectInput {
  app: AppId;
  t: TFunction;
  providers: Provider[];
  currentProviderId: string;
  onSwitch: (provider: Provider) => void;
}

export function buildDirectSections({
  app,
  t,
  providers,
  currentProviderId,
  onSwitch,
}: DirectInput): ProviderSection[] {
  return [
    {
      key: "all",
      items: providers.map((provider) => {
        const current = provider.id === currentProviderId;
        return {
          provider,
          presentation: {
            tone: current ? "direct" : undefined,
            status: current
              ? { label: t("providerCard.status.inUse"), dot: "direct" }
              : undefined,
            chips: isOfficialAccount(app, provider)
              ? [
                  {
                    key: "official",
                    label: t("providerCard.chip.official"),
                    tone: "outline",
                  },
                ]
              : [],
            buttons: current
              ? []
              : [
                  {
                    key: "switch",
                    label: t("providerCard.action.switch"),
                    onClick: () => onSwitch(provider),
                    disabledReason: providerNeedsRouting(app, provider)
                      ? t("providerCard.reason.directUnsupported")
                      : undefined,
                  },
                ],
            deleteDisabledReason: current
              ? t("providerCard.reason.inUseCannotDelete")
              : undefined,
          },
        };
      }),
    },
  ];
}

// ─── 启动器式应用（Antigravity）──────────────────────────────────────────────

export interface LaunchInput {
  app: AppId;
  t: TFunction;
  providers: Provider[];
  openTerminal: (provider: Provider) => void;
}

/**
 * Antigravity：第三方 Key 只能经环境变量交给 CC Switch 打开的那个 agy，管不到用户自己敲的
 * `agy`，所以没有「启用 / 使用中」，每张卡的主操作就是「打开终端」，哪张都能删。
 */
export function buildLaunchSections(input: LaunchInput): ProviderSection[] {
  const { app, t, providers, openTerminal } = input;
  return [
    {
      key: "all",
      items: providers.map((p) => ({
        provider: p,
        presentation: {
          chips: isOfficialAccount(app, p)
            ? [
                {
                  key: "official",
                  label: t("providerCard.chip.official"),
                  tone: "outline",
                },
              ]
            : [],
          buttons: [
            {
              key: "openTerminal",
              label: t("provider.openTerminalWithProvider"),
              onClick: () => openTerminal(p),
            },
          ],
        },
      })),
    },
  ];
}

// ─── 共存式应用（OpenCode / OpenClaw / Hermes / Pi / MiniMax Code / Kimi）─────

export interface AdditiveInput {
  app: AppId;
  t: TFunction;
  providers: Provider[];
  isInConfig: (provider: Provider) => boolean;
  /** OpenCode：当前启用的 OMO / OMO Slim */
  currentOmoId?: string | null;
  currentOmoSlimId?: string | null;
  /** OpenClaw / OpenCode：默认模型属于哪家、它的模型名 */
  defaultModel?: { providerId: string; model: string } | null;
  /** OpenClaw / OpenCode：每家可选的模型 */
  defaultModelOptions?: (provider: Provider) => { id: string; name?: string }[];
  /** Hermes：model.provider 指向的那家 */
  /** Pi / Oh My Pi：读不到当前配置时一律不能改 */
  piStateUnavailable?: boolean;
  /** Kimi：原生 default_model 别名所属的供应商。 */
  actions: {
    add: (provider: Provider) => void;
    remove: (provider: Provider) => void;
    disableOmo: (provider: Provider) => void;
    setDefault: (provider: Provider, modelId?: string) => void;
  };
}

export function buildAdditiveSections(input: AdditiveInput): ProviderSection[] {
  const { app, t, providers, actions } = input;
  const added: ProviderSection["items"] = [];
  const available: ProviderSection["items"] = [];
  const piBlocked =
    isPiFamilyApp(app) && input.piStateUnavailable
      ? t(`${app}.current.stateUnavailableHint`)
      : undefined;

  for (const p of providers) {
    const chips: CardChip[] = [];

    const isOmo = p.category === "omo";
    const isOmoSlim = p.category === "omo-slim";
    if (isOmo) chips.push({ key: "omo", label: "OMO", tone: "outline" });
    if (isOmoSlim) chips.push({ key: "slim", label: "Slim", tone: "outline" });

    // OMO / Slim：插件配置，同一时间只启用一个
    if (isOmo || isOmoSlim) {
      const enabled = isOmo
        ? p.id === input.currentOmoId
        : p.id === input.currentOmoSlimId;
      if (enabled) {
        // 分组标题已经写了「已添加」，按钮是「停用」，卡上不再重复写状态
        added.push({
          provider: p,
          presentation: {
            chips,
            buttons: [
              {
                key: "disable",
                label: t("providerCard.action.disable"),
                onClick: () => actions.disableOmo(p),
              },
            ],
          },
        });
      } else {
        available.push({
          provider: p,
          presentation: {
            chips,
            buttons: [
              {
                key: "enable",
                label: t("providerCard.action.enable"),
                onClick: () => actions.add(p),
              },
            ],
          },
        });
      }
      continue;
    }

    if (!input.isInConfig(p)) {
      available.push({
        provider: p,
        presentation: {
          chips,
          deleteDisabledReason: piBlocked,
          buttons: [
            {
              key: "add",
              label: isPiFamilyApp(app)
                ? t("providerCard.action.enable")
                : t("providerCard.action.add"),
              onClick: () => actions.add(p),
              disabledReason: piBlocked,
            },
          ],
        },
      });
      continue;
    }

    // 已添加：白底、不写「● 已添加」（分组标题和「移除」已经说清楚）；蓝底只给默认那一家
    const buttons: CardButton[] = [];
    const menuItems: CardMenuItem[] = [];
    let status: CardPresentation["status"];
    let isDefault = false;
    let removeReason: string | undefined = piBlocked;

    // OpenCode 的顶层 model 一直允许移走所指的那家，这里不改；OpenClaw 不能
    if (app === "opencode") {
      isDefault = input.defaultModel?.providerId === p.id;
      if (isDefault) {
        status = { label: t("providerCard.status.default"), dot: "direct" };
        chips.push({
          key: "defaultModel",
          label: t("providerCard.chip.defaultModel", {
            model: input.defaultModel?.model ?? "",
          }),
          tone: "outline",
        });
      } else {
        const models = input.defaultModelOptions?.(p) ?? [];
        // 「设为默认」放「更多」菜单，不占卡片上的主操作位；多个模型时展开子菜单选。
        // OpenCode 内置供应商可以不列模型（运行时才有），给不出选项就不显示
        if (models.length > 0) {
          menuItems.push({
            key: "setDefault",
            label: t("providerCard.action.setDefault"),
            onSelect: () => actions.setDefault(p, models[0]?.id),
            submenu:
              models.length > 1
                ? {
                    title: t("openclaw.selectDefaultModel"),
                    options: models.map((model) => ({
                      key: model.id,
                      label: model.name?.trim() || model.id,
                      detail:
                        model.name?.trim() && model.name.trim() !== model.id
                          ? model.id
                          : undefined,
                      onSelect: () => actions.setDefault(p, model.id),
                    })),
                  }
                : undefined,
          });
        }
      }
    }

    // Hermes 跟 OpenClaw / OpenCode 一样是累加式：model.provider 只是默认那家，
    // 「设为默认」收在「更多」菜单里，主操作位只留「移除」

    buttons.push({
      key: "remove",
      label: t("providerCard.action.remove"),
      onClick: () => actions.remove(p),
      disabledReason: removeReason,
    });

    added.push({
      provider: p,
      presentation: {
        tone: isDefault ? "direct" : undefined,
        status,
        chips,
        deleteDisabledReason: piBlocked,
        buttons,
        menuItems: menuItems.length ? menuItems : undefined,
      },
    });
  }

  return [
    {
      key: "added",
      title: t("providerCard.section.added", { count: added.length }),
      help: {
        title: t("providerCard.section.addedHelpTitle"),
        body: t("providerCard.section.addedHelp", {
          app: t(`apps.${app}`),
        }),
      },
      emptyText: t("providerCard.section.addedEmpty"),
      items: added,
    },
    {
      key: "available",
      title: t("providerCard.section.available", { count: available.length }),
      items: available,
    },
  ];
}
