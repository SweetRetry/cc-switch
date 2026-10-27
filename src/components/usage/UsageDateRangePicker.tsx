import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PickerTrigger } from "@/components/common/PickerTrigger";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getUsageRangePresetLabel, resolveUsageRange } from "@/lib/usageRange";
import { getLocaleFromLanguage } from "./format";
import type { UsageRangePreset, UsageRangeSelection } from "@/types/usage";

const PRESETS: UsageRangePreset[] = ["today", "1d", "7d", "14d", "30d", "all"];

interface UsageDateRangePickerProps {
  selection: UsageRangeSelection;
  onApply: (selection: UsageRangeSelection) => void;
  triggerLabel: string;
}

/** 草稿区间：只选到起点时 end 为 null，等第二次点击 */
interface DraftRange {
  start: Date | null;
  end: Date | null;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const timeInputClass =
  "h-8 w-[68px] border-transparent bg-transparent px-1.5 text-center text-body tabular-nums text-fg-1 shadow-none hover:bg-subtle";
const DEFAULT_START_TIME = "00:00";
const DEFAULT_END_TIME = "23:59";

function fmtTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** 日期（本地零点）+ "HH:mm" → 秒级时间戳；end 取该分钟的最后一秒 */
function toTs(day: Date, time: string, endOfMinute: boolean): number {
  const [h, m] = time.split(":").map(Number);
  return Math.floor(
    new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      h || 0,
      m || 0,
      endOfMinute ? 59 : 0,
    ).getTime() / 1000,
  );
}

/** 已生效的自定义区间 → 草稿里的时刻；预设和「结束于现在」走默认值 */
function timesFromSelection(selection: UsageRangeSelection) {
  if (selection.preset !== "custom") {
    return {
      start: DEFAULT_START_TIME,
      end: DEFAULT_END_TIME,
      endTouched: false,
    };
  }
  const r = resolveUsageRange(selection);
  return {
    start: fmtTime(new Date(r.startDate * 1000)),
    end: selection.liveEndTime
      ? DEFAULT_END_TIME
      : fmtTime(new Date(r.endDate * 1000)),
    endTouched: !selection.liveEndTime,
  };
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}

/** 6 周 × 7 天的固定网格；不属于本月的格子为 null，两个月的高度才一致 */
function monthCells(month: Date): (Date | null)[] {
  const offset = month.getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return Array.from({ length: 42 }, (_, i) => {
    const day = i - offset + 1;
    return day >= 1 && day <= days
      ? new Date(month.getFullYear(), month.getMonth(), day)
      : null;
  });
}

/** 「全部」没有日历意义（起点是 1970），草稿留空 */
function draftFromSelection(selection: UsageRangeSelection): DraftRange {
  if (selection.preset === "all") return { start: null, end: null };
  const r = resolveUsageRange(selection);
  return {
    start: startOfDay(new Date(r.startDate * 1000)),
    end: startOfDay(new Date(r.endDate * 1000)),
  };
}

function MonthGrid({
  month,
  draft,
  hover,
  today,
  locale,
  weekdays,
  onPick,
  onHover,
}: {
  month: Date;
  draft: DraftRange;
  hover: Date | null;
  today: Date;
  locale: string;
  weekdays: string[];
  onPick: (day: Date) => void;
  onHover: (day: Date | null) => void;
}) {
  const cells = useMemo(() => monthCells(month), [month]);
  // 只选了起点时，带状预览跟着鼠标
  const rawEnd = draft.end ?? hover;
  const [lo, hi] =
    draft.start && rawEnd && rawEnd < draft.start
      ? [rawEnd, draft.start]
      : [draft.start, rawEnd];

  return (
    <div className="w-[252px]">
      <div className="grid grid-cols-7 text-center text-caption text-fg-3">
        {weekdays.map((label, i) => (
          <div key={i} className="flex h-8 items-center justify-center">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7" onMouseLeave={() => onHover(null)}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="h-9" />;
          const isLo = !!lo && isSameDay(day, lo);
          const isHi = !!hi && isSameDay(day, hi);
          const inBand = !!lo && !!hi && day >= lo && day <= hi;
          const col = i % 7;
          return (
            // 行高 36、色带高 32：上下各内缩 2px，相邻两周的色带之间留出缝
            <div key={i} className="flex h-9 items-center">
              <div
                className={cn(
                  "flex h-8 w-full items-center justify-center",
                  inBand && "bg-selected",
                  inBand && (isLo || col === 0) && "rounded-s-control",
                  inBand && (isHi || col === 6) && "rounded-e-control",
                )}
              >
                <button
                  type="button"
                  aria-label={day.toLocaleDateString(locale)}
                  aria-current={isSameDay(day, today) ? "date" : undefined}
                  aria-pressed={isLo || isHi}
                  className={cn(
                    "h-8 w-8 rounded-control text-body tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isLo || isHi
                      ? "bg-action font-medium text-action-fg"
                      : cn(
                          "text-fg-1",
                          !inBand && "hover:bg-subtle",
                          isSameDay(day, today) && "font-semibold",
                        ),
                  )}
                  onClick={() => onPick(day)}
                  onMouseEnter={() => onHover(day)}
                >
                  {day.getDate()}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function UsageDateRangePicker({
  selection,
  onApply,
  triggerLabel,
}: UsageDateRangePickerProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DraftRange>(() =>
    draftFromSelection(selection),
  );
  const [hover, setHover] = useState<Date | null>(null);
  const [times, setTimes] = useState(() => timesFromSelection(selection));
  // 左面板的月份；右面板是下一个月。默认让区间终点落在右面板
  const [leftMonth, setLeftMonth] = useState(() => addMonths(new Date(), -1));

  const locale = getLocaleFromLanguage(
    i18n.resolvedLanguage || i18n.language || "en",
  );
  const today = startOfDay(new Date());
  const prevLabel = t("usage.prevMonth", { defaultValue: "上个月" });
  const nextLabel = t("usage.nextMonth", { defaultValue: "下个月" });

  useEffect(() => {
    if (!open) return;
    const next = draftFromSelection(selection);
    setDraft(next);
    setHover(null);
    setTimes(timesFromSelection(selection));
    setLeftMonth(addMonths(next.end ?? new Date(), -1));
  }, [open, selection]);

  const weekdays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        new Intl.DateTimeFormat(locale, { weekday: "narrow" }).format(
          new Date(2024, 0, 7 + i),
        ),
      ),
    [locale],
  );

  // 点一下定起点，再点一下定终点；终点早于起点就对调；已选满再点重新开始
  const pick = (day: Date) => {
    setDraft((cur) => {
      if (!cur.start || cur.end) return { start: day, end: null };
      return day < cur.start
        ? { start: day, end: cur.start }
        : { start: cur.start, end: day };
    });
  };

  // 终点是今天、且没动过结束时刻，就跟着「现在」走，和预设一样随时间滚动
  const endIsToday = !!draft.end && isSameDay(draft.end, today);
  const live = endIsToday && !times.endTouched;
  const endTimeShown = live ? fmtTime(new Date()) : times.end;
  const startTs = draft.start ? toTs(draft.start, times.start, false) : null;
  const endTs = draft.end ? toTs(draft.end, times.end, true) : null;
  const complete =
    startTs != null && endTs != null && (live || startTs <= endTs);
  const apply = () => {
    if (startTs == null || endTs == null) return;
    onApply({
      preset: "custom",
      customStartDate: startTs,
      customEndDate: endTs,
      liveEndTime: live,
    });
    setOpen(false);
  };

  const monthTitle = (month: Date) =>
    month.toLocaleDateString(locale, { year: "numeric", month: "long" });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <PickerTrigger
          className="max-w-[260px] shrink-0"
          title={`${t("usage.timeRange")}: ${triggerLabel}`}
        >
          <CalendarDays
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-fg-3"
          />
          <span className="min-w-0 truncate text-body">{triggerLabel}</span>
        </PickerTrigger>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        collisionPadding={16}
        className="w-auto max-w-[calc(100vw-2rem)] overflow-x-auto rounded-panel border-border bg-surface p-0 shadow-v7-md"
      >
        <div className="flex divide-x divide-border">
          {[leftMonth, addMonths(leftMonth, 1)].map((month, side) => (
            <div
              key={side}
              className="flex flex-1 flex-col items-center px-4 pb-3 pt-3"
            >
              <div className="mb-1 flex h-8 w-[252px] items-center justify-between">
                {side === 0 ? (
                  <Button
                    type="button"
                    size="icon-compact"
                    variant="quiet"
                    aria-label={prevLabel}
                    onClick={() => setLeftMonth(addMonths(leftMonth, -1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                ) : (
                  <span className="h-6 w-6" />
                )}
                <span className="text-body font-medium text-fg-1">
                  {monthTitle(month)}
                </span>
                {side === 1 ? (
                  <Button
                    type="button"
                    size="icon-compact"
                    variant="quiet"
                    aria-label={nextLabel}
                    onClick={() => setLeftMonth(addMonths(leftMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <span className="h-6 w-6" />
                )}
              </div>
              <MonthGrid
                month={month}
                draft={draft}
                hover={hover}
                today={today}
                locale={locale}
                weekdays={weekdays}
                onPick={pick}
                onHover={setHover}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2.5">
          {/* 预设直接生效：最常见的选择不用再点确定 */}
          <div className="flex flex-wrap gap-1">
            {PRESETS.map((preset) => (
              <Button
                key={preset}
                type="button"
                size="compact"
                variant="quiet"
                aria-pressed={selection.preset === preset}
                className={cn(
                  "px-2.5",
                  selection.preset === preset && "bg-selected font-semibold",
                )}
                onClick={() => {
                  onApply({ preset });
                  setOpen(false);
                }}
              >
                {getUsageRangePresetLabel(preset, t)}
              </Button>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {/* 时刻是日期之后的微调，不单占一行：和确定键并排，输入框不画框，悬停才有底 */}
            <div className="flex items-center gap-0.5 text-fg-3">
              <Input
                type="time"
                step={60}
                aria-label={t("usage.startTime")}
                className={timeInputClass}
                value={times.start}
                onChange={(e) =>
                  e.target.value &&
                  setTimes((cur) => ({ ...cur, start: e.target.value }))
                }
              />
              <span aria-hidden="true">–</span>
              <Input
                type="time"
                step={60}
                aria-label={t("usage.endTime")}
                title={live ? t("usage.endsNow") : undefined}
                className={timeInputClass}
                value={endTimeShown}
                onChange={(e) =>
                  e.target.value &&
                  setTimes((cur) => ({
                    ...cur,
                    end: e.target.value,
                    endTouched: true,
                  }))
                }
              />
            </div>
            <Button
              type="button"
              variant="solid"
              size="compact"
              disabled={!complete}
              onClick={apply}
            >
              {t("common.confirm")}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
