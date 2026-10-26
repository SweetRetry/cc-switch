import { CSS } from "@dnd-kit/utilities";
import { DndContext, closestCenter, type Modifier } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useCallback,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import type { Provider } from "@/types";
import { getOpencodeDeclaredModels } from "@/components/providers/forms/helpers/opencodeFormUtils";
import type { AppId } from "@/lib/api";
import { providersApi } from "@/lib/api/providers";
import {
  extractErrorMessage,
  translatePiProviderMutationError,
} from "@/utils/errorUtils";
import { useDragSort } from "@/hooks/useDragSort";
import { useStreamCheck } from "@/hooks/useStreamCheck";
import { ProviderDetail } from "@/components/providers/ProviderDetail";
import { Button } from "@/components/ui/button";
import { HoverTip } from "@/components/ui/hover-tip";
import { Switch } from "@/components/ui/switch";
import { GripVertical, SquareTerminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProviderEmptyState } from "@/components/providers/ProviderEmptyState";
import {
  useCurrentOmoProviderId,
  useCurrentOmoSlimProviderId,
} from "@/lib/query/omo";
import { Notice } from "@/components/ui/notice";
import { usePiCurrentState } from "@/lib/query/pi";
import { isPiFamilyApp } from "@/config/appConfig";
import {
  buildAdditiveSections,
  buildLaunchSections,
  buildDirectSections,
  type CardPresentation,
  type ProviderSection,
} from "@/components/providers/presentation";

const verticalDragModifiers: Modifier[] = [
  ({ transform }) => ({ ...transform, x: 0 }),
];

interface ProviderListProps {
  providers: Record<string, Provider>;
  currentProviderId: string;
  appId: AppId;
  /** 直连切换 / 共存式的添加 / Pi 的启用 / Claude Desktop 的切换 */
  onSwitch: (provider: Provider) => void;
  onEdit: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
  onRemoveFromConfig?: (provider: Provider) => void;
  onDisableOmo?: () => void;
  onDisableOmoSlim?: () => void;
  onDuplicate: (provider: Provider) => void;
  onConfigureUsage?: (provider: Provider) => void;
  onOpenWebsite: (url: string) => void;
  onOpenTerminal?: (provider: Provider) => void;
  onCreate?: () => void;
  /** OpenClaw 的默认模型、Hermes 的当前供应商 */
  onSetAsDefault?: (provider: Provider, modelId?: string) => void;
  isLoading?: boolean;
}

export function ProviderList({
  providers,
  currentProviderId,
  appId,
  onSwitch,
  onEdit,
  onDelete,
  onRemoveFromConfig,
  onDisableOmo,
  onDisableOmoSlim,
  onDuplicate,
  onConfigureUsage,
  onOpenWebsite,
  onOpenTerminal,
  onCreate,
  onSetAsDefault,
  isLoading = false,
}: ProviderListProps) {
  const { t } = useTranslation();
  const { checkProvider, isChecking } = useStreamCheck(appId);
  const { sortedProviders, sensors, handleDragEnd } = useDragSort(
    providers,
    appId,
  );

  const { data: opencodeLiveIds, isPending: isOpencodeLiveIdsPending } =
    useQuery({
      queryKey: ["opencodeLiveProviderIds"],
      queryFn: () => providersApi.getOpenCodeLiveProviderIds(),
      enabled: appId === "opencode",
    });
  const { data: opencodeDefaultModel } = useQuery({
    queryKey: ["opencodeDefaultModel"],
    queryFn: () => providersApi.getOpenCodeDefaultModel(),
    enabled: appId === "opencode",
  });
  const isOpenCode = appId === "opencode";
  const { data: currentOmoId } = useCurrentOmoProviderId(isOpenCode);
  const { data: currentOmoSlimId } = useCurrentOmoSlimProviderId(isOpenCode);
  const {
    data: piCurrentState,
    isSuccess: isPiCurrentStateSuccess,
    isPending: isPiCurrentStatePending,
    isError: isPiCurrentStateError,
    error: piCurrentStateError,
  } = usePiCurrentState(isPiFamilyApp(appId), "pi");
  const isPiStateReady = !isPiFamilyApp(appId) || isPiCurrentStateSuccess;
  // 累加式应用要等 live 里有哪些供应商读回来（成功或失败）才知道卡片该进哪个分区；
  // 在那之前按加载中画骨架，不然卡片先全落进「可添加」，读回来再整体搬到「已添加」。
  // 一张卡都没有时不用等，直接出空状态
  const isLiveMembershipPending =
    (appId === "opencode" && isOpencodeLiveIdsPending) ||
    (isPiFamilyApp(appId) && isPiCurrentStatePending);

  const isInConfig = useCallback(
    (provider: Provider): boolean => {
      switch (appId) {
        case "opencode":
          return opencodeLiveIds?.includes(provider.id) ?? false;

        case "pi":
          return (
            isPiStateReady &&
            (piCurrentState?.enabledProviderIds.includes(provider.id) ?? false)
          );
        default:
          return true;
      }
    },
    [appId, opencodeLiveIds, isPiStateReady, piCurrentState],
  );

  const handleTest = useCallback(
    (provider: Provider) => {
      checkProvider(provider.id, provider.name);
    },
    [checkProvider],
  );

  const queryClient = useQueryClient();
  const importMutation = useMutation({
    mutationFn: async (): Promise<boolean> => {
      if (appId === "opencode") {
        return (await providersApi.importOpenCodeFromLive()) > 0;
      }

      return providersApi.importDefault(appId);
    },
    onSuccess: (imported) => {
      if (imported) {
        queryClient.invalidateQueries({ queryKey: ["providers", appId] });

        toast.success(t("provider.importCurrentDescription"));
      } else {
        toast.info(t("provider.noProviders"));
      }
    },
    onError: (error: unknown) => {
      // Tauri invoke 的 reject 值是后端序列化出的纯字符串而非 Error 对象，
      // 取 .message 只会得到 undefined（空 toast）。
      toast.error(extractErrorMessage(error) || t("settings.importFailed"));
      // 导入失败前也可能已产生需要上屏的副作用：GrokBuild 官方登录态下点
      // 导入，命令层会先补种官方条目、随后才因 live 不可导入而报错。
      queryClient.invalidateQueries({ queryKey: ["providers", appId] });
    },
  });

  const sections = useMemo<ProviderSection[]>(() => {
    if (appId === "claude" || appId === "codex") {
      return buildDirectSections({
        app: appId,
        t,
        providers: sortedProviders,
        currentProviderId,
        onSwitch,
      });
    }
    if (appId === "agy") {
      return buildLaunchSections({
        app: appId,
        t,
        providers: sortedProviders,
        openTerminal: (provider) => onOpenTerminal?.(provider),
      });
    }
    const defaultPrimary =
      (appId === "opencode" ? opencodeDefaultModel : null) ?? "";
    const slash = defaultPrimary.indexOf("/");
    return buildAdditiveSections({
      app: appId,
      t,
      providers: sortedProviders,
      isInConfig,
      currentOmoId,
      currentOmoSlimId,
      defaultModel:
        slash > 0
          ? {
              providerId: defaultPrimary.slice(0, slash),
              model: defaultPrimary.slice(slash + 1),
            }
          : null,
      defaultModelOptions: (provider) =>
        getOpencodeDeclaredModels(provider.id, provider.settingsConfig),
      piStateUnavailable: isPiFamilyApp(appId) && !isPiStateReady,
      actions: {
        add: onSwitch,
        remove: (provider) =>
          onRemoveFromConfig
            ? onRemoveFromConfig(provider)
            : onDelete(provider),
        disableOmo: (provider) =>
          provider.category === "omo-slim"
            ? onDisableOmoSlim?.()
            : onDisableOmo?.(),
        setDefault: (provider, modelId) => onSetAsDefault?.(provider, modelId),
      },
    });
  }, [
    appId,
    t,
    sortedProviders,
    onSwitch,
    onOpenTerminal,
    opencodeDefaultModel,
    isInConfig,
    currentOmoId,
    currentOmoSlimId,
    isPiStateReady,
    currentProviderId,
    onRemoveFromConfig,
    onDelete,
    onDisableOmo,
    onDisableOmoSlim,
    onSetAsDefault,
  ]);

  const piStateRawError =
    isPiFamilyApp(appId) && isPiCurrentStateError
      ? extractErrorMessage(piCurrentStateError)
      : "";
  const piStateError =
    translatePiProviderMutationError(piStateRawError, t) || piStateRawError;
  const piStateErrorNotice =
    isPiFamilyApp(appId) && isPiCurrentStateError ? (
      <Notice
        tone="warning"
        title={t(`${appId}.current.readFailed`, {
          defaultValue: "无法读取 Pi 当前配置",
        })}
      >
        {t(`${appId}.current.stateUnavailableHint`)}
        {piStateError ? ` ${piStateError}` : ""}
      </Notice>
    ) : null;

  if (isLoading || (isLiveMembershipPending && sortedProviders.length > 0)) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-[60px] w-full rounded-panel border border-dashed border-border bg-subtle"
          />
        ))}
      </div>
    );
  }

  if (sortedProviders.length === 0) {
    return (
      <div className="space-y-4">
        {piStateErrorNotice}
        <ProviderEmptyState
          appId={appId}
          onCreate={isPiFamilyApp(appId) ? undefined : onCreate}
          onImport={
            isPiFamilyApp(appId) ? undefined : () => importMutation.mutate()
          }
        />
      </div>
    );
  }

  // 「当前」只用来决定额度显示和自动刷新：Pi 没有当前项，OMO / Hermes 各看自己的当前项；
  // Antigravity 没有「启用」，每张卡都随时能打开，额度一律照常显示
  const isCurrentFor = (provider: Provider) => {
    if (isPiFamilyApp(appId)) return false;
    if (appId === "agy") return true;
    if (provider.category === "omo") return provider.id === currentOmoId;
    if (provider.category === "omo-slim")
      return provider.id === currentOmoSlimId;

    return provider.id === currentProviderId;
  };

  // 列表顺序固定按用户排的顺序，不按「使用中 / 已添加」分组：切换后行不跳位置
  const presentationOf = new Map(
    sections.flatMap((section) =>
      section.items.map((item) => [item.provider.id, item.presentation]),
    ),
  );
  const rows = sortedProviders.map((provider) => ({
    provider,
    presentation: presentationOf.get(provider.id) ?? { chips: [], buttons: [] },
  }));
  const isActive = (provider: Provider) =>
    appId === "claude" || appId === "codex"
      ? provider.id === currentProviderId
      : appId !== "agy" && isInConfig(provider);
  const control: RowControl =
    appId === "claude" || appId === "codex"
      ? "radio"
      : appId === "agy"
        ? "launch"
        : "switch";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {piStateErrorNotice}
      <DndContext
        sensors={sensors}
        modifiers={verticalDragModifiers}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={rows.map((row) => row.provider.id)}
          strategy={verticalListSortingStrategy}
        >
          <div
            role="list"
            aria-label={t("providerDetail.listLabel", {
              app: t(`apps.${appId}`),
            })}
            className="mx-auto min-h-0 w-full max-w-5xl flex-1 space-y-0.5 overflow-y-auto pb-12"
          >
            {rows.map((row) => (
              <SortableProviderRow
                key={row.provider.id}
                provider={row.provider}
                presentation={row.presentation}
                control={control}
                active={isActive(row.provider)}
              >
                <ProviderDetail
                  provider={row.provider}
                  appId={appId}
                  presentation={row.presentation}
                  isCurrent={isCurrentFor(row.provider)}
                  isInConfig={isInConfig(row.provider)}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  onConfigureUsage={
                    onConfigureUsage
                      ? (item) => onConfigureUsage(item)
                      : () => undefined
                  }
                  onOpenWebsite={onOpenWebsite}
                  // Antigravity 的「打开终端」在列表行尾，「更多」菜单里不再重复
                  onOpenTerminal={appId === "agy" ? undefined : onOpenTerminal}
                  onTest={handleTest}
                  isTesting={isChecking(row.provider.id)}
                />
              </SortableProviderRow>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

/** 行首控件：Claude / Codex 单选当前那家；OpenCode / Pi 开关启用；Antigravity 行尾打开终端。 */
type RowControl = "radio" | "switch" | "launch";

interface SortableProviderRowProps {
  provider: Provider;
  presentation: CardPresentation;
  control: RowControl;
  active: boolean;
  children: ReactNode;
}

function SortableProviderRow({
  provider,
  presentation,
  control,
  active,
  children,
}: SortableProviderRowProps) {
  const { t } = useTranslation();
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: provider.id });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    position: "relative",
    zIndex: isDragging ? 10 : undefined,
  };
  // 列表算好的主操作：直连的「切换」、共存式的「添加 / 移除 / 启用 / 停用」、启动器的「打开终端」
  const action = presentation.buttons[0];

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="listitem"
      className={cn(
        "group relative flex items-start rounded-control transition-colors",
        isDragging ? "bg-selected" : "hover:bg-subtle",
      )}
    >
      {control === "radio" && (
        <button
          type="button"
          role="radio"
          aria-checked={active}
          aria-label={t("providerDetail.useProvider", { name: provider.name })}
          title={action?.disabledReason}
          disabled={!active && (!action || Boolean(action.disabledReason))}
          onClick={() => !active && action?.onClick()}
          className="flex h-11 w-10 shrink-0 items-center justify-center rounded-control disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span
            aria-hidden="true"
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded-full border transition-colors duration-150 ease-out",
              active ? "border-fg-1" : "border-border-strong",
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full bg-fg-1 transition-transform duration-150 ease-out",
                active ? "scale-100" : "scale-0",
              )}
            />
          </span>
        </button>
      )}
      {control === "switch" && (
        <span
          className="flex h-11 w-12 shrink-0 items-center justify-center"
          title={action?.disabledReason}
        >
          <Switch
            checked={action?.key === "remove" || action?.key === "disable"}
            disabled={!action || Boolean(action.disabledReason)}
            onCheckedChange={() => action?.onClick()}
            aria-label={t("providerDetail.enableProvider", {
              name: provider.name,
            })}
          />
        </span>
      )}
      <button
        type="button"
        aria-label={t("providerDetail.reorder", { name: provider.name })}
        className="absolute start-0 top-4 flex h-4 w-3 cursor-grab touch-none items-center justify-center text-fg-3 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
      <div
        className={cn(
          "flex min-w-0 flex-1 pe-2",
          control === "launch" && "ps-3",
        )}
      >
        {children}
      </div>
      {control === "launch" && action && (
        <HoverTip content={action.label}>
          <Button
            variant="quiet"
            size="icon-compact"
            className="me-1 mt-2"
            aria-label={t("providerCard.action.openTerminal", {
              name: provider.name,
            })}
            onClick={action.onClick}
          >
            <SquareTerminal className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </HoverTip>
      )}
    </div>
  );
}
