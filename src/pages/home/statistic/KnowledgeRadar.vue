<template>
  <div ref="container" class="container"></div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as echarts from "echarts/core";
import {
  TitleComponent,
  TitleComponentOption,
  LegendComponent,
  LegendComponentOption,
} from "echarts/components";
import { RadarChart, RadarSeriesOption } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import api from "@/api";
import Category from "@/dto/Category";

echarts.use([TitleComponent, LegendComponent, RadarChart, CanvasRenderer]);

type EChartsOption = echarts.ComposeOption<
  TitleComponentOption | LegendComponentOption | RadarSeriesOption
>;

export default defineComponent({
  setup() {},
  methods: {
    async init() {
      const rawData = (await api.getCompiledCategory()).filter(v => v.name.indexOf('首页') == -1 && v.name.indexOf('参考文献') == -1 && v.name.indexOf('MyBook') == -1)
      const max = rawData.map(v => Category.childrenSize(v)).sort((a,b) => b - a)[0]
      var chartDom = this.$refs.container as HTMLElement;
      var myChart = echarts.init(chartDom);
      var option: EChartsOption;

      option = {
        title: {},
        legend: {
          data: ["知识丰富度"],
        },
        radar: {
          // shape: 'circle',
          indicator: rawData.map(v => {return {name: v.name, max}}),
        },
        series: [
          {
            name: "知识丰富度",
            type: "radar",
            data: [
              {
                value: rawData.map(v => Category.childrenSize(v)),
                name: "知识丰富度",
              },
            ],
          },
        ],
      };

      option && myChart.setOption(option);
    },
  },
  mounted() {
    this.init()
  },
});
</script>

<style lang="less" scoped>
.container {
  width: 1000px;
  height: 500px;
  margin: 0 auto;
}
</style>