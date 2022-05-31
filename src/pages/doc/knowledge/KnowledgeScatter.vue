<template>
  <div ref="container" class="container"></div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import api from "@/api";
import * as echarts from "echarts/core";
import {
  GridComponent,
  GridComponentOption,
  DataZoomComponent,
  DataZoomComponentOption,
  TooltipComponent,
  TooltipComponentOption
} from "echarts/components";
import { ScatterChart, ScatterSeriesOption } from "echarts/charts";
import { UniversalTransition } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";
import DocFileInfo from "@/dto/DocFileInfo";
import DocService from "@/service/DocService";

echarts.use([
  GridComponent,
  DataZoomComponent,
  ScatterChart,
  CanvasRenderer,
  UniversalTransition,
  TooltipComponent,
]);

type EChartsOption = echarts.ComposeOption<
  GridComponentOption | DataZoomComponentOption | ScatterSeriesOption | TooltipComponentOption
>;

export default defineComponent({
  setup() {},
  mounted() {
    this.init();
  },
  data() {
    return {};
  },
  methods: {
    // 生成散点图数据 [时间新鲜维度, 质量维度, 文档id]
    async generateScatterData(): Promise<[number, number, string][]> {
      const docUpdateList = await api.getDescCommitDocList();
      const minTime = docUpdateList
        .map((v) => new Date(v[1].date).getTime())
        .sort((a, b) => a - b)[0];
      const docQualityList = await api.getDocQualityData();
      const map = new Map<string, [number, number]>();
      for (let i of docUpdateList) {
        if (!map.has(i[0])) {
          map.set(i[0], [0, 0]);
        }
        map.get(i[0])![0] =
          (new Date(i[1].date).getTime() - minTime) / (1000 * 3600 * 24);
      }
      for (let i of docQualityList) {
        map.get(i.id)![1] = i.quality;
      }
      return Array.from(map.entries()).map((v) => [...v[1], v[0]]);
    },
    async init() {
      const data = await this.generateScatterData()
      var chartDom = this.$refs.container as HTMLElement;
      const chart = echarts.init(chartDom);
      chart.on('click', e => {
        const id = (e.data as any)[2]
        this.$router.push('/doc/' + id)
      })
      var option: EChartsOption;

      option = {
        xAxis: {
          name: '时间新鲜度'
        },
        yAxis: {
          name: '质量'
        },
        dataZoom: [{ type: "inside" }, { type: "slider" }],
        tooltip: {
          formatter(params: any, ticket: string, callback: (ticket: string, html: string) => string | HTMLElement | HTMLElement[]): string {
            const id = (params.data as any)[2]
            const result: Promise<DocFileInfo> | DocFileInfo = DocService.getDocFileInfo(id)
            if (result instanceof Promise) {
              result
              .then(file => {
                callback(ticket, DocService.buildSummaryDocInfo(file))
              })
              .catch(err => {
                callback(ticket, `${err}`)
              })
            }else {
              return DocService.buildSummaryDocInfo(result)
            }
            return 'loading'
          }
        },
        series: [
          {
            symbolSize: 20,
            data,
            type: "scatter",
          },
        ],
      } as any;

      option && chart.setOption(option);
    },
  },
});
</script>

<style lang="less" scoped>
.container {
  width: 100%;
  height: 600px;
}
</style>