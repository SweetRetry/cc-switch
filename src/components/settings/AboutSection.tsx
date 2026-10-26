import { useCallback, useEffect, useState } from "react";
import { Download, Info, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { getVersion } from "@tauri-apps/api/app";
import { settingsApi } from "@/lib/api";
import { useUpdate } from "@/contexts/UpdateContext";
import { Badge } from "@/components/ui/badge";
import { extractErrorMessage } from "@/utils/errorUtils";

interface AboutSectionProps {
  isPortable: boolean;
}

// 应用自身版本（getVersion，本地毫秒级、无网络）也缓存一份，纯为重挂时免去 loading 闪烁。
let appVersionCache: string | null = null;

/**
 * 设置页底部一行：版本、便携模式、检查更新 / 安装并重启、项目链接。
 * 命令行应用的安装与升级在侧栏「应用」页。
 */
export function AboutSection({ isPortable }: AboutSectionProps) {
  const { t } = useTranslation();
  // 惰性初始化自模块缓存：重挂时首帧即渲染上次的值，避免 loading 闪烁；首次挂载缓存
  // 为空则回退到原始初值（null / loading）。
  const [version, setVersion] = useState<string | null>(() => appVersionCache);
  const [isLoadingVersion, setIsLoadingVersion] = useState(
    () => appVersionCache === null,
  );
  const [isDownloading, setIsDownloading] = useState(false);

  const { hasUpdate, updateInfo, checkUpdate, resetDismiss, isChecking } =
    useUpdate();

  useEffect(() => {
    let active = true;
    const loadAppVersion = async () => {
      try {
        const appVersion = await getVersion();
        appVersionCache = appVersion;
        if (active) {
          setVersion(appVersion);
        }
      } catch (error) {
        console.error("[AboutSection] Failed to load app version", error);
        if (active) {
          setVersion(null);
        }
      } finally {
        if (active) {
          setIsLoadingVersion(false);
        }
      }
    };

    void loadAppVersion();
    return () => {
      active = false;
    };
  }, []);

  const handleOpenReleaseNotes = useCallback(async () => {
    try {
      const targetVersion = updateInfo?.availableVersion ?? version ?? "";
      const displayVersion = targetVersion.startsWith("v")
        ? targetVersion
        : targetVersion
          ? `v${targetVersion}`
          : "";

      if (!displayVersion) {
        await settingsApi.openExternal(
          "https://github.com/farion1231/cc-switch/releases",
        );
        return;
      }

      await settingsApi.openExternal(
        `https://github.com/farion1231/cc-switch/releases/tag/${displayVersion}`,
      );
    } catch (error) {
      console.error("[AboutSection] Failed to open release notes", error);
      toast.error(t("settings.openReleaseNotesFailed"));
    }
  }, [t, updateInfo?.availableVersion, version]);

  const handleOpenGithub = useCallback(() => {
    void settingsApi.openExternal("https://github.com/farion1231/cc-switch");
  }, []);

  const handleCheckUpdate = useCallback(async () => {
    if (hasUpdate) {
      if (isPortable) {
        try {
          await settingsApi.openPortableUpdateDownload(
            updateInfo?.availableVersion ?? "",
          );
        } catch (error) {
          console.error("[AboutSection] Portable update failed", error);
        }
        return;
      }

      setIsDownloading(true);
      try {
        resetDismiss();
        const installed = await settingsApi.installUpdateAndRestart();
        if (!installed) {
          toast.success(t("settings.upToDate"), { closeButton: true });
        }
      } catch (error) {
        console.error("[AboutSection] Update failed", error);
        toast.error(t("settings.updateFailed"), {
          description: extractErrorMessage(error) || undefined,
          closeButton: true,
        });
        try {
          await settingsApi.checkUpdates();
        } catch (fallbackError) {
          console.error(
            "[AboutSection] Failed to open fallback updater",
            fallbackError,
          );
        }
      } finally {
        setIsDownloading(false);
      }
      return;
    }

    try {
      const available = await checkUpdate();
      if (!available) {
        toast.success(t("settings.upToDate"), { closeButton: true });
      }
    } catch (error) {
      console.error("[AboutSection] Check update failed", error);
      toast.error(t("settings.checkUpdateFailed"), {
        description: extractErrorMessage(error) || undefined,
        closeButton: true,
      });
    }
  }, [
    checkUpdate,
    hasUpdate,
    isPortable,
    resetDismiss,
    t,
    updateInfo?.availableVersion,
  ]);

  const displayVersion = version ?? t("common.unknown");

  const linkClass =
    "text-fg-2 transition-colors hover:text-fg-1 hover:underline";

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-body">
        {isLoadingVersion ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-fg-3" />
        ) : (
          <span className="tabular-nums text-fg-1">{`CC Switch v${displayVersion}`}</span>
        )}
        {isPortable && (
          <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-badge">
            <Info className="h-3 w-3" />
            {t("settings.portableMode")}
          </Badge>
        )}
        <Button
          type="button"
          variant={hasUpdate ? "solid" : "neutral"}
          size="compact"
          onClick={handleCheckUpdate}
          disabled={isChecking || isDownloading}
        >
          {isDownloading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t("settings.updating")}
            </>
          ) : hasUpdate ? (
            <>
              <Download className="h-3.5 w-3.5" />
              {t("settings.updateTo", {
                version: updateInfo?.availableVersion ?? "",
              })}
            </>
          ) : isChecking ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              {t("settings.checking")}
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              {t("settings.checkForUpdates")}
            </>
          )}
        </Button>
        <div className="ms-auto flex items-center gap-3 text-caption">
          <button
            type="button"
            className={linkClass}
            onClick={handleOpenGithub}
          >
            {t("settings.github")}
          </button>
          <button
            type="button"
            className={linkClass}
            onClick={() => settingsApi.openExternal("https://ccswitch.io")}
          >
            {t("settings.officialWebsite")}
          </button>
          <button
            type="button"
            className={linkClass}
            onClick={handleOpenReleaseNotes}
          >
            {t("settings.releaseNotes")}
          </button>
        </div>
      </div>

      {hasUpdate && updateInfo && (
        <div className="space-y-1 text-body">
          {updateInfo.notes && (
            <p className="line-clamp-3 text-fg-2">{updateInfo.notes}</p>
          )}
          {isPortable && (
            <p className="text-fg-2">{t("settings.portableUpdateHint")}</p>
          )}
        </div>
      )}
    </div>
  );
}
