/**
 * 内容页共用的版心：所有页（供应商、MCP、Skills、提示词、应用）都从这里取，
 * 宽窄和左右轴线才一致。67rem = 内容 64rem + 两侧各 1.5rem 的留白。
 */
export const PAGE_FRAME = "mx-auto w-full max-w-[67rem] px-6";

/**
 * 页头和 PAGE_FRAME 的内容共用左右轴线：图标对齐列表行里的名称（行内缩进 1rem），
 * 右缘对齐内容右缘。窗口比版心窄时退回最小留白。
 */
export const PAGE_HEADER_INSET =
  "ps-[max(2.5rem,calc((100%_-_64rem)/2_+_1rem))] pe-[max(1.5rem,calc((100%_-_64rem)/2))]";
