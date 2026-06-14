<template>
  <div ref="main" class="main"></div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as echarts from "echarts/core";
import { GridComponent, GridComponentOption } from "echarts/components";
import { BarChart, BarSeriesOption } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import api from "@/api";

echarts.use([GridComponent, BarChart, CanvasRenderer]);

type EChartsOption = echarts.ComposeOption<
  GridComponentOption | BarSeriesOption
>;

export default defineComponent({
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
  watch: {
    isDark() {
      this.init();
    },
  },
  methods: {
    handleResize() {
      this.chart?.resize();
    },
    async init() {
      const raw = new Map<string, number>(await api.getHourCommitHeatmap());
      let data = [];
      // 填充数据
      for (let i = 0; i < 24; i++) {
        data.push([i, raw.get(i.toString()) || 0]);
      }
      var chartDom = this.$refs.main as HTMLElement;
      // 复用实例: isDark 切换会重入 init, 先 dispose 避免同 dom 多实例泄漏
      this.chart?.dispose();
      var myChart = (this.chart = echarts.init(chartDom));
      const option: EChartsOption = {
        title: {
          text: "各时段提交统计(GMT+8)",
          left: "center",
          textStyle: {
            color: this.isDark ? "#bbb" : "#666",
          },
        },
        xAxis: {
          type: "category",
          data: data.map((v) => v[0]),
        },
        yAxis: {
          type: "value",
        },
        tooltip: {
          formatter: "{c}",
          backgroundColor: this.isDark ? "#666" : "#fff",
          textStyle: {
            color: this.isDark ? "#bbb" : "#666",
          },
        },
        series: [
          {
            data: data.map((v) => v[1]),
            type: "bar",
            showBackground: true,
            backgroundStyle: {
              color: "rgba(180, 180, 180, 0.2)",
            },
          },
        ],
      };

      option && myChart.setOption(option);
    },
  },
  mounted() {
    this.init()
    window.addEventListener("resize", this.handleResize);
  },
  unmounted() {
    window.removeEventListener("resize", this.handleResize);
    this.chart?.dispose();
    this.chart = null;
  },
});
</script>

<style lang="less" scoped>
.main {
  height: 400px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>