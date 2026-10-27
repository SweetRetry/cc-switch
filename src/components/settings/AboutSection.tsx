import { useCallback, useEffect, useState } from "react";
import { Info, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { toast } from "@/lib/toast";
import { getVersion } from "@tauri-apps/api/app";
import { settingsApi } from "@/lib/api";
import { useAppUpdate } from "@/hooks/useAppUpdate";
import { Badge } from "@/components/ui/badge";

/**
 * 设置页底部一行：便携模式、检查更新、项目链接。版本号和「更新到 vX」在侧栏底部的品牌行，
 * 命令行应用的安装与升级在侧栏「应用」页。
 */
export function AboutSection() {
  const { t } = useTranslation();
  const [version, setVersion] = useState<string | null>(null);
  const { hasUpdate, updateInfo, isPortable, isChecking, run } = useAppUpdate();

  useEffect(() => {
    let active = true;
    void getVersion()
      .then((appVersion) => active && setVersion(appVersion))
      .catch(() => undefined);
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

  const linkClass =
    "text-fg-2 transition-colors hover:text-fg-1 hover:underline";

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-body">
        {isPortable && (
          <Badge variant="secondary" className="gap-1 px-1.5 py-0 text-badge">
            <Info className="h-3 w-3" />
            {t("settings.portableMode")}
          </Badge>
        )}
        {!hasUpdate && (
          <Button
            type="button"
            variant="ghost"
            size="compact"
            onClick={() => void run()}
            disabled={isChecking}
          >
            <RefreshCw
              className={
                isChecking ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"
              }
            />
            {isChecking
              ? t("settings.checking")
              : t("settings.checkForUpdates")}
          </Button>
        )}
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
