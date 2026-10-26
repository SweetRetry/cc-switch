import { Fragment, type ReactNode } from "react";
import type { AppId } from "@/lib/api";

const PROMPT_FILE_NAME: Partial<Record<AppId, string>> = {
  claude: "CLAUDE.md",
  codex: "AGENTS.md",
  opencode: "AGENTS.md",
  pi: "AGENTS.md",
};

export function promptFileName(app: AppId): string {
  return PROMPT_FILE_NAME[app] ?? "AGENTS.md";
}

export function utf8Bytes(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function formatSize(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

/**
 * 说明里的标识符（路径、文件名、斜杠命令）用等宽字；「名字」整体不断行。
 * 和画板 Prompts.dc.html 的 segs() 同一条规则。
 */
const SEG_RE =
  /(~[/\\][\w./\\-]*[\w/\\]|[A-Z_]+\.md|\/[a-z0-9][a-z0-9._-]*|「[^」]{1,24}」)/;
const SEG_WHOLE = new RegExp(`^${SEG_RE.source}$`);

export function renderSegs(text: string): ReactNode {
  return text
    .split(SEG_RE)
    .filter((part) => part !== "")
    .map((part, index) => {
      if (!SEG_WHOLE.test(part)) return <Fragment key={index}>{part}</Fragment>;
      if (part.startsWith("「")) {
        return (
          <span key={index} className="whitespace-nowrap">
            {part}
          </span>
        );
      }
      return (
        <code key={index} className="whitespace-nowrap font-mono text-caption">
          {part}
        </code>
      );
    });
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
