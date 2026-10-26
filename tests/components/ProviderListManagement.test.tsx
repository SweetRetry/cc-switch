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
vi.mock("@/components/providers/ProviderDetail", () => ({
  ProviderDetail: ({
    provider,
    onEdit,
  }: {
    provider: Provider;
    onEdit: (provider: Provider) => void;
  }) => <button onClick={() => onEdit(provider)}>Edit {provider.name}</button>,
}));

describe("Provider list management", () => {
  it.each([{ ctrlKey: true }, { metaKey: true }])(
    "selects a provider from the list to edit it and leaves the find shortcut available (%o)",
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
      expect(screen.getByRole("button", { name: /^Alpha/ })).toBeVisible();
      fireEvent.click(screen.getByRole("button", { name: /^Beta/ }));
      fireEvent.click(screen.getByRole("button", { name: "Edit Beta" }));
      expect(onEdit).toHaveBeenCalledWith(beta);
    },
  );

  it("switches Claude providers from the row radio without leaving the list", () => {
    const alpha: Provider = { id: "alpha", name: "Alpha", settingsConfig: {} };
    const beta: Provider = { id: "beta", name: "Beta", settingsConfig: {} };
    const onSwitch = vi.fn();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <ProviderList
          providers={{ alpha, beta }}
          currentProviderId="alpha"
          appId="claude"
          onSwitch={onSwitch}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onDuplicate={vi.fn()}
          onOpenWebsite={vi.fn()}
        />
      </QueryClientProvider>,
    );
    const radios = screen.getAllByRole("radio");
    expect(radios.map((radio) => radio.getAttribute("aria-checked"))).toEqual([
      "true",
      "false",
    ]);
    fireEvent.click(radios[1]);
    expect(onSwitch).toHaveBeenCalledWith(beta);
    // 点名字只是查看详情，不切换
    fireEvent.click(screen.getByRole("button", { name: /^Alpha/ }));
    expect(onSwitch).toHaveBeenCalledTimes(1);
  });
});
