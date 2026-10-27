import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen } from "lucide-react";
import { AppPageHeader } from "@/components/shell/AppPageHeader";
import { PAGE_FRAME, PAGE_HEADER_INSET } from "@/components/shell/pageLayout";
import { AppGlyph, APP_DISPLAY_NAME } from "@/components/shell/AppGlyph";
import { PageTabs } from "@/components/ui/page-tabs";
import type { AppId } from "@/lib/api";

interface PromptPageFrameProps {
  app: AppId;
  apps: AppId[];
  onAppChange: (app: AppId) => void;
  /** 页头右侧的操作按钮 */
  headerActions?: ReactNode;
  /** 页签行右侧的操作按钮 */
  actions?: ReactNode;
  target?: { label: string; path: string; meta?: string } | null;
  children: ReactNode;
}

/** 提示词文件查看页的页头和应用页签。 */
export function PromptPageFrame({
  app,
  apps,
  onAppChange,
  headerActions,
  actions,
  target,
  children,
}: PromptPageFrameProps) {
  const { t } = useTranslation();

  return (
    <>
      <AppPageHeader
        icon={<BookOpen className="h-[18px] w-[18px]" strokeWidth={2} />}
        title={t("nav.prompts")}
        actions={headerActions}
        className={PAGE_HEADER_INSET}
      />

      <div className={`shrink-0 ${PAGE_FRAME}`}>
        <PageTabs
          aria-label={t("prompts.appSelect")}
          className="ps-4"
          value={app}
          onValueChange={onAppChange}
          items={apps.map((id) => ({
            value: id,
            label: (
              <span className="inline-flex items-center gap-1.5">
                <AppGlyph app={id} size={14} badgeClassName="bg-app" />
                {APP_DISPLAY_NAME[id]}
              </span>
            ),
          }))}
          trailing={<div className="flex items-center gap-2">{actions}</div>}
        />
      </div>

      <div
        className={`flex min-h-0 flex-1 flex-col pb-5 pt-3 ${PAGE_FRAME} ps-10`}
      >
        {target ? (
          <p
            title={`${target.label} ${target.path}${target.meta ?? ""}`}
            className="m-0 mb-2 flex min-w-0 shrink-0 text-caption text-fg-3"
          >
            <code className="min-w-0 truncate font-mono text-fg-2">
              {target.path}
            </code>
            <span className="shrink-0 whitespace-pre">{target.meta}</span>
          </p>
        ) : null}
        {children}
      </div>
    </>
  );
}
