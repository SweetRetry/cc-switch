/** 行与表头共用的列模板，列宽才对得齐 */
export const PROVIDER_GRID =
  "grid grid-cols-[minmax(10rem,1fr)_minmax(0,8rem)_5rem_14rem_5rem_6.5rem] items-center gap-x-4 max-[1100px]:grid-cols-[minmax(10rem,1fr)_5rem_14rem_5rem_6.5rem]";

/** 窗口窄（最小 900）时先藏模型列，名称才有地方写；表头和行都带它 */
export const PROVIDER_MODEL_COL = "max-[1100px]:hidden";

/** 列区的左右留白：所有应用同宽，列的位置和宽度才不随应用变 */
export const PROVIDER_CONTENT = "flex min-w-0 flex-1 ps-4 pe-2";
