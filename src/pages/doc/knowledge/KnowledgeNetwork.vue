<template>
  <el-drawer
    v-model="showDrawer"
    :size="$isMobile() ? '50%' : '44%'"
    :direction="$isMobile() ? 'btt': 'rtl'"
    :with-header="false"
    :modal="false"
    modal-penetrable
    resizable
    class="knowledge-network-drawer"
    title="知识网络"
    @close="$emit('close')"
    :lock-scroll="false"
  >
  <div class="tool-zone">
    <div>
      <el-button text class="close-btn" @click="showDrawer = false">
        <el-icon><close-bold /></el-icon>
      </el-button>
    </div>
    <div>
      <el-radio-group v-model="mode" placeholder="显示模式" size="small" popper-class="popper-list">
          <el-radio
          v-for="item in displayMode"
          :key="item"
          :label="item"
          :value="item"
        >
        </el-radio>
      </el-radio-group>
    </div>
    <div>
      <el-checkbox v-model="onlySelfRelated" label="只看跟本节点关联的" size="large" />
    </div>
    <div>
      <el-switch
        v-model="isPotential"
        active-color="#409EFF"
        inactive-color="#409EFF"
        inactive-text="显式知识网络"
        active-text="隐式知识网络"
        @change="init"
      />
    </div>
    <div>
      度数: <el-input type="number" size="small" v-model="degree" :disabled="!onlySelfRelated || isPotential"></el-input>
    </div>
  </div>
  <div id="knowledgeNetwork"></div>
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as echarts from "echarts/core";
import {CloseBold} from '@element-plus/icons-vue'
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
  components: {
    CloseBold
  },
  props: {
    doc: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      showDrawer: false,
      chart: null as echarts.ECharts | null,
      resizeObserver: null as ResizeObserver | null,
      nodes: [] as any[],
      mode: 'force' as "force" | "circular" | "none" | undefined,
      displayMode: ['force', 'circular'],
      onlySelfRelated: true,
      isPotential: false,
      degree: 3,
    };
  },
  watch: {
    mode(){
     this.init(false); 
    },
    onlySelfRelated(){
      if (this.onlySelfRelated) {
        this.mode = 'circular'
      }else {
        this.mode = 'force'
      }
      this.init();
    },
    displayMode(){
      this.init()
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
  setup() {},
  mounted() {
    // 初始化时创建 ResizeObserver
    this.setupResizeObserver();
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
    setupResizeObserver() {
      const chartDom = document.querySelector('.knowledge-network-drawer');
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
    
    // 优化图表渲染性能
    optimizeChartRender() {
      if (this.chart) {
        // 设置渲染配置以提高性能
        this.chart.setOption({
          animation: false, // 在调整大小时不触制动效
        });
        
        // 稍微延迟后恢复动画
        setTimeout(() => {
          if (this.chart) {
            this.chart.setOption({
              animation: true,
            });
          }
        }, 300);
      }
    },
    show() {
      this.showDrawer = true;
      this.$nextTick(() => {
        this.init();
      });
    },
    // 防抖函数
    debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
      let timeout: ReturnType<typeof setTimeout> | null = null;
      return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    },
    async init(potentialProcess : boolean = true) {
      const stream = (await KnowledgeNetworkService.getDocStream(this.doc)).flatMap(v => v)
      if (!this.showDrawer) {
        return;
      }
      // 若是潜在知识网络 默认设置为圆圈展示模式
      if (this.isPotential && potentialProcess) {
        this.mode = 'circular';
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
        const chartDom = document.getElementById("knowledgeNetwork")!;
        this.chart = echarts.init(chartDom);
        // 点击事件
        this.chart.on("click", (e) => {
          console.log(e);
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
        { name: "当前", icon: "circle", textStyle: { color: this.isDark ? '#eee' : '#555' }},
      ];

      docCategories.forEach(category => {
        if (!['当前'].includes(category)) {
          // 查找节点获取颜色
          const node = nodes.find((n: any) => n.docCategory === category);
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
              icon: "circle",
              textStyle: { color: this.isDark ? '#eee' : '#555' }
            });
          }
        }
      });

      nodes.forEach(node => {
        node.category = categoryList.findIndex(item => item.name === node.docCategory)
      })

      // 找到当前节点（文档名称匹配的节点）
      const currentNodeIndex = nodes.findIndex(node => node.name === this.doc);
      if (currentNodeIndex !== -1) {
        // 为当前节点设置固定位置在图表中心
        // 先获取图表DOM元素的尺寸
        const chartDom = document.getElementById("knowledgeNetwork");
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
          top: 'bottom',
          left: 'right'
        },
        darkMode: this.isDark,
        tooltip: {
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
                callback(ticket, KnowledgeNetworkDataProcessor.buildSummaryDocInfo(file))
              })
              .catch(err => {
                callback(ticket, `${err}`)
              })
            }else {
              return KnowledgeNetworkDataProcessor.buildSummaryDocInfo(result)
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
          show: true,
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
              opacity: 0.9,
              curveness: 0,
              width: 2,
              color: "#38B3FF",
            },
            emphasis: {
              focus: "adjacency",
              lineStyle: {
                width: 10,
              },
            },
          },
        ],
      };

      this.chart.setOption(option);
      
    }
  },
});
</script>

<style lang="less">
.el-drawer__body {
  padding: 0;
}
</style>

<style lang="less" scoped>
#knowledgeNetwork {
  height: 100%;
  width: 100%;
}
.close-btn {
  position:absolute;
  top: -2px;
  right: -2px;
  z-index: 9999;
}
.tool-zone {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 9999;
}
</style>