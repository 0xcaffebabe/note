<template>
  <div ref="chartContainer" class="chartContainer">tt</div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import api from "@/api";
import * as echarts from 'echarts/core';
import {
  TitleComponent,
  TitleComponentOption,
  ToolboxComponent,
  ToolboxComponentOption,
  TooltipComponent,
  TooltipComponentOption,
  GridComponent,
  GridComponentOption,
  LegendComponent,
  LegendComponentOption
} from 'echarts/components';
import { LineChart, LineSeriesOption } from 'echarts/charts';
import { UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  CanvasRenderer,
  UniversalTransition
]);

type EChartsOption = echarts.ComposeOption<
  | TitleComponentOption
  | ToolboxComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | LegendComponentOption
  | LineSeriesOption
>;

export default defineComponent({
  setup() {},
  computed: {
    isDark() {
      return this.$store.state.isDarkMode;
    },
  },
  watch: {
    isDark() {
      this.init();
    },
  },
  methods: {
    async init() {
    const data = await api.getCommitTotalTrend();
    const chartDom = this.$refs.chartContainer as HTMLElement;
    const myChart = echarts.init(chartDom);
    const option: EChartsOption = {
      darkMode: this.isDark,
      title: {
        text: "提交总量趋势",
        textStyle: {
          color: this.isDark ? "#bbb" : "",
        },
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: this.isDark ? "#666" : "#fff",
        textStyle: {
          color: this.isDark ? "#bbb" : "",
        },
      },
      legend: {
        data: ["总字数", "总行数"],
        textStyle: {
          color: this.isDark ? "#bbb" : "",
        }
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true,
      },
      toolbox: {
        feature: {
          saveAsImage: {},
        },
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: data.map(v => v[0]),
      },
      yAxis: {
        type: "value",
      },
      series: [
        {
          name: "总字数",
          type: "line",
          data: data.map(v => v[1]),
        },
        {
          name: "总行数",
          type: "line",
          data: data.map(v => v[2]),
        },
      ],
    };
    option && myChart.setOption(option);
    }
  },
  async mounted() {
    this.init()
  },
});
</script>

<style lang="less" scoped>
.chartContainer {
  height: 400px;
  max-width: 90%;
  margin: 0 auto;
}
</style>