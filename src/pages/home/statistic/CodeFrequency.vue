<template>
  <div class="chart-host">
    <div ref="chartEl" class="chart-box" role="img" :aria-label="ariaLabel"></div>
    <div v-if="chartState === 'empty' || chartState === 'error'" class="chart-overlay" role="status">
      {{ chartState === 'empty' ? '暂无数据' : '数据加载失败' }}
    </div>
  </div>
</template>

<script lang="ts">
import langColor from './langColor'
import eChartMixin from './eChartMixin'
import { ChartTheme, tooltipStyle } from './chartTheme'

import { defineComponent, PropType } from "vue";
import * as echarts from "echarts/core";
import {
  TooltipComponent,
  TooltipComponentOption,
  LegendComponent,
  LegendComponentOption,
} from "echarts/components";
import { PieChart, PieSeriesOption } from "echarts/charts";
import { LabelLayout } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";
import { CodeFrequencyItem } from "@/dto/StatisticInfo";

echarts.use([
  TooltipComponent,
  LegendComponent,
  PieChart,
  CanvasRenderer,
  LabelLayout,
]);

type EChartsOption = echarts.ComposeOption<
  TooltipComponentOption | LegendComponentOption | PieSeriesOption
>;

// 饼图保留的语言条数: 超出部分合并为「其他」, 避免图例过长
const TOP_N = 9;

export default defineComponent({
  mixins: [eChartMixin],
  props: {
    codeFrequency: {
      type: Array as PropType<CodeFrequencyItem[]>,
      required: true,
    },
  },
  computed: {
    // 无障碍摘要: 取占比最大的语言作为一句话描述
    ariaLabel(): string {
      const top = [...this.codeFrequency].sort((a, b) => b.frequency - a.frequency)[0];
      return top ? `代码构成饼图，主要语言 ${top.lang}` : '代码构成饼图';
    },
  },
  watch: {
    // props 异步到达后重渲染(isDark 切换由 mixin 统一处理)
    codeFrequency() {
      this.renderChart();
    },
  },
  methods: {
    buildOption(theme: ChartTheme): EChartsOption | null {
      if (!this.codeFrequency.length) {
        return null;
      }

      // 归一化: 降序取前 N, 其余合并为「其他」; 用原始 frequency 作 value 让 echarts 自动算百分比
      const sorted = [...this.codeFrequency].sort((a, b) => b.frequency - a.frequency);
      const top = sorted.slice(0, TOP_N).map(v => ({
        name: v.lang,
        value: v.frequency,
        itemStyle: { color: langColor[v.lang] || '#ccc' },
      }));
      const restTotal = sorted.slice(TOP_N).reduce((sum, v) => sum + v.frequency, 0);
      if (restTotal > 0) {
        top.push({
          name: '其他',
          value: restTotal,
          itemStyle: { color: theme.subText },
        });
      }

      return {
        tooltip: {
          trigger: "item",
          // 名称: 占比%
          formatter: '{b}: {d}%',
          ...tooltipStyle(theme),
        },
        legend: {
          top: "5%",
          left: "center",
          textStyle: { color: theme.subText },
        },
        series: [
          {
            name: "代码构成",
            type: "pie",
            radius: ["40%", "70%"],
            avoidLabelOverlap: false,
            // 扇区描边与卡片底色融合
            itemStyle: {
              borderRadius: 10,
              borderColor: theme.surface,
              borderWidth: 2,
            },
            label: {
              show: false,
              position: "center",
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 40,
                fontWeight: "bold",
                color: theme.text,
              },
            },
            labelLine: {
              show: false,
            },
            data: top,
          },
        ],
      };
    },
  },
});
</script>

<style lang="less" scoped>
// 饼图高度: 比默认 360 的环形比例更舒展
.chart-box {
  height: 360px;
}
</style>
