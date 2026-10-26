import type { AppId } from "@/lib/api/types";

/** Normalize the selected provider icon name. */
export function resolveProviderIcon(
  _appId: AppId,
  icon?: string,
  _iconColor?: string,
): string | undefined {
  const normalizedIcon = icon?.trim();
  if (!normalizedIcon) return undefined;

  return normalizedIcon;
}
