/**
 * 知识网络图聚类布局的确定性几何(纯逻辑, 零框架/服务/平台依赖)。
 *
 * 从 KnowledgeNetworkChart.vue 的 assignClusterPositions 抽出确定性部分:
 *  - 各分类中心按极坐标均布在圆上;
 *  - 同类节点相对簇心的确定性偏移(小圆均布)。
 *
 * DOM 读取(clientWidth/Height)与 Math.random 抖动留在组件层:
 *  组件读出 width/height 传入, 用返回的簇心/偏移, 再自行叠加随机抖动。
 * 节点最终坐标公式与原内联实现逐项一致(随机部分本就非确定, 不计入)。
 */

export interface Point {
  x: number
  y: number
}

export interface Offset {
  dx: number
  dy: number
}

/**
 * 计算各分类中心坐标(极坐标均布在以图表中心为圆心的圆上)。
 *
 * @param categoryNames 分类名列表(顺序即均布顺序, 与原 categoryList 过滤后顺序一致)
 * @param width  图表宽度(组件传入 chartDom.clientWidth)
 * @param height 图表高度(组件传入 chartDom.clientHeight)
 * @param excludeName 需排除的分类名(原实现排除"当前"); 不传则不排除
 * @returns 分类名 → 簇心坐标 的映射; 无可用分类时返回空对象
 */
export function computeClusterCenters(
  categoryNames: string[],
  width: number,
  height: number,
  excludeName?: string,
): Record<string, Point> {
  const centerX = width / 2
  const centerY = height / 2
  const clusterRadius = Math.min(centerX, centerY) * 0.55

  const categories = excludeName === undefined
    ? categoryNames.slice()
    : categoryNames.filter(name => name !== excludeName)
  const categoryCount = categories.length

  const clusterCenters: Record<string, Point> = {}
  if (categoryCount === 0) return clusterCenters

  categories.forEach((cat, index) => {
    const angle = (index / categoryCount) * 2 * Math.PI - Math.PI / 2
    clusterCenters[cat] = {
      x: centerX + clusterRadius * Math.cos(angle),
      y: centerY + clusterRadius * Math.sin(angle),
    }
  })
  return clusterCenters
}

/**
 * 计算同类节点相对其簇心的确定性偏移(小圆上均布, 不含随机抖动)。
 *
 * @param idx   节点在同类中的序号(从 0 起)
 * @param total 同类节点总数(>=1)
 * @returns {dx, dy} 相对簇心的偏移; 调用方做 center.x + dx + 随机抖动
 */
export function nodeClusterOffset(idx: number, total: number): Offset {
  const spreadRadius = Math.min(60, total * 8)
  const angle = (idx / total) * 2 * Math.PI
  return {
    dx: spreadRadius * Math.cos(angle),
    dy: spreadRadius * Math.sin(angle),
  }
}
