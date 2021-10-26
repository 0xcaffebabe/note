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
  props: {
    doc: {
      type: String,
      required: true
    }
  },
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
      // 提取所有节点
      let nodes = Array.from(new Set(knowledgeNetwork.flatMap(v =>  [ v.id, ...v.links || []])))
                        .map(v => {
                          return {
                              name: v,
                              category: v == this.doc ? 1: 0,
                              draggable: true
                            }
                        })
      // 节点下标映射<节点, index>
      const nodeMap = new Map(nodes.map((v, i) =>[v.name, i]))
      // 节点关系处理
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
      // 图表创建、参数设置
      if (!this.chart) {
        const chartDom = document.getElementById('knowledgeNetwork')!;
        this.chart = echarts.init(chartDom);
        this.chart.on('click',(e) => {
          const doc = (e.data as any).name;
          // 路由跳转后重新初始化更新图表
          this.$router.push('/doc/' + doc).then(data => this.init())
        })
      }
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
            symbolSize: 45,
            focusNodeAdjacency: true,
            roam: true,
            categories: [
              {
                name: '联系',
                itemStyle: {
                  color: '#409EFF'

                }
              },
              {
                name: '主要',
                itemStyle: {
                  color: "#F56C6C"
                }
              }
            ],
            label: {
              show: true,
              position: 'top',
              fontSize: 14,
              color: "#666",
              textBorderColor: "#000",
              // 将文档id进行处理 提取为文档最后一个名称
              formatter(params): string {
                const name:string = (params.data as any).name
                const arr = name.split('-')
                return arr[arr.length - 1]
              }

            },
            force: {
              repulsion: 500,
              edgeLength: 80
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

      this.chart.setOption(option);
      
    }
  },
  data() {
    return {
      showDrawer: false as boolean,
      chart: null as echarts.ECharts | null
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