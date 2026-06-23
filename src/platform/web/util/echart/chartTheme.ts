// echarts 图表统一主题: canvas 绘制无法直接用 var(), 故从 :root 读取设计令牌的当前快照值
// 暗/亮切换时同名令牌已换值, 重新 buildChartTheme() 即可拿到对应主题色 —— 组件不再写 isDark ? '#xxx' : '#yyy'
// (与 KnowledgeNetworkChart.vue 的 css() 助手同源)

function css(name: string, fallback = ''): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

export interface ChartTheme {
  /** 主文本: 强调标签/中心文案 */
  text: string
  /** 次级文本: 坐标轴/图例/普通标签 */
  subText: string
  /** 轴线/边框 */
  axisLine: string
  /** 网格分隔线 */
  splitLine: string
  /** 卡片底色: 饼图扇区描边等需与卡片融合处 */
  surface: string
  /** 悬浮层底色: tooltip 背景 */
  tooltipBg: string
  /** 悬浮层边框 */
  tooltipBorder: string
  /** 品牌主色 */
  primary: string
  /** 柱状背景槽等弱填充 */
  track: string
  /** 多系列调色板: 首位取品牌主色, 其余为与之协调的柔和色相, 统一各图配色避免 echarts 默认杂色 */
  palette: string[]
}

export function buildChartTheme(): ChartTheme {
  const primary = css('--primary-color', '#409eff')
  return {
    text: css('--main-text-color', '#1e293b'),
    subText: css('--secondary-text-color', '#64748b'),
    axisLine: css('--border-color', '#e2e8f0'),
    splitLine: css('--divider-color', '#f1f5f9'),
    surface: css('--card-bg-color', '#ffffff'),
    tooltipBg: css('--elevated-bg-color', '#ffffff'),
    tooltipBorder: css('--border-color', '#e2e8f0'),
    primary,
    track: css('--hover-bg-color', 'rgba(180,180,180,0.12)'),
    // 首位 = 品牌蓝(随主题令牌走), 其余为中等饱和、明暗背景皆可读的协调色相
    palette: [
      primary,
      '#2cc6a8',
      '#9d7cf4',
      '#f6a13c',
      '#ee6c7d',
      '#54c1e6',
      '#7cc955',
      '#e58fc0',
    ],
  }
}

/** 统一的 echarts tooltip 样式片段(走令牌, 暗/亮自适应) */
export function tooltipStyle(theme: ChartTheme) {
  return {
    backgroundColor: theme.tooltipBg,
    borderColor: theme.tooltipBorder,
    borderWidth: 1,
    textStyle: { color: theme.text },
    extraCssText: 'box-shadow: var(--shadow-md); border-radius: 6px;',
  }
}
