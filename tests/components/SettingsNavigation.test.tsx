import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { Sidebar } from "@/components/shell/Sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { http, HttpResponse } from "msw";
import { server } from "../msw/server";
import { TooltipProvider } from "@/components/ui/tooltip";
import { parseView, readStoredView, storeView } from "@/lib/navigation";

vi.mock("@tauri-apps/api/app", () => ({
  getVersion: async () => "4.0.20",
}));
vi.mock("@/contexts/UpdateContext", () => ({
  useUpdate: () => ({ hasUpdate: false, isChecking: false }),
}));
vi.mock("@/hooks/useSidebarStatus", () => ({
  useSidebarStatus: () => ({
    todayCost: 0,
    todayTokens: 0,
    todayRequests: 0,
    todayHitRate: 0,
  }),
}));

function renderPage(page: "settings" | "data") {
  const onSelectPage = vi.fn();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Sidebar
            activeApp="claude"
            view={page}
            visibleApps={{
              claude: true,
              codex: true,
              opencode: true,
              pi: true,
              agy: true,
            }}
            onSelectApp={vi.fn()}
            onSelectPage={onSelectPage}
          />
          <SettingsPage page={page} />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
  return onSelectPage;
}

describe("Settings navigation", () => {
  afterEach(() => vi.unstubAllGlobals());

  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn((media: string) => ({
        matches: false,
        media,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
    server.use(
      http.post("http://tauri.local/set_window_theme", () =>
        HttpResponse.json(null),
      ),
      http.post("http://tauri.local/list_backup_locations", () =>
        HttpResponse.json([]),
      ),
      http.post("http://tauri.local/list_db_backups", () =>
        HttpResponse.json([]),
      ),
      http.post("http://tauri.local/get_log_config", () =>
        HttpResponse.json({ enabled: true, level: "info" }),
      ),
    );
  });
  it("shows preferences and about together while keeping the main sidebar", async () => {
    const navigate = renderPage("settings");
    expect(
      await screen.findByRole("combobox", { name: "settings.language" }),
    ).toBeVisible();
    expect(
      await screen.findByRole("button", { name: "settings.checkForUpdates" }),
    ).toBeVisible();
    const nav = within(screen.getByRole("navigation"));
    expect(nav.getByRole("button", { name: "nav.settings" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(nav.getByRole("button", { name: /^Claude Code/ })).toBeVisible();
    expect(
      nav.queryByRole("button", { name: "nav.back" }),
    ).not.toBeInTheDocument();
    expect(
      nav.queryByRole("button", { name: "settings.sections.about" }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      nav.getByRole("button", { name: "settings.sections.data" }),
    );
    expect(navigate).toHaveBeenCalledWith("data");
  });

  it("opens data as its own selected page with a direct route back to settings", async () => {
    const navigate = renderPage("data");
    expect(
      await screen.findByRole("button", {
        name: "settings.backupManager.createBackup",
      }),
    ).toBeVisible();
    expect(screen.getByText("settings.data.configDir")).toBeVisible();
    expect(
      screen.queryByRole("combobox", { name: "settings.language" }),
    ).not.toBeInTheDocument();
    const nav = within(screen.getByRole("navigation"));
    expect(
      nav.getByRole("button", { name: "settings.sections.data" }),
    ).toHaveAttribute("aria-current", "page");
    fireEvent.click(nav.getByRole("button", { name: "nav.settings" }));
    expect(navigate).toHaveBeenCalledWith("settings");
  });

  it("lists the five latest backups and reveals the rest on demand", async () => {
    const backups = Array.from({ length: 7 }, (_, index) => ({
      filename: `db_backup_2026102${index}_090000.db`,
      sizeBytes: 400 * 1024,
      createdAt: `2026-10-2${index}T09:00:00`,
    }));
    server.use(
      http.post("http://tauri.local/list_db_backups", () =>
        HttpResponse.json(backups),
      ),
    );
    renderPage("data");
    const restoreButtons = await screen.findAllByRole("button", {
      name: /settings\.backupManager\.restore$/,
    });
    expect(restoreButtons).toHaveLength(5);
    fireEvent.click(
      screen.getByRole("button", {
        name: "settings.backupManager.showEarlier",
      }),
    );
    expect(
      screen.getAllByRole("button", {
        name: /settings\.backupManager\.restore$/,
      }),
    ).toHaveLength(7);
  });

  it("restores the data page from the saved main navigation", () => {
    const previous = readStoredView();
    expect(parseView("data")).toBe("data");
    storeView("data");
    expect(readStoredView()).toBe("data");
    storeView(previous);
  });
});
