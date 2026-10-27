import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { settingsApi } from "@/lib/api";
import { useUpdate } from "@/contexts/UpdateContext";
import { extractErrorMessage } from "@/utils/errorUtils";

/**
 * CC Switch 自身更新的唯一入口（侧栏品牌行、设置页「检查更新」共用）：
 * 有新版本时 run 安装并重启（便携版改为打开下载页），没有时检查一次。
 */
export function useAppUpdate() {
  const { t } = useTranslation();
  const { hasUpdate, updateInfo, checkUpdate, resetDismiss, isChecking } =
    useUpdate();
  const { data: isPortable = false } = useQuery({
    queryKey: ["is-portable"],
    queryFn: () => settingsApi.isPortable().catch(() => false),
    staleTime: Infinity,
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const availableVersion = updateInfo?.availableVersion ?? "";

  const run = useCallback(async () => {
    if (hasUpdate) {
      if (isPortable) {
        try {
          await settingsApi.openPortableUpdateDownload(availableVersion);
        } catch (error) {
          console.error("[useAppUpdate] Portable update failed", error);
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
        console.error("[useAppUpdate] Update failed", error);
        toast.error(t("settings.updateFailed"), {
          description: extractErrorMessage(error) || undefined,
          closeButton: true,
        });
        try {
          await settingsApi.checkUpdates();
        } catch (fallbackError) {
          console.error(
            "[useAppUpdate] Failed to open fallback updater",
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
      console.error("[useAppUpdate] Check update failed", error);
      toast.error(t("settings.checkUpdateFailed"), {
        description: extractErrorMessage(error) || undefined,
        closeButton: true,
      });
    }
  }, [availableVersion, checkUpdate, hasUpdate, isPortable, resetDismiss, t]);

  return {
    hasUpdate,
    updateInfo,
    availableVersion,
    isPortable,
    isChecking,
    isDownloading,
    run,
  };
}
