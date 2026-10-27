import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useUsageSummaryByApp } from "@/lib/query/usage";
import { HelpTip } from "@/components/ui/help-tip";
import { HoverTip } from "@/components/ui/hover-tip";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  fmtInt,
  formatHitRatePercent,
  formatTokensCompact,
  getLocaleFromLanguage,
  getResolvedLang,
  parseFiniteNumber,
} from "./format";
import {
  getCacheWriteAvailability,
  type UsageRangeSelection,
  type UsageSummary,
  type UsageSummaryByApp,
} from "@/types/usage";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import type { UsageMetric } from "./rememberedChoice";

interface UsageHeroProps {
  range: UsageRangeSelection;
  appType?: string;
  providerName?: string;
  model?: string;
  refreshIntervalMs: number;
  /** 窄容器下指标排成两列 */
  compact?: boolean;
  /** 选中的指标就是下方趋势图 / 热力图画的指标 */
  metric: UsageMetric;
  onMetricChange: (metric: UsageMetric) => void;
}

/**
 * Combine per-app summaries into a single rolled-up summary.
 *
 * The backend's per-app rows already use fresh-input semantics (cache-inclusive
 * providers have been normalized in SQL), so plain addition is correct here.
 * `cacheHitRate` and `successRate` must be re-derived from the summed counts
 * rather than averaged across rows.
 */
export function aggregateSummaries(items: UsageSummary[]): UsageSummary {
  let totalRequests = 0;
  let successCount = 0;
  let totalCostNum = 0;
  let input = 0;
  let output = 0;
  let cacheCreation = 0;
  let cacheRead = 0;

  for (const s of items) {
    totalRequests += s.totalRequests;
    successCount += Math.round((s.totalRequests * s.successRate) / 100);
    totalCostNum += parseFiniteNumber(s.totalCost) ?? 0;
    input += s.totalInputTokens;
    output += s.totalOutputTokens;
    cacheCreation += s.totalCacheCreationTokens;
    cacheRead += s.totalCacheReadTokens;
  }

  const cacheableInput = input + cacheCreation + cacheRead;
  return {
    totalRequests,
    totalCost: totalCostNum.toFixed(6),
    totalInputTokens: input,
    totalOutputTokens: output,
    totalCacheCreationTokens: cacheCreation,
    totalCacheReadTokens: cacheRead,
    successRate: totalRequests > 0 ? (successCount / totalRequests) * 100 : 0,
    realTotalTokens: input + output + cacheCreation + cacheRead,
    cacheHitRate: cacheableInput > 0 ? cacheRead / cacheableInput : 0,
  };
}

function pickSummary(
  apps: UsageSummaryByApp[],
  appType: string | undefined,
): UsageSummary | undefined {
  if (apps.length === 0) return undefined;
  if (appType) {
    return apps.find((a) => a.appType === appType)?.summary;
  }
  return aggregateSummaries(apps.map((a) => a.summary));
}

/**
 * 指标格：整格是一个按下态按钮（铺满整格、放在内容底下），内容层不接指针事件，
 * 只有「?」接——按钮里不能再套按钮。选中的格子是实心底色，其余透明。
 */
function MetricCell({
  label,
  help,
  value,
  title,
  detail,
  selected,
  onSelect,
}: {
  label: string;
  help?: { title: string; body: string };
  value: string;
  title?: string;
  /** 二级展示：悬停 / 聚焦这一格时弹出，移进卡片不关 */
  detail?: ReactNode;
  selected: boolean;
  onSelect: () => void;
}) {
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const toggle = (next: boolean, delay: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(next), delay);
  };
  const hover = detail
    ? {
        onPointerEnter: () => toggle(true, 200),
        onPointerLeave: () => toggle(false, 150),
        onFocus: () => toggle(true, 0),
        onBlur: () => toggle(false, 0),
      }
    : {};

  const cell = (
    <div className="group relative min-w-0 pb-3.5 pe-4 pt-2.5" {...hover}>
      <button
        type="button"
        aria-pressed={selected}
        aria-label={`${label} ${value}`}
        onClick={onSelect}
        className={cn(
          "absolute inset-0 transition-[background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          // 选中：底边一道 2px 正文色线，下半像素压住分隔线，和它在同一水平线上；不再用底色
          // 悬停用 group：鼠标在数字上（数字接指针事件、显示完整值）时整格也要变色
          selected
            ? "shadow-[inset_0_-1px_0_var(--text-1),0_1px_0_var(--text-1)]"
            : "group-hover:bg-sidebar",
        )}
      />
      <div className="pointer-events-none relative flex min-w-0 flex-col gap-0.5">
        <div className="flex h-[18px] min-w-0 items-center gap-0.5">
          <span
            className={cn(
              "truncate text-caption",
              selected ? "text-fg-1" : "text-fg-2",
            )}
          >
            {label}
          </span>
          {detail && (
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-fg-3 transition-transform duration-200 motion-reduce:transition-none",
                open && "rotate-180 text-fg-1",
              )}
            />
          )}
          {help && (
            // flex 包一层：行内 span 会让「?」按基线排、比文字低约 1px
            <span className="pointer-events-auto flex">
              <HelpTip title={help.title} align="end">
                {help.body}
              </HelpTip>
            </span>
          )}
        </div>
        {/* 完整数字的提示挂在数字上、往右弹：挂在整格上会弹到格子底下、盖住展开的第二行。
            数字接指针事件才能悬停，点它同样是选这一格 */}
        <HoverTip content={title} side="right">
          <span
            aria-hidden="true"
            onClick={onSelect}
            className={cn(
              "max-w-full self-start truncate text-metric leading-7 tabular-nums",
              title && "pointer-events-auto",
              selected ? "text-fg-1" : "text-fg-2",
            )}
          >
            {value}
          </span>
        </HoverTip>
      </div>
    </div>
  );

  if (!detail) return cell;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>{cell}</PopoverAnchor>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={2}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onPointerEnter={() => toggle(true, 0)}
        onPointerLeave={() => toggle(false, 150)}
        className="w-72 border-border bg-surface p-1.5 shadow-v7-md"
      >
        {detail}
      </PopoverContent>
    </Popover>
  );
}

/** Tokens 构成里的一行：名字在左，完整数值居右，占比在最右 */
function BreakdownRow({
  label,
  value,
  share,
  muted,
  help,
}: {
  label: string;
  value: string;
  share?: string;
  muted?: boolean;
  help?: { title: string; body: string };
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_3rem] items-center gap-x-3 px-2 py-1 text-caption">
      <span className="flex items-center gap-0.5 whitespace-nowrap text-fg-2">
        {label}
        {help && <HelpTip title={help.title}>{help.body}</HelpTip>}
      </span>
      <span
        className={cn(
          "tabular-nums",
          muted ? "font-medium text-fg-3" : "text-fg-1",
        )}
      >
        {value}
      </span>
      <span className="text-right tabular-nums text-fg-3">{share ?? ""}</span>
    </div>
  );
}

/**
 * 指标条（概览面板顶部）：总成本、总请求数、真实消耗 Tokens、缓存命中率 4 格等宽，
 * 点一格切换下方图表的指标。Tokens 的 4 个组成部分（新增输入、输出、缓存写入、缓存命中）
 * 悬停 Tokens 格时在 popover 里二级展示。
 */
export function UsageHero({
  range,
  appType,
  providerName,
  model,
  refreshIntervalMs,
  compact = false,
  metric,
  onMetricChange,
}: UsageHeroProps) {
  const { t, i18n } = useTranslation();
  const { money, moneyTitle } = useMoneyFormat();
  const locale = getLocaleFromLanguage(getResolvedLang(i18n));

  const { data, isLoading } = useUsageSummaryByApp(
    range,
    { providerName, model },
    {
      refetchInterval: refreshIntervalMs > 0 ? refreshIntervalMs : false,
    },
  );

  // No client-side filtering: totals must match the Trend/Logs/Stats below,
  // which all go through the backend's full set of app_types. The
  // KNOWN_APP_TYPES list only governs which filter chips appear.
  const allApps = data ?? [];
  const summary = pickSummary(allApps, appType);

  const cacheWriteState = getCacheWriteAvailability(
    appType ? [appType] : allApps.map((a) => a.appType),
  );

  const input = summary?.totalInputTokens ?? 0;
  const output = summary?.totalOutputTokens ?? 0;
  const cacheWrite = summary?.totalCacheCreationTokens ?? 0;
  const cacheRead = summary?.totalCacheReadTokens ?? 0;
  const realTotal = summary?.realTotalTokens ?? 0;
  const hitRate = summary?.cacheHitRate ?? 0;
  const totalCost = parseFiniteNumber(summary?.totalCost);
  const requests = summary?.totalRequests ?? 0;

  // 加载中写「…」；这段时间一条请求都没有时，各项都写「—」（和表格的空值一致），
  // 不写 0 / 0.0%：那是「有数据、结果为零」的意思
  const placeholder = isLoading ? "…" : requests === 0 ? "—" : undefined;
  // 命中率的分母（新增输入 + 缓存写入 + 缓存命中）为 0 时没有意义，同样写「—」
  const hitRateKnown = input + cacheWrite + cacheRead > 0;
  const tokens = (value: number) => formatTokensCompact(value, locale);
  // 悬停看完整数字；加载中、没有数据时格子里是「…」「—」，不提示
  const exact = (text: string | undefined) => (placeholder ? undefined : text);
  const columns = compact ? "grid-cols-2" : "grid-cols-4";

  const cacheWriteHelp =
    cacheWriteState === "na"
      ? t("usage.cacheWriteNotReported")
      : cacheWriteState === "partial"
        ? t("usage.cacheWritePartial")
        : undefined;

  const share = (value: number) =>
    realTotal > 0 ? `${((value / realTotal) * 100).toFixed(1)}%` : undefined;
  const breakdown = (
    <>
      <div className="px-2 pb-1.5 pt-1">
        <div className="text-caption text-fg-3">{t("usage.realTotal")}</div>
        <div className="text-section font-semibold tabular-nums text-fg-1">
          {placeholder ?? fmtInt(realTotal, locale)}
        </div>
      </div>
      <div className="border-t border-border pt-1">
        <BreakdownRow
          label={t("usage.freshInput")}
          value={placeholder ?? fmtInt(input, locale)}
          share={share(input)}
        />
        <BreakdownRow
          label={t("usage.outputTokens")}
          value={placeholder ?? fmtInt(output, locale)}
          share={share(output)}
        />
        <BreakdownRow
          label={t("usage.logColumns.cacheWrite")}
          value={
            cacheWriteState === "na"
              ? "N/A"
              : (placeholder ?? fmtInt(cacheWrite, locale))
          }
          share={cacheWriteState === "na" ? undefined : share(cacheWrite)}
          muted={cacheWriteState === "na"}
          help={
            cacheWriteHelp
              ? {
                  title: t("usage.logColumns.cacheWrite"),
                  body: cacheWriteHelp,
                }
              : undefined
          }
        />
        <BreakdownRow
          label={t("usage.cacheReadTokens")}
          value={placeholder ?? fmtInt(cacheRead, locale)}
          share={share(cacheRead)}
        />
      </div>
      <p className="mt-1 border-t border-border px-2 pb-0.5 pt-1.5 text-[11px] leading-snug text-fg-3">
        {t("usage.metrics.realTotalHelp")}
      </p>
    </>
  );

  return (
    <section
      aria-label={t("usage.metrics.label")}
      className="relative z-10 mx-4 border-b border-border"
    >
      <div className={cn("grid", columns)}>
        <MetricCell
          label={t("usage.totalCost")}
          value={placeholder ?? (totalCost == null ? "—" : money(totalCost, 2))}
          title={
            totalCost == null ? undefined : exact(moneyTitle(totalCost, 6))
          }
          selected={metric === "cost"}
          onSelect={() => onMetricChange("cost")}
        />
        <MetricCell
          label={t("usage.totalRequests")}
          value={placeholder ?? fmtInt(requests, locale)}
          selected={metric === "requests"}
          onSelect={() => onMetricChange("requests")}
        />
        <MetricCell
          label={t("usage.realTotal")}
          value={placeholder ?? tokens(realTotal)}
          detail={breakdown}
          selected={metric === "tokens"}
          onSelect={() => onMetricChange("tokens")}
        />
        <MetricCell
          label={t("usage.cacheHitRate")}
          help={{
            title: t("usage.metrics.hitRateHelpTitle"),
            body: t("usage.metrics.hitRateHelp"),
          }}
          value={
            placeholder ?? (hitRateKnown ? formatHitRatePercent(hitRate) : "—")
          }
          selected={metric === "hitRate"}
          onSelect={() => onMetricChange("hitRate")}
        />
      </div>
    </section>
  );
}
