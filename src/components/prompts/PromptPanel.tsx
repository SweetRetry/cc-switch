import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Copy, FolderOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HoverTip } from "@/components/ui/hover-tip";
import { promptsApi, settingsApi, type AppId } from "@/lib/api";
import { promptKeys, usePromptFileLocationQuery } from "@/lib/query/prompts";
import { toast } from "@/lib/toast";
import { extractErrorMessage } from "@/utils/errorUtils";
import { PromptPageFrame } from "./PromptPageFrame";
import PromptMarkdown from "./PromptMarkdown";
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
  // 文件不存在或为空：内容相关的操作一律不能点
  const hasContent = content != null && content !== "";

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

  const openFolder = () => {
    void settingsApi.openConfigFolder(appId).catch((error: unknown) => {
      toast.error(t("prompts.openFolderFailed"), {
        description: extractErrorMessage(error),
      });
    });
  };

  return (
    <PromptPageFrame
      app={appId}
      apps={apps}
      onAppChange={onAppChange}
      headerActions={
        <Button
          variant="quiet"
          size="regular"
          disabled={file.isFetching || location.isFetching}
          onClick={refresh}
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {t("common.refresh")}
        </Button>
      }
      actions={
        <>
          <HoverTip content={t("prompts.copyContent")}>
            <Button
              variant="quiet"
              size="icon-compact"
              aria-label={t("prompts.copyContent")}
              disabled={!hasContent}
              onClick={() =>
                void copy(content ?? "", t("prompts.contentCopied"))
              }
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
            </Button>
          </HoverTip>
          <HoverTip content={t("prompts.openFolder")}>
            <Button
              variant="quiet"
              size="icon-compact"
              aria-label={t("prompts.openFolder")}
              onClick={openFolder}
            >
              <FolderOpen className="h-4 w-4" aria-hidden="true" />
            </Button>
          </HoverTip>
        </>
      }
      target={{
        label: t("prompts.targetFile"),
        path,
        meta:
          !failed && !loading
            ? ` · ${content === null ? t("prompts.fileMissing") : content === "" ? t("prompts.fileEmpty") : formatSize(utf8Bytes(content ?? ""))}`
            : undefined,
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
        ) : !hasContent ? (
          <div
            role="status"
            className="flex flex-1 flex-col items-center justify-center gap-2 text-body text-fg-2"
          >
            <p>
              {t(
                content === null ? "prompts.fileMissing" : "prompts.fileEmpty",
              )}
            </p>
            <code className="break-all font-mono text-caption">{path}</code>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto pb-5 pt-2">
            <PromptMarkdown content={content} />
          </div>
        )}
      </div>
    </PromptPageFrame>
  );
}
