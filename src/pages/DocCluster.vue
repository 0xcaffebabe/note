<template>
  <div id="docCluster" style="height: 1080px; width: 100%"></div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as echarts from "echarts/core";
import { TooltipComponent, TooltipComponentOption } from "echarts/components";
import { TreeChart, TreeSeriesOption } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";

import axios from "axios";
echarts.use([TooltipComponent, TreeChart, CanvasRenderer]);

type EChartsOption = echarts.ComposeOption<
  TooltipComponentOption | TreeSeriesOption
>;

export default defineComponent({
  methods: {
    init() {
      var chartDom = document.getElementById("docCluster")!;
      var myChart = echarts.init(chartDom);
      var option: EChartsOption;

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
      axios.get("/docCluster.json").then((resp) => {
        const data = resp.data[0];
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
                left: "7%",
                bottom: "1%",
                right: "20%",
                edgeShape: 'polyline',
                symbolSize: 7,

                label: {
                  position: "left",
                  verticalAlign: "middle",
                  align: "right",
                  fontSize: 15,
                  lineHeight: 55,
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
  },
});
</script>
