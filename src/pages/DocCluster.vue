<template>
  <div class="cluster-page">
    <div class="cluster-header">
      <div class="cluster-heading">
        <h1 class="cluster-title">知识聚类</h1>
        <p class="cluster-hint">按文本相似度聚合的文档关系图 · 拖拽平移 · 滚轮缩放</p>
      </div>
      <div class="cluster-search">
        <el-input
          v-model="kw"
          placeholder="搜索高亮节点"
          size="default"
          clearable
          aria-label="搜索高亮聚类节点"
        >
          <template #prefix>
            <el-icon><search /></el-icon>
          </template>
        </el-input>
        <span v-if="noMatch" class="cluster-nomatch">无匹配节点</span>
      </div>
    </div>

    <div class="chart-host cluster-host">
      <div ref="chartEl" class="chart-box" role="img" :aria-label="ariaLabel"></div>
      <div v-if="chartState === 'empty' || chartState === 'error'" class="chart-overlay" role="status">
        {{ chartState === 'empty' ? '暂无聚类数据' : '聚类数据加载失败' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
</script>

<script lang="ts">
import { defineComponent } from "vue";
import * as echarts from "echarts/core";
import { TooltipComponent, TooltipComponentOption } from "echarts/components";
import { TreeChart, TreeSeriesOption } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import api from "@/api";
import { isMobile } from "@/composables/useBreakpoint";
import eChartMixin from "@/util/echart/eChartMixin";
import { ChartTheme, tooltipStyle } from "@/util/echart/chartTheme";
import { SysUtils } from "@/util/SysUtils";

echarts.use([TooltipComponent, TreeChart, CanvasRenderer]);

type EChartsOption = echarts.ComposeOption<
  TooltipComponentOption | TreeSeriesOption
>;

export default defineComponent({
  mixins: [eChartMixin],
  data() {
    return {
      // url ?kw= 预填高亮词; 也由搜索框驱动
      kw: (this.$route?.query?.kw?.toString() ?? "") as string,
      clusterData: null as any, // 缓存聚类根, 供 kw 高亮的轻量重绘复用
      kwTimer: undefined as ReturnType<typeof setTimeout> | undefined,
      matchCount: 0,
    };
  },
  computed: {
    ariaLabel(): string {
      return "文档知识聚类放射状关系图";
    },
    mobile(): boolean {
      return isMobile.value;
    },
    // 有搜索词但零命中时给出反馈
    noMatch(): boolean {
      return !!this.kw.trim() && this.matchCount === 0;
    },
  },
  watch: {
    kw() {
      // 防抖: 避免每个按键都全量重绘 + spinner 闪烁
      clearTimeout(this.kwTimer);
      this.kwTimer = setTimeout(() => this.applyHighlight(), 250);
    },
    // 视口跨断点时字号实时重排(与响应式约定一致)
    mobile() {
      this.renderChart();
    },
  },
  methods: {
    // 展示名: 去掉 doc/ 路径前缀与 .md 后缀, 只留文件名(全路径会令外环严重叠字, 且搜 'doc' 命中全部)
    displayName(name: string): string {
      return (name || "").split("/").pop()?.replace(/\.md$/, "") ?? "";
    },
    // 就地给匹配节点打高亮 label(每次重置全部 label 故无残留), 返回命中数
    highlightTree(node: any, theme: ChartTheme, kw: string): number {
      if (!node) {
        return 0;
      }
      let count = 0;
      const matched = !!kw && this.displayName(node.name).toLowerCase().indexOf(kw) !== -1;
      if (matched) {
        node.label = { color: theme.primary, fontWeight: "bold", fontSize: this.mobile ? 14 : 18 };
        count++;
      } else {
        node.label = undefined;
      }
      for (const child of node.children || []) {
        count += this.highlightTree(child, theme, kw);
      }
      return count;
    },
    // kw 变化走轻量路径: 仅更新 label 并 merge setOption, 保留用户 roam(平移/缩放), 不重播入场动画/不闪 spinner
    applyHighlight() {
      if (!this.chart || !this.clusterData) {
        return;
      }
      const theme = this.chartTheme();
      this.matchCount = this.highlightTree(this.clusterData, theme, this.kw.trim().toLowerCase());
      this.chart.setOption({ series: [{ data: [this.clusterData] }] });
    },
    async buildOption(theme: ChartTheme): Promise<EChartsOption | null> {
      const resp = await api.getDocCluster();
      const data = resp?.[0];
      if (!data) {
        return null;
      }
      this.clusterData = data;
      this.matchCount = this.highlightTree(data, theme, this.kw.trim().toLowerCase());
      const mobile = this.mobile;
      return {
        tooltip: {
          trigger: "item",
          triggerOn: "mousemove",
          ...tooltipStyle(theme),
          formatter: (p: any) => this.displayName(p?.data?.name),
        },
        series: [
          {
            type: "tree",
            data: [data],
            layout: "radial",
            symbol: "circle",
            symbolSize: 7,
            initialTreeDepth: -1, // 展开全部层级
            roam: true,
            expandAndCollapse: false,
            itemStyle: {
              color: theme.primary,
              borderColor: theme.surface,
              borderWidth: 1,
            },
            lineStyle: {
              color: theme.axisLine,
              width: 1,
              curveness: 0.5,
            },
            label: {
              color: theme.subText,
              fontSize: mobile ? 10 : 12,
              // 只显文件名, 去掉冗长全路径(显著缓解外环叠字)
              formatter: (p: any) => this.displayName(p?.data?.name),
            },
            emphasis: {
              focus: "descendant",
              label: { color: theme.text },
              lineStyle: { color: theme.primary, width: 1.5 },
            },
            animationDuration: 550,
            animationDurationUpdate: 750,
          },
        ],
      };
    },
  },
  mounted() {
    SysUtils.setDocTitle("知识聚类");
  },
  unmounted() {
    clearTimeout(this.kwTimer);
  },
});
</script>

<style lang="less" scoped>
.cluster-page {
  // 图谱需要横向空间, 不收窄到 --home-max; 仅留流式内边距
  padding: var(--spacing-xl) var(--content-pad) var(--spacing-lg);
}

.cluster-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-md);
}
.cluster-title {
  margin: 0;
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--main-text-color);
}
.cluster-hint {
  margin: var(--spacing-xs) 0 0;
  font-size: var(--font-size-sm);
  color: var(--secondary-text-color);
}
.cluster-search {
  width: 260px;
  max-width: 100%;

  :deep(.el-input__wrapper) {
    border-radius: var(--radius-xl);
  }
}
.cluster-nomatch {
  display: block;
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--secondary-text-color);
  text-align: right;
}

// 图表卡: 与全站卡片语言一致, 容纳全屏放射树
.cluster-host {
  height: calc(100vh - 220px);
  min-height: 460px;
  background-color: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
// 覆写全局 .chart-box 的默认 360px, 填满卡片
.cluster-host .chart-box {
  height: 100%;
}

@media (max-width: @bp-mobile) {
  // 窄屏 header 换行更高, 需多减一些避免页面溢出出现双滚动条
  .cluster-host {
    height: calc(100vh - 240px);
    min-height: 360px;
  }
  .cluster-search {
    width: 100%;
  }
}
</style>
