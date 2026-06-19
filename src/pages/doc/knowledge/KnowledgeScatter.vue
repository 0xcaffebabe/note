<template>
  <div class="knowledge-scatter-container">
    <!-- 知识断代指数展示区域 -->
    <div class="knowledge-gap-index-container">
      <div class="gap-index-card">
        <div class="index-header">
          <h3>知识断代指数</h3>
        </div>
        <div class="index-content">
          <div class="gap-index-value" :class="getGapIndexLevelClass(knowledgeGapIndex)">
            {{ knowledgeGapIndex }}
          </div>
          <div class="gap-index-details">
            <span class="oldest-date">最老: {{ oldestDate }}</span>
            <span class="newest-date">最新: {{ newestDate }}</span>
            <span class="time-span">跨度: {{ timeSpan }}天</span>
            <span class="max-gap" :title="gapWindow ? ('最长断层窗口: ' + gapWindow) : ''">最长断层: {{ maxGapDays }}天</span>
          </div>
        </div>
        <div class="gap-index-interpretation">{{ getGapIndexInterpretation(knowledgeGapIndex) }}</div>
      </div>
    </div>

    <!-- 图表容器 -->
    <div ref="container" class="container" :class="{'mobile-container': $isMobile()}"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import api from "@/api";
import * as echarts from "echarts/core";
import {
  GridComponent,
  GridComponentOption,
  DataZoomComponent,
  DataZoomComponentOption,
  TooltipComponent,
  TooltipComponentOption,
  MarkLineComponent,
  MarkLineComponentOption,
  MarkAreaComponent,
  MarkAreaComponentOption,
  BrushComponent,
  BrushComponentOption,
  ToolboxComponent,
  ToolboxComponentOption
} from "echarts/components";
import { ScatterChart, ScatterSeriesOption } from "echarts/charts";
import { UniversalTransition } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";
import DocFileInfo from "@/dto/DocFileInfo";
import DocQuality from "@/dto/doc/DocQuality";
import DocService from "@/service/DocService";

echarts.use([
  GridComponent,
  DataZoomComponent,
  ScatterChart,
  CanvasRenderer,
  UniversalTransition,
  TooltipComponent,
  MarkLineComponent,
  MarkAreaComponent,
  BrushComponent,
  ToolboxComponent
]);

type EChartsOption = echarts.ComposeOption<
  GridComponentOption | DataZoomComponentOption | ScatterSeriesOption | TooltipComponentOption
  | MarkLineComponentOption | MarkAreaComponentOption | BrushComponentOption | ToolboxComponentOption
>;

// 中位数: 象限分割用它而非"最大值的几分之几", 抗离群且能把文档大致均分到四象限
function median(nums: number[]): number {
  if (!nums.length) {
    return 0;
  }
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

interface ScatterPoint {
  name: string;
  value: [number, number, string];
  symbolSize: number;
  itemStyle: { color: string };
}

export default defineComponent({
  props: {
    doc: {
      type: String,
      required: true
    }
  },
  emits: ['focus-doc'],
  mounted() {
    this.init();
    // 抽屉可拖拽 + 布局变化: 监听容器尺寸主动 resize, 否则图表不会随之重绘
    const container = this.$refs.container as HTMLElement;
    if (container && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        // 抽屉开合动画期间容器可能为 0 尺寸, 此时 resize 会让坐标系建不出来并报错, 跳过
        const el = this.$refs.container as HTMLElement;
        if (this.chart && el && el.clientWidth > 0 && el.clientHeight > 0) {
          this.chart.resize();
        }
      });
      this.resizeObserver.observe(container);
    }
  },
  beforeUnmount() {
    this.resizeObserver?.disconnect();
    this.chart?.dispose();
    this.chart = null;
  },
  data() {
    return {
      knowledgeGapIndex: 0, // 知识断代指数
      timeSpan: 0, // 时间跨度（天）
      oldestDate: '', // 最老文档日期
      newestDate: '', // 最新文档日期
      maxGapDays: 0, // 最长无更新间隔（天）
      gapWindow: '', // 断层窗口 "起 ~ 止"
      chart: null as echarts.ECharts | null,
      chartData: [] as ScatterPoint[],
      idToIndex: new Map<string, number>(), // 文档id → 散点 dataIndex, 供 hover 联动高亮
      qualityMap: new Map<string, DocQuality>(), // 文档id → 质量明细, 供 tooltip 展示子维度
      resizeObserver: null as ResizeObserver | null
    };
  },
  watch: {
    doc() {
      this.init();
    }
  },
  methods: {
    // 生成散点图数据 [时间新鲜度, 质量维度, 文档id]; 顺带建立质量明细映射
    async generateScatterData(): Promise<{data: [number, number, string][], timeRange: {min: number, max: number, daysDiff: number}}> {
      const docUpdateList = await api.getDescCommitDocList();
      const times = docUpdateList.map((v) => new Date(v[1].date).getTime());
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      const daysDiff = (maxTime - minTime) / (1000 * 3600 * 24); // 时间差（天数）

      const docQualityList = await api.getDocQualityData();
      this.qualityMap = new Map(docQualityList.map((q) => [q.id, q]));

      const map = new Map<string, [number, number]>();
      for (let i of docUpdateList) {
        if (!map.has(i[0])) {
          map.set(i[0], [0, 0]);
        }
        map.get(i[0])![0] =
          (new Date(i[1].date).getTime() - minTime) / (1000 * 3600 * 24);
      }
      for (let i of docQualityList) {
        if (map.get(i.id)) {
          map.get(i.id)![1] = i.quality;
        }
      }
      const data = Array.from(map.entries()).map((v) => [...v[1], v[0]]) as [number, number, string][];

      return {
        data,
        timeRange: {
          min: minTime,
          max: maxTime,
          daysDiff
        }
      };
    },
    async init() {
      const { data, timeRange } = await this.generateScatterData();

      // 时间新鲜度序列(距最老文档天数) → 断代指数与象限分割共用
      const freshness = data.map(v => v[0]);
      this.calculateKnowledgeGapIndex(timeRange, freshness);

      this.chartData = data.map(v => ({
        name: v[2],
        value: v,
        symbolSize: this.doc == v[2] ? 20 : 12,
        itemStyle: {
          color: this.doc == v[2] ? '#F56C6C' : '#409EFF'
        }
      }));
      this.idToIndex = new Map(this.chartData.map((p, i) => [p.name, i]));

      const xs = data.map(v => v[0]);
      const ys = data.map(v => v[1]);
      const xMax = xs.length ? Math.max(...xs) : 0;
      const yMax = ys.length ? Math.max(...ys) : 0;
      const xMid = median(xs);
      const yMid = median(ys);
      // 数据够多且有跨度才画象限, 否则退化为普通散点(避免单点/零跨度时画出无意义的格子)
      const hasQuadrants = data.length >= 4 && xMax > 0 && yMax > 0;
      const xTop = xMax * 1.02;
      const yTop = yMax * 1.02;

      const self = this;
      const option: EChartsOption = {
        grid: { top: 48, right: 28, bottom: 48, left: 56 },
        xAxis: {
          name: '时间新鲜度 →',
          nameGap: 24,
          min: 0,
          max: hasQuadrants ? Math.ceil(xTop) : undefined
        },
        yAxis: {
          name: '质量 →',
          min: 0,
          max: hasQuadrants ? Number(yTop.toFixed(2)) : undefined
        },
        tooltip: {
          formatter(params: any, ticket: string, callback: (ticket: string, html: string) => any): string {
            const id = (params.data as any).name;
            const sub = self.subDimLine(id);
            const result: Promise<DocFileInfo> | DocFileInfo = DocService.getDocFileInfo(id);
            if (result instanceof Promise) {
              result
                .then(file => {
                  callback(ticket, DocService.buildSummaryDocInfo(file) + sub);
                })
                .catch(err => {
                  callback(ticket, `${err}`);
                });
              return 'loading';
            } else {
              return DocService.buildSummaryDocInfo(result) + sub;
            }
          }
        },
        series: [
          {
            symbolSize: 12,
            data: this.chartData,
            type: "scatter",
            emphasis: { scale: 2 },
            ...(hasQuadrants ? {
              // 中位数十字线: 把"质量×新鲜度"切成四象限
              markLine: {
                silent: true,
                symbol: 'none',
                lineStyle: { type: 'dashed', color: 'rgba(144,147,153,0.45)' },
                label: { show: false },
                data: [{ xAxis: xMid }, { yAxis: yMid }] as any
              },
              // 四象限语义底色 + 标注: 让用户一眼看出"该回顾谁 / 该重写谁"
              markArea: {
                silent: true,
                label: { show: true, position: 'inside', color: '#909399', fontSize: 12 },
                data: [
                  [{ name: '优先回顾', coord: [0, yMid], itemStyle: { color: 'rgba(230,162,60,0.10)' } }, { coord: [xMid, yTop] }],
                  [{ name: '核心活跃', coord: [xMid, yMid], itemStyle: { color: 'rgba(103,194,58,0.08)' } }, { coord: [xTop, yTop] }],
                  [{ name: '可重写 / 归档', coord: [0, 0], itemStyle: { color: 'rgba(245,108,108,0.07)' } }, { coord: [xMid, yMid] }],
                  [{ name: '新生待完善', coord: [xMid, 0], itemStyle: { color: 'rgba(64,158,255,0.07)' } }, { coord: [xTop, yMid] }]
                ] as any
              }
            } : {})
          },
        ],
      } as any;

      const chartDom = this.$refs.container as HTMLElement;
      // 复用实例: 原实现每次 doc 变化都 echarts.init 同一 DOM, 既告警又泄漏旧实例与事件
      if (!this.chart) {
        this.chart = echarts.init(chartDom);
        this.bindChartEvents();
      }
      this.chart.setOption(option, true);
    },

    // 图表事件仅绑定一次, 切换文档时只 setOption, 避免事件回调叠加
    bindChartEvents() {
      const chart = this.chart!;
      chart.on('click', (e: any) => {
        const id = (e.data as any)?.name;
        if (id) {
          this.$router.push('/doc/' + id);
        }
      });
      // 悬停散点 → 通知父级在时间线里定位并高亮该文档(双向联动的"图→线"方向)
      chart.on('mouseover', { seriesIndex: 0 }, (e: any) => {
        const id = (e.data as any)?.name;
        if (id) {
          this.$emit('focus-doc', id);
        }
      });
      chart.on('mouseout', { seriesIndex: 0 }, () => {
        this.$emit('focus-doc', null);
      });
    },

    // tooltip 里补上被丢弃的质量子维度(内容/链接/活跃度), 仅在有非零值时展示
    subDimLine(id: string): string {
      const q = this.qualityMap.get(id);
      if (!q) {
        return '';
      }
      const parts: string[] = [];
      if (q.contentQuality) {
        parts.push(`📄内容 ${q.contentQuality.toFixed(2)}`);
      }
      if (q.linkQuality) {
        parts.push(`🔗链接 ${q.linkQuality.toFixed(2)}`);
      }
      if (q.updateActivity) {
        parts.push(`🔄活跃 ${q.updateActivity.toFixed(2)}`);
      }
      return parts.length ? `<div>${parts.join(' · ')}</div>` : '';
    },

    // 供时间线 hover 联动: 高亮对应散点(传 null 取消高亮)
    highlightDoc(id: string | null) {
      if (!this.chart) {
        return;
      }
      this.chart.dispatchAction({ type: 'downplay', seriesIndex: 0 });
      if (id == null) {
        return;
      }
      const idx = this.idToIndex.get(id);
      if (idx == null) {
        return;
      }
      this.chart.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: idx });
    },

    // 计算知识断代指数: 最长无更新间隔 / 总跨度
    // 更新分布越均匀越接近 0; 存在大段无更新空窗时越接近 1, 才真正反映"断代"
    calculateKnowledgeGapIndex(timeRange: {min: number, max: number, daysDiff: number}, freshnessDays: number[]) {
      const span = timeRange.daysDiff;
      const sorted = [...freshnessDays].sort((a, b) => a - b);
      let maxGap = 0, gapStart = 0, gapEnd = 0;
      for (let i = 1; i < sorted.length; i++) {
        const g = sorted[i] - sorted[i - 1];
        if (g > maxGap) {
          maxGap = g;
          gapStart = sorted[i - 1];
          gapEnd = sorted[i];
        }
      }
      const index = span > 0 ? maxGap / span : 0;

      // 更新组件数据
      this.knowledgeGapIndex = parseFloat(index.toFixed(2));
      this.timeSpan = Math.round(span);
      this.maxGapDays = Math.round(maxGap);

      const oldestDate = new Date(timeRange.min);
      const newestDate = new Date(timeRange.max);
      this.oldestDate = this.formatDate(oldestDate);
      this.newestDate = this.formatDate(newestDate);

      // 断层窗口 = 最老时间分别 + gapStart/gapEnd 天
      if (maxGap > 0) {
        const dayMs = 1000 * 3600 * 24;
        const from = new Date(timeRange.min + gapStart * dayMs);
        const to = new Date(timeRange.min + gapEnd * dayMs);
        this.gapWindow = `${this.formatDate(from)} ~ ${this.formatDate(to)}`;
      } else {
        this.gapWindow = '';
      }
    },

    // 格式化日期为可读格式
    formatDate(date: Date) {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    },

    // 根据断代指数获取等级样式类
    getGapIndexLevelClass(index: number) {
      if (index < 0.25) {
        return 'low-gap';
      } else if (index < 0.5) {
        return 'medium-gap';
      } else if (index < 0.75) {
        return 'high-gap';
      } else {
        return 'critical-gap';
      }
    },

    // 获取断代指数的解释说明
    getGapIndexInterpretation(index: number) {
      if (index < 0.25) {
        return '更新分布均匀，知识体系连续性良好';
      } else if (index < 0.5) {
        return '存在一定空窗期，部分时段更新停滞';
      } else if (index < 0.75) {
        return '断层较明显，有较长时间未沉淀新内容';
      } else {
        return '存在严重断层，大段时期知识更新停滞，建议补充';
      }
    }
  },
});

</script>

<style lang="less" scoped>
.container {
  width: 100%;
  height: 100%;
}
.mobile-container {
  height: 450px; // 进一步减小移动设备高度
}

.knowledge-scatter-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .knowledge-gap-index-container {
    padding: 8px;
    margin-bottom: 8px;
    background-color: var(--main-bg-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);

    .gap-index-card {
      display: flex;
      flex-direction: column;
      background: var(--card-bg-color);
      border-radius: var(--radius-md);
      padding: 10px;

      .index-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;

        h3 {
          margin: 0;
          color: var(--main-text-color);
          font-size: 1.1em;
        }
      }

      .index-content {
        display: flex;
        align-items: center;
        font-size: 0.85em;
        color: var(--secondary-text-color);

        .gap-index-value {
          font-size: 1.8em;
          font-weight: bold;
          min-width: 50px;
          margin-right: 10px;
          transition: all 0.3s ease;

          &.low-gap {
            color: var(--success-color); // 绿色 - 低断层
          }

          &.medium-gap {
            color: var(--warning-color); // 黄色 - 中等断层
          }

          &.high-gap {
            color: #E74C3C; // 橙红色 - 高断层(warning与danger之间的阶梯色 无对应令牌)
          }

          &.critical-gap {
            color: var(--danger-color); // 红色 - 严重断层
            animation: pulse 1.5s infinite;
          }
        }

        .gap-index-details {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          flex: 1;

          span {
            font-size: 1em;
            color: var(--secondary-text-color);
          }
        }
      }

      .gap-index-interpretation {
        font-size: 0.75em;
        color: var(--secondary-text-color);
        font-style: italic;
        padding: 4px 6px;
        background-color: var(--primary-light-color);
        border-left: 2px solid var(--primary-color);
        text-align: left;
        margin-top: 4px;
        display: none; /* 默认隐藏解释文本，节省空间 */
      }
    }
  }

  // 在较大屏幕上水平排列断代指数信息
  // 注: min-width 增强档(非移动裁切), 768 故意保留 —— 映射 @bp-mobile(820) 会回归 769-819 区间
  @media (min-width: 768px) {
    .gap-index-card {
      flex-direction: row;
      align-items: center;
      padding: 8px;

      .index-header {
        width: 120px; // 为标题预留固定宽度

        h3 {
          font-size: 1.1em;
        }
      }

      .index-content {
        flex: 1;
        justify-content: flex-start;
        font-size: 0.85em;

        .gap-index-value {
          font-size: 2em;
          min-width: 60px;
        }

        .gap-index-details {
          display: flex;
          gap: 12px;

          span {
            font-size: 0.85em;
          }
        }
      }

      .gap-index-interpretation {
        display: block; // 在较大屏幕上显示解释文本
        font-size: 0.8em;
        width: 25%; // 为解释文本预留固定宽度
        padding: 6px;
      }
    }
  }

  // 在更大屏幕上进一步优化(min-width 增强档): 1200 收敛到 @bp-desktop, 增强延后 80px 可接受
  @media (min-width: @bp-desktop) {
    .gap-index-card {
      padding: 10px;

      .index-header {
        width: 150px;
      }

      .index-content {
        .gap-index-value {
          font-size: 2.2em;
          min-width: 70px;
        }

        .gap-index-details {
          gap: 15px;
        }
      }

      .gap-index-interpretation {
        width: 30%;
        font-size: 0.85em;
      }
    }

    .container {
      flex: 1;
      min-height: 550px; // 为大屏幕上的图表留更多空间
    }
  }

  // 为整个容器分配高度
  .container {
    flex: 1;
    min-height: 280px; // 确保图表区域有足够的显示空间
  }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
</style>
