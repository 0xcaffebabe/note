<template>
  <div class="frequency-wrapper">
    <div id="codeFrequencyChart"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent,PropType } from "vue";
import * as echarts from "echarts/core";
import {
  TooltipComponent,
  TooltipComponentOption,
  LegendComponent,
  LegendComponentOption,
  VisualMapComponentOption
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
  TooltipComponentOption | LegendComponentOption | PieSeriesOption | VisualMapComponentOption
>;

export default defineComponent({
  props: {
    codeFrequency: {
      type: Array as PropType<CodeFrequencyItem[]>,
      required: true,
    },
  },
  data() {
    return {
      chart: null as echarts.ECharts | null
    }
  },
  computed: {
    isDark() {
      return this.$store.state.isDarkMode;
    },
  },
  watch: {
    codeFrequency() {
      this.updateChart()
    },
    isDark() {
      this.updateChart();
    }
  },
  methods: {
    updateChart(){
      const option: EChartsOption = {
      tooltip: {
        trigger: "item",
        backgroundColor: this.isDark ? "#666" : "#fff",
        textStyle: {
          color: this.isDark ? "#bbb" : "",
        },
      },
      legend: {
        top: "5%",
        left: "center",
        textStyle: {
          color: this.isDark ? "#bbb" : "",
        },
        itemStyle: {
          borderColor: this.isDark ? "#bbb" : "",
        }
      },
      height: 500,
      series: [
        {
          name: "代码频率",
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: "#fff",
            borderWidth: 2,
          },
          label: {
            show: false,
            position: "center",
          },
          emphasis: {
            label: {
              show: true,
              fontSize: "40",
              fontWeight: "bold",
            },
          },
          labelLine: {
            show: false,
          },
          data: this.codeFrequency.map(v => {
            return {name: v.lang, value: v.frequency}
          }).splice(0,10),
        },
      ],
    };

    option && this.chart!.setOption(option);
    }
  },
  setup() {},
  mounted() {
    const chartDom = document.getElementById("codeFrequencyChart")!;
    if (!this.chart) {
      this.chart = echarts.init(chartDom);
    }
    this.updateChart()
  },
});
</script>

<style lang="less" scoped>
.frequency-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}
#codeFrequencyChart {
  height: 500px;
}
</style>