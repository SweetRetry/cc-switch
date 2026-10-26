import * as React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { settingsApi } from "@/lib/api";

/** 链接一律用系统浏览器打开：点开网页不该把整个应用导航走。 */
function openExternally(
  event: React.MouseEvent<HTMLAnchorElement>,
  href?: string,
) {
  event.preventDefault();
  if (!href) return;
  void settingsApi.openExternal(href).catch(() => undefined);
}

const components: Components = {
  a: ({ href, children, ...rest }) => (
    <a
      {...rest}
      href={href}
      rel="noreferrer noopener"
      onClick={(event) => openExternally(event, href)}
    >
      {children}
    </a>
  ),
};

/** 提示词文件的 Markdown 预览。排版样式见 index.css 的 .prompt-md。 */
export default function PromptMarkdown({ content }: { content: string }) {
  return (
    <div className="prompt-md">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
