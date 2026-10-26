import { describe, expect, it, vi } from "vitest";
import type { TFunction } from "i18next";
import type { Provider } from "@/types";
import { getOpencodeDeclaredModels } from "@/components/providers/forms/helpers/opencodeFormUtils";
import {
  buildAdditiveSections,
  buildLaunchSections,
  buildDirectSections,
  type ProviderSection,
} from "@/components/providers/presentation";

const t = ((key: string, options?: Record<string, unknown>) =>
  options && "count" in options
    ? `${key}:${String(options.count)}`
    : key) as unknown as TFunction;

const provider = (id: string, overrides: Partial<Provider> = {}): Provider => ({
  id,
  name: id,
  settingsConfig: {},
  ...overrides,
});

const official = provider("official", { category: "official" });
const relay = provider("relay");
const backup = provider("backup");
const item = (sections: ProviderSection[], id: string) => {
  for (const section of sections) {
    const found = section.items.find((entry) => entry.provider.id === id);
    if (found) return { section: section.key, ...found.presentation };
  }
  throw new Error(`no card for ${id}`);
};

const button = (sections: ProviderSection[], id: string, key: string) => {
  const found = item(sections, id).buttons.find((b) => b.key === key);
  if (!found) throw new Error(`no ${key} button on ${id}`);
  return found;
};

/** 「更多」菜单里的「设为默认」 */
const setDefaultItem = (sections: ProviderSection[], id: string) => {
  const found = item(sections, id).menuItems?.find(
    (m) => m.key === "setDefault",
  );
  if (!found) throw new Error(`no setDefault menu item on ${id}`);
  return found;
};

describe("buildDirectSections", () => {
  it("keeps unsupported legacy providers editable but blocks direct switching", () => {
    const converted = provider("converted", {
      meta: { apiFormat: "openai_chat" },
    });
    const sections = buildDirectSections({
      app: "claude",
      t,
      providers: [converted],
      currentProviderId: "relay",
      onSwitch: vi.fn(),
    });
    expect(button(sections, "converted", "switch").disabledReason).toBe(
      "providerCard.reason.directUnsupported",
    );
    expect(item(sections, "converted").editDisabledReason).toBeUndefined();
    expect(item(sections, "converted").deleteDisabledReason).toBeUndefined();
  });
  it("marks the current provider and switches another provider directly", () => {
    const onSwitch = vi.fn();
    const sections = buildDirectSections({
      app: "claude",
      t,
      providers: [official, relay, backup],
      currentProviderId: "relay",
      onSwitch,
    });
    expect(item(sections, "relay")).toMatchObject({
      tone: "direct",
      status: { label: "providerCard.status.inUse", dot: "direct" },
      buttons: [],
      deleteDisabledReason: "providerCard.reason.inUseCannotDelete",
    });
    button(sections, "backup", "switch").onClick();
    expect(onSwitch).toHaveBeenCalledWith(backup);
    expect(item(sections, "backup").deleteDisabledReason).toBeUndefined();
    expect(item(sections, "official").chips).toEqual([
      { key: "official", label: "providerCard.chip.official", tone: "outline" },
    ]);
  });
});

describe("buildAdditiveSections", () => {
  const additiveActions = () => ({
    add: vi.fn(),
    remove: vi.fn(),
    disableOmo: vi.fn(),
    setDefault: vi.fn(),
  });

  it("splits added and available providers and keeps OMO to one at a time", () => {
    const omo = provider("omo", { category: "omo" });
    const otherOmo = provider("omo-2", { category: "omo" });
    const actions = additiveActions();
    const sections = buildAdditiveSections({
      app: "opencode",
      t,
      providers: [relay, backup, omo, otherOmo],
      isInConfig: (p) => p.id === "relay",
      currentOmoId: "omo",
      actions,
    });

    expect(sections.map((s) => [s.key, s.items.length])).toEqual([
      ["added", 2],
      ["available", 2],
    ]);
    button(sections, "relay", "remove").onClick();
    expect(actions.remove).toHaveBeenCalledWith(relay);
    // 已添加的卡白底、不再写「● 已添加 / 已启用」：灰底只给默认那一家
    for (const id of ["relay", "omo"]) {
      expect(item(sections, id).tone).toBeUndefined();
      expect(item(sections, id).status).toBeUndefined();
    }
    button(sections, "backup", "add").onClick();
    expect(actions.add).toHaveBeenCalledWith(backup);
    button(sections, "omo", "disable").onClick();
    expect(actions.disableOmo).toHaveBeenCalledWith(omo);
    expect(item(sections, "omo-2").buttons.map((b) => b.key)).toEqual([
      "enable",
    ]);
  });

  it("lets OpenCode set the top-level default model without blocking removal", () => {
    const multi = provider("multi");
    const actions = additiveActions();
    const sections = buildAdditiveSections({
      app: "opencode",
      t,
      providers: [relay, multi],
      isInConfig: () => true,
      defaultModel: { providerId: "relay", model: "vendor/gpt" },
      defaultModelOptions: (p) =>
        p.id === "multi" ? [{ id: "m-1", name: "Model 1" }, { id: "m-2" }] : [],
      actions,
    });

    expect(item(sections, "relay")).toMatchObject({
      tone: "direct",
      status: { label: "providerCard.status.default" },
    });
    expect(
      item(sections, "relay").chips.some((c) => c.key === "defaultModel"),
    ).toBe(true);
    expect(button(sections, "relay", "remove").disabledReason).toBeUndefined();
    const setDefault = setDefaultItem(sections, "multi");
    setDefault.onSelect();
    expect(actions.setDefault).toHaveBeenCalledWith(multi, "m-1");
    setDefault.submenu?.options[1].onSelect();
    expect(actions.setDefault).toHaveBeenCalledWith(multi, "m-2");
    // relay 不是默认时也没有声明模型（内置供应商）：不给「设为默认」
    const other = buildAdditiveSections({
      app: "opencode",
      t,
      providers: [relay],
      isInConfig: () => true,
      defaultModel: null,
      defaultModelOptions: () => [],
      actions,
    });
    expect(item(other, "relay").buttons.map((b) => b.key)).toEqual(["remove"]);
    expect(item(other, "relay").menuItems).toBeUndefined();
  });

  it("reads OpenCode models from a stored full config as the backend does", () => {
    const models = {
      "m-1": { name: "Model 1" },
      "": {},
      off: { disabled: true },
      "m-2": {},
    };
    expect(getOpencodeDeclaredModels("relay", { models })).toEqual([
      { id: "m-1", name: "Model 1" },
      { id: "m-2", name: undefined },
    ]);
    expect(
      getOpencodeDeclaredModels("relay", {
        $schema: "https://opencode.ai/config.json",
        providers: { relay: { models: { native: {} } } },
        provider: { relay: { models: { legacy: {} } } },
      }).map((m) => m.id),
    ).toEqual(["native"]);
    expect(
      getOpencodeDeclaredModels("relay", {
        provider: { relay: { models: { legacy: {} } } },
      }).map((m) => m.id),
    ).toEqual(["legacy"]);
    expect(getOpencodeDeclaredModels("relay", { options: {} })).toEqual([]);
  });

  it("blocks every Pi change while Pi's current state is unavailable", () => {
    const sections = buildAdditiveSections({
      app: "pi",
      t,
      providers: [relay],
      isInConfig: () => false,
      piStateUnavailable: true,
      actions: additiveActions(),
    });

    expect(button(sections, "relay", "add")).toMatchObject({
      label: "providerCard.action.enable",
      disabledReason: "pi.current.stateUnavailableHint",
    });
    expect(item(sections, "relay").deleteDisabledReason).toBe(
      "pi.current.stateUnavailableHint",
    );
  });
});

describe("buildLaunchSections", () => {
  it("gives every Antigravity card Open Terminal instead of enable or in use", () => {
    const openTerminal = vi.fn();
    const [section] = buildLaunchSections({
      app: "agy",
      t,
      providers: [official, relay],
      openTerminal,
    });
    expect(section.items.map((item) => item.provider.id)).toEqual([
      "official",
      "relay",
    ]);
    for (const { provider: p, presentation } of section.items) {
      expect(presentation.status).toBeUndefined();
      expect(presentation.tone).toBeUndefined();
      // 没有「使用中」，哪张都能删
      expect(presentation.deleteDisabledReason).toBeUndefined();
      expect(presentation.buttons.map((button) => button.key)).toEqual([
        "openTerminal",
      ]);
      presentation.buttons[0].onClick();
      expect(openTerminal).toHaveBeenLastCalledWith(p);
    }
    expect(section.items[0].presentation.chips.map((chip) => chip.key)).toEqual(
      ["official"],
    );
    expect(section.items[1].presentation.chips).toEqual([]);
  });
});
