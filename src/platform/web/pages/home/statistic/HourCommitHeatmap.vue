<template>
  <div class="chart-host">
    <div ref="chartEl" class="chart-box" role="img" :aria-label="'各时段提交分布柱状图（GMT+8）'"></div>
    <div
      v-if="chartState === 'empty' || chartState === 'error'"
      class="chart-overlay"
      role="status"
    >
      {{ chartState === "empty" ? "暂无数据" : "数据加载失败" }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as echarts from "echarts/core";
import { GridComponent, GridComponentOption } from "echarts/components";
import { BarChart, BarSeriesOption } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import eChartMixin from "@/platform/web/util/echart/eChartMixin";
import { ChartTheme, tooltipStyle } from "@/platform/web/util/echart/chartTheme";
import { fillHourBuckets } from "@/core/util/DataUtils";

echarts.use([GridComponent, BarChart, CanvasRenderer]);

type EChartsOption = echarts.ComposeOption<
  GridComponentOption | BarSeriesOption
>;

export default defineComponent({
  mixins: [eChartMixin],
  methods: {
    // 标题/GMT+8 限定词交给父级 h3, 这里只产出图本体 option
    async buildOption(theme: ChartTheme): Promise<EChartsOption | null> {
      const rawArr = await this.$services.api.getHourCommitHeatmap();
      // 空数据(空仓库/数据缺失)走统一空态, 不画一排全 0 柱子
      if (!rawArr.length) {
        return null;
      }
      // 填充 0..23 时, 缺失时段补 0 保证 24 根柱子完整
      const data = fillHourBuckets(rawArr);
      const option: EChartsOption = {
        grid: {
          left: "3%",
          right: "4%",
          bottom: "3%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          name: "时段",
          data: data.map((v) => v[0]),
          axisLine: { lineStyle: { color: theme.axisLine } },
          axisLabel: {
            color: theme.subText,
            formatter: (v: string) => `${v}时`,
          },
          nameTextStyle: { color: theme.subText },
        },
        yAxis: {
          type: "value",
          name: "次数",
          axisLine: { lineStyle: { color: theme.axisLine } },
          axisLabel: { color: theme.subText },
          splitLine: { lineStyle: { color: theme.splitLine } },
          nameTextStyle: { color: theme.subText },
        },
        tooltip: {
          ...tooltipStyle(theme),
          formatter: (params: any) => {
            const p = Array.isArray(params) ? params[0] : params;
            return `${p.name}时 · ${p.value}次`;
          },
        },
        series: [
          {
            data: data.map((v) => v[1]),
            type: "bar",
            // 圆角柱顶呼应全站圆角卡片; 悬浮加柔光不改色相
            itemStyle: { color: theme.primary, borderRadius: [4, 4, 0, 0] },
            emphasis: {
              itemStyle: { shadowBlur: 10, shadowColor: theme.track },
            },
            showBackground: true,
            backgroundStyle: { color: theme.track, borderRadius: [4, 4, 0, 0] },
          },
        ],
      };
      return option;
    },
  },
});
</script>

<style lang="less" scoped>
.chart-box {
  height: calc(var(--chart-h) - 40px);
}
</style>
