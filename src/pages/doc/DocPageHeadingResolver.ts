import { slugify } from "@/util/Slugger";

/**
 * 从 DocPageEventManager 抽出的两段纯/仅依赖 DOM 的逻辑, 与 Vue/element-plus 解耦以便单测:
 *  - resolveHeadingElement: syncHeading 的标题三级解析(原始id -> slug -> 标题文本前缀)
 *  - openOutterLinkFallback: openOutterLink 的兜底分支(有资源浏览器则 show, 否则新标签打开)
 * 这两个函数不持有 Vue 实例, 由原类方法委托调用以保持运行时行为不变。
 */

/**
 * 标题元素三级解析:
 *  1) 直接命中 id
 *  2) slug 化后命中(兼容搜索索引/旧链接里的标题原文)
 *  3) 按标题文本(忽略大小写)前缀匹配
 * 与原 syncHeading 内联逻辑逐字保持一致, 命中不到返回 null。
 *
 * @param headingId 目标标题标识(原始 id / 标题原文)
 * @param doc 查询根(默认全局 document), 便于测试注入
 */
export function resolveHeadingElement(
  headingId: string,
  doc: Document = document
): HTMLElement | null {
  let elm: HTMLElement | null = doc.getElementById(headingId)
    || doc.getElementById(slugify(headingId));
  if (!elm) {
    const headingList = doc.querySelectorAll('.markdown-section h1,h2,h3,h4,h5,h6');
    elm = (Array.from(headingList) as HTMLElement[])
      .find(h => h.textContent?.trim().toLowerCase().startsWith(headingId.trim().toLowerCase())) || null;
  }
  return elm;
}

/**
 * 外部链接打开兜底:
 *  - 已挂载资源浏览器(brower)时交给它 show
 *  - 未挂载(兜底)时退回新标签打开, 不再静默崩溃
 * 与原 openOutterLink 行为逐字一致。
 *
 * @param brower 资源浏览器实例(可能为 undefined)
 * @param link 待打开链接
 */
export function openOutterLinkFallback(
  brower: { show(link: string): void } | undefined,
  link: string
): void {
  if (brower) {
    brower.show(link);
  } else {
    window.open(link, '_blank', 'noopener');
  }
}
