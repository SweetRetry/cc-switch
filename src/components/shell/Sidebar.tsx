import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { getVersion } from "@tauri-apps/api/app";
import {
  ArrowLeft,
  BookOpen,
  ChartColumn,
  Database,
  Folder,
  Info,
  LayoutGrid,
  Server,
  Settings,
  SlidersHorizontal,
} from "lucide-react";
import type { AppId } from "@/lib/api";
import type { VisibleApps } from "@/types";
import { orderAppIds } from "@/config/appConfig";
import type { GlobalPage, SettingsSection, View } from "@/lib/navigation";
import { isAppPage } from "@/lib/navigation";
import { SkillsIcon } from "@/components/BrandIcons";
import { useUpdate } from "@/contexts/UpdateContext";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useProvidersQuery, useSettingsQuery } from "@/lib/query";
import { usePiCurrentState } from "@/lib/query/pi";
import { providersApi } from "@/lib/api/providers";
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
  settingsSection: SettingsSection;
  onSelectApp: (app: AppId) => void;
  onSelectPage: (page: GlobalPage | "settings") => void;
  onSelectSettingsSection: (section: SettingsSection) => void;
  onExitSettings: () => void;
  /** 打开了「启动时检查应用更新」并且查到了新版本 */
  appsUpdateAvailable?: boolean;
}

/**
 * 主导航（v7）：顶条 44 → 应用列表（唯一滚动的区域）→ 全局 6 项（贴底）→ 底栏「应用 · 设置」。
 * 侧栏始终以 200px 宽度显示，进入设置后整条侧栏换成设置目录。
 */
export function Sidebar(props: SidebarProps) {
  const { t } = useTranslation();
  const { view } = props;
  const inSettings = view === "settings";

  return (
    <nav
      aria-label={t("nav.mainLabel")}
      className="relative flex h-full w-[200px] shrink-0 flex-col overflow-hidden whitespace-nowrap border-e border-border bg-sidebar text-body text-fg-1"
    >
      <a
        href="#main-content"
        className="absolute -start-[999px] top-2 z-10 rounded-control bg-surface px-2 py-1 text-caption shadow-v7-sm focus:start-2"
      >
        {t("nav.skipToContent")}
      </a>
      <SidebarTopBar />
      {inSettings ? (
        <SettingsDirectory {...props} />
      ) : (
        <MainDirectory {...props} />
      )}
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
          className="-mt-[18px] mb-2 flex h-9 shrink-0 items-center gap-2 pe-2 ps-4"
          {...DRAG_REGION_ATTR}
          style={DRAG_REGION_STYLE as React.CSSProperties}
        >
          <img
            src={ccswitchLogo}
            alt=""
            draggable={false}
            className="pointer-events-none h-5 w-5 shrink-0"
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
  const { moneyShort } = useMoneyFormat();
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
        return todayCost > 0 ? moneyShort(todayCost) : null;
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
  const todayText =
    todayValues.length > 0
      ? t("nav.today", { value: todayValues.join(" · ") })
      : undefined;
  const todayTrailing = todayValues.length > 1 ? todayValues : todayText;

  const globals: {
    page: GlobalPage;
    label: string;
    icon: IconComponent;
    trailing?: string | string[];
    trailingLabel?: string;
    alert?: string;
  }[] = [
    { page: "mcp", label: "MCP", icon: Server },
    { page: "skills", label: "Skills", icon: SkillsIcon },
    { page: "prompts", label: t("nav.prompts"), icon: BookOpen },
    {
      page: "usage",
      label: t("nav.usage"),
      icon: ChartColumn,
      trailing: todayTrailing,
      trailingLabel: todayText,
    },
  ];

  const isGlobalSelected = (page: GlobalPage) => view === page;

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden pb-2 pt-0.5">
        <div
          role="group"
          aria-label={t("nav.appsGroup")}
          className="flex shrink-0 flex-col"
        >
          {apps.map((app) => (
            <AppNavItem
              key={app}
              app={app}
              selected={onAppPage && activeApp === app}
              onSelect={() => onSelectApp(app)}
            />
          ))}
        </div>
      </div>

      <div className="mx-4 mb-1.5 mt-0.5 h-px shrink-0 bg-border" />

      <div className="flex shrink-0 flex-col pb-2">
        {globals.map((item) => (
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
        ))}
        <NavItem
          selected={view === "apps"}
          icon={LayoutGrid}
          label={t("nav.apps")}
          title={
            appsUpdateAvailable ? t("nav.appsHasUpdate") : t("nav.appsTitle")
          }
          dot={appsUpdateAvailable}
          onClick={() => onSelectPage("apps")}
        />
        <NavItem
          selected={false}
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

function AppNavItem({
  app,
  selected,
  onSelect,
}: {
  app: AppId;
  selected: boolean;
  onSelect: () => void;
}) {
  const name = APP_DISPLAY_NAME[app];
  const badgeBg = selected ? "bg-selected" : "bg-sidebar";
  const subtitle = useAppNavSubtitle(app);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "page" : undefined}
      className={cn(
        "mx-2 flex w-[184px] shrink-0 items-start gap-2 rounded-control px-2 py-1 text-start transition-colors hover:bg-subtle",
        selected && "bg-selected hover:bg-selected",
      )}
    >
      <span className="mt-0.5 flex shrink-0">
        <AppGlyph app={app} size={16} badgeClassName={badgeBg} />
      </span>
      <span className="grid min-w-0 flex-1">
        <span className={cn("truncate", selected && "font-medium")}>
          {name}
        </span>
        <span className="min-h-[1lh] truncate text-caption text-fg-3">
          {subtitle}
        </span>
      </span>
    </button>
  );
}

/** 应用行的副标题：直连应用写当前供应商，共存式写启用了几家，Antigravity 写有几家。 */
function useAppNavSubtitle(app: AppId): string | undefined {
  const { t } = useTranslation();
  const { data } = useProvidersQuery(app);
  const { data: opencodeLiveIds } = useQuery({
    queryKey: ["opencodeLiveProviderIds"],
    queryFn: () => providersApi.getOpenCodeLiveProviderIds(),
    enabled: app === "opencode",
  });
  const { data: piState } = usePiCurrentState(app === "pi", "pi");
  if (!data) return undefined;
  switch (app) {
    case "claude":
    case "codex":
      return (
        data.providers[data.currentProviderId]?.name ?? t("nav.noProvider")
      );
    case "opencode":
      return opencodeLiveIds
        ? t("nav.enabledCount", { count: opencodeLiveIds.length })
        : undefined;
    case "pi":
      return piState
        ? t("nav.enabledCount", { count: piState.enabledProviderIds.length })
        : undefined;
    case "agy":
      return t("nav.providerCount", {
        count: Object.keys(data.providers).length,
      });
  }
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
  endDot = false,
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
  /** 圆点放在行尾（设置目录里的「关于」），而不是图标角上 */
  endDot?: boolean;
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
      <Icon className="h-[18px] w-[18px]" />
      {dot && !endDot && (
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
          "flex h-7 shrink-0 items-center gap-2 rounded-control px-2 text-start transition-colors hover:bg-subtle",
          "mx-2 w-[184px]",
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
        {dot && endDot && (
          <span
            aria-hidden="true"
            className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotFill)}
          />
        )}
      </button>
    </HoverTip>
  );
}

// ─── 设置目录 ──────────────────────────────────────────────────────────────

const SETTINGS_ITEMS: { section: SettingsSection; icon: IconComponent }[] = [
  { section: "general", icon: SlidersHorizontal },
  { section: "appConfig", icon: Folder },
  { section: "data", icon: Database },
  { section: "about", icon: Info },
];

function SettingsDirectory({
  settingsSection,
  onSelectSettingsSection,
  onExitSettings,
}: SidebarProps) {
  const { t } = useTranslation();
  const { hasUpdate } = useUpdate();
  const { data: version } = useQuery({
    queryKey: ["app-version"],
    queryFn: () => getVersion(),
    staleTime: Infinity,
  });

  return (
    <>
      <button
        type="button"
        onClick={onExitSettings}
        className="mx-2 flex h-7 w-[184px] shrink-0 items-center gap-2 rounded-control px-2 text-start text-fg-2 transition-colors hover:bg-subtle hover:text-fg-1"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
        {t("nav.back")}
      </button>
      <div className="mt-3 px-4 pb-1 text-badge text-fg-3">
        {t("nav.settings")}
      </div>
      <div
        role="group"
        aria-label={t("nav.settings")}
        className="flex min-h-0 flex-1 flex-col"
      >
        {SETTINGS_ITEMS.map(({ section, icon }) => (
          <NavItem
            key={section}
            selected={settingsSection === section}
            icon={icon}
            label={t(`settings.sections.${section}`)}
            dot={section === "about" && hasUpdate}
            dotTone="success"
            endDot
            title={
              section === "about" && hasUpdate
                ? t("nav.settingsHasUpdate")
                : undefined
            }
            onClick={() => onSelectSettingsSection(section)}
          />
        ))}
      </div>
      {version && (
        <div className="shrink-0 px-4 pb-4 text-caption text-fg-3">
          CC Switch v{version}
        </div>
      )}
    </>
  );
}

export type { SidebarProps };
