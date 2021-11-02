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

function fillTimeRange(data: [string, number][]): [string, number][] {
  console.log(data)
  const map = new Map<string, number>(data)
  console.log(map)
  const range = [data[0][0],data[data.length - 1][0]]
  const start = +echarts.number.parseDate(range[0]);
  const end = +echarts.number.parseDate(range[1]);
  const dayTime = 3600 * 24 * 1000;
  const results: [string, number][] = []
  for (let time = start; time < end; time += dayTime) {
    const date = echarts.format.formatTime("yyyy-MM-dd", time)
    results.push([
      date,
      map.get(date) || 0
    ]);
  }
  return results
}

/**
 * 封装服务次数区间数据
 * @param {*} maxValue 最大值
 * @param {*} colorBox 区间颜色集
 */
function generatePieces(maxValue: number, colorBox: string[]) {
  const pieces = [];
  const quotient = Math.ceil(maxValue / 4);
  let temp :any= {};
  temp.lt = 1;
  temp.label = "0";
  temp.color = colorBox[0];
  pieces.push(temp);

  for (var i = 1; i <= 5; i++) {
    temp = {};
    if (i == 1) {
      temp.gte = 1;
    } else {
      temp.gte = quotient * (i - 1);
    }
    temp.lte = quotient * i;
    temp.color = colorBox[i];
    // temp.label = '等级'+i;
    pieces.push(temp);
  }

  return pieces;
}

export default defineComponent({
  setup() {},
  methods: {
  },
  async mounted() {
    const heatmapData = fillTimeRange(await api.getCommitHeatmap());
    const chartDom = document.getElementById("heatmap")!;
    const myChart = echarts.init(chartDom);
    let option: EChartsOption;
    const colorBox = ["white", "#98E9A8", "#40C403", "#30A14E", "#216E39", "#1A572D"];
    const maxValue = heatmapData.map(v => v[1]).sort().reverse()[0]
    const range = [heatmapData[0][0],heatmapData[heatmapData.length - 1][0]]
    console.log(range, maxValue)
    console.log(heatmapData)
    option = {
      title: {
        top: 30,
        left: "center",
        text: "提交日历图",
      },
      tooltip: {
        formatter(params: any) {
          const data :[string, number] = params.data
          return `${data[0]} ${data[1]}次`
        }
      },
      visualMap: {
        min: 0,
        max: maxValue,
        type: "piecewise",
        orient: "horizontal",
        left: "center",
        top: 65,
        pieces: generatePieces(maxValue, colorBox),
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
        yearLabel: { show: true },
        dayLabel: { show: true, nameMap: 'cn', firstDay: 1 },
        monthLabel: { show: true, nameMap: 'cn' },
      },
      series: {
        type: "heatmap",
        coordinateSystem: "calendar",
        data: heatmapData,
      },
    };

    option && myChart.setOption(option);
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