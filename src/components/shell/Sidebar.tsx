import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  ChartColumn,
  Database,
  LayoutGrid,
  Server,
  Settings,
} from "lucide-react";
import type { AppId } from "@/lib/api";
import type { VisibleApps } from "@/types";
import { orderAppIds } from "@/config/appConfig";
import type { GlobalPage, View } from "@/lib/navigation";
import { isAppPage } from "@/lib/navigation";
import { SkillsIcon } from "@/components/BrandIcons";
import { useUpdate } from "@/contexts/UpdateContext";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useSettingsQuery } from "@/lib/query";
import {
  fmtInt,
  formatHitRatePercent,
  formatTokensCompact,
  getLocaleFromLanguage,
  getResolvedLang,
  resolveSidebarToday,
  type SidebarTodayItem,
} from "@/components/usage/format";
import { useSidebarStatus } from "@/hooks/useSidebarStatus";
import { HoverTip } from "@/components/ui/hover-tip";
import { DRAG_REGION_ATTR, DRAG_REGION_STYLE, isMac } from "@/lib/platform";
import { cn } from "@/lib/utils";
import ccswitchLogo from "@/assets/icons/logo.svg";
import { APP_DISPLAY_NAME, AppGlyph } from "./AppGlyph";

type IconComponent = ComponentType<{ className?: string }>;

interface SidebarProps {
  activeApp: AppId;
  view: View;
  visibleApps: VisibleApps;
  onSelectApp: (app: AppId) => void;
  onSelectPage: (page: GlobalPage | "settings") => void;
  /** 打开了「启动时检查应用更新」并且查到了新版本 */
  appsUpdateAvailable?: boolean;
}

/**
 * 主导航：应用列表滚动，全局页贴底；所有页面共享同一条 224px 侧栏。
 */
export function Sidebar(props: SidebarProps) {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t("nav.mainLabel")}
      className="relative flex h-full w-56 shrink-0 flex-col overflow-hidden whitespace-nowrap border-e border-border bg-sidebar text-body text-fg-1"
    >
      <a
        href="#main-content"
        className="absolute -start-[999px] top-2 z-10 rounded-control bg-surface px-2 py-1 text-caption shadow-v7-sm focus:start-2"
      >
        {t("nav.skipToContent")}
      </a>
      <SidebarTopBar />
      <MainDirectory {...props} />
    </nav>
  );
}

function SidebarTopBar() {
  // macOS 顶条只放红绿灯；下面一行贴近红绿灯放 logo + 名字
  if (isMac()) {
    return (
      <>
        <div
          className="h-11 shrink-0"
          {...DRAG_REGION_ATTR}
          style={DRAG_REGION_STYLE as React.CSSProperties}
        />
        {/* 品牌区与导航通过侧栏底色和留白分开 */}
        <div
          className="-mt-[18px] mb-2 flex h-9 shrink-0 items-center gap-2 pe-2 ps-5"
          {...DRAG_REGION_ATTR}
          style={DRAG_REGION_STYLE as React.CSSProperties}
        >
          <img
            src={ccswitchLogo}
            alt=""
            draggable={false}
            className="pointer-events-none h-6 w-6 shrink-0"
          />
          <span className="pointer-events-none me-auto min-w-0 truncate text-strong font-semibold text-fg-1">
            CC Switch
          </span>
        </div>
      </>
    );
  }

  return (
    <div
      className="flex h-11 shrink-0 items-center gap-0.5 px-2"
      {...DRAG_REGION_ATTR}
      style={DRAG_REGION_STYLE as React.CSSProperties}
    >
      {/* 图片不接收指针事件，拖它也是在拖窗口 */}
      <span className="pointer-events-none me-auto flex min-w-0 items-center gap-2 ps-1.5">
        <img
          src={ccswitchLogo}
          alt=""
          draggable={false}
          className="h-[22px] w-[22px] shrink-0"
        />
        <span className="truncate text-strong font-semibold text-fg-1">
          CC Switch
        </span>
      </span>
    </div>
  );
}

// ─── 主目录 ────────────────────────────────────────────────────────────────

function MainDirectory({
  activeApp,
  view,
  visibleApps,
  onSelectApp,
  onSelectPage,
  appsUpdateAvailable = false,
}: SidebarProps) {
  const { t, i18n } = useTranslation();
  const { money } = useMoneyFormat();
  const { data: settings } = useSettingsQuery();
  const { hasUpdate } = useUpdate();
  const { todayCost, todayTokens, todayRequests, todayHitRate } =
    useSidebarStatus();
  // 顺序跟应用页拖出来的一致
  const apps = orderAppIds(settings?.appOrder).filter(
    (app) => visibleApps[app],
  );
  const onAppPage = isAppPage(view);

  // 选了的项里是 0 的不写（没配定价时金额总是 0）；命中率在今天还没有请求时不写；
  // 全都没有就整个不显示。两项都有时只写数、上下两行（「今日」放进悬停和读屏）：
  // 带上「今日」，换成新台币这类长币种后一行放不下，会把「用量统计」挤成省略号
  const locale = getLocaleFromLanguage(getResolvedLang(i18n));
  const todayValue = (item: SidebarTodayItem): string | null => {
    switch (item) {
      case "cost":
        return todayCost > 0 ? money(todayCost, 2) : null;
      case "tokens":
        return todayTokens > 0
          ? formatTokensCompact(todayTokens, locale)
          : null;
      case "requests":
        return todayRequests > 0
          ? t("nav.todayRequests", { value: fmtInt(todayRequests, locale) })
          : null;
      case "hitRate":
        return todayRequests > 0
          ? t("nav.todayHitRate", { value: formatHitRatePercent(todayHitRate) })
          : null;
    }
  };
  const todayValues = resolveSidebarToday(settings?.usageDisplay)
    .map(todayValue)
    .filter((part): part is string => part != null);
  const todayTrailing = todayValues.length > 0 ? todayValues : undefined;

  const globals: {
    page: GlobalPage;
    label: string;
    icon: IconComponent;
    trailing?: string | string[];
    trailingLabel?: string;
    alert?: string;
    /** 在「共享配置」组里；其余贴底 */
    shared?: boolean;
  }[] = [
    { page: "mcp", label: "MCP", icon: Server, shared: true },
    { page: "skills", label: "Skills", icon: SkillsIcon, shared: true },
    { page: "prompts", label: t("nav.prompts"), icon: BookOpen, shared: true },
    {
      page: "usage",
      label: t("nav.usage"),
      icon: ChartColumn,
      trailing: todayTrailing,
    },
  ];

  const isGlobalSelected = (page: GlobalPage) => view === page;

  const renderGlobal = (item: (typeof globals)[number]) => (
    <NavItem
      key={item.page}
      selected={isGlobalSelected(item.page)}
      icon={item.icon}
      label={item.label}
      trailing={item.trailing}
      trailingLabel={item.trailingLabel}
      alert={item.alert}
      onClick={() => onSelectPage(item.page)}
    />
  );
  const appsTitle = appsUpdateAvailable
    ? t("nav.appsHasUpdate")
    : t("nav.appsTitle");

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden pb-2 pt-0.5">
        <div
          role="group"
          aria-label={t("nav.appsGroup")}
          className="flex shrink-0 flex-col gap-1"
        >
          <div className="mx-3 flex h-8 items-center justify-between ps-2">
            <GroupLabel>{t("nav.appsGroup")}</GroupLabel>
            {/* 应用页管的是这一组：安装、升级、哪些应用显示在这里 */}
            <HoverTip content={appsTitle} side="right" disableHoverableContent>
              <button
                type="button"
                onClick={() => onSelectPage("apps")}
                aria-label={t("nav.apps")}
                aria-current={view === "apps" ? "page" : undefined}
                className={cn(
                  "relative flex h-6 w-6 items-center justify-center rounded-control text-fg-3 transition-colors hover:bg-subtle hover:text-fg-1",
                  view === "apps" && "bg-selected text-fg-1",
                )}
              >
                <LayoutGrid className="h-4 w-4" />
                {appsUpdateAvailable && (
                  <span className="absolute end-0.5 top-0.5 h-2 w-2 rounded-full bg-fg-1" />
                )}
              </button>
            </HoverTip>
          </div>
          {apps.map((app) => (
            <AppNavItem
              key={app}
              app={app}
              selected={onAppPage && activeApp === app}
              onSelect={() => onSelectApp(app)}
            />
          ))}
        </div>
        <div
          role="group"
          aria-label={t("nav.configGroup")}
          className="mt-6 flex shrink-0 flex-col gap-1"
        >
          <div className="mx-3 flex h-8 items-center ps-2">
            <GroupLabel>{t("nav.configGroup")}</GroupLabel>
          </div>
          {globals.filter((item) => item.shared).map(renderGlobal)}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-1 border-t border-border pb-3 pt-3">
        {globals.filter((item) => !item.shared).map(renderGlobal)}
        <NavItem
          selected={view === "data"}
          icon={Database}
          label={t("settings.sections.data")}
          onClick={() => onSelectPage("data")}
        />
        <NavItem
          selected={view === "settings"}
          icon={Settings}
          label={t("nav.settings")}
          title={hasUpdate ? t("nav.settingsHasUpdate") : t("nav.settings")}
          dot={hasUpdate}
          dotTone="success"
          onClick={() => onSelectPage("settings")}
        />
      </div>
    </>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-caption text-fg-3">{children}</span>;
}

function AppNavItem({
  app,
  selected,
  onSelect,
}: {
  app: AppId;
  selected: boolean;
  onSelect: () => void;
}) {
  const badgeBg = selected ? "bg-selected" : "bg-sidebar";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "page" : undefined}
      className={cn(
        "mx-3 flex h-10 shrink-0 items-center gap-3 rounded-control px-2 text-start transition-colors hover:bg-subtle",
        selected && "bg-selected font-medium hover:bg-selected",
      )}
    >
      <AppGlyph app={app} size={20} badgeClassName={badgeBg} />
      <span className="min-w-0 flex-1 truncate">{APP_DISPLAY_NAME[app]}</span>
    </button>
  );
}

function NavItem({
  selected,
  icon: Icon,
  label,
  title,
  trailing,
  trailingLabel,
  alert,
  dot = false,
  dotTone = "neutral",
  onClick,
}: {
  selected: boolean;
  icon: IconComponent;
  label: string;
  title?: string;
  /** 行尾的小字；放不下时在空格处折成两行，给数组时直接上下排 */
  trailing?: string | string[];
  /** 行尾小字的完整说法（读屏和悬停用），行尾只写了数时给 */
  trailingLabel?: string;
  /** 红点：需要处理，内容是给读屏的说明 */
  alert?: string;
  /** 圆点：有更新 */
  dot?: boolean;
  /** 工具更新用中性色（很多人不想追新）；CC Switch 自己的更新用绿色，和工具更新分开 */
  dotTone?: "neutral" | "success";
  onClick: () => void;
}) {
  const ring = selected ? "border-selected" : "border-sidebar";
  const dotFill = dotTone === "success" ? "bg-success" : "bg-fg-1";
  const trailingLines =
    trailing == null ? [] : Array.isArray(trailing) ? trailing : [trailing];
  const accessibleName = [
    label,
    trailingLabel ?? trailingLines.join(" · "),
    alert,
  ]
    .filter(Boolean)
    .join(" · ");
  const glyph = (
    <span aria-hidden="true" className="relative flex shrink-0 text-fg-2">
      <Icon className="h-5 w-5" />
      {dot && (
        <span
          className={cn(
            "absolute -end-1 -top-[3px] h-2.5 w-2.5 rounded-full border-2",
            dotFill,
            ring,
          )}
        />
      )}
    </span>
  );

  // 名字可见；只有 title 比名字多说了点什么（如「有可用更新」），
  // 或行尾只写了数（完整说法在 trailingLabel）时才挂提示
  const hoverContent =
    title && title !== label
      ? title
      : trailingLabel
        ? accessibleName
        : undefined;
  return (
    <HoverTip content={hoverContent} side="right" disableHoverableContent>
      <button
        type="button"
        onClick={onClick}
        aria-label={trailingLabel ? accessibleName : undefined}
        aria-current={selected ? "page" : undefined}
        className={cn(
          "flex h-9 shrink-0 items-center gap-3 rounded-control px-2 text-start transition-colors hover:bg-subtle",
          "mx-3",
          selected && "bg-selected font-medium hover:bg-selected",
        )}
      >
        {glyph}
        {trailingLines.length === 0 ? (
          <span className="min-w-0 flex-1 truncate">{label}</span>
        ) : (
          <>
            {/* 有行尾小字时名字不让：放不下就让小字折行（两行正好塞进 28px 的行高） */}
            <span className="shrink-0 grow">{label}</span>
            <span className="min-w-0 text-end text-caption leading-[13px] tabular-nums text-fg-3">
              {trailingLines.map((line) => (
                <span
                  key={line}
                  className={
                    trailingLines.length > 1
                      ? "block whitespace-nowrap"
                      : undefined
                  }
                >
                  {line}
                </span>
              ))}
            </span>
          </>
        )}
        {alert && (
          <span
            role="img"
            aria-label={alert}
            title={alert}
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger"
          />
        )}
      </button>
    </HoverTip>
  );
}

export type { SidebarProps };
