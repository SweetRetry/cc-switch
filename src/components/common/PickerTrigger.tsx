import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 下拉 / 弹层选择器共用的触发按钮：填充底色、无描边、尾部一个 chevron。
 * 应用多选和用量页的时间范围用它，页头里并排时才是同一种控件。
 * 配合 Radix 的 `asChild` 使用，展开时的底色跟着 `data-state=open`。
 */
export const PickerTrigger = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      "flex h-8 items-center gap-1.5 rounded-control bg-selected px-2.5 outline-none transition-colors hover:bg-border-strong focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45 data-[state=open]:bg-border-strong",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-fg-3" strokeWidth={2} />
  </button>
));
PickerTrigger.displayName = "PickerTrigger";
