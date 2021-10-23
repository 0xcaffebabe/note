<template>
  <el-drawer v-model="showDrawer" size="60%" title="知识网络">
    <div id="knowledgeNetwork"></div>
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import * as echarts from 'echarts/core';
import {
  TitleComponent,
  TitleComponentOption,
  TooltipComponent,
  TooltipComponentOption,
  LegendComponent
} from 'echarts/components';
import { GraphChart, GraphSeriesOption } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import api from '@/api';

echarts.use([TitleComponent, TooltipComponent, GraphChart, CanvasRenderer, LegendComponent]);

type EChartsOption = echarts.ComposeOption<
  TitleComponentOption | TooltipComponentOption | GraphSeriesOption
>;

export default defineComponent({
  setup() {

  },
  methods: {
    show() {
      this.showDrawer = true
      this.$nextTick(() => {
        this.init()
      })
    },
    async init() {
      const knowledgeNetwork = await api.getKnowledgeNetwork()

      let nodes = Array.from(new Set(knowledgeNetwork.flatMap(v =>  [ v.id, ...v.links || []])))
                        .map(v => {
                          return {
                              name: v,
                              category: 0,
                              draggable: true
                            }
                        })
      console.log(nodes)
      const nodeMap = new Map(nodes.map((v, i) =>[v.name, i]))
      const links :any[] = []
      for(let i of knowledgeNetwork) {
        if (i.links) {
          for(let j of i.links) {
            links.push({
              target: nodeMap.get(i.id),
              source: nodeMap.get(j),
              value: ''
            })
          }
        }
      }
      console.log(links)


      const chartDom = document.getElementById('knowledgeNetwork')!;
      const myChart = echarts.init(chartDom);
      const option: EChartsOption = {
        title: {
          text: ''
        },
        tooltip: {},
        animationDurationUpdate: 1500,
        animationEasingUpdate: 'quinticInOut',
        label: {
          normal: {
            show: true,
            textStyle: {
              fontSize: 12
            }
          }
        },
        legend: {
          x: 'center',
          show: true,
          data: ['联系']
        },
        series: [
          {
            type: 'graph',
            layout: 'force',
            symbolSize: 20,
            focusNodeAdjacency: true,
            roam: true,
            categories: [
              {
                name: '联系',
                itemStyle: {
                  color: '#409EFF'

                }
              }
            ],
            label: {
              show: true,
              position: 'top',
              fontSize: 14,
              color: "#666",
              textBorderColor: "#000"

            },
            force: {
              repulsion: 100
            },
            edgeSymbolSize: [4, 50],
            edgeLabel: {
              show: true,
              fontSize: 10,
              formatter: '{c}'

            },
            data: nodes,
            links,
            lineStyle: {
              opacity: 0.9,
              width: 1,
              curveness: 0
            }
          }
        ]
      };

      option && myChart.setOption(option);
    }
  },
  data() {
    return {
      showDrawer: false as boolean
    }
  },
  mounted() {


  }
})
</script>


<style lang="less" scoped>
#knowledgeNetwork {
  height: 100%;
}
</style>