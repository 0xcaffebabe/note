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

function getVirtulData(year: string, maxValue: any) {
  year = year || "2017";
  var date = +echarts.number.parseDate(year + "-01-01");
  var end = +echarts.number.parseDate(+year + 1 + "-01-01");
  var dayTime = 3600 * 24 * 1000;
  var data: [string, number][] = [];
  for (var time = date; time < end; time += dayTime) {
    data.push([
      echarts.format.formatTime("yyyy-MM-dd", time),
      Math.floor(Math.random() * maxValue),
    ]);
  }
  return data;
}

/**
 * 封装服务次数区间数据
 * @param {*} maxValue 最大值
 * @param {*} colorBox 区间颜色集
 */
function generatePieces(maxValue: number, colorBox: string[]) {
  const pieces = [];
  const quotient = Math.floor(maxValue / 5);
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
  mounted() {
    var chartDom = document.getElementById("heatmap")!;
    var myChart = echarts.init(chartDom);
    var option: EChartsOption;
    var colorBox = ["#EBEDF0", "#98E9A8", "#40C403", "#30A14E", "#216E39", "#1A572D"];
    const maxValue = Math.ceil(Math.random() * 100)
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
        range: ["2020-02","2021-02"],
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
        data: getVirtulData("2020", maxValue),
      },
    };

    option && myChart.setOption(option);
  },
});
</script>

<style lang="less" scoped>
#heatmap {
  height: 600px;
}
</style>