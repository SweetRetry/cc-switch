import type { McpServerSpec } from "@/types";

export type McpTransport = "stdio" | "http" | "sse";

export function transportOf(spec: McpServerSpec | undefined): McpTransport {
  if (spec?.type === "http" || spec?.type === "sse") return spec.type;
  if (!spec?.type && typeof spec?.url === "string" && !spec?.command) {
    return "http";
  }
  return "stdio";
}

/** 列表第二行：stdio 显示命令 + 参数，http/sse 显示去掉协议头的 URL。永不含 env / headers。 */
export function summaryOf(spec: McpServerSpec | undefined): string {
  if (!spec) return "";
  if (transportOf(spec) !== "stdio") {
    return String(spec.url ?? "").replace(/^https?:\/\//i, "");
  }
  const args = Array.isArray(spec.args) ? spec.args.map(String) : [];
  return [spec.command ?? "", ...args].join(" ").trim();
}
