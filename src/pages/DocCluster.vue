<template>
  <div id="docCluster" style="height: calc(100vh - 80px); min-height: 480px; width: 100%"></div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as echarts from "echarts/core";
import { TooltipComponent, TooltipComponentOption } from "echarts/components";
import { TreeChart, TreeSeriesOption } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import api from "@/api";
import { isMobile } from "@/composables/useBreakpoint";

echarts.use([TooltipComponent, TreeChart, CanvasRenderer]);

type EChartsOption = echarts.ComposeOption<
  TooltipComponentOption | TreeSeriesOption
>;

export default defineComponent({
  data() {
    return {
      chart: null as echarts.ECharts | null,
    };
  },
  methods: {
    handleResize() {
      this.chart?.resize();
    },
    init() {
      var chartDom = document.getElementById("docCluster")!;
      var myChart = echarts.init(chartDom);
      this.chart = myChart;
      var option: EChartsOption;
      // 移动端窄屏: 缩小标签字号/行高并收紧边距, 配合 roam 缩放平移
      const mobile = isMobile.value;

      myChart.showLoading();
      const kw = this.$route.query.kw
      function hilight(data: any) {
        if (!data) return;
        if (kw && data.name.indexOf(kw) != -1) {
          data.label = {
            fontSize: 25,
            color: "red",
          };
        }
        for (let i of data.children) {
          hilight(i);
        }
      }
      api.getDocCluster().then(resp => {
        const data = resp[0];
        hilight(data);
        myChart.hideLoading();

        myChart.setOption(
          (option = {
            tooltip: {
              trigger: "item",
              triggerOn: "mousemove",
            },
            series: [
              {
                type: "tree",

                data: [data],

                top: "1%",
                left: mobile ? "12%" : "7%",
                bottom: "1%",
                right: mobile ? "12%" : "20%",
                edgeShape: 'polyline',
                symbolSize: 7,

                label: {
                  position: "left",
                  verticalAlign: "middle",
                  align: "right",
                  fontSize: mobile ? 11 : 15,
                  lineHeight: mobile ? 28 : 55,
                },

                leaves: {
                  label: {
                    position: "top",
                    verticalAlign: "middle",
                    align: "left",
                    padding: 20,
                  },
                },

                emphasis: {
                  focus: "descendant",
                },

                expandAndCollapse: false,
                animationDuration: 550,
                roam: true,
                animationDurationUpdate: 750,
              },
            ],
          })
        );
        myChart.setOption(option);
      });
    },
  },
  mounted() {
    this.init()
    // 容器尺寸随视口变化(缩放/旋转/折叠侧栏)时重绘, 避免图表拉伸变形
    window.addEventListener('resize', this.handleResize)
  },
  unmounted() {
    window.removeEventListener('resize', this.handleResize)
    this.chart?.dispose()
    this.chart = null
  },
});
</script>
