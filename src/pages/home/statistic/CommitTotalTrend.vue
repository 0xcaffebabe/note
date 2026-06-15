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
import api from "@/api";
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
import { cloneDeep } from '@/util/DataUtils'
import eChartMixin from '@/util/echart/eChartMixin'
import { ChartTheme, tooltipStyle } from '@/util/echart/chartTheme'

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
      const data = cloneDeep(await api.getCommitTotalTrend()) as [string, number, number, number][];
      if (!data?.length) {
        return null;
      }

      // 相对量: 逐项与前一项求差(从尾向头, 避免覆盖待用的前值)
      if (this.type === 'relative') {
        for (let i = data.length - 1; i > 0; i--) {
          data[i][1] -= data[i - 1][1]
          data[i][2] -= data[i - 1][2]
          data[i][3] -= data[i - 1][3]
        }
      }

      const absolutely = this.type === 'absolute'

      const option: EChartsOption = {
        dataZoom: [
          {
            start: 0,
            end: 100
          },
          {
            start: 0,
            end: 100
          }
        ],
        tooltip: {
          trigger: "axis",
          ...tooltipStyle(theme),
        },
        legend: {
          data: absolutely ? ["总字数", "总行数", "总提交"] : ["相对字数", "相对行数", "相对提交"],
          textStyle: {
            color: theme.subText,
          }
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "3%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: data.map(v => v[0]),
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
            name: absolutely ? "总字数" : '相对字数',
            type: "line",
            data: data.map(v => v[1]),
          },
          {
            name: absolutely ? "总行数" : '相对行数',
            type: "line",
            data: data.map(v => v[2]),
          },
          {
            name: absolutely ? "总提交" : '相对提交',
            type: "line",
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
// 宽度交父级 flex 控制, 仅在此覆写高度
.chart-box {
  height: 360px;
}
</style>
