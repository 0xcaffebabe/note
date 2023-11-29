<template>
  <div style="text-align:center">
    <div ref="container" class="container"></div>
    <el-button @click="back" v-show="showBack" class="back-btn">返回</el-button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as echarts from "echarts/core";
import {
  TitleComponent,
  TitleComponentOption,
  LegendComponent,
  LegendComponentOption,
} from "echarts/components";
import { RadarChart, RadarSeriesOption } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import api from "@/api";
import { ElMessage } from "element-plus";
import KnowledgeRichnessNode from "@/dto/KnowledgeRichnessNode";

echarts.use([TitleComponent, LegendComponent, RadarChart, CanvasRenderer]);

type EChartsOption = echarts.ComposeOption<
  TitleComponentOption | LegendComponentOption | RadarSeriesOption
>;

export default defineComponent({
  data() {
    return {
      origin: [] as KnowledgeRichnessNode[],
      current: [] as KnowledgeRichnessNode[],
      chart: null as echarts.ECharts|null,
    }
  },
  computed: {
    showBack():boolean {
      if (this.origin.length < 1 || this.current.length < 1) {
        return false
      }
      return this.current[0].link != this.origin[0].link
    }
  },
  watch: {
    current() {
      this.init()
    }
  },
  methods: {
    async getData() {
      this.origin = await api.getKnowledgeRichness()
    },
    back(event: any, cate?: KnowledgeRichnessNode[]) {
      if (!cate) {
        cate = this.origin
      }
      for(let elm of cate) {
        for(let c of elm.chidren) {
          if (c.link == this.current[0].link) {
            this.current = cate
          }
        }
        this.back(null, elm.chidren)
      }

    },
    async prepareCurrentData(name?: string) {
      if (!name) {
        this.current = this.origin
        return
      }
      for(let elm of this.current) {
        if (elm.name == name) {
          if (elm.chidren.length == 0) {
            ElMessage.warning("没有更多了")
            return
          }
          this.current = elm.chidren
          return
        }
      }
      this.current = []
    },
    async init() {
      const max = this.current.map(v => KnowledgeRichnessNode.childrenSize(v)).sort((a,b) => b - a)[0]
      const avg = this.current.map(v => KnowledgeRichnessNode.childrenSize(v)).reduce((a,b) => a + b, 0)
      if (!this.chart) {
        const chartDom = this.$refs.container as HTMLElement;
        this.chart = echarts.init(chartDom);
        this.chart.on("click", (e) => {
          this.prepareCurrentData(e.name)
          this.init()
        })
      }
      var option: EChartsOption;
      option = {
        title: {},
        legend: {
          data: ["知识丰富度"],
        },
        radar: {
          // shape: 'circle',
          indicator: this.current.map(v => {return {name: v.name, max: Math.min(avg, max) }}),
          triggerEvent: true,
        },
        series: [
          {
            name: "知识丰富度",
            type: "radar",
            data: [
              {
                value: this.current.map(v => KnowledgeRichnessNode.childrenSize(v)),
                name: "知识丰富度",
              },
            ],
          },
        ],
      };

      this.chart.setOption(option);
    },
  },
  async mounted() {
    await this.getData()
    this.prepareCurrentData()
  },
});
</script>

<style lang="less" scoped>
.container {
  width: 1000px;
  height: 500px;
  margin: 0 auto;
}
</style>