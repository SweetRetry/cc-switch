import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { Check, ChevronDown, Pencil, RotateCcw, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { HoverTip } from "@/components/ui/hover-tip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { useBackupManager } from "@/hooks/useBackupManager";
import type { BackupEntry } from "@/lib/api/settings";
import {
  BackupStorageSection,
  formatBytes,
} from "@/components/settings/BackupStorageSection";
import { extractErrorMessage } from "@/utils/errorUtils";

interface BackupHistoryProps {
  manager: ReturnType<typeof useBackupManager>;
  backupIntervalHours?: number;
  backupRetainCount?: number;
  onSettingsChange: (updates: {
    backupIntervalHours?: number;
    backupRetainCount?: number;
  }) => void;
}

/** 列表默认只显示最近几份，保留份数可到 50，不能铺满一屏 */
const VISIBLE_COUNT = 5;
const INTERVAL_HOURS = [0, 6, 12, 24, 48, 168];
const RETAIN_COUNTS = [3, 5, 10, 15, 20, 30, 50];

const DEFAULT_NAME_RE = /^db_backup_\d{8}_\d{6}(?:_\d+)?\.db$/;

/** 默认命名的备份，文件名只是时间戳，时间本身已经是第一行，不再重复 */
function isDefaultName(filename: string): boolean {
  return DEFAULT_NAME_RE.test(filename);
}

function getDisplayName(filename: string): string {
  const match = filename.match(
    /^db_backup_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})(?:_\d+)?\.db$/,
  );
  if (match) {
    const [, y, m, d, hh, mm, ss] = match;
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  }
  return filename.replace(/\.db$/, "");
}

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** 今天 / 昨天 加时间，更早的显示日期加时间；星期与月份名跟随界面语言 */
function formatBackupTime(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const now = new Date();
  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (dayDiff === 0 || dayDiff === 1) {
    const day = new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
      dayDiff === 0 ? 0 : -1,
      "day",
    );
    return `${day} ${time}`;
  }
  const day = new Intl.DateTimeFormat(locale, {
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
  return `${day} ${time}`;
}

export function BackupHistory({
  manager,
  backupIntervalHours,
  backupRetainCount,
  onSettingsChange,
}: BackupHistoryProps) {
  const { t, i18n } = useTranslation();
  const { backups, isLoading, restore, isRestoring, rename, isRenaming } =
    manager;
  const { remove, isDeleting } = manager;
  const [confirmFilename, setConfirmFilename] = useState<string | null>(null);
  const [deleteFilename, setDeleteFilename] = useState<string | null>(null);
  const [editingFilename, setEditingFilename] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showAll, setShowAll] = useState(false);

  const intervalHours = backupIntervalHours ?? 24;
  const retainCount = backupRetainCount ?? 10;
  const visible = showAll ? backups : backups.slice(0, VISIBLE_COUNT);
  const hiddenCount = backups.length - VISIBLE_COUNT;
  const renameLabel = t("settings.backupManager.rename");
  const deleteLabel = t("settings.backupManager.delete");

  const intervalLabel = (hours: number) =>
    hours === 0
      ? t("settings.backupManager.intervalDisabled")
      : hours === 168
        ? t("settings.backupManager.intervalDays", { days: 7 })
        : t("settings.backupManager.intervalHours", { hours });

  const policySummary =
    intervalHours === 0
      ? t("settings.backupManager.policyOff", { count: retainCount })
      : t("settings.backupManager.policy", {
          interval: intervalLabel(intervalHours),
          count: retainCount,
        });

  const handleRestore = async () => {
    if (!confirmFilename) return;
    try {
      const safetyId = await restore(confirmFilename);
      setConfirmFilename(null);
      toast.success(t("settings.backupManager.restoreSuccess"), {
        description: safetyId
          ? `${t("settings.backupManager.safetyBackupId")}: ${safetyId}`
          : undefined,
        duration: 6000,
        closeButton: true,
      });
    } catch (error) {
      toast.error(
        extractErrorMessage(error) || t("settings.backupManager.restoreFailed"),
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteFilename) return;
    try {
      await remove(deleteFilename);
      setDeleteFilename(null);
      toast.success(t("settings.backupManager.deleteSuccess"));
    } catch (error) {
      toast.error(
        extractErrorMessage(error) || t("settings.backupManager.deleteFailed"),
      );
    }
  };

  const handleStartRename = (filename: string) => {
    setEditingFilename(filename);
    setEditValue(getDisplayName(filename));
  };

  const handleCancelRename = () => {
    setEditingFilename(null);
    setEditValue("");
  };

  const handleConfirmRename = async () => {
    if (!editingFilename || !editValue.trim()) return;
    try {
      await rename({ oldFilename: editingFilename, newName: editValue.trim() });
      handleCancelRename();
      toast.success(t("settings.backupManager.renameSuccess"));
    } catch (error) {
      toast.error(
        extractErrorMessage(error) || t("settings.backupManager.renameFailed"),
      );
    }
  };

  const renderRow = (backup: BackupEntry) => {
    const time = formatBackupTime(backup.createdAt, i18n.language);
    const size = formatBytes(backup.sizeBytes);
    const defaultName = isDefaultName(backup.filename);
    const editing = editingFilename === backup.filename;
    const reveal =
      "opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100";

    return (
      <div
        key={backup.filename}
        className="group relative -mx-2 flex items-center gap-2 rounded-lg px-2 py-2.5 transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-px after:bg-border/40 last:after:hidden focus-within:bg-subtle hover:bg-subtle hover:after:hidden focus-within:after:hidden"
      >
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex items-center gap-1.5">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleConfirmRename();
                  if (e.key === "Escape") handleCancelRename();
                }}
                className="h-7 text-caption"
                placeholder={t("settings.backupManager.namePlaceholder")}
                autoFocus
                disabled={isRenaming}
              />
              <Button
                variant="quiet"
                size="icon-compact"
                onClick={() => void handleConfirmRename()}
                disabled={isRenaming || !editValue.trim()}
                aria-label={t("common.save")}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="quiet"
                size="icon-compact"
                onClick={handleCancelRename}
                disabled={isRenaming}
                aria-label={t("common.cancel")}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <>
              <div className="truncate text-body font-medium text-fg-1">
                {defaultName ? time : getDisplayName(backup.filename)}
              </div>
              <div className="truncate text-caption text-fg-2">
                {defaultName ? size : `${time} · ${size}`}
              </div>
            </>
          )}
        </div>
        {!editing && (
          <div className="flex shrink-0 items-center gap-0.5">
            <HoverTip content={renameLabel}>
              <Button
                variant="quiet"
                size="icon-compact"
                className={reveal}
                onClick={() => handleStartRename(backup.filename)}
                disabled={isRestoring || isRenaming || isDeleting}
                aria-label={renameLabel}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </HoverTip>
            <HoverTip content={deleteLabel}>
              <Button
                variant="quiet"
                size="icon-compact"
                className={reveal}
                onClick={() => setDeleteFilename(backup.filename)}
                disabled={isRestoring || isDeleting}
                aria-label={deleteLabel}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </HoverTip>
            <Button
              variant="quiet"
              size="compact"
              disabled={isRestoring || isDeleting}
              onClick={() => setConfirmFilename(backup.filename)}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("settings.backupManager.restore")}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <section>
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="m-0 flex items-center gap-2 text-body font-medium text-fg-1">
          {t("settings.backupManager.history")}
          {backups.length > 0 && (
            <span className="text-caption font-normal text-fg-2">
              {backups.length}
            </span>
          )}
        </h2>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="quiet"
              size="compact"
              className="font-normal text-fg-2"
            >
              {policySummary}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 space-y-3 p-4">
            <div className="space-y-1.5">
              <Label className="text-body">
                {t("settings.backupManager.intervalLabel")}
              </Label>
              <Select
                value={String(intervalHours)}
                onValueChange={(v) =>
                  onSettingsChange({ backupIntervalHours: Number(v) })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVAL_HOURS.map((hours) => (
                    <SelectItem key={hours} value={String(hours)}>
                      {intervalLabel(hours)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-body">
                {t("settings.backupManager.retainLabel")}
              </Label>
              <Select
                value={String(retainCount)}
                onValueChange={(v) =>
                  onSettingsChange({ backupRetainCount: Number(v) })
                }
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RETAIN_COUNTS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div>
        {isLoading ? (
          <div className="py-3 text-body text-fg-2">{t("common.loading")}</div>
        ) : backups.length === 0 ? (
          <div className="py-3 text-body text-fg-2">
            {t("settings.backupManager.empty")}
          </div>
        ) : (
          <div>{visible.map(renderRow)}</div>
        )}
        {hiddenCount > 0 && (
          <button
            type="button"
            className="py-2 text-caption text-fg-2 transition-colors hover:text-fg-1"
            onClick={() => setShowAll((value) => !value)}
          >
            {showAll
              ? t("settings.backupManager.showLess")
              : t("settings.backupManager.showEarlier", { count: hiddenCount })}
          </button>
        )}
      </div>

      <div className="mt-2">
        <BackupStorageSection />
      </div>

      <Dialog
        open={!!confirmFilename}
        onOpenChange={(open) => !open && setConfirmFilename(null)}
      >
        <DialogContent className="max-w-md" zIndex="alert">
          <DialogHeader>
            <DialogTitle>
              {t("settings.backupManager.confirmTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("settings.backupManager.confirmMessage")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmFilename(null)}
              disabled={isRestoring}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={() => void handleRestore()} disabled={isRestoring}>
              {isRestoring
                ? t("settings.backupManager.restoring")
                : t("settings.backupManager.restore")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteFilename}
        onOpenChange={(open) => !open && setDeleteFilename(null)}
      >
        <DialogContent className="max-w-md" zIndex="alert">
          <DialogHeader>
            <DialogTitle>
              {t("settings.backupManager.deleteConfirmTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("settings.backupManager.deleteConfirmMessage")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteFilename(null)}
              disabled={isDeleting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
            >
              {isDeleting
                ? t("settings.backupManager.deleting")
                : t("settings.backupManager.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
