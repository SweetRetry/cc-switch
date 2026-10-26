import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import PromptPanel from "@/components/prompts/PromptPanel";
import { promptsApi, type AppId } from "@/lib/api";

const clients: QueryClient[] = [];
function renderViewer(initialApp: AppId = "claude") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  function Viewer() {
    const [app, setApp] = useState(initialApp);
    return (
      <PromptPanel
        appId={app}
        apps={["claude", "codex", "pi"]}
        onAppChange={setApp}
      />
    );
  }
  return render(
    <QueryClientProvider client={client}>
      <Viewer />
    </QueryClientProvider>,
  );
}

function mockPaths() {
  return vi
    .spyOn(promptsApi, "getFileLocation")
    .mockImplementation(async (app) => {
      const path =
        app === "claude"
          ? ".claude/CLAUDE.md"
          : app === "codex"
            ? ".codex/AGENTS.md"
            : ".pi/agent/AGENTS.md";
      return { path: `/Users/test/${path}`, displayPath: `~/${path}` };
    });
}

afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
  vi.restoreAllMocks();
});

describe("prompt file viewer", () => {
  it("shows the selected app's live file as read-only and switches files through the app picker", async () => {
    mockPaths();
    vi.spyOn(promptsApi, "getCurrentFileContent").mockImplementation(
      async (app) =>
        app === "claude"
          ? "# Claude\nUse concise answers.\n"
          : "# Codex\nRun tests.\n",
    );
    const library = vi.spyOn(promptsApi, "getPrompts");
    const user = userEvent.setup();
    renderViewer();
    expect(await screen.findByRole("textbox")).toHaveValue(
      "# Claude\nUse concise answers.\n",
    );
    expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
    expect(screen.getByText("~/.claude/CLAUDE.md")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /prompts.appLabel/ }));
    await user.click(screen.getByRole("button", { name: "Codex" }));
    await waitFor(() =>
      expect(screen.getByRole("textbox")).toHaveValue("# Codex\nRun tests.\n"),
    );
    expect(screen.getByText("~/.codex/AGENTS.md")).toBeInTheDocument();
    expect(library).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "prompts.add" }),
    ).not.toBeInTheDocument();
  });

  it("refreshes external edits and copies the exact current file content", async () => {
    mockPaths();
    const read = vi
      .spyOn(promptsApi, "getCurrentFileContent")
      .mockResolvedValue("original\n");
    const user = userEvent.setup();
    const clipboard = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue();
    renderViewer();
    expect(await screen.findByRole("textbox")).toHaveValue("original\n");
    read.mockResolvedValue("# Edited externally\n\nKeep spacing.\n");
    await user.click(screen.getByRole("button", { name: "common.refresh" }));
    await waitFor(() =>
      expect(screen.getByRole("textbox")).toHaveValue(
        "# Edited externally\n\nKeep spacing.\n",
      ),
    );
    await user.click(
      screen.getByRole("button", { name: "prompts.copyContent" }),
    );
    expect(clipboard).toHaveBeenCalledWith(
      "# Edited externally\n\nKeep spacing.\n",
    );
  });

  it.each([null, ""])(
    "distinguishes an absent file from an empty file (%s)",
    async (content) => {
      mockPaths();
      vi.spyOn(promptsApi, "getCurrentFileContent").mockResolvedValue(content);
      renderViewer("pi");
      expect(
        await screen.findByText(
          content === null ? "prompts.fileMissing" : "prompts.fileEmpty",
        ),
      ).toBeInTheDocument();
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "prompts.copyContent" }),
      ).toBeDisabled();
      expect(
        screen.queryByText("pi.prompts.systemTab"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("pi.prompts.templatesTab"),
      ).not.toBeInTheDocument();
    },
  );

  it("shows read errors and recovers after refresh", async () => {
    mockPaths();
    const read = vi
      .spyOn(promptsApi, "getCurrentFileContent")
      .mockRejectedValue(new Error("Permission denied"));
    const user = userEvent.setup();
    renderViewer();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Permission denied",
    );
    expect(
      screen.getByRole("button", { name: "prompts.copyContent" }),
    ).toBeDisabled();
    read.mockResolvedValue("Recovered prompt");
    await user.click(
      screen.getAllByRole("button", { name: "common.refresh" })[0],
    );
    expect(await screen.findByRole("textbox")).toHaveValue("Recovered prompt");
  });
});
