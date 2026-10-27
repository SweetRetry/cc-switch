import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { PickerTrigger } from "./PickerTrigger";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { APP_DISPLAY_NAME, AppGlyph } from "@/components/shell/AppGlyph";
import type { AppId } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export type AppSelectState = "on" | "off" | "fail";

interface AppMultiSelectProps<A extends AppId> {
  /** 触发器的无障碍名称，也是默认勾选项提示里的主语（服务器 id、技能名、「应用」） */
  name: string;
  appIds: readonly A[];
  states: Record<A, AppSelectState>;
  disabled?: boolean;
  onToggle: (app: A) => void;
  onSetAll: (enabled: boolean) => void;
  /** 「全部」按钮文案；默认「全部启用」 */
  allLabel?: string;
  /** 「全部关闭」按钮文案；默认「全部停用」。传 null 不画这个按钮（筛选器至少留一个） */
  noneLabel?: string | null;
  /** 一个都没开时触发器里的文字；默认「未启用」 */
  emptyLabel?: string;
  /** 勾选项的悬停提示；默认按「启用 / 写入失败」写，筛选器要自己的措辞 */
  itemTitle?: (app: A, state: AppSelectState) => string;
}

/**
 * 多选下拉：触发器直接画出已选的应用图标（avatar stack），没有文字值；
 * 展开后是「全部 / 全部关闭」加每个应用一个勾选项，勾选不关菜单。
 * MCP、Skills 的行内开关和用量页的应用筛选共用：后者只换文案，不画「全部关闭」。
 * 写入失败的应用在触发器里带警告描边，点它的勾选项重试。
 */
export function AppMultiSelect<A extends AppId>({
  name,
  appIds,
  states,
  disabled,
  onToggle,
  onSetAll,
  allLabel,
  noneLabel,
  emptyLabel,
  itemTitle,
}: AppMultiSelectProps<A>) {
  const { t } = useTranslation();
  const shown = appIds.filter((app) => states[app] !== "off");
  const allOn = appIds.every((app) => states[app] === "on");
  const noneOn = appIds.every((app) => states[app] === "off");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <PickerTrigger
          disabled={disabled}
          aria-label={name}
          className="min-w-[132px]"
        >
          <span className="flex min-w-0 flex-1 items-center gap-1.5">
            {shown.length === 0 && (
              <span className="text-caption text-fg-3">
                {emptyLabel ?? t("mcpPage.noneEnabled")}
              </span>
            )}
            {shown.map((app) => (
              <span
                key={app}
                title={APP_DISPLAY_NAME[app]}
                className={cn(
                  "flex rounded-[4px]",
                  states[app] === "fail" && "ring-2 ring-warning",
                )}
              >
                <AppGlyph app={app} size={16} />
              </span>
            ))}
          </span>
        </PickerTrigger>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[248px] p-1.5">
        <div className="flex gap-1 pb-1">
          <Button
            type="button"
            variant="quiet"
            size="compact"
            className="flex-1"
            disabled={allOn}
            onClick={() => onSetAll(true)}
          >
            {allLabel ?? t("mcpPage.enableEverywhere")}
          </Button>
          {noneLabel !== null && (
            <Button
              type="button"
              variant="quiet"
              size="compact"
              className="flex-1"
              disabled={noneOn}
              onClick={() => onSetAll(false)}
            >
              {noneLabel ?? t("mcpPage.disableEverywhere")}
            </Button>
          )}
        </div>
        {appIds.map((app) => {
          const state = states[app];
          return (
            <label
              key={app}
              className="flex cursor-pointer items-center gap-2.5 rounded-control px-2.5 py-2 text-body hover:bg-subtle"
              title={
                itemTitle
                  ? itemTitle(app, state)
                  : t(`appMatrix.cell.${state}`, {
                      name,
                      app: APP_DISPLAY_NAME[app],
                    })
              }
            >
              <Checkbox
                checked={state === "on"}
                onCheckedChange={() => onToggle(app)}
              />
              <AppGlyph app={app} size={16} />
              <span className="min-w-0 flex-1 truncate">
                {APP_DISPLAY_NAME[app]}
              </span>
              {state === "fail" && (
                <AlertTriangle
                  className="h-3.5 w-3.5 text-warning-text"
                  strokeWidth={2}
                />
              )}
            </label>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
