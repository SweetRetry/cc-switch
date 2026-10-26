import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { promptsApi, settingsApi, type AppId } from "@/lib/api";
import { promptKeys, usePromptFileLocationQuery } from "@/lib/query/prompts";
import { toast } from "@/lib/toast";
import { extractErrorMessage } from "@/utils/errorUtils";
import { PromptPageFrame } from "./PromptPageFrame";
import { copyText, formatSize, promptFileName, utf8Bytes } from "./promptUtils";

export interface PromptPanelProps {
  appId: AppId;
  apps: AppId[];
  onAppChange: (app: AppId) => void;
  open?: boolean;
  onInteractionBlockedChange?: (blocked: boolean) => void;
  onNavigationBlockedChange?: (blocked: boolean) => void;
}

export default function PromptPanel({
  appId,
  apps,
  onAppChange,
  open = true,
  onInteractionBlockedChange,
  onNavigationBlockedChange,
}: PromptPanelProps) {
  const { t } = useTranslation();
  const location = usePromptFileLocationQuery(appId, open);
  const file = useQuery({
    queryKey: promptKeys.content(appId),
    queryFn: () => promptsApi.getCurrentFileContent(appId),
    enabled: open,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });
  const path = location.data?.displayPath ?? promptFileName(appId);
  const content = file.data;
  const failed = file.isError || location.isError;
  const loading = file.isPending || location.isPending;

  useEffect(() => {
    onInteractionBlockedChange?.(false);
    onNavigationBlockedChange?.(false);
  }, [onInteractionBlockedChange, onNavigationBlockedChange]);

  const copy = async (text: string, message: string) => {
    if (await copyText(text)) toast.success(message);
    else toast.error(t("prompts.copyFailed"));
  };

  const refresh = () => {
    void file.refetch();
    void location.refetch();
  };

  return (
    <PromptPageFrame
      app={appId}
      apps={apps}
      onAppChange={onAppChange}
      help={{ title: t("prompts.viewerTitle"), text: t("prompts.viewerHelp") }}
      actions={
        <>
          <Button
            variant="neutral"
            size="regular"
            disabled={loading || failed || content == null || content === ""}
            onClick={() => void copy(content ?? "", t("prompts.contentCopied"))}
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
            {t("prompts.copyContent")}
          </Button>
          <Button
            variant="neutral"
            size="regular"
            disabled={file.isFetching || location.isFetching}
            onClick={refresh}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t("common.refresh")}
          </Button>
        </>
      }
      moreItems={[
        {
          key: "open-folder",
          label: t("prompts.openFolder"),
          onSelect: () => {
            void settingsApi.openConfigFolder(appId).catch((error: unknown) => {
              toast.error(t("prompts.openFolderFailed"), {
                description: extractErrorMessage(error),
              });
            });
          },
        },
        {
          key: "copy-path",
          label: t("prompts.copyFilePath"),
          reason: location.data ? undefined : t("prompts.pathUnavailable"),
          onSelect: () => {
            if (location.data) {
              void copy(
                location.data.path,
                t("prompts.copiedPath", { path: location.data.path }),
              );
            }
          },
        },
      ]}
      target={{
        label: t("prompts.targetFile"),
        path,
        meta:
          !failed && !loading
            ? ` · ${content === null ? t("prompts.fileMissing") : content === "" ? t("prompts.fileEmpty") : formatSize(utf8Bytes(content ?? ""))}`
            : undefined,
      }}
    >
      {failed ? (
        <div
          role="alert"
          className="flex flex-1 flex-col items-center justify-center gap-3 text-body text-fg-2"
        >
          <p>{t("prompts.loadFailed")}</p>
          <p className="max-w-xl break-words text-caption">
            {extractErrorMessage(file.error ?? location.error)}
          </p>
          <Button variant="neutral" size="regular" onClick={refresh}>
            {t("common.refresh")}
          </Button>
        </div>
      ) : loading ? (
        <div
          role="status"
          className="flex flex-1 items-center justify-center text-body text-fg-2"
        >
          {t("prompts.loading")}
        </div>
      ) : content == null || content === "" ? (
        <div
          role="status"
          className="flex flex-1 flex-col items-center justify-center gap-2 text-body text-fg-2"
        >
          <p>
            {t(content === null ? "prompts.fileMissing" : "prompts.fileEmpty")}
          </p>
          <code className="break-all font-mono text-caption">{path}</code>
        </div>
      ) : (
        <textarea
          readOnly
          aria-label={t("prompts.fileContent")}
          value={content}
          spellCheck={false}
          className="min-h-0 w-full flex-1 resize-none rounded-panel border border-border bg-surface px-4 py-3 font-mono text-caption leading-6 text-fg-1 focus:outline-none focus:ring-2 focus:ring-border"
        />
      )}
    </PromptPageFrame>
  );
}
