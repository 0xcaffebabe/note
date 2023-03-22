<template>
  <el-drawer
    v-model="showDrawer"
    :size="$isMobile() ? '50%' : '44%'"
    :direction="$isMobile() ? 'btt': 'rtl'"
    :with-header="false"
    :modal="false"
    title="知识网络"
    @close="$emit('close')"
    :lock-scroll="false"
    modal-class="operational-drawer-modal"
    class="operational-drawer"
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

function nodeColorMapping(size: number): string {
  if (size <= 20) {
    return '#84c0ff'
  }
  if (size > 20 && size <= 40) {
    return '#409eff'
  }
  return '#1D8CFF'
}

function buildSummaryDocInfo(file: DocFileInfo): string {
  return DocService.buildSummaryDocInfo(file)
}

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
  methods: {
    show() {
      this.showDrawer = true;
      this.$nextTick(() => {
        this.init();
      });
    },
    async init(potentialProcess : boolean = true) {
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
          const direct: KnowledgeNode[] = knowledgeNetwork.filter(v => v.id == this.doc || v.links?.find(cv => this.doc == cv.id));
          for(let i = 0; i < this.degree; i++) {
            const list = knowledgeNetwork.filter(v => direct.some(d => d.id == v.id) || v.links?.find(cv => direct.some(d => d.id == cv.id)));
            direct.push(...list);
            direct.push(...list.flatMap(v => v.links || []).filter(v => direct.some(d => d.id == v.id)));
          }
          // direct.forEach(v => {
          //     v.links = v.links?.filter(cv => direct.some(d => d.id == cv.id))
          //   })
          knowledgeNetwork = direct;
        } else {
          knowledgeNetwork = knowledgeNetwork
          .filter(v => v.id == this.doc || v.links?.find(cv => cv.id == this.doc))
          .map(v => {
            if (v.id != this.doc) {
              v.links = v.links?.filter(cv => cv.id == this.doc)
            }
            return v
          })
        }
        
      }
      // 提取所有节点
      let nodes = Array.from(
        new Set(
          knowledgeNetwork.flatMap((v) => [
            v.id,
            ...(v.links?.map((ln) => ln.id) || []),
          ])
        )
      ).map((v) => {
        const list = knowledgeNetwork.filter((item) => item.id == v);
        // 默认节点渲染样式
        if (list.length == 0) {
          return {
            name: v,
            category: v == this.doc ? 1 : 0,
            symbolSize: 20,
            draggable: true,
            itemStyle: {
              color: v == this.doc ? '#F56C6C': nodeColorMapping(20)
            }
          };
          // 节点扇出数越多 大小越大
        } else {
          return {
            name: v,
            category: v == this.doc ? 1 : 0,
            symbolSize: 20 * (1 + (list[0].links?.length || 0) / 3),
            draggable: true,
            itemStyle: {
              color: v == this.doc ? '#F56C6C': nodeColorMapping(20 * (1 + (list[0].links?.length || 0) / 3))
            }
          };
        }
      });
      // 节点下标映射<节点, index>
      const nodeMap = new Map(nodes.map((v, i) => [v.name, i]));
      // 节点关系处理
      const links: any[] = [];
      for (let i of knowledgeNetwork) {
        if (i.links) {
          for (let j of i.links) {
            links.push({
              target: i.id,
              source: j.id,
              value: decodeURI(j.headingId ? "#" + j.headingId : "-")
            });
          }
        }
      }
      // 图表创建、参数设置
      if (!this.chart) {
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
            if (!name) {
              return 'none'
            }
            const result: Promise<DocFileInfo> | DocFileInfo = DocService.getDocFileInfo(name)
            if (result instanceof Promise) {
              result
              .then(file => {
                callback(ticket, buildSummaryDocInfo(file))
              })
              .catch(err => {
                callback(ticket, `${err}`)
              })
            }else {
              return buildSummaryDocInfo(result)
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
          data: ["联系", "当前"],
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
            categories: [
              {
                name: "联系",
                itemStyle: {
                  color: "#409EFF",
                  opacity: this.isDark ? 0.9 : 1
                },
              },
              {
                name: "当前",
                itemStyle: {
                  color: "#F56C6C",
                  opacity: this.isDark ? 0.9 : 1
                },
              },
            ],
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
                        `{category|『${name.replaceAll(/-/g, '/')}』}`
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
              // 节点之间的斥力因子,值越大则斥力越大
              repulsion: [nodeMap.size * 4, nodeMap.size * 6],
              // 节点受到的向中心的引力因子。该值越大节点越往中心点靠拢
              gravity: nodeMap.size / 800,
              // 网络边长 节点数越多 边越长
              edgeLength: [nodeMap.size * 1.2, nodeMap.size * 2],
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
    },
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