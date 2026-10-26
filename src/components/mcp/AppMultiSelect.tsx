import { AlertTriangle, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { APP_DISPLAY_NAME, AppGlyph } from "@/components/shell/AppGlyph";
import type { McpAppId } from "@/config/appConfig";
import { cn } from "@/lib/utils";

export type AppSelectState = "on" | "off" | "fail";

interface AppMultiSelectProps {
  /** 服务器 id，只用于无障碍文案 */
  name: string;
  appIds: readonly McpAppId[];
  states: Record<McpAppId, AppSelectState>;
  disabled?: boolean;
  onToggle: (app: McpAppId) => void;
  onSetAll: (enabled: boolean) => void;
}

/**
 * 多选下拉：触发器直接画出已写入的应用图标（avatar stack），没有文字值；
 * 展开后是「全部启用 / 全部关闭」加每个应用一个勾选项，勾选不关菜单。
 * 写入失败的应用在触发器里带警告描边，点它的勾选项重试。
 */
export function AppMultiSelect({
  name,
  appIds,
  states,
  disabled,
  onToggle,
  onSetAll,
}: AppMultiSelectProps) {
  const { t } = useTranslation();
  const shown = appIds.filter((app) => states[app] !== "off");
  const allOn = appIds.every((app) => states[app] === "on");
  const noneOn = appIds.every((app) => states[app] === "off");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={name}
          className="flex h-8 min-w-[132px] items-center gap-1.5 rounded-control bg-selected px-2.5 outline-none transition-colors hover:bg-border-strong focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45 data-[state=open]:bg-border-strong"
        >
          <span className="flex min-w-0 flex-1 items-center gap-1.5">
            {shown.length === 0 && (
              <span className="text-caption text-fg-3">
                {t("mcpPage.noneEnabled")}
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
          <ChevronDown className="h-3.5 w-3.5 text-fg-3" strokeWidth={2} />
        </button>
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
            {t("mcpPage.enableEverywhere")}
          </Button>
          <Button
            type="button"
            variant="quiet"
            size="compact"
            className="flex-1"
            disabled={noneOn}
            onClick={() => onSetAll(false)}
          >
            {t("mcpPage.disableEverywhere")}
          </Button>
        </div>
        {appIds.map((app) => {
          const state = states[app];
          return (
            <label
              key={app}
              className="flex cursor-pointer items-center gap-2.5 rounded-control px-2.5 py-2 text-body hover:bg-subtle"
              title={t(`appMatrix.cell.${state}`, {
                name,
                app: APP_DISPLAY_NAME[app],
              })}
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
