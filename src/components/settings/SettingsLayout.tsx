import { useId, type ReactNode } from "react";
import { Switch } from "@/components/ui/switch";
import { HelpTip } from "@/components/ui/help-tip";
import { cn } from "@/lib/utils";

export function SettingsRow({
  label,
  help,
  description,
  control,
  htmlFor,
  children,
  className,
}: {
  label: ReactNode;
  help?: { title: string; body: ReactNode };
  /** 只有真正的数据（路径、地址）才写在名称下面；说明进「?」 */
  description?: ReactNode;
  control?: ReactNode;
  htmlFor?: string;
  /** 控件下面整行宽的内容（如路径输入框） */
  children?: ReactNode;
  className?: string;
}) {
  const Label = htmlFor ? "label" : "div";
  return (
    <div className={cn("px-4 py-3", className)}>
      <div className="flex min-h-[28px] items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <Label
              htmlFor={htmlFor}
              className="text-body font-medium text-fg-1"
            >
              {label}
            </Label>
            {help && <HelpTip title={help.title}>{help.body}</HelpTip>}
          </div>
          {description && (
            <div className="mt-0.5 break-all text-caption text-fg-2">
              {description}
            </div>
          )}
        </div>
        {control && (
          <div className="flex shrink-0 items-center gap-2">{control}</div>
        )}
      </div>
      {children && <div className="mt-2.5">{children}</div>}
    </div>
  );
}

/** 平铺的一组设置行：没有卡片，行与行之间一条细线，组名是一行小字。 */
export function SettingsList({
  title,
  children,
}: {
  title?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      {title && (
        <h2 className="m-0 mb-1 text-caption font-medium text-fg-2">{title}</h2>
      )}
      <div className="divide-y divide-border border-b border-border [&>div]:px-0">
        {children}
      </div>
    </section>
  );
}

/** 开关在文字左边，说明直接写在名称下面。 */
export function SettingsOption({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string;
  description?: ReactNode;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="mt-0.5"
      />
      <div className="min-w-0">
        <label htmlFor={id} className="block text-body font-medium text-fg-1">
          {label}
        </label>
        {description && (
          <p className="m-0 text-caption text-fg-2">{description}</p>
        )}
      </div>
    </div>
  );
}

/** 设置页正文：最大宽度 760，左右 24 的内边距，分节间距 28。 */
export function SettingsBody({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[760px] space-y-7 px-6 pb-10 pt-6">
      {children}
    </div>
  );
}
