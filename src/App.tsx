import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { invoke } from "@tauri-apps/api/core";
import { useQueryClient } from "@tanstack/react-query";
import { ChartColumn, Plus } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { Provider, VisibleApps } from "@/types";
import { KNOWN_APP_TYPES, type AppTypeFilter } from "@/types/usage";
import type { EnvConflict } from "@/types/env";
import type { SubscriptionQuota } from "@/types/subscription";
import {
  providersQueryOptions,
  useProvidersQuery,
  useSettingsQuery,
} from "@/lib/query";
import {
  piApi,
  providersApi,
  settingsApi,
  type AppId,
  type ProviderSwitchEvent,
} from "@/lib/api";
import { checkAllEnvConflicts, checkEnvConflicts } from "@/lib/api/env";
import { useProviderActions } from "@/hooks/useProviderActions";
import type { ProviderEditorSave } from "@/lib/api/providers";
import { useUsageCacheBridge } from "@/hooks/useUsageCacheBridge";
import {
  useTrayAppPageSeen,
  useTrayNavigation,
} from "@/hooks/useTrayNavigation";
import { useTauriEvent } from "@/hooks/useTauriEvent";
import { useLastValidValue } from "@/hooks/useLastValidValue";
import {
  extractErrorMessage,
  translatePiProviderMutationError,
} from "@/utils/errorUtils";
import { deepClone } from "@/utils/deepClone";
import { isLinux, isWindows } from "@/lib/platform";
import {
  APP_STORAGE_KEY,
  appPageBelongsTo,
  isAppPage,
  readStoredView,
  sharedFeatureAppOf,
  storeView,
  type GlobalPage,
  type SettingsSection,
  type View,
} from "@/lib/navigation";
import { Sidebar } from "@/components/shell/Sidebar";
import { NewLayoutDialog } from "@/components/shell/NewLayoutDialog";
import {
  AppPageHeader,
  WindowControlsContext,
} from "@/components/shell/AppPageHeader";
import { WindowControls } from "@/components/shell/WindowControls";
import { APP_DISPLAY_NAME, AppGlyph } from "@/components/shell/AppGlyph";
import { PAGE_FRAME, PAGE_HEADER_INSET } from "@/components/shell/pageLayout";
import { ProviderList } from "@/components/providers/ProviderList";
import { AddProviderDialog } from "@/components/providers/AddProviderDialog";
import {
  hasOpencodeDefinition,
  isNativeOpencodeConfig,
} from "@/components/providers/forms/helpers/opencodeFormUtils";
import { EditProviderDialog } from "@/components/providers/EditProviderDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { OpenTerminalDialog } from "@/components/providers/OpenTerminalDialog";
import { discardUnsavedChanges, hasUnsavedChanges } from "@/lib/unsavedChanges";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { AppsPage } from "@/components/apps/AppsPage";
import {
  checkToolUpdatesInBackground,
  useToolUpdatesAvailable,
} from "@/components/apps/useToolManagement";
import { UsagePage } from "@/components/usage/UsagePage";
import { EnvWarningBanner } from "@/components/env/EnvWarningBanner";
import UsageScriptModal from "@/components/UsageScriptModal";
import UnifiedMcpPanel from "@/components/mcp/UnifiedMcpPanel";
import PromptPanel from "@/components/prompts/PromptPanel";
import { PROMPT_APP_IDS } from "@/lib/query/prompts";
import UnifiedSkillsPanel from "@/components/skills/UnifiedSkillsPanel";
import { DeepLinkImportDialog } from "@/components/DeepLinkImportDialog";
import { FirstRunNoticeDialog } from "@/components/FirstRunNoticeDialog";
import { WhatsNewNotice } from "@/components/WhatsNewDialog";
import { Button } from "@/components/ui/button";
import {
  useDisableCurrentOmo,
  useDisableCurrentOmoSlim,
} from "@/lib/query/omo";
import { invalidatePiProviderCaches, usePiCurrentState } from "@/lib/query/pi";
import {
  APP_IDS,
  normalizeVisibleApps,
  isPiFamilyApp,
  orderAppIds,
} from "@/config/appConfig";
import type { PiFamilyAppId } from "@/lib/api/pi";

interface SyncStatusUpdatedPayload {
  source?: string;
  status?: string;
  error?: string;
}

const getInitialApp = (): AppId => {
  const saved = localStorage.getItem(APP_STORAGE_KEY) as AppId | null;
  if (saved && APP_IDS.includes(saved)) {
    return saved;
  }
  return "claude";
};

function App() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [activeApp, setActiveApp] = useState<AppId>(getInitialApp);
  const sharedFeatureApp = sharedFeatureAppOf(activeApp);
  const [currentView, setCurrentView] = useState<View>(readStoredView);
  const [promptsApp, setPromptsApp] = useState<AppId>(() =>
    PROMPT_APP_IDS.includes(sharedFeatureApp) ? sharedFeatureApp : "claude",
  );
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [mcpManagementBusy, setMcpManagementBusy] = useState(false);
  const [skillsNavigationBusy, setSkillsNavigationBusy] = useState(false);
  const [promptNavigationBusy, setPromptNavigationBusy] = useState(false);

  useEffect(() => {
    storeView(currentView);
  }, [currentView]);

  const { data: settingsData } = useSettingsQuery();
  // Windows 一律去掉系统标题栏，用页头里的应用内窗口按钮；Linux 由设置决定
  const useAppWindowControls =
    isWindows() || (isLinux() && (settingsData?.useAppWindowControls ?? false));
  const visibleApps = useMemo<VisibleApps>(
    () => normalizeVisibleApps(settingsData?.visibleApps),
    [settingsData?.visibleApps],
  );

  const getFirstVisibleApp = (): AppId => {
    return (
      orderAppIds(settingsData?.appOrder).find((app) => visibleApps[app]) ??
      "claude"
    );
  };

  useEffect(() => {
    if (!visibleApps[activeApp]) {
      setActiveApp(getFirstVisibleApp());
    }
  }, [visibleApps, activeApp]);

  // 启动后把其他可见应用的供应商列表预取进缓存：第一次切过去直接有数据，不先画骨架
  const providersPrefetchedRef = useRef(false);
  useEffect(() => {
    if (!settingsData || providersPrefetchedRef.current) return;
    providersPrefetchedRef.current = true;
    for (const app of APP_IDS) {
      if (app !== activeApp && visibleApps[app]) {
        void queryClient.prefetchQuery(providersQueryOptions(app));
      }
    }
  }, [settingsData, visibleApps, activeApp, queryClient]);

  // 「启动时检查应用更新」（默认关）：打开了才在后台查一次，查到新版本侧栏「应用」上出现圆点
  const checkToolUpdatesOnStartup =
    settingsData?.checkToolUpdatesOnStartup ?? false;
  const toolUpdatesAvailable = useToolUpdatesAvailable();
  const startupToolCheckDoneRef = useRef(false);
  useEffect(() => {
    if (!checkToolUpdatesOnStartup || startupToolCheckDoneRef.current) return;
    startupToolCheckDoneRef.current = true;
    void checkToolUpdatesInBackground();
  }, [checkToolUpdatesOnStartup]);

  // 应用专属页（工作区、记忆…）只属于它的应用；换了应用就回到供应商页
  useEffect(() => {
    if (isAppPage(currentView) && !appPageBelongsTo(currentView, activeApp)) {
      setCurrentView("providers");
    }
  }, [activeApp, currentView]);

  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [usageProvider, setUsageProvider] = useState<Provider | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    provider: Provider;
    action: "remove" | "delete";
  } | null>(null);
  const [terminalProvider, setTerminalProvider] = useState<Provider | null>(
    null,
  );
  const [envConflicts, setEnvConflicts] = useState<EnvConflict[]>([]);
  const [showEnvBanner, setShowEnvBanner] = useState(false);

  const effectiveEditingProvider = useLastValidValue(editingProvider);
  const effectiveUsageProvider = useLastValidValue(usageProvider);
  const mainScrollRef = useRef<HTMLElement>(null);
  const providerScrollContainerRef = useRef<HTMLDivElement>(null);

  useUsageCacheBridge();

  useLayoutEffect(() => {
    if (currentView !== "providers") return;

    for (const container of [
      mainScrollRef.current,
      providerScrollContainerRef.current,
    ]) {
      if (container) {
        container.scrollTop = 0;
        container.scrollLeft = 0;
      }
    }
  }, [activeApp, currentView]);

  const openAddProvider = () => setIsAddOpen(true);
  const { data, isLoading, refetch } = useProvidersQuery(activeApp);
  const { data: piCurrentState } = usePiCurrentState(activeApp === "pi");
  const providers = useMemo(() => data?.providers ?? {}, [data]);
  const currentProviderId = data?.currentProviderId ?? "";
  const {
    addProvider,
    updateProvider,
    switchProvider,
    deleteProvider,
    saveUsageScript,
    setAsDefaultModel,
  } = useProviderActions(activeApp);
  const handleEnablePiProvider = async (
    provider: Provider,
    app: PiFamilyAppId,
  ) => {
    try {
      await providersApi.switch(provider.id, app);
      await invalidatePiProviderCaches(queryClient, app);
      await providersApi.updateTrayMenu().catch((error) => {
        console.error(
          "Failed to update tray menu after enabling Pi provider",
          error,
        );
      });
      toast.success(
        t(`${app}.provider.enabled`, {
          defaultValue: "已在 Pi 中启用",
        }),
        { closeButton: true },
      );
    } catch (error) {
      const detail = extractErrorMessage(error);
      toast.error(
        t(`${app}.provider.enableFailed`, {
          defaultValue: "无法在 Pi 中启用此供应商",
        }),
        {
          description:
            translatePiProviderMutationError(detail, t) || detail || undefined,
          closeButton: true,
        },
      );
    }
  };

  const disableOmoMutation = useDisableCurrentOmo();
  const handleDisableOmo = () => {
    disableOmoMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(t("omo.disabled", { defaultValue: "OMO 已停用" }));
      },
      onError: (error: Error) => {
        toast.error(
          t("omo.disableFailed", {
            defaultValue: "停用 OMO 失败: {{error}}",
            error: extractErrorMessage(error),
          }),
        );
      },
    });
  };

  const disableOmoSlimMutation = useDisableCurrentOmoSlim();
  const handleDisableOmoSlim = () => {
    disableOmoSlimMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(t("omo.disabled", { defaultValue: "OMO 已停用" }));
      },
      onError: (error: Error) => {
        toast.error(
          t("omo.disableFailed", {
            defaultValue: "停用 OMO 失败: {{error}}",
            error: extractErrorMessage(error),
          }),
        );
      },
    });
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let active = true;

    const setupListener = async () => {
      try {
        const off = await providersApi.onSwitched(
          async (event: ProviderSwitchEvent) => {
            await queryClient.invalidateQueries({
              queryKey: ["providers", event.appType],
            });
            if (event.appType === "pi") {
              await invalidatePiProviderCaches(queryClient);
            }
            // 切换会顺带刷新托管 ChatGPT 账号的令牌（托盘切换也一样）：
            // 重查停在失败上的账号额度，免得主界面一直显示旧的「登录过期」
            await queryClient.invalidateQueries({
              predicate: (query) =>
                query.queryKey[0] === "codex_oauth" &&
                query.queryKey[1] === "quota" &&
                (query.state.status === "error" ||
                  (query.state.data as SubscriptionQuota | undefined)
                    ?.success === false),
            });
          },
        );
        if (!active) {
          off();
          return;
        }
        unsubscribe = off;
      } catch (error) {
        console.error("[App] Failed to subscribe provider switch event", error);
      }
    };

    void setupListener();
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [queryClient]);

  useTauriEvent<SyncStatusUpdatedPayload | null | undefined>(
    "webdav-sync-status-updated",
    async (payload) => {
      const statusPayload = payload ?? {};
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
      if (statusPayload.source !== "auto" || statusPayload.status !== "error") {
        return;
      }
      toast.error(
        t("settings.webdavSync.autoSyncFailedToast", {
          error: statusPayload.error || t("common.unknown"),
        }),
      );
    },
  );

  useTauriEvent<SyncStatusUpdatedPayload | null | undefined>(
    "s3-sync-status-updated",
    async (payload) => {
      const statusPayload = payload ?? {};
      await queryClient.invalidateQueries({ queryKey: ["settings"] });
      if (statusPayload.source !== "auto" || statusPayload.status !== "error") {
        return;
      }
      toast.error(
        t("settings.s3Sync.autoSyncFailedToast", {
          error: statusPayload.error || t("common.unknown"),
        }),
      );
    },
  );

  useEffect(() => {
    // settingsData 未加载时跳过，避免用 fallback false 覆盖 Rust 侧已设好的装饰状态
    if (!settingsData) return;

    const syncWindowDecorations = async () => {
      try {
        await getCurrentWindow().setDecorations(!useAppWindowControls);
      } catch (error) {
        console.error("[App] Failed to update window decorations", error);
      }
    };

    void syncWindowDecorations();
  }, [useAppWindowControls, settingsData]);

  useEffect(() => {
    if (!isLinux() || !useAppWindowControls) return;

    const win = getCurrentWindow();
    let active = true;
    let revision = 0;
    let canResize = false;
    let nativeScale = 1;
    const unlisteners: (() => void)[] = [];
    let cursor:
      | {
          target: HTMLElement | SVGElement;
          value: string;
          priority: string;
          applied: string;
        }
      | undefined;
    const restoreCursor = () => {
      if (
        cursor &&
        cursor.target.style.cursor === cursor.applied &&
        cursor.target.style.getPropertyPriority("cursor") === "important"
      ) {
        cursor.target.style.setProperty(
          "cursor",
          cursor.value,
          cursor.priority,
        );
      }
      cursor = undefined;
    };
    const refresh = async () => {
      const current = ++revision;
      canResize = false;
      restoreCursor();
      try {
        const [maximized, fullscreen, resizable, scale] = await Promise.all([
          win.isMaximized(),
          win.isFullscreen(),
          win.isResizable(),
          win.scaleFactor(),
        ]);
        if (active && current === revision) {
          canResize = resizable && !maximized && !fullscreen;
          nativeScale = scale;
        }
      } catch (error) {
        console.error("[App] Failed to read window resize state", error);
      }
    };
    const edgeCursor = ({ clientX: x, clientY: y }: MouseEvent) => {
      if (
        !canResize ||
        x < 0 ||
        y < 0 ||
        x >= window.innerWidth ||
        y >= window.innerHeight
      ) {
        return "";
      }
      // 与 tauri-runtime-wry 的 GTK 边缘宽度（5 × scale，GDK 坐标）对齐，
      // 再从 GDK 坐标转换为 CSS 像素，兼容显示缩放和 WebView 缩放。
      const inset = (5 * nativeScale * nativeScale) / window.devicePixelRatio;
      const horizontal =
        x < inset ? -1 : x >= window.innerWidth - inset ? 1 : 0;
      const vertical = y < inset ? -1 : y >= window.innerHeight - inset ? 1 : 0;
      if (horizontal && vertical) {
        return horizontal === vertical ? "nwse-resize" : "nesw-resize";
      }
      return horizontal ? "ew-resize" : vertical ? "ns-resize" : "";
    };
    const onMouseMove = (event: MouseEvent) => {
      const value = edgeCursor(event);
      const target = event.target;
      if (
        !value ||
        !(target instanceof HTMLElement || target instanceof SVGElement)
      ) {
        restoreCursor();
        return;
      }
      if (cursor?.target !== target) {
        restoreCursor();
        cursor = {
          target,
          value: target.style.cursor,
          priority: target.style.getPropertyPriority("cursor"),
          applied: "",
        };
      }
      if (cursor.applied !== value) {
        cursor.applied = value;
        target.style.setProperty("cursor", value, "important");
      }
    };
    const onMouseDown = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const drag = event.target.getAttribute("data-tauri-drag-region");
      if (
        event.button === 0 &&
        drag !== null &&
        drag !== "false" &&
        edgeCursor(event)
      ) {
        // 保留 GTK 原生缩放，阻止 Tauri 的 document 冒泡监听再发起窗口移动。
        event.stopPropagation();
      }
    };

    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("mousedown", onMouseDown, true);
    document.documentElement.addEventListener("mouseleave", restoreCursor);
    window.addEventListener("blur", restoreCursor);
    for (const listener of [
      win.onResized(refresh),
      win.onScaleChanged(refresh),
    ]) {
      void listener
        .then((unlisten) => {
          if (active) unlisteners.push(unlisten);
          else unlisten();
        })
        .catch((error) =>
          console.error("[App] Failed to listen for window resize", error),
        );
    }
    void refresh();
    return () => {
      active = false;
      unlisteners.forEach((unlisten) => unlisten());
      document.removeEventListener("mousemove", onMouseMove, true);
      document.removeEventListener("mousedown", onMouseDown, true);
      document.documentElement.removeEventListener("mouseleave", restoreCursor);
      window.removeEventListener("blur", restoreCursor);
      restoreCursor();
    };
  }, [useAppWindowControls]);

  useEffect(() => {
    const checkEnvOnStartup = async () => {
      try {
        const allConflicts = await checkAllEnvConflicts();
        const flatConflicts = Object.values(allConflicts).flat();

        if (flatConflicts.length > 0) {
          setEnvConflicts(flatConflicts);
          const dismissed = sessionStorage.getItem("env_banner_dismissed");
          if (!dismissed) {
            setShowEnvBanner(true);
          }
        }
      } catch (error) {
        console.error(
          "[App] Failed to check environment conflicts on startup:",
          error,
        );
      }
    };

    checkEnvOnStartup();
  }, []);

  useEffect(() => {
    const checkMigration = async () => {
      try {
        const migrated = await invoke<boolean>("get_migration_result");
        if (migrated) {
          toast.success(
            t("migration.success", { defaultValue: "配置迁移成功" }),
            { closeButton: true },
          );
        }
      } catch (error) {
        console.error("[App] Failed to check migration result:", error);
      }
    };

    checkMigration();
  }, [t]);

  useEffect(() => {
    const checkSkillsMigration = async () => {
      try {
        const result = await invoke<{ count: number; error?: string } | null>(
          "get_skills_migration_result",
        );
        if (result?.error) {
          toast.error(t("migration.skillsFailed"), {
            description: t("migration.skillsFailedDescription"),
            closeButton: true,
          });
          console.error("[App] Skills SSOT migration failed:", result.error);
          return;
        }
        if (result && result.count > 0) {
          toast.success(t("migration.skillsSuccess", { count: result.count }), {
            closeButton: true,
          });
          await queryClient.invalidateQueries({ queryKey: ["skills"] });
        }
      } catch (error) {
        console.error("[App] Failed to check skills migration result:", error);
      }
    };

    checkSkillsMigration();
  }, [t, queryClient]);

  useEffect(() => {
    const checkEnvOnSwitch = async () => {
      try {
        if (activeApp === "agy") return;
        const conflicts = await checkEnvConflicts(activeApp);

        if (conflicts.length > 0) {
          setEnvConflicts((prev) => {
            const existingKeys = new Set(
              prev.map((c) => `${c.varName}:${c.sourcePath}`),
            );
            const newConflicts = conflicts.filter(
              (c) => !existingKeys.has(`${c.varName}:${c.sourcePath}`),
            );
            return [...prev, ...newConflicts];
          });
          const dismissed = sessionStorage.getItem("env_banner_dismissed");
          if (!dismissed) {
            setShowEnvBanner(true);
          }
        }
      } catch (error) {
        console.error(
          "[App] Failed to check environment conflicts on app switch:",
          error,
        );
      }
    };

    checkEnvOnSwitch();
  }, [activeApp]);

  const currentViewRef = useRef(currentView);
  const managementBusy =
    mcpManagementBusy || skillsNavigationBusy || promptNavigationBusy;
  const managementBusyRef = useRef(false);
  managementBusyRef.current = managementBusy;

  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  // ─── 导航 ───────────────────────────────────────────────────────────────
  // MCP / Skills / 提示词在进行中的操作会锁住导航（卸载面板会丢掉进行中的状态）

  // 添加 / 编辑 / 用量脚本面板只盖住内容区，侧栏还能点。离开当前页就把它们关掉：
  // 面板的 appId 跟着 activeApp 走，开着切应用会把 A 应用的供应商保存进 B 应用
  const closeProviderPanels = () => {
    setIsAddOpen(false);
    setEditingProvider(null);
    setUsageProvider(null);
  };

  // 整页编辑器里有未保存的修改：先确认，确认放弃后再执行这次导航
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
  const confirmLeave = (proceed: () => void) => {
    if (!hasUnsavedChanges()) return false;
    setPendingLeave(() => proceed);
    return true;
  };

  const openSettings = (section: SettingsSection = "general") => {
    if (managementBusyRef.current) return;
    if (confirmLeave(() => openSettings(section))) return;
    closeProviderPanels();
    setCurrentView(section === "data" ? "data" : "settings");
  };

  const selectApp = (app: AppId) => {
    if (managementBusyRef.current) return;
    if (confirmLeave(() => selectApp(app))) return;
    closeProviderPanels();
    setActiveApp(app);
    localStorage.setItem(APP_STORAGE_KEY, app);
    setCurrentView("providers");
  };

  const openPage = (page: GlobalPage | "settings") => {
    if (page === "settings") {
      openSettings("general");
      return;
    }
    if (managementBusyRef.current) return;
    // 再点当前页不会离开：不弹确认，也不能清掉编辑页的未保存登记
    if (currentViewRef.current === page) return;
    if (confirmLeave(() => openPage(page))) return;
    closeProviderPanels();
    if (page === "prompts" && currentViewRef.current !== "prompts") {
      // 提示词页默认选中侧栏里最后选的那个应用
      setPromptsApp(
        PROMPT_APP_IDS.includes(sharedFeatureApp) ? sharedFeatureApp : "claude",
      );
    }
    setCurrentView(page);
  };
  useTrayAppPageSeen(currentView === "providers" ? activeApp : null);

  useTrayNavigation((navigation) => {
    const navigate = () => {
      if (navigation.section) {
        openSettings(navigation.section);
        return;
      }
      if (!navigation.app) return;
      selectApp(navigation.app);
      // 托盘先换应用：新应用那格还没报上来，按它实际生效的模式
      if (navigation.intent === "add") openAddProvider();
    };
    if (managementBusyRef.current || !confirmLeave(navigate)) navigate();
  });

  // 侧栏、⌘K 进用量统计看全部应用；只有应用页 ⋯ 进来时带应用筛选
  const openPageFromNav = (page: GlobalPage | "settings") => {
    if (page === "usage") setUsageAppFilter("all");
    openPage(page);
  };

  const openSettingsRef = useRef(openSettings);
  openSettingsRef.current = openSettings;
  const [usageAppFilter, setUsageAppFilter] = useState<AppTypeFilter>("all");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key === ",") {
        event.preventDefault();
        openSettingsRef.current("general");
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleOpenWebsite = async (url: string) => {
    try {
      await settingsApi.openExternal(url);
    } catch (error) {
      const detail =
        extractErrorMessage(error) ||
        t("notifications.openLinkFailed", {
          defaultValue: "链接打开失败",
        });
      toast.error(detail);
    }
  };

  const handleEditProvider = async ({
    provider,
    originalId,
    editorSave,
  }: {
    provider: Provider;
    originalId?: string;
    editorSave?: ProviderEditorSave;
  }) => {
    await updateProvider(provider, originalId, editorSave);
    setEditingProvider(null);
  };

  // 累加式应用的「已添加」和「默认」都现读客户端文件，移除前后重读一遍
  const refreshAdditiveLiveState = async (app: AppId) => {
    if (isPiFamilyApp(app)) {
      await invalidatePiProviderCaches(queryClient, app);
    } else if (app === "opencode") {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["opencodeLiveProviderIds"],
        }),
        queryClient.invalidateQueries({ queryKey: ["opencodeDefaultModel"] }),
      ]);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    const { provider, action } = confirmAction;

    if (action === "remove") {
      // Remove from live config only (for additive mode apps like OpenCode/OpenClaw)
      // Does NOT delete from database - provider remains in the list
      try {
        await providersApi.removeFromLiveConfig(provider.id, activeApp);
      } catch (error) {
        const detail = extractErrorMessage(error);
        const description =
          (isPiFamilyApp(activeApp)
            ? translatePiProviderMutationError(detail, t)
            : "") || detail;
        // 默认模型可能在客户端里改过、页面还是旧的：失败了也重读，让「默认」和移除按钮跟上
        void refreshAdditiveLiveState(activeApp).catch(() => undefined);
        toast.error(t("notifications.removeFromConfigFailed"), {
          description: description || t("common.unknown"),
          closeButton: true,
        });
        return;
      }
      await refreshAdditiveLiveState(activeApp);
      toast.success(
        isPiFamilyApp(activeApp)
          ? t(`${activeApp}.provider.removed`, {
              defaultValue: "已从 Pi 移除",
            })
          : t("notifications.removeFromConfigSuccess", {
              defaultValue: "已从配置移除",
            }),
        { closeButton: true },
      );
    } else {
      try {
        await deleteProvider(provider.id);
      } catch {
        // useDeleteProviderMutation 的 onError 已经弹了错误 toast；确认框照样关掉
      }
    }
    setConfirmAction(null);
  };

  const generateUniqueProviderCopyKey = (
    originalKey: string,
    existingKeys: string[],
  ): string => {
    const baseKey = `${originalKey}-copy`;

    if (!existingKeys.includes(baseKey)) {
      return baseKey;
    }

    let counter = 2;
    while (existingKeys.includes(`${baseKey}-${counter}`)) {
      counter++;
    }
    return `${baseKey}-${counter}`;
  };

  const handleDuplicateProvider = async (provider: Provider) => {
    if (
      activeApp === "opencode" &&
      provider.category !== "omo" &&
      provider.category !== "omo-slim"
    ) {
      // A copy gets a new ID, so it cannot inherit a built-in definition.
      // Native V2 declarations name their package in `package`, not `npm`.
      const isNative = isNativeOpencodeConfig(
        JSON.stringify(provider.settingsConfig),
        provider.meta?.opencodeConfigFormat,
      );
      if (
        !hasOpencodeDefinition(
          provider.settingsConfig,
          isNative ? "package" : "npm",
        )
      ) {
        toast.error(
          t(
            isNative
              ? "opencode.duplicateRequiresNativeDefinition"
              : "opencode.duplicateRequiresDefinition",
          ),
        );
        return;
      }
    }

    const newSortIndex =
      provider.sortIndex !== undefined ? provider.sortIndex + 1 : undefined;

    const duplicatedProvider: Omit<Provider, "id" | "createdAt"> & {
      providerKey?: string;
      addToLive?: boolean;
    } = {
      name: `${provider.name} copy`,
      settingsConfig: deepClone(provider.settingsConfig),
      websiteUrl: provider.websiteUrl,
      category: provider.category,
      sortIndex: newSortIndex, // 复制原 sortIndex + 1
      meta: provider.meta ? deepClone(provider.meta) : undefined,
      icon: provider.icon,
      iconColor: provider.iconColor,
    };

    if (activeApp === "opencode" || activeApp === "pi") {
      let liveProviderIds: string[] = [];
      try {
        liveProviderIds =
          activeApp === "opencode"
            ? await queryClient.ensureQueryData({
                queryKey: ["opencodeLiveProviderIds"],
                queryFn: () => providersApi.getOpenCodeLiveProviderIds(),
              })
            : (
                await queryClient.ensureQueryData({
                  queryKey: [activeApp, "currentState"],
                  queryFn: () => piApi.getCurrentState("pi"),
                })
              ).enabledProviderIds;
      } catch (error) {
        console.error(
          "[App] Failed to load live provider IDs for duplication",
          error,
        );
        const errorMessage = extractErrorMessage(error);
        toast.error(
          t("provider.duplicateLiveIdsLoadFailed", {
            defaultValue: "读取配置中的供应商标识失败，请先修复配置后再试",
          }) + (errorMessage ? `: ${errorMessage}` : ""),
        );
        return;
      }
      const existingKeys = Array.from(
        new Set([...Object.keys(providers), ...liveProviderIds]),
      );
      duplicatedProvider.providerKey = generateUniqueProviderCopyKey(
        provider.id,
        existingKeys,
      );
      duplicatedProvider.addToLive = false;
    } else if (provider.sortIndex !== undefined) {
      const updates = Object.values(providers)
        .filter(
          (p) =>
            p.sortIndex !== undefined &&
            p.sortIndex >= newSortIndex! &&
            p.id !== provider.id,
        )
        .map((p) => ({
          id: p.id,
          sortIndex: p.sortIndex! + 1,
        }));

      if (updates.length > 0) {
        try {
          await providersApi.updateSortOrder(updates, activeApp);
        } catch (error) {
          console.error("[App] Failed to update sort order", error);
          toast.error(
            t("provider.sortUpdateFailed", {
              defaultValue: "排序更新失败",
            }),
          );
          return; // 如果排序更新失败，不继续添加
        }
      }
    }

    await addProvider(duplicatedProvider);
  };

  const confirmActionMessage = useMemo(() => {
    if (!confirmAction) return "";

    const message =
      confirmAction.action === "remove"
        ? t("confirm.removeProviderMessage", {
            name: confirmAction.provider.name,
          })
        : t("confirm.deleteProviderMessage", {
            name: confirmAction.provider.name,
          });
    const isPiGlobalDefault =
      activeApp === "pi" &&
      piCurrentState?.defaultProviderId === confirmAction.provider.id;

    return isPiGlobalDefault
      ? `${message}\n\n${t("confirm.piDefaultProviderWarning")}`
      : message;
  }, [activeApp, confirmAction, piCurrentState?.defaultProviderId, t]);

  const handleImportSuccess = async () => {
    try {
      await queryClient.invalidateQueries({
        queryKey: ["providers"],
        refetchType: "all",
      });
      await queryClient.refetchQueries({
        queryKey: ["providers"],
        type: "all",
      });
    } catch (error) {
      console.error("[App] Failed to refresh providers after import", error);
      await refetch();
    }
    try {
      await providersApi.updateTrayMenu();
    } catch (error) {
      console.error("[App] Failed to refresh tray menu", error);
    }
  };

  // ─── 应用页 ─────────────────────────────────────────────────────────────

  // 应用页 ⋯ →「查看此应用的用量」：带上这个应用的筛选（Claude Desktop 的流量并在 Claude 里）
  const usageAppOf = (app: AppId): AppTypeFilter | null => {
    const type = app;
    return (KNOWN_APP_TYPES as ReadonlyArray<string>).includes(type)
      ? (type as AppTypeFilter)
      : null;
  };
  const activeUsageApp = usageAppOf(activeApp);

  const usageButton = activeUsageApp && (
    <Button
      variant="quiet"
      size="sm"
      onClick={() => {
        setUsageAppFilter(activeUsageApp);
        openPage("usage");
      }}
    >
      <ChartColumn className="h-4 w-4" />
      {t("appPage.viewUsage")}
    </Button>
  );

  const renderAppPageHeader = () => (
    <AppPageHeader
      variant="app"
      icon={<AppGlyph app={activeApp} size={20} badgeClassName="bg-app" />}
      title={APP_DISPLAY_NAME[activeApp]}
      className={PAGE_HEADER_INSET}
      actions={
        <>
          {usageButton}
          <Button variant="solid" size="sm" onClick={() => openAddProvider()}>
            <Plus className="h-4 w-4" />
            {t("common.add")}
          </Button>
        </>
      }
    />
  );

  const listCallbacks = {
    onEdit: (provider: Provider) => {
      setEditingProvider(provider);
    },
    onDelete: (provider: Provider) =>
      setConfirmAction({ provider, action: "delete" }),
    onDuplicate: handleDuplicateProvider,
    onConfigureUsage: setUsageProvider,
    onOpenWebsite: handleOpenWebsite,
    onOpenTerminal:
      activeApp === "claude" || activeApp === "agy"
        ? setTerminalProvider
        : undefined,
    onCreate: () => openAddProvider(),
  };

  const renderProviderList = () => {
    return (
      <div
        ref={providerScrollContainerRef}
        id="main-content"
        className={`flex min-h-0 flex-1 flex-col overflow-hidden pt-4 ${PAGE_FRAME}`}
      >
        <ProviderList
          key={activeApp}
          {...listCallbacks}
          providers={providers}
          currentProviderId={currentProviderId}
          appId={activeApp}
          isLoading={isLoading}
          onSwitch={(provider) =>
            void (isPiFamilyApp(activeApp)
              ? handleEnablePiProvider(provider, activeApp)
              : switchProvider(provider))
          }
          onRemoveFromConfig={
            activeApp === "opencode" || activeApp === "pi"
              ? (provider) => setConfirmAction({ provider, action: "remove" })
              : undefined
          }
          onDisableOmo={activeApp === "opencode" ? handleDisableOmo : undefined}
          onDisableOmoSlim={
            activeApp === "opencode" ? handleDisableOmoSlim : undefined
          }
          onSetAsDefault={
            activeApp === "opencode"
              ? (provider, modelId) => void setAsDefaultModel(provider, modelId)
              : undefined
          }
        />
      </div>
    );
  };

  const renderAppPage = () => (
    <>
      {renderAppPageHeader()}
      {renderProviderList()}
    </>
  );

  // ─── 全局页 ─────────────────────────────────────────────────────────────

  const renderGlobalPage = () => {
    switch (currentView) {
      case "usage":
        return <UsagePage initialAppType={usageAppFilter} />;
      case "mcp":
        return (
          <UnifiedMcpPanel onInteractionBlockedChange={setMcpManagementBusy} />
        );
      case "skills":
        return (
          <UnifiedSkillsPanel
            onNavigationBlockedChange={setSkillsNavigationBusy}
          />
        );
      case "prompts":
        return (
          <div id="main-content" className="flex min-h-0 flex-1 flex-col">
            <PromptPanel
              appId={promptsApp}
              apps={PROMPT_APP_IDS.filter(
                (app) => visibleApps[app] || app === promptsApp,
              )}
              onAppChange={setPromptsApp}
              onNavigationBlockedChange={setPromptNavigationBusy}
            />
          </div>
        );
      case "apps":
        return <AppsPage />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (currentView === "settings" || currentView === "data") {
      return (
        <SettingsPage
          page={currentView}
          onImportSuccess={handleImportSuccess}
        />
      );
    }
    return isAppPage(currentView) ? renderAppPage() : renderGlobalPage();
  };

  return (
    <WindowControlsContext.Provider
      value={useAppWindowControls ? <WindowControls /> : null}
    >
      <div className="flex h-screen overflow-hidden bg-app text-fg-1 selection:bg-action/25">
        <Sidebar
          activeApp={activeApp}
          view={currentView}
          visibleApps={visibleApps}
          onSelectApp={selectApp}
          onSelectPage={openPageFromNav}
          appsUpdateAvailable={
            checkToolUpdatesOnStartup && toolUpdatesAvailable
          }
        />
        <main
          ref={mainScrollRef}
          id="content-area"
          className="relative isolate flex min-w-0 flex-1 flex-col overflow-hidden bg-app"
        >
          {showEnvBanner && envConflicts.length > 0 && (
            <EnvWarningBanner
              conflicts={envConflicts}
              onDismiss={() => {
                setShowEnvBanner(false);
                sessionStorage.setItem("env_banner_dismissed", "true");
              }}
              onDeleted={async () => {
                try {
                  const allConflicts = await checkAllEnvConflicts();
                  const flatConflicts = Object.values(allConflicts).flat();
                  setEnvConflicts(flatConflicts);
                  if (flatConflicts.length === 0) {
                    setShowEnvBanner(false);
                  }
                } catch (error) {
                  console.error(
                    "[App] Failed to re-check conflicts after deletion:",
                    error,
                  );
                }
              }}
            />
          )}
          <div
            key={
              currentView === "settings"
                ? "settings"
                : isAppPage(currentView)
                  ? "app"
                  : currentView
            }
            className="flex min-h-0 flex-1 flex-col"
          >
            {renderContent()}
          </div>
        </main>
      </div>

      <AddProviderDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        appId={activeApp}
        onSubmit={addProvider}
      />

      <EditProviderDialog
        open={Boolean(editingProvider)}
        provider={effectiveEditingProvider}
        onOpenChange={(open) => {
          if (!open) {
            setEditingProvider(null);
          }
        }}
        onSubmit={handleEditProvider}
        appId={activeApp}
        isCurrent={effectiveEditingProvider?.id === currentProviderId}
      />

      {effectiveUsageProvider && (
        <UsageScriptModal
          key={effectiveUsageProvider.id}
          provider={effectiveUsageProvider}
          appId={activeApp}
          isOpen={Boolean(usageProvider)}
          onClose={() => setUsageProvider(null)}
          onSave={(script) => {
            if (usageProvider) {
              void saveUsageScript(usageProvider, script);
            }
          }}
        />
      )}

      <OpenTerminalDialog
        provider={terminalProvider}
        appId={activeApp}
        onClose={() => setTerminalProvider(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmAction)}
        title={
          confirmAction?.action === "remove"
            ? t("confirm.removeProvider")
            : t("confirm.deleteProvider")
        }
        message={confirmActionMessage}
        // 「移除」只是从应用配置里拿掉、CC Switch 里还留着，可以再加回去，不用红色
        variant={confirmAction?.action === "remove" ? "info" : "destructive"}
        onConfirm={() => void handleConfirmAction()}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmDialog
        isOpen={pendingLeave !== null}
        title={t("common.unsavedLeaveTitle")}
        message={t("common.unsavedLeaveMessage")}
        confirmText={t("common.unsavedLeaveConfirm")}
        cancelText={t("common.unsavedLeaveCancel")}
        zIndex="top"
        onConfirm={() => {
          const proceed = pendingLeave;
          setPendingLeave(null);
          discardUnsavedChanges();
          proceed?.();
        }}
        onCancel={() => setPendingLeave(null)}
      />

      <DeepLinkImportDialog />
      <FirstRunNoticeDialog />
      <NewLayoutDialog />
      <WhatsNewNotice />
    </WindowControlsContext.Provider>
  );
}

export default App;
