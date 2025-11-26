<template>
  <div ref="container" class="container" :class="{'mobile-container': $isMobile()}"></div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import 'element-plus/es/components/notification/style/css'
import { ElNotification, NotificationHandle   } from 'element-plus'
import api from "@/api";
import * as echarts from "echarts/core";
import {
  GridComponent,
  GridComponentOption,
  DataZoomComponent,
  DataZoomComponentOption,
  TooltipComponent,
  TooltipComponentOption,
  MarkLineComponent,
  MarkLineComponentOption,
  BrushComponent,
  BrushComponentOption
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
  MarkLineComponent,
  BrushComponent
]);

type EChartsOption = echarts.ComposeOption<
  GridComponentOption | DataZoomComponentOption | ScatterSeriesOption | TooltipComponentOption | MarkLineComponentOption | BrushComponentOption
>;

function generateMarkLineOptions(data: [number,number,string][]) {
  const maxQuality = data.sort((a,b) => b[1] - a[1])[0][1]
  const maxTime = data.sort((a,b) => b[0] - a[0])[0][0]
  return {
    animation: false,
    label: {
      formatter: '{b}',
      align: 'right'
    },
    lineStyle: {
      type: 'solid'
    },
    tooltip: {
      formatter: '{b}'
    },
    data: [
      
        {
          name: '0.75 基准线',
          yAxis: maxQuality * 0.75,
        },
        {
          name: '0.5 基准线',
          yAxis: maxQuality * 0.5,
        },{
          name: '0.25 基准线',
          yAxis: maxQuality * 0.25,
        },
        {
          name: '0.75 基准线',
          xAxis: maxTime * 0.75,
        },
        {
          name: '0.5 基准线',
          xAxis: maxTime * 0.5,
        },
        {
          name: '0.25 基准线',
          xAxis: maxTime * 0.25,
        },
      
    ]
  };
}

export default defineComponent({
  props: {
    doc: {
      type: String,
      required: true
    }
  },
  setup() {},
  mounted() {
    this.init();
  },
  data() {
    return {
      selectedData: [] as string[]
    };
  },
  watch: {
    doc() {
      this.init()
    }
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
        if (map.get(i.id)) {
          map.get(i.id)![1] = i.quality;
        }
      }
      return Array.from(map.entries()).map((v) => [...v[1], v[0]]);
    },
    async init() {
      let raw = await this.generateScatterData()
      const data = raw.map(v => {
        return {
          name: v[2], 
          value: v,
          symbolSize: this.doc == v[2] ? 20: 12,
          itemStyle: {
            color: this.doc == v[2] ? '#F56C6C': '#409EFF'
          }
        }
      })
      var chartDom = this.$refs.container as HTMLElement;
      const chart = echarts.init(chartDom);
      chart.on('click', e => {
        const id = (e.data as any).name
        this.$router.push('/doc/' + id)
      })
      chart.on('brushselected', e => {
        this.selectedData = ((e as any).batch[0].selected[0].dataIndex as number[]).map(v => data[v].name)
      })
      let notification: NotificationHandle | null  = null
      chart.on('brushEnd', e => {
        if (this.selectedData.length == 0) {
          return
        }
        if (notification) {
          notification.close()
        }
        this.selectedData.sort()
        notification = ElNotification({
          title: '所选文档',
          dangerouslyUseHTMLString: true,
          message: this.selectedData.join("</br>"),
          duration: 0
        })
      })
      var option: EChartsOption;

      option = {
        xAxis: {
          name: '时间新鲜度'
        },
        yAxis: {
          name: '质量'
        },
        brush: {},
        dataZoom: [{ type: "inside" }, { type: "slider" }],
        tooltip: {
          formatter(params: any, ticket: string, callback: (ticket: string, html: string) => string | HTMLElement | HTMLElement[]): string {
            const id = (params.data as any).name
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
            symbolSize: 12,
            data,
            type: "scatter",
            markLine: generateMarkLineOptions(data.map(v => v.value))
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
  height: 100%;
}
.mobile-container {
  height: 600px;
}
</style>