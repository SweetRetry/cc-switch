import { useTranslation } from "react-i18next";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "@/lib/toast";
import { useResyncSkillsToApps, useSkillsDir } from "@/hooks/useSkills";
import { DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { V7Dialog } from "@/components/mcp/formBits";
import { APP_DISPLAY_NAME } from "@/components/shell/AppGlyph";
import { skillsApi, type SkillAppSyncOutcome } from "@/lib/api/skills";
import type { AppId } from "@/lib/api/types";
import { extractErrorMessage } from "@/utils/errorUtils";

const shortenHomePath = (value: string) =>
  value
    .replace(/^\/Users\/[^/]+(?=\/|$)/, "~")
    .replace(/^\/home\/[^/]+(?=\/|$)/, "~")
    .replace(/^[A-Za-z]:\\Users\\[^\\]+(?=\\|$)/, "~");

interface SkillsStorageSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const appName = (app: string) => APP_DISPLAY_NAME[app as AppId] ?? app;

const DEFAULT_SKILLS_DIR = "~/.agents/skills";

/** Skills 页 ⋯ →「存储与同步」对话框：主副本固定在 ~/.agents/skills，各应用只放软链；这里能打开目录、重新同步。 */
export function SkillsStorageSheet({
  open,
  onOpenChange,
}: SkillsStorageSheetProps) {
  const { t } = useTranslation();
  const { data: skillsDirRaw } = useSkillsDir(open);
  const resyncMutation = useResyncSkillsToApps();
  const skillsDir = skillsDirRaw
    ? shortenHomePath(skillsDirRaw)
    : DEFAULT_SKILLS_DIR;

  const handleOpenFolder = async () => {
    try {
      await skillsApi.openSkillsDir();
    } catch (error) {
      toast.error(t("common.error"), {
        description: extractErrorMessage(error) || String(error),
      });
    }
  };

  const reportResync = (outcomes: SkillAppSyncOutcome[]) => {
    const failed = outcomes.filter((outcome) => !outcome.ok);
    if (failed.length === 0) {
      toast.success(t("skills.storageSheet.resyncDone"), { closeButton: true });
      return;
    }
    const details = failed.flatMap((outcome) =>
      outcome.error
        ? [`${appName(outcome.app)}: ${outcome.error}`]
        : outcome.failedSkills.map(
            (skill) =>
              `${appName(outcome.app)} · ${t(
                "skills.storageSheet.resyncSkillItem",
                { directory: skill.directory, error: skill.error },
              )}`,
          ),
    );
    toast.warning(
      t("skills.storageSheet.resyncPartial", {
        count: failed.length,
        apps: failed
          .map((outcome) => appName(outcome.app))
          .join(t("mcpPage.listSeparator")),
      }),
      { description: details.join("\n"), closeButton: true },
    );
  };

  const handleResync = async () => {
    if (resyncMutation.isPending) return;
    try {
      reportResync(await resyncMutation.mutateAsync());
    } catch (error) {
      toast.error(t("common.error"), {
        description: extractErrorMessage(error) || String(error),
      });
    }
  };

  return (
    <V7Dialog open={open} onOpenChange={onOpenChange} width={520}>
      <DialogTitle>{t("skills.storageSheet.title")}</DialogTitle>

      <div className="flex min-w-0 flex-col gap-2">
        <p className="m-0 text-body text-fg-1">
          {t("skills.storageSheet.fixedBody")}
        </p>
        <div className="flex min-w-0 items-center gap-2">
          <code
            className="min-w-0 truncate font-mono text-caption text-fg-2"
            title={skillsDirRaw ?? skillsDir}
          >
            {skillsDir}
          </code>
          <button
            type="button"
            aria-label={t("skills.storageSheet.openFolderAria", {
              path: skillsDir,
            })}
            onClick={() => void handleOpenFolder()}
            className="shrink-0 whitespace-nowrap text-caption font-medium text-fg-1 underline decoration-border-strong underline-offset-[3px] hover:decoration-fg-1"
          >
            {t("skills.storageSheet.openFolder")}
          </button>
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="flex items-center gap-3">
        <p className="m-0 min-w-0 flex-1 text-caption text-fg-2">
          {t("skills.storageSheet.resyncHint")}
        </p>
        <Button
          type="button"
          variant="neutral"
          size="compact"
          className="shrink-0"
          disabled={resyncMutation.isPending}
          onClick={() => void handleResync()}
        >
          {resyncMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
          )}
          {resyncMutation.isPending
            ? t("skills.storageSheet.resyncing")
            : t("skills.storageSheet.resync")}
        </Button>
      </div>

      <div className="flex justify-end pt-1">
        <Button
          type="button"
          variant="solid"
          size="regular"
          autoFocus
          onClick={() => onOpenChange(false)}
        >
          {t("common.done")}
        </Button>
      </div>
    </V7Dialog>
  );
}
