import * as React from "react";
import { useTranslation } from "react-i18next";
import { SearchField } from "@/components/ui/search-field";
import { cn } from "@/lib/utils";

/** MCP 与 Skills 共用的搜索框和中性徽标。 */

// ─── 搜索框 ─────────────────────────────────────────────────────────────
interface MatrixSearchProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  /** 有内容时读屏报「找到 N 个」 */
  status?: string;
  className?: string;
  onEnter?: () => void;
  inputId?: string;
}

export function MatrixSearch({
  value,
  onValueChange,
  placeholder,
  ariaLabel,
  status,
  className,
  onEnter,
  inputId,
}: MatrixSearchProps) {
  const { t } = useTranslation();
  return (
    <>
      <SearchField
        id={inputId}
        value={value}
        onValueChange={onValueChange}
        clearLabel={t("appMatrix.clearSearch")}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        containerClassName={className}
        onKeyDown={(event) => {
          if (event.key === "Enter" && onEnter) {
            event.preventDefault();
            onEnter();
          }
        }}
      />
      <span role="status" className="sr-only">
        {status}
      </span>
    </>
  );
}

// ─── 小徽标 ─────────────────────────────────────────────────────────────
export function NeutralBadge({
  children,
  mono,
  className,
}: {
  children: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[18px] shrink-0 items-center whitespace-nowrap rounded-full border border-border-strong px-1.5 text-badge font-medium text-fg-2",
        mono && "font-mono",
        className,
      )}
    >
      {children}
    </span>
  );
}
