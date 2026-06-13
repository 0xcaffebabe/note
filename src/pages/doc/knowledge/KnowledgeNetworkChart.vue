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
  GraphicComponent,
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
  GraphicComponent,
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
    },
    zoom: {
      type: Number,
      default: 1
    }
  },
  data() {
    return {
      id: this.generateRandomId(),
      chart: null as echarts.ECharts | null,
      resizeObserver: null as ResizeObserver | null,
      graphZoom: this.zoom,
      nodes: [] as any[],
    };
  },
  watch: {
    doc() {
      this.init();
    },
    mode() {
      this.init();
    },
    onlySelfRelated() {
      this.init();
    },
    isPotential() {
      this.init();
    },
    degree() {
      this.init();
    },
    zoom(newVal) {
      this.updateChartZoom(newVal);
    },
    // 主题切换时重读CSS令牌重渲染(画布内颜色是初始化时解析的快照)
    isDark() {
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
    // 解析CSS语义令牌的当前值(canvas绘制无法直接用var() 需取快照 主题切换由isDark watcher重渲染)
    css(name: string): string {
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
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
    async init() {
      // 图表实例先就绪 数据加载期间展示loading而非白屏
      if (this.chart) {
        this.chart.dispose();
      }
      const chartDom = document.getElementById(this.id);
      if (!chartDom) {
        return;
      }
      this.chart = echarts.init(chartDom);
      this.chart.showLoading({
        text: '正在加载知识网络…',
        color: this.css('--primary-color') || '#409eff',
        textColor: this.css('--secondary-text-color'),
        maskColor: 'transparent',
        fontSize: 13,
      });

      const stream = (await KnowledgeNetworkService.getDocStream(this.doc)).flatMap(v => v)
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
      const links = KnowledgeNetworkDataProcessor.createLinks(knowledgeNetwork);
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

      // 当前节点: 主色实心 + 白描边 + 主色发光光环, 像"你在这里"的定位标记, 亮暗都醒目
      const legendTextColor = this.css('--secondary-text-color');
      const primary = this.css('--primary-color') || '#409eff';
      const currentNodeData = nodes.find((n: any) => n.name === this.doc) as any;
      if (currentNodeData) {
        currentNodeData.itemStyle = {
          ...currentNodeData.itemStyle,
          color: primary,
          borderColor: '#fff',
          borderWidth: 2,
          shadowBlur: 18,
          shadowColor: primary,
        };
        currentNodeData.symbolSize = 32;
      }
      const currentNodeColor = primary;

      const specialCategories = [
        {
          name: "当前",
          itemStyle: {
            color: currentNodeColor,
          },
        },
      ];

      // 生成文档分类的类别配置
      const categoryList = [...specialCategories];
      const legendData = [
        { name: "当前", icon: "roundRect",
        itemStyle: {
          color: currentNodeColor,
        },
         textStyle: { color: legendTextColor }},
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
              },
            });
            legendData.push({
              name: category,
              icon: "roundRect",
              itemStyle: {
                color: color,
              },
              textStyle: { color: legendTextColor }
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
      const chartDomForPos = document.getElementById(this.id);
      if (currentNodeIndex !== -1) {
        // 为当前节点设置固定位置在图表中心
        if (chartDomForPos) {
          (nodes[currentNodeIndex] as any).x = chartDomForPos.clientWidth / 2;
          (nodes[currentNodeIndex] as any).y = chartDomForPos.clientHeight / 2;
          (nodes[currentNodeIndex] as any).fixed = true;
        }
      }

      // 按分类预设初始位置，让同类节点从聚类中心出发
      this.assignClusterPositions(nodes, categoryList, chartDomForPos);

      // 空态: 没有任何关联时给出提示而非一片空白
      const isEmpty = links.length === 0 && nodes.length <= 1;

      const option: EChartsOption = {
        title: {
          text: "知识网络",
          show: this.showChartText,
          top: 'bottom',
          left: 'right',
          textStyle: {
            color: this.css('--secondary-text-color'),
            fontSize: 14,
          }
        },
        darkMode: this.isDark,
        graphic: isEmpty ? [{
          type: 'text',
          left: 'center',
          top: 'middle',
          silent: true,
          style: {
            text: '当前文档暂无知识关联\n试试切换到「隐式」网络或取消「仅看相关」',
            fill: this.css('--secondary-text-color'),
            font: '14px sans-serif',
            align: 'center' as const,
            lineHeight: 24,
          }
        }] : [],
        // tooltip是HTML浮层 可直接用CSS变量 主题切换自动适配
        tooltip: {
          show: this.showTooltip,
          confine: true,
          backgroundColor: 'var(--elevated-bg-color)',
          borderColor: 'var(--border-color)',
          textStyle: {
            color: 'var(--main-text-color)',
          },
          extraCssText: 'box-shadow: var(--shadow-lg); border-radius: 8px; max-width: 380px;',
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
        legend: {
          left: "center",
          // 分类多时图例可分页滚动 不再挤压图表
          type: "scroll",
          show: this.showLegend,
          data: legendData,
          textStyle: {
            color: legendTextColor
          },
          pageTextStyle: {
            color: legendTextColor
          }
        },
        series: [
          {
            type: "graph",
            layout: this.mode,
            symbolSize: 45,
            roam: true,
            roamTrigger: 'global',
            draggable: true,
            categories: categoryList,
            zoom: this.graphZoom,
            // 节点标签: 始终显示, 同背景色光晕描边让文字"浮"在杂乱连线之上仍清晰
            label: {
              show: true,
              position: "bottom",
              distance: 5,
              fontSize: 12,
              fontWeight: 500,
              color: this.css('--main-text-color'),
              textBorderColor: this.css('--card-bg-color'),
              textBorderWidth: 3,
              // 将文档id进行处理 提取为文档最后一个名称
              formatter(params): string {
                const name: string = (params.data as any).name;
                const arr = name.split("-");
                return arr[arr.length - 1];
              },
            },
            // 标签重叠时自动隐藏被压住的, 放大(roam)后空间变大会重新显示更多
            // 既保证"尽量都显示"又不糊成一团; emphasis.label强制显示被隐藏的悬浮标签
            labelLayout: {
              hideOverlap: true,
            },
            force: {
              // 舒展铺开 + 封顶: 原repulsion上限随节点数无界放大(n*100)数百节点会爆开 这里给斥力上限封顶
              // gravity保持很低让节点充分散开 edgeLength回到宽松值
              repulsion: Math.max(400, Math.min(1600, nodes.length * 35)),
              gravity: 0.05,
              edgeLength: [120, 220],
            },
            edgeSymbolSize: 6,
            edgeSymbol: ['', ''], // 移除箭头符号，实现无向图效果
            edgeLabel: {
              show: false,
              fontSize: 10,
              formatter: "{c}",
            },
            data: nodes,
            links,
            lineStyle: {
              // 次级文本色比原#aaa更深 降低不透明度补偿 避免密集网络糊成一团
              opacity: 0.22,
              curveness: 0,
              width: 1,
              color: this.css('--secondary-text-color'),
            },
            emphasis: {
              focus: "adjacency",
              label: {
                show: true,
              },
              lineStyle: {
                opacity: 0.8,
                width: 2,
                color: this.css('--primary-color') || '#409eff',
              },
            },
          },
        ],
      };

      this.chart.hideLoading();
      this.chart.setOption(option);
      
      // 通过 graphRoam 事件的 params.zoom（缩放倍率）累积跟踪当前缩放级别
      this.chart.on('graphRoam', (params: any) => {
        if (params.zoom != null) {
          this.graphZoom = this.graphZoom * params.zoom;
        }
      });

      // 鼠标在节点上时 ECharts 不会自动处理滚轮缩放，需手动处理
      // 同时阻止事件冒泡到页面，避免触发页面滚动
      // 注意：必须使用 dispatchAction 而不是 setOption，否则会触发完整重渲染，
      //       导致 force layout 重启，破坏拖拽交互状态
      this.chart.getZr().on('mousewheel', (params: any) => {
        params.event.preventDefault();
        if (params.target) {
          const zoomFactor = params.wheelDelta > 0 ? 1.1 : 0.9;
          this.chart!.dispatchAction({
            type: 'graphRoam',
            seriesIndex: 0,
            zoom: zoomFactor,
            originX: params.offsetX,
            originY: params.offsetY,
          });
        }
      });
    },
    
    updateChartZoom(newZoom: number) {
      // 图表未创建时只记录目标缩放，等init时生效
      if (!this.chart) {
        this.graphZoom = newZoom;
        return;
      }
      // 用相对缩放动作更新，避免销毁重建图表导致力导向布局重跑
      // this.graphZoom 由 graphRoam 事件回调同步
      const factor = newZoom / this.graphZoom;
      if (!isFinite(factor) || factor <= 0 || factor === 1) {
        return;
      }
      const chartDom = document.getElementById(this.id);
      this.chart.dispatchAction({
        type: 'graphRoam',
        seriesIndex: 0,
        zoom: factor,
        originX: (chartDom?.clientWidth ?? 0) / 2,
        originY: (chartDom?.clientHeight ?? 0) / 2,
      });
    },

    /**
     * 按分类为节点预设初始位置，使同类节点聚集在各自的区域中心附近
     * 力导向布局会以这些初始位置为起点进行模拟，从而保持聚类效果
     */
    assignClusterPositions(nodes: any[], categoryList: any[], chartDom: HTMLElement | null) {
      if (!chartDom || this.mode !== 'force') return;

      const centerX = chartDom.clientWidth / 2;
      const centerY = chartDom.clientHeight / 2;
      const clusterRadius = Math.min(centerX, centerY) * 0.55;

      // 过滤出非"当前"的分类
      const categories = categoryList
        .filter(c => c.name !== '当前')
        .map(c => c.name);
      const categoryCount = categories.length;
      if (categoryCount === 0) return;

      // 将各分类中心均匀分布在以图表中心为圆心的圆上
      const clusterCenters: Record<string, { x: number; y: number }> = {};
      categories.forEach((cat, index) => {
        const angle = (index / categoryCount) * 2 * Math.PI - Math.PI / 2;
        clusterCenters[cat] = {
          x: centerX + clusterRadius * Math.cos(angle),
          y: centerY + clusterRadius * Math.sin(angle),
        };
      });

      // 同类节点均匀排布在各自聚类中心附近
      const categoryCounts: Record<string, number> = {};
      const categoryIndexMap: Record<string, number> = {};
      nodes.forEach(node => {
        if (node.fixed || !node.docCategory || node.docCategory === '当前') return;
        categoryCounts[node.docCategory] = (categoryCounts[node.docCategory] || 0) + 1;
      });
      nodes.forEach(node => {
        if (node.fixed || !node.docCategory || node.docCategory === '当前') return;
        const center = clusterCenters[node.docCategory];
        if (!center) return;
        const total = categoryCounts[node.docCategory] || 1;
        const idx = categoryIndexMap[node.docCategory] || 0;
        categoryIndexMap[node.docCategory] = idx + 1;
        // 同类节点均匀排在聚类中心的小圆上，再加少量随机抖动
        const spreadRadius = Math.min(60, total * 8);
        const angle = (idx / total) * 2 * Math.PI;
        const jitter = 15;
        node.x = center.x + spreadRadius * Math.cos(angle) + (Math.random() - 0.5) * jitter;
        node.y = center.y + spreadRadius * Math.sin(angle) + (Math.random() - 0.5) * jitter;
      });
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

        // 高亮节点和边
        this.chart.dispatchAction({ type: 'highlight', seriesIndex:0, 
          batch:[
            {dataIndex: nodeDataIndexes},
            // {dataType: 'edge', dataIndex: linkDataIndexes}
          ]}
        )
      }
    },
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