import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

/**
 * Skills 与 MCP 列表共用的三列：名称（弹性）、应用（定宽）、操作（定宽）。
 * 表头和每一行都从这里取列样式，列宽才对得齐；不画分隔线，不做成表格。
 */
export const listCol = {
  name: "flex min-w-0 flex-1 flex-col ps-4 pe-3",
  apps: `flex w-[180px] shrink-0 items-center px-3`,
  actions: `flex w-16 shrink-0 items-center justify-center`,
} as const;

/** 行容器：不画行线，悬停才有底色 */
export const listRow =
  "group flex h-14 items-stretch rounded-control hover:bg-subtle";

/** 滚动时吸顶；纯装饰，读屏走下面列表自己的 aria-label */
export function ListHeader({ nameLabel }: { nameLabel: string }) {
  const { t } = useTranslation();
  return (
    <div
      aria-hidden="true"
      className="sticky top-0 z-[1] flex h-8 items-stretch bg-app text-caption text-fg-3"
    >
      <div className={cn(listCol.name, "justify-center")}>{nameLabel}</div>
      <div className="flex w-[180px] shrink-0 items-center px-3">
        {t("appMatrix.columnApps")}
      </div>
      <div className="w-16 shrink-0" />
    </div>
  );
}
