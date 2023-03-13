<template>
  <div>
    <el-radio-group size="small" style="margin-bottom:8px;margin-left:60px" v-model="type">
      <el-radio-button :label="'absolute'">绝对量</el-radio-button>
      <el-radio-button :label="'relative'">相对量</el-radio-button>
    </el-radio-group>
    <div ref="chartContainer" class="chartContainer"></div>
  </div>
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
import {cloneDeep} from 'lodash'

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
  setup() { },
  computed: {
    isDark(): boolean {
      return this.$store.state.isDarkMode;
    },
  },
  watch: {
    isDark() {
      this.init();
    },
    type() {
      this.init()
    }
  },
  data() {
    return {
      type: 'absolute' as 'absolute' | 'relative',
      chart: null as echarts.ECharts | null
    }
  },
  methods: {
    async init() {
      const data = cloneDeep(await api.getCommitTotalTrend());
      const myChart = echarts.init(this.$refs.chartContainer as HTMLElement);

      if (this.type === 'relative') {
        for(let i = data.length - 1; i > 0; i--) {
          data[i][1] -= data[i-1][1]
          data[i][2] -= data[i-1][2]
          data[i][3] -= data[i-1][3]
        }
      }

      const absolutely = this.type === 'absolute'

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
          text: "提交趋势",
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
          data: absolutely ? ["总字数", "总行数", "总提交"] : ["相对字数", "相对行数", "相对提交"],
          textStyle: {
            color: this.isDark ? "#bbb" : "#666",
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
            saveAsImage: { show: false },
          },
        },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: data.map(v => v[0]),
        },
        yAxis: {
          type: "value",
          min: 'dataMin'
        },
        series: [
          {
            name: absolutely ? "总字数" : '相对字数',
            type: "line",
            data: data.map(v => v[1]),
          },
          {
            name: absolutely ? "总行数" : '相对行数',
            type: "line",
            data: data.map(v => v[2]),
          },
          {
            name: absolutely ? "总提交" : '相对提交',
            type: "line",
            data: data.map(v => v[3]),
          },
        ],
      };
      myChart.setOption(option);
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