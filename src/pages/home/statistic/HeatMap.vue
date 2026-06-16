<template>
  <div class="chart-host">
    <div ref="chartEl" class="chart-box" role="img" :aria-label="`提交日历热力图`"></div>
    <div v-if="chartState === 'empty' || chartState === 'error'" class="chart-overlay" role="status">
      {{ chartState === 'empty' ? '暂无数据' : '数据加载失败' }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import * as echarts from "echarts/core";
import {
  CalendarComponent,
  CalendarComponentOption,
  TooltipComponent,
  TooltipComponentOption,
  VisualMapComponent,
  VisualMapComponentOption,
} from "echarts/components";
import { HeatmapChart, HeatmapSeriesOption } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import api from "@/api";
import HeatMapUtils from "./HeatMapUtils";
import eChartMixin from "@/util/echart/eChartMixin";
import { ChartTheme, tooltipStyle } from "@/util/echart/chartTheme";

// 标题交由父级 Statistic 卡片 h3 承担, 故移除 TitleComponent
echarts.use([
  CalendarComponent,
  TooltipComponent,
  VisualMapComponent,
  HeatmapChart,
  CanvasRenderer,
]);

type EChartsOption = echarts.ComposeOption<
  | CalendarComponentOption
  | TooltipComponentOption
  | VisualMapComponentOption
  | HeatmapSeriesOption
>;

const fillTimeRange = HeatMapUtils.fillTimeRange;

const generatePieces = HeatMapUtils.generatePieces;

export default defineComponent({
  mixins: [eChartMixin],
  methods: {
    async buildOption(theme: ChartTheme): Promise<EChartsOption | null> {
      const raw = await api.getCommitHeatmap();
      // 空仓库真实场景: 原始数据为空时直接空态, 否则 fillTimeRange/range 取值会 TypeError 崩页
      if (!raw.length) {
        return null;
      }
      const heatmapData = fillTimeRange(raw);
      if (!heatmapData.length) {
        return null;
      }
      // 数值取最大值 (原 sort().reverse()[0] 是字符串排序, 对数字不正确)
      const maxValue = Math.max(...heatmapData.map((v) => v[1]));
      const range = [heatmapData[0][0], heatmapData[heatmapData.length - 1][0]];
      const option: EChartsOption = {
        tooltip: {
          ...tooltipStyle(theme),
          formatter(params: any) {
            const data: [string, number] = params.data;
            return `${data[0]} ${data[1]}次`;
          },
        },
        visualMap: {
          min: 0,
          max: maxValue,
          type: "piecewise",
          orient: "horizontal",
          left: "center",
          top: 0,
          pieces: generatePieces(maxValue, this.isDark),
          textStyle: {
            color: theme.subText,
          },
        },
        calendar: {
          top: 60,
          left: 30,
          right: 30,
          cellSize: ["auto", this.isWide ? 26 : 20],
          range,
          itemStyle: {
            borderWidth: 0.5,
          },
          yearLabel: {
            show: true,
            color: theme.text,
          },
          dayLabel: {
            show: true,
            nameMap: "ZH",
            firstDay: 1,
            color: theme.subText,
          },
          monthLabel: {
            show: true,
            nameMap: "ZH",
            color: theme.subText,
          },
        },
        series: {
          type: "heatmap",
          coordinateSystem: "calendar",
          data: heatmapData,
        },
      };
      return option;
    },
  },
});
</script>

<style lang="less" scoped>
// 顶部 visualMap 图例 + 日历主体, 整体约 300px
.chart-box {
  height: calc(var(--chart-h) - 60px);
}
</style>
