<template>
  <div class="knowledge-network-chart">
    <div :id="id" class="knowledge-network-chart-container"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as echarts from "echarts/core";
import {
  TitleComponent,
  TitleComponentOption,
  TooltipComponent,
  TooltipComponentOption,
  LegendComponent,
} from "echarts/components";
import { GraphChart, GraphSeriesOption } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import api from "@/api";
import { KnowledgeNode } from "@/dto/KnowledgeNode";
import DocFileInfo from "@/dto/DocFileInfo";
import DocService from "@/service/DocService";
import KnowledgeNetworkService from "@/service/KnowledgeNetworkService";
import { KnowledgeNetworkDataProcessor } from "@/pages/doc/knowledge/KnowledgeNetworkDataProcessor";

echarts.use([
  TitleComponent,
  TooltipComponent,
  GraphChart,
  CanvasRenderer,
  LegendComponent,
]);

type EChartsOption = echarts.ComposeOption<
  TitleComponentOption | TooltipComponentOption | GraphSeriesOption
>;

export default defineComponent({
  props: {
    doc: {
      type: String,
      required: true,
    },
    mode: {
      type: String as () => "force" | "circular" | "none",
      default: 'force'
    },
    onlySelfRelated: {
      type: Boolean,
      default: true
    },
    isPotential: {
      type: Boolean,
      default: false
    },
    degree: {
      type: Number,
      default: 3
    },
    showLegend: {
      type: Boolean,
      default: true
    },
    resizeListener: {
      type: Boolean,
      default: true
    },
    showTooltip: {
      type: Boolean,
      default: true
    },
    showChartText: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      id: this.generateRandomId(),
      chart: null as echarts.ECharts | null,
      resizeObserver: null as ResizeObserver | null,
      graphZoom: 1,
      nodes: [] as any[],
    };
  },
  watch: {
    doc() {
      this.init();
    },
    mode() {
      this.init(false);
    },
    onlySelfRelated() {
      this.init();
    },
    isPotential() {
      this.init();
    },
    degree() {
      this.init();
    }
  },
  computed: {
    isDark() {
      return this.$store.state.isDarkMode;
    }
  },
  mounted() {
    // 初始化时创建 ResizeObserver
    if (this.resizeListener) {
      this.setupResizeObserver();
    }
    // 初始化图表
    this.$nextTick(() => {
      this.init();
    });
  },
  beforeUnmount() {
    // 组件销毁前断开观察器并清理图表
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.chart) {
      this.chart.dispose();
    }
  },
  methods: {
    generateRandomId(): string {
      return 'knowledgeNetwork' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    },
    setupResizeObserver() {
      const chartDom = document.querySelector('.knowledge-network-chart') || document.getElementById(this.id);
      if (chartDom) {
        const debouncedResize = this.debounce(() => {
          this.chart?.resize();
        }, 300);

        this.resizeObserver = new ResizeObserver(() => {
          debouncedResize();
        });

        this.resizeObserver.observe(chartDom);
      }
    },
    // 防抖函数
    debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
      let timeout: ReturnType<typeof setTimeout> | null = null;
      return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    },
    async init(potentialProcess: boolean = true) {
      const stream = (await KnowledgeNetworkService.getDocStream(this.doc)).flatMap(v => v)
      // 若是潜在知识网络 默认设置为圆圈展示模式
      if (this.isPotential && potentialProcess) {
        // Note: 由于mode是通过props传入的，不能在这里直接修改
        // this.mode = 'circular';
      }
      let knowledgeNetwork: KnowledgeNode[] = this.isPotential ? await api.getPotentialKnowledgeNetwork() : await api.getKnowledgeNetwork();
      if (this.onlySelfRelated) {
        // 非隐式知识网络才能进行度数过滤
        if (!this.isPotential) {
          knowledgeNetwork = KnowledgeNetworkDataProcessor.filterByDegree(knowledgeNetwork, this.doc, this.degree);
        } else {
          knowledgeNetwork = KnowledgeNetworkDataProcessor.filterByCurrentDoc(knowledgeNetwork, this.doc);
        }
      }

      // 创建节点和边的数据
      const nodes = KnowledgeNetworkDataProcessor.createNodes(knowledgeNetwork, this.doc, stream);
      this.nodes = nodes; // 存储nodes以便在autoFitChart方法中使用
      const nodeMap = KnowledgeNetworkDataProcessor.buildNodeMap(nodes);
      const links = KnowledgeNetworkDataProcessor.createLinks(knowledgeNetwork);
      // 图表创建、参数设置
      // if (!this.chart) {
      if (this.chart) {
        this.chart.dispose();
      }
        const chartDom = document.getElementById(this.id)!;
        this.chart = echarts.init(chartDom);
        // 点击事件
        this.chart.on("click", (e) => {
          if (e.componentType !== 'legend') {
            const doc = (e.data as any).name || (e.data as any).target;
            const headingId = (e.data as any).value?.replace("#", "");
            // 路由跳转后重新初始化更新图表
            if (!headingId || headingId == "") {
              this.$router.push("/doc/" + doc).then((data) => this.init());
            } else {
              // 拥有锚点
              this.$router
                .push({
                  path: "/doc/" + doc,
                  query: {
                    headingId: headingId == "-" ? "" : headingId,
                  },
                })
                .then((data) => this.init());
            }
          }
        });

        // 添加图例点击事件监听器
        this.chart.on('highlight', (params) => {
          // 当图例选择状态改变时处理高亮
          this.handleHighlight(params);
        });
      // }
      // 生成文档分类的类别和图例
      const docCategories = new Set<string>();
      nodes.forEach((node: any) => {
        if (node.docCategory) {
          docCategories.add(node.docCategory);
        }
      });

      // 定义特殊类别（当前节点和上下游节点）
      const specialCategories = [
        {
          name: "当前",
          itemStyle: {
            color: "#F56C6C",
            opacity: this.isDark ? 0.9 : 1
          },
        },
      ];

      // 生成文档分类的类别配置
      const categoryList = [...specialCategories];
      const legendData = [
        { name: "当前", icon: "roundRect",
        itemStyle: {
          color: "#F56C6C",
          opacity: this.isDark ? 0.9 : 1
        },
         textStyle: { color: this.isDark ? '#eee' : '#555' }},
      ];

      docCategories.forEach(category => {
        if (!['当前'].includes(category)) {
          // 查找节点获取颜色
          const node = nodes.find((n: any) => n.docCategory === category && n.name !== this.doc);
          if (node) {
            const color = node.itemStyle?.color || '#909399'; // 默认灰色
            categoryList.push({
              name: category,
              itemStyle: {
                color: color,
                opacity: this.isDark ? 0.9 : 1,
              },
            });
            legendData.push({
              name: category,
              icon: "roundRect",
              itemStyle: {
                color: color,
                opacity: this.isDark ? 0.9 : 1,
              },
              textStyle: { color: this.isDark ? '#eee' : '#555' }
            });
          }
        }
      });

      nodes.forEach(node => {
        if (node.name == this.doc) {
          return;
        }
        node.category = categoryList.findIndex(item => item.name === node.docCategory)
      })

      // 找到当前节点（文档名称匹配的节点）
      const currentNodeIndex = nodes.findIndex(node => node.name === this.doc);
      if (currentNodeIndex !== -1) {
        // 为当前节点设置固定位置在图表中心
        // 先获取图表DOM元素的尺寸
        const chartDom = document.getElementById(this.id);
        if (chartDom) {
          // 初始设置中心坐标，实际坐标将在图表渲染后调整
          (nodes[currentNodeIndex] as any).x = chartDom.clientWidth / 2;
          (nodes[currentNodeIndex] as any).y = chartDom.clientHeight / 2;
          (nodes[currentNodeIndex] as any).fixed = true; // 固定节点位置
        }
      }

      const option: EChartsOption = {
        title: {
          text: "知识网络",
          show: this.showChartText,
          top: 'bottom',
          left: 'right'
        },
        darkMode: this.isDark,
        tooltip: {
          show: this.showTooltip,
          backgroundColor: this.isDark ? 'var(--main-dark-bg-color)' :'#fff',
          textStyle: {
            color: this.isDark ? 'var(--main-dark-text-color)' :'',
          },
          formatter(params: any, ticket: string, callback: (ticket: string, html: string) => string | HTMLElement | HTMLElement[]): string {
            const name: string = (params.data as any).name;
            // 如果不存在name 则就是边的tooltip
            if (!name) {
              return `${params.data.source}->${params.data.target} ${params.data.value}`
            }
            const result: Promise<DocFileInfo> | DocFileInfo = DocService.getDocFileInfo(name)
            if (result instanceof Promise) {
              result
              .then(file => {
                callback(ticket, KnowledgeNetworkDataProcessor.buildSummaryDocInfo(file, knowledgeNetwork))
              })
              .catch(err => {
                callback(ticket, `${err}`)
              })
            }else {
              return KnowledgeNetworkDataProcessor.buildSummaryDocInfo(result, knowledgeNetwork)
            }
            return 'loading'
          }
        } as any,
        // 数据更新动画的时长
        animationDurationUpdate: 1500,
        animationEasingUpdate: "quinticInOut",
        label: {
          normal: {
            show: true,
            textStyle: {
              fontSize: 12,
            },
          },
        },
        legend: {
          x: "center",
          show: this.showLegend,
          data: legendData,
          textStyle: {
            color: this.isDark ? '#eee' : '#555'
          }
        },
        series: [
          {
            type: "graph",
            layout: this.mode,
            symbolSize: 45,
            focusNodeAdjacency: true,
            roam: true,
            draggable: true,
            categories: categoryList,
            zoom: this.graphZoom,
            // 节点的文字样式
            label: {
              show: true,
              position: "top",
              fontSize: 14,
              color: this.isDark ? "#eee":"#555",
              textBorderWidth: 1,
              // 将文档id进行处理 提取为文档最后一个名称
              formatter(params): string {
                const name: string = (params.data as any).name;
                const arr = name.split("-");
                return [`{title|${arr[arr.length - 1]}}`,
                        // `{category|『${name.replaceAll(/-/g, '/')}』}`
                ].join("\n");
              },
              rich: {
                title: {
                  align: "center",
                  fontSize: "15px",
                  color: this.isDark ? '#eee' :'#4C4C49',
                },
                category: {
                  align: "center",
                  color: '#46adff',
                  textBorderColor: this.isDark ? "":"#fff",
                }
              }
            },
            force: {
              repulsion: [nodeMap.size * 1, nodeMap.size * 100],
              gravity: nodeMap.size / 1000,
              edgeLength: [nodeMap.size * 1, nodeMap.size * 4],
            },
            edgeSymbolSize: 6,
            edgeSymbol: ["arrow"],
            edgeLabel: {
              show: false,
              fontSize: 10,
              formatter: "{c}",
            },
            data: nodes,
            links,
            lineStyle: {
              opacity: 0.4,
              curveness: 0,
              width: 1,
              color: this.isDark ? "#666" : "#aaa",
            },
            emphasis: {
              focus: "adjacency",
              lineStyle: {
                opacity: 0.6,
                width: 2,
              },
            },
          },
        ],
      };

      this.chart.setOption(option);
      this.chart.on('graphRoam', (params: any) => {
        let zoom = (this.chart as any)._coordSysMgr._coordinateSystems[0]._zoom;
        this.graphZoom = zoom;
      })
    },

    /**
     * 处理图例选择状态改变事件
     * 当点击图例时，高亮对应类型的节点和关系
     */
    handleHighlight(params: any) {
      if (params.batch) {
        return
      }
      if (!this.chart) return;

      // 获取系列中的分类信息
      const option = this.chart.getOption() as any;
      const categories = option.series[0].categories || [];

      // 找到分类的索引
      const categoryIndex = categories.findIndex((cat: any) => cat.name === params.name);
      if (categoryIndex !== -1) {
        // 找到属于该分类的所有节点索引
        const seriesData = option.series[0].data;
        const nodeDataIndexes: number[] = [];

        seriesData.forEach((node: any, index: number) => {
          if (node.category === categoryIndex) {
            nodeDataIndexes.push(index);
          }
        });

        // 找到与这些节点相关的边的索引
        const links = option.series[0].links || [];
        const linkDataIndexes: number[] = [];

        links.forEach((link: any, index: number) => {
          // 检查边的源节点或目标节点是否在高亮节点列表中
          const sourceIndex = seriesData.findIndex((node: any) => node.name === link.source);
          const targetIndex = seriesData.findIndex((node: any) => node.name === link.target);

          if (nodeDataIndexes.includes(sourceIndex) || nodeDataIndexes.includes(targetIndex)) {
            linkDataIndexes.push(index);
          }
        });

        console.log('nodeDataIndexes', nodeDataIndexes)
        // 高亮节点和边
        this.chart.dispatchAction({ type: 'highlight', seriesIndex:0, 
          batch:[
            {dataIndex: nodeDataIndexes},
            // {dataType: 'edge', dataIndex: linkDataIndexes}
          ]}
        )
      }
    },

    /**
     * 根据分类高亮节点和相关边
     */
    highlightNodesByCategory(categoryName: string) {
      if (!this.chart) return;

      // 先取消所有高亮
      this.clearHighlight();

      // 获取系列中的分类信息
      const option = this.chart.getOption() as any;
      const categories = option.series[0].categories || [];

      // 找到分类的索引
      const categoryIndex = categories.findIndex((cat: any) => cat.name === categoryName);
      console.log()
      if (categoryIndex !== -1) {
        // 找到属于该分类的所有节点索引
        const seriesData = option.series[0].data;
        const nodeDataIndexes: number[] = [];

        seriesData.forEach((node: any, index: number) => {
          if (node.category === categoryIndex) {
            nodeDataIndexes.push(index);
          }
        });

        // 找到与这些节点相关的边的索引
        const links = option.series[0].links || [];
        const linkDataIndexes: number[] = [];

        links.forEach((link: any, index: number) => {
          // 检查边的源节点或目标节点是否在高亮节点列表中
          const sourceIndex = seriesData.findIndex((node: any) => node.name === link.source);
          const targetIndex = seriesData.findIndex((node: any) => node.name === link.target);

          if (nodeDataIndexes.includes(sourceIndex) || nodeDataIndexes.includes(targetIndex)) {
            linkDataIndexes.push(index);
          }
        });

        console.log('nodeDataIndexes', nodeDataIndexes)
        // 高亮节点和边
        if (nodeDataIndexes.length > 0) {
          this.chart.dispatchAction({
            type: 'highlight',
            seriesIndex: 0,
            dataIndex: nodeDataIndexes
          });
        }

        if (linkDataIndexes.length > 0) {
          this.chart.dispatchAction({
            type: 'highlight',
            seriesIndex: 0,
            dataType: 'edge', // 指定高亮边
            dataIndex: linkDataIndexes
          });
        }
      }
    },

    /**
     * 清除所有高亮
     */
    clearHighlight() {
      if (!this.chart) return;

      // 清除节点高亮
      this.chart.dispatchAction({
        type: 'downplay',
        seriesIndex: 0
      });

      // 清除边高亮
      this.chart.dispatchAction({
        type: 'downplay',
        seriesIndex: 0,
        dataType: 'edge'
      });
    }
  },
});
</script>

<style lang="less">
.knowledge-network-chart {
  height: 100%;
  width: 100%;
  position: relative;
}

.knowledge-network-chart-container {
  height: 100%;
  width: 100%;
}
</style>