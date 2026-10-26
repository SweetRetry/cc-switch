import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDelayedFlag } from "@/hooks/useDelayedFlag";
import { useTranslation } from "react-i18next";
import {
  ArrowUpCircle,
  Copy,
  Loader2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Notice, NoticeSlot } from "@/components/ui/notice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HoverTip } from "@/components/ui/hover-tip";
import { AppPageHeader } from "@/components/shell/AppPageHeader";
import { APP_DISPLAY_NAME } from "@/components/shell/AppGlyph";
import { SkillsIcon } from "@/components/BrandIcons";
import {
  type ImportSkillSelection,
  type InstalledSkill,
  type SkillBackupEntry,
  type SkillUpdateInfo,
  useBulkToggleSkillApp,
  useCheckSkillUpdates,
  useDeleteSkillBackup,
  useImportSkillsFromApps,
  useInstalledSkills,
  useRestoreSkillBackup,
  useScanUnmanagedSkills,
  useSkillBackups,
  useToggleSkillApp,
  useUninstallSkill,
  useUpdateSkill,
} from "@/hooks/useSkills";
import type { AppId } from "@/lib/api/types";
import { SKILLS_APP_IDS } from "@/config/appConfig";
import { settingsApi } from "@/lib/api";
import { copyText } from "@/lib/clipboard";
import { extractErrorMessage } from "@/utils/errorUtils";
import { cn } from "@/lib/utils";
import { MatrixSearch } from "@/components/mcp/AppMatrix";
import {
  AppMultiSelect,
  type AppSelectState,
} from "@/components/mcp/AppMultiSelect";
import { V7ConfirmDialog } from "@/components/mcp/formBits";
import { useVisibleAppIds } from "@/components/mcp/useVisibleAppIds";
import { SkillRestoreDialog } from "./SkillRestoreDialog";
import { SkillsStorageSheet } from "./SkillsStorageSheet";
import { useSkillInstallTargets } from "./useSkillInstallTargets";
import { describeRepoFailures } from "./repoFailures";

const BACKUP_DIR = "~/.cc-switch/skill-backups";

interface WriteFailure {
  desired: boolean;
  error: string;
}
const failKey = (id: string, app: AppId) => `${id}\u0000${app}`;

type ConfirmState =
  | { kind: "uninstall"; ids: string[] }
  | { kind: "updateAll" }
  | { kind: "deleteBackup"; backup: SkillBackupEntry };

interface UnifiedSkillsPanelProps {
  onInteractionBlockedChange?: (blocked: boolean) => void;
  onNavigationBlockedChange?: (blocked: boolean) => void;
}

/**
 * Skills 全局页：已安装的技能和应用启用状态。
 * Pi 列常驻（应用页里隐藏 Pi 时才不显示）；Pi 的状态来自后端对 ~/.pi/agent/skills 的目录检查，
 * get_installed_skills 返回前会用这个检查结果覆盖 apps.pi，所以这里显示的不是数据库里的开关。
 */
const UnifiedSkillsPanel: React.FC<UnifiedSkillsPanelProps> = ({
  onInteractionBlockedChange,
  onNavigationBlockedChange,
}) => {
  const { t, i18n } = useTranslation();
  const appIds = useVisibleAppIds(SKILLS_APP_IDS);
  const { targets, installTo } = useSkillInstallTargets(appIds);

  const [searchQuery, setSearchQuery] = useState("");
  const [fails, setFails] = useState<Record<string, WriteFailure>>({});
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [storageOpen, setStorageOpen] = useState(false);
  /** 关掉的是哪一次检查的「仓库没读到」横幅（按检查时间记） */
  const [dismissedRepoFailAt, setDismissedRepoFailAt] = useState<number | null>(
    null,
  );
  const [writePending, setWritePending] = useState(false);
  const [isUpdatingMany, setIsUpdatingMany] = useState(false);
  // 更新进度：确认框点完就关，进度显示在搜索框旁的按钮上
  const [updateProgress, setUpdateProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const writeLockRef = useRef(false);
  const checkUpdatesLockRef = useRef(false);

  const {
    data: skills,
    isLoading,
    isError,
    error: loadError,
    refetch,
  } = useInstalledSkills();
  const {
    data: skillBackups = [],
    refetch: refetchSkillBackups,
    isFetching: isFetchingSkillBackups,
  } = useSkillBackups();
  const deleteBackupMutation = useDeleteSkillBackup();
  const toggleAppMutation = useToggleSkillApp();
  const bulkToggleAppMutation = useBulkToggleSkillApp();
  const uninstallMutation = useUninstallSkill();
  const restoreBackupMutation = useRestoreSkillBackup();
  // 进入页面时静默扫描一次「本机已有但未管理」的 Skill
  const { data: unmanagedSkills } = useScanUnmanagedSkills({ enabled: true });
  const importMutation = useImportSkillsFromApps();
  const {
    data: updateCheck,
    refetch: checkUpdates,
    isFetching: isCheckingUpdates,
    dataUpdatedAt: updatesCheckedAt,
  } = useCheckSkillUpdates();
  const skillUpdates = updateCheck?.updates;
  const updateRepoFailures = updateCheck?.failures ?? [];
  const updateSkillMutation = useUpdateSkill();

  const mutationPending =
    deleteBackupMutation.isPending ||
    toggleAppMutation.isPending ||
    bulkToggleAppMutation.isPending ||
    uninstallMutation.isPending ||
    restoreBackupMutation.isPending ||
    importMutation.isPending ||
    updateSkillMutation.isPending ||
    isUpdatingMany;
  const dialogOpen = restoreOpen || confirm !== null;
  const navigationBlocked = writePending || mutationPending || dialogOpen;
  const interactionBlocked = navigationBlocked || isCheckingUpdates;
  // 外观上的禁用晚 300ms 才出现：点一个格子写得很快时不让整页按钮闪一下变灰。
  // 写入本身仍由写锁（writeLockRef / interactionBlocked）拦着。
  const controlsDisabled = useDelayedFlag(interactionBlocked);

  useEffect(() => {
    onInteractionBlockedChange?.(interactionBlocked);
  }, [interactionBlocked, onInteractionBlockedChange]);

  useEffect(() => {
    onNavigationBlockedChange?.(navigationBlocked);
  }, [navigationBlocked, onNavigationBlockedChange]);

  useEffect(
    () => () => {
      onInteractionBlockedChange?.(false);
      onNavigationBlockedChange?.(false);
    },
    [onInteractionBlockedChange, onNavigationBlockedChange],
  );

  const beginWrite = (allowOpenDialog = false) => {
    if (
      checkUpdatesLockRef.current ||
      isCheckingUpdates ||
      writeLockRef.current ||
      mutationPending ||
      (!allowOpenDialog && dialogOpen)
    ) {
      return false;
    }
    writeLockRef.current = true;
    setWritePending(true);
    return true;
  };

  const endWrite = () => {
    writeLockRef.current = false;
    setWritePending(false);
  };

  const listSeparator = t("mcpPage.listSeparator");
  const names = (apps: AppId[]) =>
    apps.map((app) => APP_DISPLAY_NAME[app]).join(listSeparator);
  const installedSkills = skills ?? [];

  // ─── 更新 ───────────────────────────────────────────────────────────
  const applicableSkillUpdates = useMemo(() => {
    const installedIds = new Set(installedSkills.map((skill) => skill.id));
    return (skillUpdates ?? []).filter((update) => installedIds.has(update.id));
  }, [skillUpdates, installedSkills]);

  const updatesMap = useMemo(() => {
    const map: Record<string, SkillUpdateInfo> = {};
    for (const update of applicableSkillUpdates) map[update.id] = update;
    return map;
  }, [applicableSkillUpdates]);

  const lastCheckedText = useMemo(() => {
    if (!updatesCheckedAt) return "";
    const minutes = Math.floor((Date.now() - updatesCheckedAt) / 60_000);
    if (minutes < 1) return t("skillsPage.justNow");
    try {
      const rtf = new Intl.RelativeTimeFormat(i18n.language, {
        numeric: "auto",
      });
      return minutes < 60
        ? rtf.format(-minutes, "minute")
        : rtf.format(-Math.floor(minutes / 60), "hour");
    } catch {
      return "";
    }
  }, [updatesCheckedAt, i18n.language, t]);

  // ─── 搜索 ───────────────────────────────────────────────────────────
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const filteredSkills = useMemo(() => {
    if (!normalizedQuery) return installedSkills;
    return installedSkills.filter((skill) =>
      [
        skill.name,
        skill.id,
        skill.description,
        skill.directory,
        skill.repoOwner,
        skill.repoName,
        skill.repoOwner && skill.repoName
          ? `${skill.repoOwner}/${skill.repoName}`
          : undefined,
      ].some((value) => value?.toLocaleLowerCase().includes(normalizedQuery)),
    );
  }, [installedSkills, normalizedQuery]);

  // ─── 写入与失败记录 ────────────────────────────────────────────────
  const recordResult = (
    id: string,
    app: AppId,
    desired: boolean,
    error?: unknown,
  ) =>
    setFails((prev) => {
      const next = { ...prev };
      const key = failKey(id, app);
      if (error === undefined) delete next[key];
      else next[key] = { desired, error: extractErrorMessage(error) };
      return next;
    });

  const recordEnableFailures = (
    failures: Array<{ id: string; app: AppId; error: unknown }>,
  ) => {
    for (const failure of failures) {
      recordResult(failure.id, failure.app, true, failure.error);
    }
  };

  const writeOne = async (id: string, app: AppId, enabled: boolean) => {
    if (!beginWrite()) return;
    try {
      await toggleAppMutation.mutateAsync({ id, app, enabled });
      recordResult(id, app, enabled);
    } catch (error) {
      recordResult(id, app, enabled, error);
    } finally {
      endWrite();
    }
  };

  const writeMany = async (ids: string[], app: AppId, enabled: boolean) => {
    if (ids.length === 0) return { succeeded: [] as string[], failed: 0 };
    try {
      const result = await bulkToggleAppMutation.mutateAsync({
        ids,
        app,
        enabled,
      });
      for (const id of result.succeeded) recordResult(id, app, enabled);
      for (const failure of result.failed) {
        recordResult(failure.item, app, enabled, failure.error);
      }
      return { succeeded: result.succeeded, failed: result.failed.length };
    } catch (error) {
      for (const id of ids) recordResult(id, app, enabled, error);
      return { succeeded: [] as string[], failed: ids.length };
    }
  };

  const handleEnableAll = async () => {
    if (!beginWrite()) return;
    try {
      let failed = 0;
      for (const app of appIds) {
        const ids = installedSkills
          .filter((skill) => !skill.apps[app])
          .map((skill) => skill.id);
        failed += (await writeMany(ids, app, true)).failed;
      }
      if (failed) {
        toast.warning(t("common.bulkToggleFailed", { count: failed }), {
          closeButton: true,
        });
      } else {
        toast.success(
          t("skillsPage.toast.enableAllDone", {
            count: installedSkills.length,
            apps: names(appIds),
          }),
          { closeButton: true },
        );
      }
    } finally {
      endWrite();
    }
  };

  const handleRowAll = async (skill: InstalledSkill, on: boolean) => {
    if (!beginWrite()) return;
    try {
      const targets = appIds.filter((app) => Boolean(skill.apps[app]) !== on);
      if (targets.length === 0) return;
      let failed = 0;
      for (const app of targets) {
        failed += (await writeMany([skill.id], app, on)).failed;
      }
      if (!failed) {
        toast.success(
          on
            ? t("mcpPage.toast.rowAllOn", {
                id: skill.name,
                count: appIds.length,
              })
            : t("mcpPage.toast.rowAllOff", { id: skill.name }),
          { closeButton: true },
        );
      }
    } finally {
      endWrite();
    }
  };

  // ─── 卸载 / 更新 ────────────────────────────────────────────────────
  const uninstallIds = async (ids: string[]) => {
    if (!beginWrite(true)) return;
    const done: InstalledSkill[] = [];
    let piWarning: string | undefined;
    let backupPath: string | undefined;
    try {
      for (const id of ids) {
        const skill = installedSkills.find((item) => item.id === id);
        try {
          const result = await uninstallMutation.mutateAsync(id);
          if (skill) done.push(skill);
          if (result.preservedPiPath) {
            piWarning = t("skills.uninstallPiPreserved", {
              path: result.preservedPiPath,
            });
          } else if (result.piCleanupIncomplete) {
            piWarning = t("skills.uninstallPiCleanupIncomplete");
          }
          if (result.backupPath) backupPath = result.backupPath;
        } catch (error) {
          toast.error(t("common.error"), {
            description: `${skill?.name ?? id}: ${String(error)}`,
          });
        }
      }
      setConfirm(null);
    } finally {
      endWrite();
    }
    if (done.length === 0) return;
    const text =
      done.length === 1
        ? t("skills.uninstallSuccess", { name: done[0].name })
        : t("skillsPage.toast.uninstalledMany", { count: done.length });
    const options = {
      description:
        piWarning ??
        (done.length === 1 && backupPath
          ? t("skills.backup.location", { path: backupPath })
          : t("skillsPage.toast.backupAt", { path: BACKUP_DIR })),
      closeButton: true,
    };
    if (piWarning) toast.warning(text, options);
    else toast.success(text, options);
  };

  const updateIds = async (ids: string[], allowOpenDialog = false) => {
    if (ids.length === 0 || !beginWrite(allowOpenDialog)) return;
    // 不让确认框等着整批更新跑完：点了确认就关，每行的 ⋯ 和页头按钮显示进度
    setConfirm(null);
    setIsUpdatingMany(ids.length > 1);
    setUpdateProgress({ done: 0, total: ids.length });
    const updated: string[] = [];
    try {
      for (const [index, id] of ids.entries()) {
        try {
          const result = await updateSkillMutation.mutateAsync(id);
          updated.push(result.name);
        } catch (error) {
          const name = installedSkills.find((skill) => skill.id === id)?.name;
          toast.error(t("skills.updateFailed"), {
            description: `${name ?? id}: ${String(error)}`,
          });
        }
        setUpdateProgress({ done: index + 1, total: ids.length });
      }
    } finally {
      setIsUpdatingMany(false);
      setUpdateProgress(null);
      endWrite();
    }
    if (updated.length === 1) {
      toast.success(t("skills.updateSuccess", { name: updated[0] }), {
        closeButton: true,
      });
    } else if (updated.length > 1) {
      toast.success(t("skills.updateAllSuccess", { count: updated.length }), {
        closeButton: true,
      });
    }
  };

  const handleCheckUpdates = async () => {
    if (
      checkUpdatesLockRef.current ||
      writeLockRef.current ||
      interactionBlocked
    ) {
      return;
    }
    checkUpdatesLockRef.current = true;
    try {
      const result = await checkUpdates();
      const installedIds = new Set(installedSkills.map((skill) => skill.id));
      const updates = (result.data?.updates ?? []).filter((update) =>
        installedIds.has(update.id),
      );
      const failures = result.data?.failures ?? [];
      setDismissedRepoFailAt(null);
      if (updates.length === 0 && failures.length > 0) {
        // 有仓库没读到时不能说「全部最新」；哪些仓库、为什么写在横幅里
        toast.warning(
          t("skills.updatesIncomplete", { count: failures.length }),
          { closeButton: true },
        );
      } else if (updates.length === 0) {
        toast.success(t("skills.noUpdates"), { closeButton: true });
      } else {
        // 查到就直接问要不要全部更新，不用再去筛选里找「全部更新」
        setConfirm({ kind: "updateAll" });
      }
    } catch (error) {
      toast.error(t("common.error"), { description: String(error) });
    } finally {
      checkUpdatesLockRef.current = false;
    }
  };

  // ─── 导入 / 备份 ───────────────────────────────────────────────
  // npx skills add 等外部工具装进来的 Skill：打开页面时自动纳入管理，
  // 在「发现于」里出现过的应用上默认启用（Pi 看目录，不用勾）
  const adoptedKeyRef = useRef("");
  useEffect(() => {
    if (!unmanagedSkills?.length) return;
    const key = unmanagedSkills
      .map((skill) => skill.directory)
      .sort()
      .join("\u0000");
    if (adoptedKeyRef.current === key || !beginWrite()) return;
    adoptedKeyRef.current = key;
    const imports: ImportSkillSelection[] = unmanagedSkills.map((skill) => ({
      directory: skill.directory,
      apps: {
        claude: skill.foundIn.includes("claude"),
        codex: skill.foundIn.includes("codex"),
        opencode: skill.foundIn.includes("opencode"),
        pi: false,
        agy: skill.foundIn.includes("agy"),
      },
    }));
    void (async () => {
      try {
        const imported = await importMutation.mutateAsync(imports);
        toast.success(t("skills.importSuccess", { count: imported.length }), {
          closeButton: true,
        });
      } catch (error) {
        toast.error(t("common.error"), { description: String(error) });
      } finally {
        endWrite();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unmanagedSkills]);

  const reportEnableFailures = (
    failures: Array<{ id: string; app: AppId; error: unknown }>,
  ) => {
    if (failures.length === 0) return;
    recordEnableFailures(failures);
    toast.warning(
      t("skillsPage.toast.enableFailed", {
        apps: names([...new Set(failures.map((failure) => failure.app))]),
      }),
      { closeButton: true },
    );
  };

  const handleOpenRestoreFromBackup = async () => {
    if (!beginWrite()) return;
    setRestoreOpen(true);
    try {
      await refetchSkillBackups({ throwOnError: true });
    } catch (error) {
      setRestoreOpen(false);
      toast.error(t("common.error"), { description: String(error) });
    } finally {
      endWrite();
    }
  };

  const handleRestoreFromBackup = async (backupId: string) => {
    if (!beginWrite(true)) return;
    try {
      const { installed, failures } = await installTo(async (firstApp) => [
        await restoreBackupMutation.mutateAsync({
          backupId,
          currentApp: firstApp,
        }),
      ]);
      setRestoreOpen(false);
      toast.success(
        t("skills.restoreFromBackup.success", { name: installed[0]?.name }),
        { closeButton: true },
      );
      reportEnableFailures(failures);
    } catch (error) {
      toast.error(t("skills.restoreFromBackup.failed"), {
        description: String(error),
      });
    } finally {
      endWrite();
    }
  };

  const confirmDeleteBackup = async (backup: SkillBackupEntry) => {
    if (!beginWrite(true)) return;
    try {
      let deleteSucceeded = false;
      let deleteError: unknown;
      try {
        await deleteBackupMutation.mutateAsync(backup.backupId);
        deleteSucceeded = true;
      } catch (error) {
        deleteError = error;
      }

      // The backups query is disabled by default, so invalidation alone
      // does not fetch authoritative data. Explicitly refresh after both
      // success and failure (remove_dir_all may have made partial progress).
      let refreshedBackups: SkillBackupEntry[] | undefined;
      try {
        const result = await refetchSkillBackups({ throwOnError: true });
        refreshedBackups = result.data;
      } catch (error) {
        // A refresh failure must not turn a completed deletion into a false
        // "delete failed" report, or replace the original deletion error.
        console.error("Failed to refresh Skill backups after deletion:", error);
      }

      if (!deleteSucceeded) {
        if (
          refreshedBackups &&
          !refreshedBackups.some((entry) => entry.backupId === backup.backupId)
        ) {
          setConfirm(null);
        }
        toast.error(t("skills.restoreFromBackup.deleteFailed"), {
          description: String(deleteError),
        });
      } else {
        setConfirm(null);
        toast.success(
          t("skills.restoreFromBackup.deleteSuccess", {
            name: backup.skill.name,
          }),
          { closeButton: true },
        );
      }
    } finally {
      endWrite();
    }
  };

  const openDocs = async (skill: InstalledSkill) => {
    const url =
      skill.readmeUrl ||
      (skill.repoOwner && skill.repoName
        ? `https://github.com/${skill.repoOwner}/${skill.repoName}`
        : undefined);
    if (!url) return;
    try {
      await settingsApi.openExternal(url);
    } catch {
      // ignore
    }
  };

  const copyDirectory = async (skill: InstalledSkill) => {
    try {
      await copyText(skill.directory);
      toast.success(t("skillsPage.toast.copiedDir", { dir: skill.directory }), {
        closeButton: true,
      });
    } catch (error) {
      toast.error(t("common.error"), { description: String(error) });
    }
  };

  // ─── 渲染：页头 ─────────────────────────────────────────────────────
  const nInstalled = installedSkills.length;
  const nUpdates = applicableSkillUpdates.length;
  const loadOk = !isLoading && !isError;
  const header = (
    <AppPageHeader
      icon={<SkillsIcon size={20} />}
      title="Skills"
      // 右缘与下面列表的 px-6 对齐
      className="pe-6"
      actions={
        <>
          {loadOk && nInstalled > 0 && (
            <MatrixSearch
              className="w-[240px] min-w-[160px] shrink"
              value={searchQuery}
              onValueChange={setSearchQuery}
              placeholder={t("skillsPage.searchPlaceholder")}
              ariaLabel={t("skills.installedSearchAriaLabel")}
              status={
                normalizedQuery
                  ? t("appMatrix.found", { count: filteredSkills.length })
                  : ""
              }
            />
          )}
          {/* 有可更新项（或正在更新）时才出现；重新检查走「⋯」菜单 */}
          {updateProgress ? (
            <Button
              type="button"
              variant="neutral"
              size="regular"
              className="shrink-0"
              disabled
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("skillsPage.updatingProgress", {
                done: Math.min(updateProgress.done + 1, updateProgress.total),
                total: updateProgress.total,
              })}
            </Button>
          ) : (
            loadOk &&
            nUpdates > 0 && (
              <HoverTip
                content={
                  lastCheckedText
                    ? t("skillsPage.lastChecked", { when: lastCheckedText })
                    : undefined
                }
              >
                <Button
                  type="button"
                  variant="neutral"
                  size="regular"
                  className="shrink-0"
                  disabled={controlsDisabled}
                  onClick={() => setConfirm({ kind: "updateAll" })}
                >
                  <ArrowUpCircle className="h-4 w-4" strokeWidth={2} />
                  {t("skillsPage.updateAllCount", { count: nUpdates })}
                </Button>
              </HoverTip>
            )
          )}
          <DropdownMenu>
            <HoverTip content={t("common.more")}>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="quiet"
                  size="icon-compact"
                  className="h-8 w-8"
                  aria-label={t("skills.moreActions")}
                >
                  <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
                </Button>
              </DropdownMenuTrigger>
            </HoverTip>
            <DropdownMenuContent align="end" className="min-w-[200px]">
              <DropdownMenuItem
                disabled={controlsDisabled || nInstalled === 0}
                onSelect={() => void handleCheckUpdates()}
              >
                {t("skills.checkUpdates")}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={controlsDisabled || nInstalled === 0}
                onSelect={() => void handleEnableAll()}
              >
                {t("skillsPage.moreMenu.enableAll")}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={controlsDisabled}
                onSelect={() => void handleOpenRestoreFromBackup()}
              >
                {t("skillsPage.moreMenu.restore")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setStorageOpen(true)}>
                {t("skills.storageSheet.open")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }
    />
  );

  const renderInstalledBody = () => {
    if (isLoading) {
      return (
        <div className="py-12 text-center text-body text-fg-2">
          {t("skills.loading")}
        </div>
      );
    }
    if (isError) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-2.5 px-10 pb-12 text-center">
          <h2 className="m-0 text-section">{t("skillsPage.loadFailed")}</h2>
          <code className="max-w-[520px] rounded-[8px] bg-subtle px-3 py-2 text-left font-mono text-caption text-fg-2 [overflow-wrap:anywhere]">
            {extractErrorMessage(loadError) || String(loadError)}
          </code>
          <p className="m-0 text-body text-fg-2">
            {t("mcpPage.noFilesChanged")}
          </p>
          <Button
            type="button"
            variant="neutral"
            size="regular"
            className="mt-1"
            onClick={() => void refetch()}
          >
            {t("common.retry")}
          </Button>
        </div>
      );
    }
    if (nInstalled === 0) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-10 pb-12 text-center">
          <h2 className="m-0 text-section">{t("skillsPage.emptyTitle")}</h2>
          <p className="m-0 text-body text-fg-2">{t("skillsPage.emptyBody")}</p>
        </div>
      );
    }

    return (
      <div
        data-testid="skills-matrix"
        className="min-h-0 overflow-auto scroll-stable"
      >
        <div className="min-w-[560px]">
          {filteredSkills.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
              <span className="text-body text-fg-2">
                {t("skillsPage.noMatch", { query: searchQuery.trim() })}
              </span>
              <Button
                type="button"
                variant="neutral"
                size="regular"
                onClick={() => setSearchQuery("")}
              >
                {t("mcpPage.clearSearch")}
              </Button>
            </div>
          ) : (
            <ul
              aria-label={t("skillsPage.listLabel")}
              className="m-0 list-none p-0"
            >
              {filteredSkills.map((skill) => {
                const rowFailedApps = appIds.filter(
                  (app) => fails[failKey(skill.id, app)],
                );
                const failure = rowFailedApps[0]
                  ? fails[failKey(skill.id, rowFailedApps[0])]
                  : undefined;
                const hasRepo = Boolean(skill.repoOwner && skill.repoName);
                const hasUpdate = Boolean(updatesMap[skill.id]);
                const isUpdating =
                  updateSkillMutation.isPending &&
                  updateSkillMutation.variables === skill.id;
                const showDir =
                  skill.directory &&
                  skill.directory.trim().toLowerCase() !==
                    skill.name.trim().toLowerCase();
                const sourceText = hasRepo
                  ? `${skill.repoOwner}/${skill.repoName}`
                  : t("skillsPage.source.local");
                return (
                  <li
                    key={skill.id}
                    className="group flex h-14 items-center rounded-control pe-2 ps-4 hover:bg-subtle"
                  >
                    <div className="flex min-w-0 flex-1 flex-col pe-3">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span
                          title={skill.name}
                          className="min-w-0 truncate text-body font-medium"
                        >
                          {skill.name}
                        </span>
                        {showDir && (
                          <span
                            title={skill.directory}
                            className="min-w-0 shrink truncate font-mono text-caption text-fg-3"
                          >
                            {skill.directory}
                          </span>
                        )}
                        <HoverTip content={t("skillsPage.copyDir")}>
                          <button
                            type="button"
                            aria-label={t("skillsPage.copyDir")}
                            onClick={() => void copyDirectory(skill)}
                            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-fg-3 opacity-0 transition-opacity hover:bg-selected hover:text-fg-1 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
                          >
                            <Copy className="h-3 w-3" strokeWidth={1.75} />
                          </button>
                        </HoverTip>
                        {hasUpdate && (
                          <HoverTip content={t("skills.update")}>
                            <button
                              type="button"
                              disabled={controlsDisabled || isUpdating}
                              onClick={() => void updateIds([skill.id])}
                              className="inline-flex h-[18px] shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-transparent bg-warning-soft px-1.5 text-badge font-medium text-warning-text hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                            >
                              {isUpdating && (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              )}
                              {t("skills.updateAvailable")}
                            </button>
                          </HoverTip>
                        )}
                      </div>
                      <div className="flex min-w-0 whitespace-nowrap text-caption text-fg-2">
                        {skill.description && (
                          <>
                            <span
                              className="min-w-0 truncate"
                              title={skill.description}
                            >
                              {skill.description}
                            </span>
                            <span aria-hidden="true" className="shrink-0">
                              &nbsp;·&nbsp;
                            </span>
                          </>
                        )}
                        {hasRepo ? (
                          <button
                            type="button"
                            onClick={() => void openDocs(skill)}
                            className="shrink-0 underline underline-offset-[3px] hover:text-fg-1"
                          >
                            {sourceText}
                          </button>
                        ) : (
                          <span className="shrink-0">{sourceText}</span>
                        )}
                        {failure && (
                          <span className="ms-1.5 flex min-w-0 text-warning-text">
                            <span className="min-w-0 truncate">
                              {t("skillsPage.rowFail", {
                                app: APP_DISPLAY_NAME[rowFailedApps[0]],
                                error: failure.error,
                              })}
                            </span>
                            <span aria-hidden="true" className="shrink-0">
                              &nbsp;·&nbsp;
                            </span>
                            <button
                              type="button"
                              onClick={() => setStorageOpen(true)}
                              className="shrink-0 underline underline-offset-[3px]"
                            >
                              {t("skillsPage.fixSync")}
                            </button>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 pe-1">
                      <AppMultiSelect
                        name={skill.name}
                        appIds={appIds}
                        disabled={controlsDisabled}
                        states={
                          Object.fromEntries(
                            appIds.map((app) => [
                              app,
                              fails[failKey(skill.id, app)]
                                ? "fail"
                                : skill.apps[app]
                                  ? "on"
                                  : "off",
                            ]),
                          ) as Record<AppId, AppSelectState>
                        }
                        onToggle={(app) => {
                          const fail = fails[failKey(skill.id, app)];
                          void writeOne(
                            skill.id,
                            app,
                            fail ? fail.desired : !skill.apps[app],
                          );
                        }}
                        onSetAll={(on) => void handleRowAll(skill, on)}
                      />
                    </div>
                    <div className="flex w-16 shrink-0 justify-end">
                      <HoverTip content={t("skills.uninstall")}>
                        <Button
                          type="button"
                          variant="quiet"
                          size="icon-compact"
                          aria-label={`${t("skills.uninstall")} ${skill.name}`}
                          disabled={controlsDisabled}
                          onClick={() => {
                            if (writeLockRef.current || interactionBlocked)
                              return;
                            setConfirm({
                              kind: "uninstall",
                              ids: [skill.id],
                            });
                          }}
                        >
                          <Trash2
                            className="h-[15px] w-[15px]"
                            strokeWidth={1.5}
                          />
                        </Button>
                      </HoverTip>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    );
  };

  const showUpdateRepoFailBanner =
    updateRepoFailures.length > 0 && dismissedRepoFailAt !== updatesCheckedAt;

  const uninstallTargets =
    confirm?.kind === "uninstall"
      ? installedSkills.filter((skill) => confirm.ids.includes(skill.id))
      : [];

  return (
    <>
      {header}
      <div id="main-content" className="flex min-h-0 flex-1 flex-col">
        <NoticeSlot className={cn(showUpdateRepoFailBanner && "px-6 pt-3")}>
          {showUpdateRepoFailBanner && (
            <Notice
              tone="warning"
              title={t("skillsPage.repoFail.title", {
                count: updateRepoFailures.length,
                repos: describeRepoFailures(updateRepoFailures, t),
              })}
              actions={
                <Button
                  type="button"
                  variant="neutral"
                  size="compact"
                  disabled={controlsDisabled}
                  onClick={() => void handleCheckUpdates()}
                >
                  {t("common.retry")}
                </Button>
              }
              onDismiss={() => setDismissedRepoFailAt(updatesCheckedAt)}
              dismissLabel={t("skillsPage.banner.close")}
            >
              {t("skillsPage.repoFail.updatesBody")}
            </Notice>
          )}
        </NoticeSlot>

        <div className="flex min-h-0 flex-1 flex-col px-6 pb-5 pt-3">
          {renderInstalledBody()}
        </div>
      </div>

      <V7ConfirmDialog
        open={confirm?.kind === "uninstall"}
        // 卸载前会备份、能从备份恢复：可恢复操作，不用红色确认键
        danger={false}
        title={
          uninstallTargets.length === 1
            ? t("skillsPage.confirm.uninstallOne", {
                name: uninstallTargets[0].name,
              })
            : t("skillsPage.confirm.uninstallMany", {
                count: uninstallTargets.length,
              })
        }
        body={t("skillsPage.confirm.uninstallBody", { path: BACKUP_DIR })}
        confirmLabel={
          uninstallTargets.length === 1
            ? t("skills.uninstall")
            : t("skillsPage.confirm.uninstallManyButton", {
                count: uninstallTargets.length,
              })
        }
        pending={writePending}
        onConfirm={() =>
          confirm?.kind === "uninstall" && void uninstallIds(confirm.ids)
        }
        onCancel={() => setConfirm(null)}
      />

      <V7ConfirmDialog
        open={confirm?.kind === "updateAll"}
        danger={false}
        title={t("skillsPage.confirm.updateAll", { count: nUpdates })}
        body={t("skillsPage.confirm.updateBody", { path: BACKUP_DIR })}
        details={
          <ul
            aria-label={t("skillsPage.confirm.updateListAria")}
            className="max-h-60 divide-y divide-border overflow-y-auto rounded-control border border-border"
          >
            {applicableSkillUpdates.map((update) => {
              const skill = installedSkills.find(
                (item) => item.id === update.id,
              );
              const repo =
                skill?.repoOwner && skill.repoName
                  ? `${skill.repoOwner}/${skill.repoName}`
                  : null;
              return (
                <li
                  key={update.id}
                  className="flex items-baseline gap-2 px-3 py-2 text-body"
                >
                  <span className="min-w-0 truncate font-medium text-fg-1">
                    {skill?.name ?? update.name}
                  </span>
                  {repo && skill && (
                    // 和列表行的来源链接一样：有 README 地址开 README，否则开仓库首页
                    <button
                      type="button"
                      onClick={() => void openDocs(skill)}
                      className="ms-auto shrink-0 rounded-sm font-mono text-caption text-fg-3 underline decoration-border-strong underline-offset-[3px] hover:text-fg-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {repo}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        }
        confirmLabel={t("skillsPage.confirm.updateAllButton", {
          count: nUpdates,
        })}
        pending={writePending || isUpdatingMany}
        onConfirm={() =>
          void updateIds(
            applicableSkillUpdates.map((update) => update.id),
            true,
          )
        }
        onCancel={() => setConfirm(null)}
      />

      <SkillRestoreDialog
        open={restoreOpen}
        backups={skillBackups}
        isLoading={isFetchingSkillBackups}
        isRestoring={restoreBackupMutation.isPending}
        isDeleting={deleteBackupMutation.isPending}
        targetsLabel={names(targets)}
        onRestore={(backupId) => void handleRestoreFromBackup(backupId)}
        onDelete={(backup) => {
          if (checkUpdatesLockRef.current || writeLockRef.current) return;
          setConfirm({ kind: "deleteBackup", backup });
        }}
        onClose={() => setRestoreOpen(false)}
      />

      <V7ConfirmDialog
        open={confirm?.kind === "deleteBackup"}
        title={t("skills.restoreFromBackup.deleteConfirmTitle")}
        body={
          confirm?.kind === "deleteBackup"
            ? t("skills.restoreFromBackup.deleteConfirmMessage", {
                name: confirm.backup.skill.name,
              })
            : ""
        }
        confirmLabel={t("skills.restoreFromBackup.delete")}
        pending={writePending}
        onConfirm={() =>
          confirm?.kind === "deleteBackup" &&
          void confirmDeleteBackup(confirm.backup)
        }
        onCancel={() => setConfirm(null)}
      />

      <SkillsStorageSheet open={storageOpen} onOpenChange={setStorageOpen} />
    </>
  );
};

UnifiedSkillsPanel.displayName = "UnifiedSkillsPanel";

export default UnifiedSkillsPanel;
