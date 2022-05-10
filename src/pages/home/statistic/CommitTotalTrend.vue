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
  LegendComponentOption,
  DataZoomComponent
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
  UniversalTransition,
  DataZoomComponent
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
        data: ["总字数", "总行数", "总提交"],
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
          saveAsImage: {show: false},
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
        {
          name: "总提交",
          type: "line",
          data: data.map(v => v[3]),
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