import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ChevronRight, ChartColumn } from "lucide-react";
import { usageApi } from "@/lib/api";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { resolveUsageRange, getUsageRangePresetLabel } from "@/lib/usageRange";
import {
  formatTokensCompact,
  getLocaleFromLanguage,
} from "@/components/usage/format";
import { cn } from "@/lib/utils";

/** 今日用量一行：点一下打开主界面看详情。 */
export function UsageSummary({
  refreshKey,
  className,
  onOpen,
}: {
  /** 每次弹出变一次：重新取数据 */
  refreshKey: number;
  className?: string;
  onOpen: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { money } = useMoneyFormat();
  const locale = getLocaleFromLanguage(
    i18n.resolvedLanguage || i18n.language || "en",
  );
  const { data } = useQuery({
    queryKey: ["tray-panel-usage-today", refreshKey],
    queryFn: () => {
      const { startDate, endDate } = resolveUsageRange({ preset: "today" });
      return usageApi.getUsageSummary(startDate, endDate);
    },
    refetchInterval: 60_000,
    placeholderData: (previous) => previous,
  });
  if (!data || data.totalRequests === 0) return null;

  return (
    <button type="button" onClick={onOpen} className={cn("w-full", className)}>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground">
        <ChartColumn className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1 truncate text-left text-muted-foreground">
        {getUsageRangePresetLabel("today", t)}{" "}
        <b className="font-semibold tabular-nums text-foreground">
          {formatTokensCompact(data.realTotalTokens, locale)}
        </b>{" "}
        tokens ·{" "}
        <b className="font-semibold tabular-nums text-foreground">
          {money(data.totalCost, 2)}
        </b>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}
