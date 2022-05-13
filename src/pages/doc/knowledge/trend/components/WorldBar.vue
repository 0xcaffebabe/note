<template>
  <div ref="chartContainer" style="width: 100%; height: 100%"></div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import * as echarts from "echarts/core";
import {
  TitleComponent,
  TitleComponentOption,
  TooltipComponent,
  TooltipComponentOption,
  GridComponent,
  GridComponentOption,
  LegendComponent,
  LegendComponentOption,
} from "echarts/components";
import { BarChart, BarSeriesOption } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import GeoMapDataItem from "@/dto/google-trend/GeoMapDataItem";
import i18n_zh from "./i18n_zh";

echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  BarChart,
  CanvasRenderer,
]);

type EChartsOption = echarts.ComposeOption<
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | LegendComponentOption
  | BarSeriesOption
>;

export default defineComponent({
  props: {
    regionData: {
      required: true,
      type: [] as PropType<GeoMapDataItem[]>,
    },
  },
  setup() {},
  data() {
    return {
      chart: null as echarts.ECharts | null,
    };
  },
  computed: {
    isDark() {
      return this.$store.state.isDarkMode;
    },
  },
  methods: {
    localeName(geoCode: string, defaultVal: string) {
      return (i18n_zh.countries as any)[geoCode] || defaultVal;
    },
    init() {
      if (!this.chart) {
        this.chart = echarts.init(this.$refs.chartContainer as HTMLElement);
      }
      let data = this.regionData
        .filter((v) => v.hasData[0])
        .sort((a, b) => b.value[0] - a.value[0])
        .map(v => {return {geoName: this.localeName(v.geoCode, v.geoName), value: v.value[0]}})
      data = data.slice(0, Math.min(10, data.length));
      var option: EChartsOption;
      option = {
        title: {
          text: "",
        },
        tooltip: {
          trigger: "item",
          axisPointer: {
            type: "shadow",
          },
        },
        legend: {},
        grid: {
          left: "3%",
          right: "4%",
          bottom: "3%",
          containLabel: true,
        },
        xAxis: {
          type: "value",
          boundaryGap: [0, 0.01],
        },
        yAxis: {
          type: "category",
          inverse: true,
          data: data.map((v) => v.geoName),
        },
        series: {
          type: "bar",
          data: data.map((v) => v.value),
        },
      };

      this.chart.setOption(option);
    },
  },
  mounted() {},
});
</script>

<style lang="less" scoped>
</style>