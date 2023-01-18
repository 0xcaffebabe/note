<template>
  <div id="heatmap"></div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import * as echarts from "echarts/core";
import {
  TitleComponent,
  TitleComponentOption,
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

echarts.use([
  TitleComponent,
  CalendarComponent,
  TooltipComponent,
  VisualMapComponent,
  HeatmapChart,
  CanvasRenderer,
]);

type EChartsOption = echarts.ComposeOption<
  | TitleComponentOption
  | CalendarComponentOption
  | TooltipComponentOption
  | VisualMapComponentOption
  | HeatmapSeriesOption
>;

const fillTimeRange = HeatMapUtils.fillTimeRange

const generatePieces = HeatMapUtils.generatePieces

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
      const heatmapData = fillTimeRange(await api.getCommitHeatmap());
      const chartDom = document.getElementById("heatmap")!;
      const myChart = echarts.init(chartDom);
      let option: EChartsOption;
      const maxValue = heatmapData
        .map((v) => v[1])
        .sort()
        .reverse()[0];
      const range = [heatmapData[0][0], heatmapData[heatmapData.length - 1][0]];
      option = {
        title: {
          top: 30,
          left: "center",
          text: "提交日历图",
          textStyle: {
            color: this.isDark ? "#bbb" : "#666",
          },
        },
        tooltip: {
          formatter(params: any) {
            const data: [string, number] = params.data;
            return `${data[0]} ${data[1]}次`;
          },
          backgroundColor: this.isDark ? "#666" : "#fff",
          textStyle: {
            color: this.isDark ? "#bbb" : "#666",
          },
        },
        visualMap: {
          min: 0,
          max: maxValue,
          type: "piecewise",
          orient: "horizontal",
          left: "center",
          top: 65,
          pieces: generatePieces(maxValue, this.isDark),
          textStyle: {
            color: this.isDark ? "#bbb" : "#666",
          },
        },
        calendar: {
          top: 120,
          left: 30,
          right: 30,
          cellSize: ["auto", 20],
          range,
          itemStyle: {
            borderWidth: 0.5,
          },
          yearLabel: {
            show: true,
          },
          dayLabel: {
            show: true,
            nameMap: "ZH",
            firstDay: 1,
            color: this.isDark ? "#bbb" : "",
          },
          monthLabel: {
            show: true,
            nameMap: "ZH",
            color: this.isDark ? "#bbb" : "",
          },
        },
        series: {
          type: "heatmap",
          coordinateSystem: "calendar",
          data: heatmapData,
        },
      };

      option && myChart.setOption(option);
    },
  },
  mounted() {
    this.init();
  },
});
</script>

<style lang="less" scoped>
#heatmap {
  height: 280px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>