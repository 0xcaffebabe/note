<template>
  <div class="knowledge-scatter-container">
    <!-- 知识断代指数展示区域 -->
    <div class="knowledge-gap-index-container">
      <div class="gap-index-card">
        <div class="index-header">
          <h3>知识断代指数</h3>
        </div>
        <div class="index-content">
          <div class="gap-index-value" :class="getGapIndexLevelClass(knowledgeGapIndex)">
            {{ knowledgeGapIndex }}
          </div>
          <div class="gap-index-details">
            <span class="oldest-date">最老: {{ oldestDate }}</span>
            <span class="newest-date">最新: {{ newestDate }}</span>
            <span class="time-span">跨度: {{ timeSpan }}天</span>
          </div>
        </div>
        <div class="gap-index-interpretation">{{ getGapIndexInterpretation(knowledgeGapIndex) }}</div>
      </div>
    </div>

    <!-- 图表容器 -->
    <div ref="container" class="container" :class="{'mobile-container': $isMobile()}"></div>
  </div>
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
      selectedData: [] as string[],
      knowledgeGapIndex: 0, // 知识断代指数
      timeSpan: 0, // 时间跨度（天）
      oldestDate: '', // 最老文档日期
      newestDate: '' // 最新文档日期
    };
  },
  watch: {
    doc() {
      this.init()
    }
  },
  methods: {
    // 生成散点图数据 [时间新鲜维度, 质量维度, 文档id]
    async generateScatterData(): Promise<{data: [number, number, string][], timeRange: {min: number, max: number, daysDiff: number}}> {
      const docUpdateList = await api.getDescCommitDocList();
      const times = docUpdateList.map((v) => new Date(v[1].date).getTime());
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      const daysDiff = (maxTime - minTime) / (1000 * 3600 * 24); // 时间差（天数）

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
      const data = Array.from(map.entries()).map((v) => [...v[1], v[0]]);

      return {
        data,
        timeRange: {
          min: minTime,
          max: maxTime,
          daysDiff
        }
      };
    },
    async init() {
      let result = await this.generateScatterData();
      const { data, timeRange } = result;

      // 计算断代指数
      this.calculateKnowledgeGapIndex(timeRange);

      const chartData = data.map(v => {
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
        this.selectedData = ((e as any).batch[0].selected[0].dataIndex as number[]).map(v => chartData[v].name)
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
            data: chartData,
            type: "scatter",
            markLine: generateMarkLineOptions(chartData.map(v => v.value))
          },
        ],
      } as any;

      option && chart.setOption(option);
    },

    // 计算知识断代指数
    calculateKnowledgeGapIndex(timeRange: {min: number, max: number, daysDiff: number}) {
      // 断代指数计算逻辑：时间跨度越大，断代指数越高
      // 可以根据需要调整算法
      const daysDiff = timeRange.daysDiff;

      // 使用对数函数来平衡时间差异对断代指数的影响
      // 以1000天为参考点，超过1000天的项目时间跨度指数增长更快
      let gapIndex;
      if (daysDiff <= 30) {
        gapIndex = 0.1; // 时间差30天内，断代指数较低
      } else if (daysDiff <= 365) {
        gapIndex = 0.3 + (daysDiff - 30) / 335 * 0.4; // 30-365天之间，指数线性增长
      } else {
        // 超过一年，使用对数增长，但不会超过1.0
        gapIndex = 0.7 + (Math.log(daysDiff / 365) / Math.log(10)) * 0.3;
        gapIndex = Math.min(gapIndex, 1.0); // 限制最大值为1.0
      }

      // 更新组件数据
      this.knowledgeGapIndex = parseFloat(gapIndex.toFixed(2));
      this.timeSpan = Math.round(daysDiff);

      // 将最老和最新的日期格式化为可读格式
      const oldestDate = new Date(timeRange.min);
      const newestDate = new Date(timeRange.max);
      this.oldestDate = this.formatDate(oldestDate);
      this.newestDate = this.formatDate(newestDate);
    },

    // 格式化日期为可读格式
    formatDate(date: Date) {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    },

    // 根据断代指数获取等级样式类
    getGapIndexLevelClass(index: number) {
      if (index < 0.3) {
        return 'low-gap';
      } else if (index < 0.6) {
        return 'medium-gap';
      } else if (index < 0.8) {
        return 'high-gap';
      } else {
        return 'critical-gap';
      }
    },

    // 获取断代指数的解释说明
    getGapIndexInterpretation(index: number) {
      if (index < 0.3) {
        return '知识体系连续性良好，文档更新时间跨度较小';
      } else if (index < 0.6) {
        return '知识体系存在部分断层，建议补充中间时期的内容';
      } else if (index < 0.8) {
        return '知识体系断层较明显，文档时效性差异较大';
      } else {
        return '知识体系存在严重断层，急需重构和补充内容';
      }
    }
  },
});

</script>

<style lang="less" scoped>
.container {
  width: 100%;
  height: 100%;
}
.mobile-container {
  height: 450px; // 进一步减小移动设备高度
}

.knowledge-scatter-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .knowledge-gap-index-container {
    padding: 8px;
    margin-bottom: 8px;
    background-color: #f8f9fa;
    border-radius: 6px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);

    .gap-index-card {
      display: flex;
      flex-direction: column;
      background: white;
      border-radius: 6px;
      padding: 10px;

      .index-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;

        h3 {
          margin: 0;
          color: #333;
          font-size: 1.1em;
        }
      }

      .index-content {
        display: flex;
        align-items: center;
        font-size: 0.85em;
        color: #666;

        .gap-index-value {
          font-size: 1.8em;
          font-weight: bold;
          min-width: 50px;
          margin-right: 10px;
          transition: all 0.3s ease;

          &.low-gap {
            color: #67C23A; // 绿色 - 低断层
          }

          &.medium-gap {
            color: #E6A23C; // 黄色 - 中等断层
          }

          &.high-gap {
            color: #E74C3C; // 橙红色 - 高断层
          }

          &.critical-gap {
            color: #F56C6C; // 红色 - 严重断层
            animation: pulse 1.5s infinite;
          }
        }

        .gap-index-details {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          flex: 1;

          span {
            font-size: 1em;
            color: #555;
          }
        }
      }

      .gap-index-interpretation {
        font-size: 0.75em;
        color: #444;
        font-style: italic;
        padding: 4px 6px;
        background-color: #f0f5ff;
        border-left: 2px solid #409EFF;
        text-align: left;
        margin-top: 4px;
        display: none; /* 默认隐藏解释文本，节省空间 */
      }
    }
  }

  // 在较大屏幕上水平排列断代指数信息
  @media (min-width: 768px) {
    .gap-index-card {
      flex-direction: row;
      align-items: center;
      padding: 8px;

      .index-header {
        width: 120px; // 为标题预留固定宽度

        h3 {
          font-size: 1.1em;
        }
      }

      .index-content {
        flex: 1;
        justify-content: flex-start;
        font-size: 0.85em;

        .gap-index-value {
          font-size: 2em;
          min-width: 60px;
        }

        .gap-index-details {
          display: flex;
          gap: 12px;

          span {
            font-size: 0.85em;
          }
        }
      }

      .gap-index-interpretation {
        display: block; // 在较大屏幕上显示解释文本
        font-size: 0.8em;
        width: 25%; // 为解释文本预留固定宽度
        padding: 6px;
      }
    }
  }

  // 在更大屏幕上进一步优化
  @media (min-width: 1200px) {
    .gap-index-card {
      padding: 10px;

      .index-header {
        width: 150px;
      }

      .index-content {
        .gap-index-value {
          font-size: 2.2em;
          min-width: 70px;
        }

        .gap-index-details {
          gap: 15px;
        }
      }

      .gap-index-interpretation {
        width: 30%;
        font-size: 0.85em;
      }
    }

    .container {
      flex: 1;
      min-height: 550px; // 为大屏幕上的图表留更多空间
    }
  }

  // 为整个容器分配高度
  .container {
    flex: 1;
    min-height: 280px; // 确保图表区域有足够的显示空间
  }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
</style>