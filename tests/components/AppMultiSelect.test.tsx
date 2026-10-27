import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  AppMultiSelect,
  type AppSelectState,
} from "@/components/common/AppMultiSelect";
import type { McpAppId } from "@/config/appConfig";

const APPS: McpAppId[] = ["claude", "codex", "pi"];

function setup(states: Record<McpAppId, AppSelectState>) {
  const onToggle = vi.fn();
  const onSetAll = vi.fn();
  render(
    <AppMultiSelect
      name="context7"
      appIds={APPS}
      states={states}
      onToggle={onToggle}
      onSetAll={onSetAll}
    />,
  );
  return { onToggle, onSetAll };
}

describe("AppMultiSelect", () => {
  it("shows the not-enabled label when no app is on", () => {
    setup({ claude: "off", codex: "off", pi: "off" } as never);
    expect(screen.getByRole("button", { name: "context7" })).toHaveTextContent(
      "mcpPage.noneEnabled",
    );
  });

  it("toggles one app and sets all, keeping the menu open", async () => {
    const user = userEvent.setup();
    const { onToggle, onSetAll } = setup({
      claude: "on",
      codex: "off",
      pi: "fail",
    } as never);
    await user.click(screen.getByRole("button", { name: "context7" }));
    await user.click(screen.getAllByRole("checkbox")[1]);
    expect(onToggle).toHaveBeenCalledWith("codex");
    await user.click(screen.getByText("mcpPage.enableEverywhere"));
    expect(onSetAll).toHaveBeenCalledWith(true);
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
  });

  it("disables the bulk button that is already satisfied", async () => {
    const user = userEvent.setup();
    setup({ claude: "on", codex: "on", pi: "on" } as never);
    await user.click(screen.getByRole("button", { name: "context7" }));
    expect(screen.getByText("mcpPage.enableEverywhere")).toBeDisabled();
    expect(screen.getByText("mcpPage.disableEverywhere")).toBeEnabled();
  });
});
