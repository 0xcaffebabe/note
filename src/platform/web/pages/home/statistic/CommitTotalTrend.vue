<template>
  <div>
    <!-- 维度切换放在图表上方 -->
    <el-radio-group class="trend-switch" size="small" v-model="type">
      <el-radio-button value="absolute">绝对量</el-radio-button>
      <el-radio-button value="relative">相对量</el-radio-button>
    </el-radio-group>
    <div class="chart-host">
      <div ref="chartEl" class="chart-box" role="img" aria-label="提交趋势折线图"></div>
      <div v-if="chartState === 'empty' || chartState === 'error'" class="chart-overlay" role="status">
        {{ chartState === 'empty' ? '暂无数据' : '数据加载失败' }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as echarts from 'echarts/core';
import {
  TooltipComponent,
  TooltipComponentOption,
  GridComponent,
  GridComponentOption,
  LegendComponent,
  LegendComponentOption,
  DataZoomComponent
} from 'echarts/components';
import { LineChart, LineSeriesOption } from 'echarts/charts';
import { UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import { cloneDeep, toRelativeTrend } from '@/core/util/DataUtils'
import eChartMixin from '@/platform/web/util/echart/eChartMixin'
import { ChartTheme, tooltipStyle } from '@/platform/web/util/echart/chartTheme'

echarts.use([
  TooltipComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  CanvasRenderer,
  UniversalTransition,
  DataZoomComponent
]);

type EChartsOption = echarts.ComposeOption<
  | TooltipComponentOption
  | GridComponentOption
  | LegendComponentOption
  | LineSeriesOption
>;

export default defineComponent({
  // echarts 生命周期(init/resize/暗色重渲染/dispose)统一交给 mixin
  mixins: [eChartMixin],
  data() {
    return {
      type: 'absolute' as 'absolute' | 'relative',
    }
  },
  watch: {
    // 维度切换重渲染; 暗色 watch 由 mixin 负责
    type() {
      this.renderChart()
    }
  },
  methods: {
    async buildOption(theme: ChartTheme): Promise<EChartsOption | null> {
      // fetch 失败让其自然抛出, 由 mixin catch 成错误态
      const data = cloneDeep(await this.$services.api.getCommitTotalTrend()) as [string, number, number, number][];
      if (!data?.length) {
        return null;
      }

      // 相对量: 逐项与前一项求差
      if (this.type === 'relative') {
        toRelativeTrend(data)
      }

      const absolutely = this.type === 'absolute'

      // 三条线共用调色板: 字数/行数/提交 取前三色, 与全站图表同源
      const seriesBase = {
        type: "line" as const,
        smooth: true,
        showSymbol: false,        // 默认不显点, 悬浮聚焦时才出, 线条更干净
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { width: 2.5 },
        emphasis: { focus: "series" as const },
      };

      const option: EChartsOption = {
        color: theme.palette,
        dataZoom: [
          // 一个内置滚轮/拖拽缩放(无视觉占位) + 一个底部细滑块(随令牌配色)
          { type: "inside", start: 0, end: 100 },
          {
            type: "slider",
            start: 0,
            end: 100,
            height: 16,
            bottom: 6,
            borderColor: "transparent",
            backgroundColor: theme.track,
            fillerColor: theme.track,
            handleStyle: { color: theme.surface, borderColor: theme.axisLine },
            moveHandleStyle: { color: theme.axisLine },
            dataBackground: {
              lineStyle: { color: theme.axisLine },
              areaStyle: { color: theme.splitLine },
            },
            selectedDataBackground: {
              lineStyle: { color: theme.primary },
              areaStyle: { color: theme.track },
            },
            textStyle: { color: theme.subText },
          },
        ],
        tooltip: {
          trigger: "axis",
          ...tooltipStyle(theme),
        },
        legend: {
          data: absolutely ? ["总字数", "总行数", "总提交"] : ["相对字数", "相对行数", "相对提交"],
          icon: "roundRect",
          itemWidth: 12,
          itemHeight: 4,
          textStyle: {
            color: theme.subText,
          }
        },
        grid: {
          left: "3%",
          right: "4%",
          top: 48,
          bottom: 42,         // 给底部细滑块留白
          containLabel: true,
        },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: data.map(v => v[0]),
          axisLine: { lineStyle: { color: theme.axisLine } },
          axisTick: { show: false },
          axisLabel: { color: theme.subText },
        },
        yAxis: {
          type: "value",
          min: 'dataMin',
          axisLabel: { color: theme.subText },
          splitLine: { lineStyle: { color: theme.splitLine } },
        },
        series: [
          {
            ...seriesBase,
            name: absolutely ? "总字数" : '相对字数',
            data: data.map(v => v[1]),
          },
          {
            ...seriesBase,
            name: absolutely ? "总行数" : '相对行数',
            data: data.map(v => v[2]),
          },
          {
            ...seriesBase,
            name: absolutely ? "总提交" : '相对提交',
            data: data.map(v => v[3]),
          },
        ],
      };
      return option;
    }
  },
});
</script>

<style lang="less" scoped>
.trend-switch {
  margin: 0 0 var(--spacing-sm);
}
// 宽度交父级 flex 控制, 仅在此覆写高度(宽档随 --chart-h 长高)
.chart-box {
  height: var(--chart-h);
}
</style>
