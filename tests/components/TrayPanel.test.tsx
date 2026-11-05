import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TrayPanel } from "@/tray-panel/TrayPanel";
import {
  CHANGED_EVENT,
  SHOW_EVENT,
  trayPanelApi,
  type PanelPlacement,
  type PanelTexts,
  type TrayPanelState,
} from "@/tray-panel/api";
import { emitTauriEvent } from "../msw/tauriMocks";
import { createTestQueryClient } from "../utils/testQueryClient";

vi.mock("@/tray-panel/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/tray-panel/api")>()),
  trayPanelApi: {
    state: vi.fn(),
    placement: vi.fn(),
    layout: vi.fn().mockResolvedValue(undefined),
    action: vi.fn().mockResolvedValue(undefined),
    hide: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock("@/tray-panel/UsageSummary", () => ({ UsageSummary: () => null }));

const texts: PanelTexts = {
  switchProvider: "Switch provider",
  inUse: "In use",
  openMain: "Open main window",
  quit: "Quit",
  settings: "Settings",
  openPanel: "Open panel",
  resetsIn: "Resets in {when}",
  durationDays: "{n}d",
  durationHours: "{n}h",
  durationMinutes: "{n}m",
  durationSep: " ",
  resetCredits: "{count} resets",
};

const state: TrayPanelState = {
  problems: [],
  feedback: null,
  apps: [
    {
      app: "claude",
      name: "Claude Code",
      current: "default",
      attention: null,
      quota: null,
      rows: [],
    },
  ],
};

const placement: PanelPlacement = {
  seq: 1,
  platform: "macos",
  scaleFactor: 1,
  side: "left",
  edge: "top",
  boundsTop: 0,
  boundsBottom: 1000,
  mainWidth: 320,
  subWidth: 300,
  gap: 8,
  radius: 12,
  layout: "floating",
  glass: "native",
  texts,
};

const FEEDBACK = "Codex switched to X. Restart Codex to apply";
const appRow = () => screen.queryByRole("button", { name: /Claude Code/ });

function renderPanel() {
  const client = createTestQueryClient();
  return render(<TrayPanel />, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}

async function showAgain(seq: number) {
  await act(async () => {
    emitTauriEvent(SHOW_EVENT, { ...placement, seq });
  });
}

describe("TrayPanel while its data is slow", () => {
  beforeEach(() => {
    vi.mocked(trayPanelApi.state).mockResolvedValue(state);
    vi.mocked(trayPanelApi.placement).mockResolvedValue(placement);
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete document.documentElement.dataset.glass;
    delete document.documentElement.dataset.layout;
  });

  it("shows Open main window and Quit before the panel data arrives", async () => {
    let resolveState: (value: TrayPanelState) => void = () => {};
    vi.mocked(trayPanelApi.state).mockReturnValue(
      new Promise((resolve) => {
        resolveState = resolve;
      }),
    );
    renderPanel();

    const quit = await screen.findByRole("button", { name: "Quit" });
    expect(
      screen.getByRole("button", { name: "Open main window" }),
    ).toBeInTheDocument();
    expect(appRow()).toBeNull();
    fireEvent.click(quit);
    expect(trayPanelApi.action).toHaveBeenCalledWith("quit");

    await act(async () => resolveState(state));
    expect(appRow()).toBeInTheDocument();
  });

  it("waits briefly on a cold open so fast data is in the first frame", async () => {
    vi.mocked(trayPanelApi.state).mockImplementation(
      () =>
        new Promise((resolve) => {
          window.setTimeout(() => resolve(state), 30);
        }),
    );
    renderPanel();

    // Quit appears only together with the app row: the frame never showed without it.
    await screen.findByRole("button", { name: "Quit" });
    expect(appRow()).toBeInTheDocument();
  });

  it("shows the previous content at once when it pops up again and the data is slow", async () => {
    renderPanel();
    await screen.findByRole("button", { name: /Claude Code/ });

    vi.mocked(trayPanelApi.state).mockReturnValue(new Promise(() => {}));
    await showAgain(2);

    expect(appRow()).toBeInTheDocument();
  });

  it("drops the one-off feedback line when it pops up again with the previous content", async () => {
    vi.mocked(trayPanelApi.state).mockResolvedValue({
      ...state,
      feedback: FEEDBACK,
    });
    renderPanel();
    expect(await screen.findByText(FEEDBACK)).toBeInTheDocument();

    vi.mocked(trayPanelApi.state).mockReturnValue(new Promise(() => {}));
    await showAgain(2);

    expect(screen.queryByText(FEEDBACK)).toBeNull();
    expect(appRow()).toBeInTheDocument();
  });

  it("keeps a feedback line that arrived while the panel was hidden", async () => {
    renderPanel();
    await screen.findByRole("button", { name: /Claude Code/ });

    vi.mocked(trayPanelApi.state).mockResolvedValue({
      ...state,
      feedback: FEEDBACK,
    });
    await act(async () => {
      emitTauriEvent(CHANGED_EVENT, null);
    });
    await showAgain(2);

    expect(await screen.findByText(FEEDBACK)).toBeInTheDocument();
  });

  it("ignores a mount-time placement older than a show event already handled", async () => {
    let resolvePlacement: (value: PanelPlacement) => void = () => {};
    vi.mocked(trayPanelApi.placement).mockReturnValue(
      new Promise((resolve) => {
        resolvePlacement = resolve;
      }),
    );
    renderPanel();
    await act(async () => {});
    await showAgain(2);
    await screen.findByRole("button", { name: /Claude Code/ });

    await act(async () => resolvePlacement(placement));

    expect(trayPanelApi.state).toHaveBeenCalledTimes(1);
  });
});
