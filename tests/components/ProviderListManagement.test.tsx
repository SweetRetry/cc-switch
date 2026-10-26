import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { ProviderList } from "@/components/providers/ProviderList";
import type { Provider } from "@/types";

vi.mock("@/hooks/useDragSort", () => ({
  useDragSort: (providers: Record<string, Provider>) => ({
    sortedProviders: Object.values(providers),
    sensors: [],
    handleDragEnd: vi.fn(),
  }),
}));
vi.mock("@/hooks/useStreamCheck", () => ({
  useStreamCheck: () => ({ checkProvider: vi.fn(), isChecking: () => false }),
}));
vi.mock("@/components/providers/ProviderCard", () => ({
  ProviderCard: ({
    provider,
    onEdit,
  }: {
    provider: Provider;
    onEdit: (provider: Provider) => void;
  }) => <button onClick={() => onEdit(provider)}>{provider.name}</button>,
}));

describe("Provider list management", () => {
  it.each([{ ctrlKey: true }, { metaKey: true }])(
    "keeps all providers editable and leaves the find shortcut available (%o)",
    (shortcut) => {
      const alpha: Provider = {
        id: "alpha",
        name: "Alpha",
        settingsConfig: {},
      };
      const beta: Provider = { id: "beta", name: "Beta", settingsConfig: {} };
      const onEdit = vi.fn();
      const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      render(
        <QueryClientProvider client={client}>
          <ProviderList
            providers={{ alpha, beta }}
            currentProviderId="alpha"
            appId="agy"
            onSwitch={vi.fn()}
            onEdit={onEdit}
            onDelete={vi.fn()}
            onDuplicate={vi.fn()}
            onOpenWebsite={vi.fn()}
          />
        </QueryClientProvider>,
      );
      const event = new KeyboardEvent("keydown", {
        key: "f",
        ...shortcut,
        cancelable: true,
      });
      fireEvent(window, event);
      expect(event.defaultPrevented).toBe(false);
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Alpha" })).toBeVisible();
      fireEvent.click(screen.getByRole("button", { name: "Beta" }));
      expect(onEdit).toHaveBeenCalledWith(beta);
    },
  );
});
