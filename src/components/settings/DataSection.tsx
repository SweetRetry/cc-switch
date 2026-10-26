import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BackupHistory } from "@/components/settings/BackupHistory";
import { useBackupManager } from "@/hooks/useBackupManager";
import type { UseImportExportResult } from "@/hooks/useImportExport";
import type { SettingsFormState } from "@/hooks/useSettings";
import { settingsApi, type LogConfig } from "@/lib/api/settings";
import { extractErrorMessage } from "@/utils/errorUtils";

const LOG_LEVELS = ["error", "warn", "info", "debug", "trace"] as const;

interface DataSectionProps {
  settings: SettingsFormState;
  onAutoSave: (updates: Partial<SettingsFormState>) => Promise<boolean>;
  importExport: UseImportExportResult;
  appConfigDir?: string;
  initialAppConfigDir?: string;
  resolvedAppConfigDir?: string;
  isSaving: boolean;
  onBrowseAppConfigDir: () => Promise<void>;
  onResetAppConfigDir: () => Promise<void>;
  onCancelAppConfigDir: () => void;
  onSaveAppConfigDir: () => void;
}

/**
 * 数据页：动作在上（立即备份、导出、导入），备份历史居中，
 * 设一次就不再动的配置目录和诊断日志沉在底部。
 */
export function DataSection({
  settings,
  onAutoSave,
  importExport,
  appConfigDir,
  initialAppConfigDir,
  resolvedAppConfigDir,
  isSaving,
  onBrowseAppConfigDir,
  onResetAppConfigDir,
  onCancelAppConfigDir,
  onSaveAppConfigDir,
}: DataSectionProps) {
  const { t } = useTranslation();
  const manager = useBackupManager();
  const { selectedFile, isImporting } = importExport;

  const handleCreate = async () => {
    try {
      await manager.create();
      toast.success(t("settings.backupManager.createSuccess"));
    } catch (error) {
      toast.error(
        extractErrorMessage(error) || t("settings.backupManager.createFailed"),
      );
    }
  };

  const appConfigDirty =
    (appConfigDir?.trim() || undefined) !==
    (initialAppConfigDir?.trim() || undefined);
  const displayDir = appConfigDir || resolvedAppConfigDir || "";

  return (
    <>
      <div>
        <div className="flex items-center gap-2">
          <Button
            variant="solid"
            size="regular"
            disabled={manager.isCreating || manager.isRestoring}
            onClick={() => void handleCreate()}
          >
            {manager.isCreating
              ? t("settings.backupManager.creating")
              : t("settings.backupManager.createBackup")}
          </Button>
          <div className="ms-auto flex items-center gap-1">
            <Button
              variant="quiet"
              size="regular"
              onClick={() => void importExport.exportConfig()}
            >
              <Download className="h-4 w-4" />
              {t("settings.data.export")}
            </Button>
            <Button
              variant="quiet"
              size="regular"
              disabled={isImporting || !!selectedFile}
              onClick={() => void importExport.selectImportFile()}
            >
              <Upload className="h-4 w-4" />
              {t("settings.data.import")}
            </Button>
          </div>
        </div>
        <ImportBanner importExport={importExport} />
      </div>

      <BackupHistory
        manager={manager}
        backupIntervalHours={settings.backupIntervalHours}
        backupRetainCount={settings.backupRetainCount}
        onSettingsChange={(updates) => void onAutoSave(updates)}
      />

      <div className="mt-3 grid auto-rows-[minmax(2rem,auto)] grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3 border-t border-border pt-5 text-body">
        <span className="text-fg-2">{t("settings.data.configDir")}</span>
        <div className="flex min-w-0 items-center justify-end gap-1">
          <span
            className="me-2 min-w-0 truncate font-mono text-caption text-fg-2"
            title={displayDir}
          >
            {displayDir}
          </span>
          {appConfigDirty ? (
            <>
              <Button
                variant="quiet"
                size="compact"
                disabled={isSaving}
                onClick={onCancelAppConfigDir}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="solid"
                size="compact"
                disabled={isSaving}
                onClick={onSaveAppConfigDir}
              >
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {t("common.save")}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="quiet"
                size="compact"
                onClick={() => void onBrowseAppConfigDir()}
              >
                {t("settings.data.change")}
              </Button>
              {initialAppConfigDir && (
                <Button
                  variant="quiet"
                  size="compact"
                  onClick={() => void onResetAppConfigDir()}
                >
                  {t("settings.data.useDefault")}
                </Button>
              )}
            </>
          )}
        </div>
        <LogRow />
      </div>
    </>
  );
}

/** 选好的文件、导入进度与结果都在动作栏下面这一条里 */
function ImportBanner({
  importExport,
}: {
  importExport: UseImportExportResult;
}) {
  const { t } = useTranslation();
  const {
    selectedFile,
    status,
    errorMessage,
    backupId,
    isImporting,
    clearSelection,
    importConfig,
    resetStatus,
  } = importExport;
  const fileName = selectedFile.split(/[\\/]/).pop() || selectedFile;
  const base = "mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-body";

  const result =
    status === "success" ? (
      <div className={`${base} bg-success-soft text-success-text`}>
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="m-0">
            {t("settings.importSuccess")} {t("settings.autoReload")}
          </p>
          {backupId && (
            <p className="m-0 text-caption">
              {t("settings.backupId")}: {backupId}
            </p>
          )}
        </div>
        <DismissButton onClick={resetStatus} />
      </div>
    ) : status === "partial-success" ? (
      <div className={`${base} bg-warning-soft text-warning-text`}>
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="m-0">{t("settings.importPartialSuccess")}</p>
          <p className="m-0 text-caption">{t("settings.importPartialHint")}</p>
        </div>
        <DismissButton onClick={resetStatus} />
      </div>
    ) : status === "error" ? (
      <div className={`${base} bg-danger-soft text-danger-text`}>
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="m-0">{t("settings.importFailed")}</p>
          <p className="m-0 break-all text-caption">{errorMessage}</p>
        </div>
        <DismissButton onClick={resetStatus} />
      </div>
    ) : null;

  if (isImporting || status === "importing") {
    return (
      <div className={`${base} items-center bg-subtle text-fg-2`}>
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        {t("settings.importing")}
      </div>
    );
  }

  return (
    <>
      {result}
      {selectedFile && status !== "success" && (
        <div className={`${base} items-center bg-subtle`}>
          <FileText className="h-4 w-4 shrink-0 text-fg-2" />
          <span className="min-w-0 flex-1 truncate font-mono text-caption text-fg-1">
            {fileName}
          </span>
          <Button variant="quiet" size="compact" onClick={clearSelection}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="solid"
            size="compact"
            onClick={() => void importConfig()}
          >
            {t("settings.import")}
          </Button>
        </div>
      )}
    </>
  );
}

function DismissButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <Button
      variant="quiet"
      size="icon-compact"
      className="-my-1 shrink-0 text-current"
      onClick={onClick}
      aria-label={t("common.close")}
    >
      <X className="h-3.5 w-3.5" />
    </Button>
  );
}

/** 诊断日志一行：打开日志、级别（仅开启时显示）、开关，右对齐 */
function LogRow() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<LogConfig>({
    enabled: true,
    level: "info",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    settingsApi
      .getLogConfig()
      .then(setConfig)
      .catch((e) => console.error("Failed to load log config:", e))
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = async (updates: Partial<LogConfig>) => {
    const previous = config;
    const next = { ...config, ...updates };
    setConfig(next);
    try {
      await settingsApi.setLogConfig(next);
    } catch (e) {
      console.error("Failed to save log config:", e);
      toast.error(String(e));
      setConfig(previous);
    }
  };

  const handleReveal = async () => {
    try {
      await settingsApi.revealAppLogFile();
    } catch (error) {
      toast.error(
        t("settings.advanced.logConfig.openLogFailed", {
          error: String(error),
        }),
      );
    }
  };

  return (
    <>
      <span
        className="text-fg-2"
        title={t("settings.advanced.logConfig.enabledDescription")}
      >
        {t("settings.data.logs")}
      </span>
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="quiet"
          size="compact"
          onClick={() => void handleReveal()}
        >
          {t("settings.advanced.logConfig.openLog")}
        </Button>
        {config.enabled && (
          <Select
            value={config.level}
            disabled={isLoading}
            onValueChange={(value) =>
              void handleChange({ level: value as LogConfig["level"] })
            }
          >
            <SelectTrigger
              aria-label={t("settings.advanced.logConfig.level")}
              className="h-7 w-auto gap-1 border-transparent bg-transparent px-2 text-fg-2 shadow-none hover:bg-subtle hover:text-fg-1"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOG_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {t(`settings.advanced.logConfig.levels.${level}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Switch
          className="ms-2"
          checked={config.enabled}
          disabled={isLoading}
          aria-label={t("settings.advanced.logConfig.enabled")}
          onCheckedChange={(checked) => void handleChange({ enabled: checked })}
        />
      </div>
    </>
  );
}
