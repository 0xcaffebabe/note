<template>
  <div class="cluster-page">
    <div class="cluster-header">
      <div class="cluster-heading">
        <h1 class="cluster-title">知识聚类</h1>
        <p class="cluster-hint">{{ dim3 ? "按文本相似度投影的 3D 文档点云 · 同色一类 · 拖拽旋转 · 滚轮缩放 · 点击进入文档" : "按文本相似度投影的文档点云 · 同色一类 · 滚轮缩放 · 点击进入文档" }}</p>
      </div>
      <div class="cluster-tools">
        <el-tooltip
          :disabled="webglOk"
          content="当前浏览器不支持 WebGL（可在设置中开启硬件加速后重试）"
          placement="bottom"
        >
          <el-radio-group v-model="dim3" size="default" aria-label="切换 2D/3D 视图">
            <el-radio-button :value="false">2D</el-radio-button>
            <el-radio-button :value="true" :disabled="!webglOk">3D</el-radio-button>
          </el-radio-group>
        </el-tooltip>
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
import DocUtils from "@/core/util/DocUtils";
import * as echarts from "echarts/core";
import {
  TooltipComponent, TooltipComponentOption,
  GridComponent, GridComponentOption,
  LegendComponent, LegendComponentOption,
  DataZoomComponent, DataZoomComponentOption,
} from "echarts/components";
import { ScatterChart, ScatterSeriesOption } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import { Scatter3DChart } from "echarts-gl/charts";
import { Grid3DComponent } from "echarts-gl/components";
import { useServices } from '@/platform/web/app/useServices'
const { api } = useServices()
import { isMobile } from "@/platform/web/composables/useBreakpoint";
import eChartMixin from "@/platform/web/util/echart/eChartMixin";
import { ChartTheme, tooltipStyle } from "@/platform/web/util/echart/chartTheme";
import { SysUtils } from "@/platform/web/util/SysUtils";
import { KnowledgeNetworkDataProcessor } from "@/platform/web/pages/doc/knowledge/KnowledgeNetworkDataProcessor";
import type { ClusterScatter, ClusterScatterPoint } from "@/core/domain/ClusterScatterPoint";
import { webglSupported } from "@/adapters/browser/FeatureDetect";

echarts.use([TooltipComponent, GridComponent, LegendComponent, DataZoomComponent, ScatterChart, CanvasRenderer]);
// echarts-gl: 3D 散点(scatter3D)+ 三维直角坐标系(grid3D), WebGL 渲染
echarts.use([Scatter3DChart, Grid3DComponent]);

type EChartsOption = echarts.ComposeOption<
  TooltipComponentOption | GridComponentOption | LegendComponentOption | DataZoomComponentOption | ScatterSeriesOption
>;

export default defineComponent({
  mixins: [eChartMixin],
  data() {
    return {
      // url ?kw= 预填高亮词; 也由搜索框驱动
      kw: (this.$route?.query?.kw?.toString() ?? "") as string,
      dim3: false, // 2D / 3D 视图切换
      webglOk: webglSupported(), // 无 WebGL 时禁用 3D, 避免 echarts-gl 抛原始报错
      scatterData: null as ClusterScatter | null, // 缓存散点数据, 供 kw 高亮的轻量重绘复用
      kwTimer: undefined as ReturnType<typeof setTimeout> | undefined,
      matchCount: 0,
    };
  },
  computed: {
    ariaLabel(): string {
      return "文档知识聚类散点图";
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
    // 视口跨断点时点径/字号实时重排(与响应式约定一致)
    mobile() {
      this.renderChart();
    },
    // 2D <-> 3D 切换: 坐标系不同, 全量重建 option
    dim3() {
      this.renderChart();
    },
  },
  methods: {
    // 展示名: 去掉 doc/ 路径前缀与 .md 后缀, 只留文件名
    displayName(name: string): string {
      return DocUtils.pathLeafName(name);
    },
    // 按顶级分类构建 scatter / scatter3D 系列; kw 命中放大高亮、其余淡化; 顺带统计命中数写入 matchCount
    buildSeries(theme: ChartTheme, kw: string): any[] {
      const data = this.scatterData;
      if (!data) {
        return [];
      }
      const threeD = this.dim3 && this.webglOk;
      // 按顶级分类分组并取色, 与知识网络图保持一致(同源 categoryColorMapping)
      const byCat = new Map<string, ClusterScatterPoint[]>();
      for (const p of data.points) {
        const cat = KnowledgeNetworkDataProcessor.getDocCategory(p.id);
        if (!byCat.has(cat)) {
          byCat.set(cat, []);
        }
        byCat.get(cat)!.push(p);
      }
      const hasKw = !!kw;
      let matched = 0;
      const series = Array.from(byCat.entries()).map(([cat, pts]) => {
        const color = KnowledgeNetworkDataProcessor.categoryColorMapping(cat);
        const points = pts.map((p) => {
          const hit = hasKw && this.displayName(p.name).toLowerCase().indexOf(kw) !== -1;
          if (hit) {
            matched++;
          }
          const base = this.mobile ? p.size * 0.7 : p.size;
          return {
            value: threeD ? [p.x3, p.y3, p.z3] : [p.x, p.y],
            name: p.name,
            docId: p.id,
            tags: p.tags,
            s: base,
            hit,
            // scatter3D 不支持 symbolSize 回调, 故按点写入 symbolSize
            symbolSize: hit ? base * 1.7 : base,
            itemStyle: hasKw ? { opacity: hit ? 1 : 0.1 } : undefined,
            // 搜索时只显命中点的标题(其余隐藏避免和淡化点叠字)
            label: hasKw ? { show: hit } : undefined,
          };
        });
        // 点上方常驻显示文档标题
        const labelFormatter = (p: any) => this.displayName(p.data?.name);
        if (threeD) {
          return {
            name: cat,
            type: "scatter3D",
            data: points as any,
            itemStyle: { color, opacity: 0.9 },
            // 3D 无标题避让能力, 全显会有叠字; 按用户要求常驻显示全部标题
            label: {
              show: true,
              position: "top",
              distance: 4,
              formatter: labelFormatter,
              textStyle: { color: theme.subText, fontSize: 10, borderWidth: 0, backgroundColor: "transparent" },
            },
            emphasis: { label: { show: true, textStyle: { color: theme.text, fontSize: 12 } }, itemStyle: { opacity: 1 } },
          };
        }
        return {
          name: cat,
          type: "scatter",
          data: points as any,
          itemStyle: { color, borderColor: theme.surface, borderWidth: 0.5, opacity: 0.88 },
          symbolSize: (_v: any, p: any) => (p.data.hit ? p.data.s * 1.7 : p.data.s),
          label: {
            show: true,
            position: "top",
            distance: 3,
            color: theme.subText,
            fontSize: this.mobile ? 9 : 11,
            formatter: labelFormatter,
          },
          // 避让: 311 点标题全显会糊, 仅渲染互不重叠的子集
          labelLayout: { hideOverlap: true },
          emphasis: { focus: "series", scale: 1.2, label: { show: true }, itemStyle: { opacity: 1, borderColor: theme.text, borderWidth: 1 } },
          animationDelay: (idx: number) => idx * 2, // "一点一点"逐个淡入
        };
      });
      this.matchCount = matched;
      return series;
    },
    // kw 变化走轻量路径: 仅 merge 系列(保留用户缩放/平移与图例开关), 不闪 spinner
    applyHighlight() {
      if (!this.chart || !this.scatterData) {
        return;
      }
      const theme = this.chartTheme();
      this.chart.setOption({ series: this.buildSeries(theme, this.kw.trim().toLowerCase()) });
    },
    async buildOption(theme: ChartTheme): Promise<EChartsOption | null> {
      const data = await api.getDocClusterScatter();
      if (!data || !data.points?.length) {
        return null;
      }
      // 初始化顶级分类 -> 颜色映射(与知识网络同源), 保证两图配色一致
      await KnowledgeNetworkDataProcessor.initializeTopLevelCategories();
      this.scatterData = data;
      const series = this.buildSeries(theme, this.kw.trim().toLowerCase());
      // 点击点 -> 跳转文档(重建 option 前解绑, 避免重复绑定)
      this.chart?.off("click");
      this.chart?.on("click", (e: any) => {
        const id = e?.data?.docId;
        if (id) {
          this.$router.push("/doc/" + id);
        }
      });
      const tooltip = {
        trigger: "item",
        ...tooltipStyle(theme),
        formatter: (p: any) => {
          const d = p.data || {};
          const name = this.displayName(d.name);
          const tags = (d.tags || []).join(" / ");
          return `<b>${name}</b><br/><span style="opacity:.6">${p.seriesName}</span>` +
            (tags ? `<br/><span style="opacity:.6">${tags}</span>` : "");
        },
      };
      const legend = {
        type: "scroll",
        top: 0,
        left: "center",
        textStyle: { color: theme.subText, fontSize: this.mobile ? 10 : 12 },
        pageTextStyle: { color: theme.subText },
        pageIconColor: theme.primary,
        pageIconInactiveColor: theme.axisLine,
        inactiveColor: theme.axisLine,
      };

      // 3D: echarts-gl scatter3D + grid3D, 拖拽旋转 / 滚轮缩放(无 WebGL 时降级走 2D)
      if (this.dim3 && this.webglOk) {
        let lim3 = 1;
        for (const p of data.points) {
          lim3 = Math.max(lim3, Math.abs(p.x3), Math.abs(p.y3), Math.abs(p.z3));
        }
        lim3 *= 1.06;
        const axis3D = { type: "value", show: false, min: -lim3, max: lim3 } as any;
        return {
          tooltip,
          legend,
          xAxis3D: axis3D,
          yAxis3D: axis3D,
          zAxis3D: axis3D,
          grid3D: {
            show: false, // 隐藏三维外框, 只留点云
            boxWidth: 100,
            boxDepth: 100,
            boxHeight: 100,
            viewControl: {
              projection: "perspective",
              autoRotate: false,
              rotateSensitivity: 1.5,
              zoomSensitivity: 2,
              distance: 170,
              minDistance: 2, // 放开近裁剪, 允许大幅放大(默认最小 40 太远)
              maxDistance: 600,
            },
            light: {
              main: { intensity: 1.1, shadow: false },
              ambient: { intensity: 0.4 },
            },
          },
          series,
        } as unknown as EChartsOption;
      }

      // 2D: 坐标取对称范围, 尽量保持纵横比一致(嵌入空间无物理单位, 坐标轴隐藏)
      let maxAbs = 1;
      for (const p of data.points) {
        maxAbs = Math.max(maxAbs, Math.abs(p.x), Math.abs(p.y));
      }
      const lim = maxAbs * 1.06;
      return {
        tooltip,
        legend,
        grid: { left: 8, right: 8, top: this.mobile ? 46 : 40, bottom: 8, containLabel: false },
        xAxis: { type: "value", show: false, min: -lim, max: lim },
        yAxis: { type: "value", show: false, min: -lim, max: lim },
        dataZoom: [
          { type: "inside", xAxisIndex: 0, filterMode: "none" },
          { type: "inside", yAxisIndex: 0, filterMode: "none" },
        ],
        animationDurationUpdate: 400,
        animationEasingUpdate: "cubicOut",
        series,
      } as EChartsOption;
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
.cluster-tools {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  flex-wrap: wrap;
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
  .cluster-tools {
    width: 100%;
  }
  .cluster-search {
    flex: 1;
    min-width: 0;
  }
}
</style>
