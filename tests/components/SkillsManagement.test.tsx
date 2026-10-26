import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InstalledSkill } from "@/lib/api/skills";
import UnifiedSkillsPanel from "@/components/skills/UnifiedSkillsPanel";

const data = vi.hoisted(() => ({ installed: [] as InstalledSkill[] }));
vi.mock("@/components/skills/SkillsStorageSheet", () => ({
  SkillsStorageSheet: () => null,
}));
vi.mock("@/components/skills/SkillRestoreDialog", () => ({
  SkillRestoreDialog: () => null,
}));
vi.mock("@/components/mcp/useVisibleAppIds", () => ({
  useVisibleAppIds: () => ["claude", "codex", "pi"],
}));
vi.mock("@/hooks/useSkills", () => {
  const mutation = () => ({ mutateAsync: vi.fn(), isPending: false });
  return {
    useInstalledSkills: () => ({
      data: data.installed,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
    useSkillBackups: () => ({ data: [], refetch: vi.fn(), isFetching: false }),
    useScanUnmanagedSkills: () => ({ data: [], refetch: vi.fn() }),
    useCheckSkillUpdates: () => ({
      data: { updates: [], failures: [] },
      refetch: vi.fn(),
      isFetching: false,
    }),
    useBulkToggleSkillApp: mutation,
    useDeleteSkillBackup: mutation,
    useImportSkillsFromApps: mutation,
    useRestoreSkillBackup: mutation,
    useToggleSkillApp: mutation,
    useUninstallSkill: mutation,
    useUpdateSkill: mutation,
  };
});

beforeEach(() => {
  data.installed = [
    {
      id: "local:alpha",
      name: "Alpha Skill",
      directory: "alpha",
      apps: { claude: true, codex: false, opencode: false, pi: false },
      installedAt: 1,
      updatedAt: 1,
    },
  ];
});

describe("Skills management", () => {
  it("lists installed Skills without an add or import entry", () => {
    render(<UnifiedSkillsPanel />);
    expect(screen.getByText("Alpha Skill")).toBeVisible();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "skillsPage.addMenu.zip" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "skillsPage.addMenu.import" }),
    ).not.toBeInTheDocument();
  });

  it("clears an installed-Skill search without navigating away", async () => {
    render(<UnifiedSkillsPanel />);
    await userEvent.type(
      screen.getByRole("textbox", { name: "skills.installedSearchAriaLabel" }),
      "zzz",
    );
    expect(screen.getByText("skillsPage.noMatch")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "skillsPage.searchInDiscover" }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "mcpPage.clearSearch" }),
    );
    expect(screen.getByText("Alpha Skill")).toBeVisible();
  });

  it("explains how to add Skills when none are installed", () => {
    data.installed = [];
    render(<UnifiedSkillsPanel />);
    expect(screen.getByText("skillsPage.emptyTitle")).toBeVisible();
    expect(screen.getByText("skillsPage.emptyBody")).toBeVisible();
  });
});
