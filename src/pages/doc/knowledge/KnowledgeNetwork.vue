<template>
  <el-drawer v-model="showDrawer" size="40%" title="知识网络" @close="$emit('close')" :lock-scroll="false" modal-class="drawer-modal-class">
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
import { KnowledgeNode } from '@/dto/KnowledgeNode';

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
      const knowledgeNetwork: KnowledgeNode[] = await api.getKnowledgeNetwork()
      // 提取所有节点
      let nodes = Array.from(new Set(knowledgeNetwork.flatMap(v =>  [ v.id, ...v.links?.map(ln => ln.id) || []])))
                        .map(v => {
                          const list = knowledgeNetwork.filter(item => item.id == v)
                          // 默认节点渲染样式
                          if (list.length == 0) {
                            return {
                              name: v,
                              category: v == this.doc ? 1: 0,
                              symbolSize: 20,
                              draggable: true
                            }
                          // 节点扇出数越多 大小越大
                          }else {
                            return {
                                name: v,
                                category: v == this.doc ? 1: 0,
                                symbolSize: 20 * (1 + (list[0].links?.length || 0) / 3),
                                draggable: true
                              }
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
              source: i.id,
              target: j.id,
              value: decodeURI(j.headingId ? '#' + j.headingId: '-')
            })
          }
        }
      }
      // 图表创建、参数设置
      if (!this.chart) {
        const chartDom = document.getElementById('knowledgeNetwork')!;
        this.chart = echarts.init(chartDom);
        this.chart.on('click',(e) => {
          console.log(e)
          const doc = (e.data as any).name || (e.data as any).target;
          const headingId = (e.data as any).value?.replace('#', '')
          // 路由跳转后重新初始化更新图表
          if (!headingId || headingId == '') {
            this.$router.push('/doc/' + doc).then(data => this.init())  
          }else {
            // 拥有锚点
            this.$router.push({
              path: '/doc/' + doc,
              query: {
                headingId: headingId == '-' ? '': headingId
              }
            }).then(data => this.init())
          }
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
              repulsion: 200,
              gravity: 0.1,
              edgeLength: 80
            },
            edgeSymbolSize: [4, 50],
            edgeLabel: {
              show: false,
              fontSize: 10,
              formatter: '{c}'
            },
            data: nodes,
            links,
            lineStyle: {
              opacity: 0.9,
              width: 8,
              curveness: 0,
              color: '#eee'
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