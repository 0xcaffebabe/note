<template>
  <el-row :gutter="15">
    <!-- <el-col :span="12"> -->
      <!-- <knowledge-radar /> -->
    <!-- </el-col> -->
    <el-col :span="24">
      <div class="rank" ref="rank"></div>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import KnowledgeRadar from "../home/statistic/KnowledgeRadar.vue";
import CategoryService from "@/service/CategoryService";

import * as echarts from "echarts/core";
import {
  TitleComponent,
  TitleComponentOption,
  TooltipComponent,
  TooltipComponentOption,
} from "echarts/components";
import { TreemapChart, TreemapSeriesOption } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import Category from "@/dto/Category";
import DocUtils from "@/util/DocUtils";

echarts.use([TitleComponent, TooltipComponent, TreemapChart, CanvasRenderer]);

type EChartsOption = echarts.ComposeOption<
  TitleComponentOption | TooltipComponentOption | TreemapSeriesOption
>;

function getLevelOption() {
  return [
    {
      itemStyle: {
        borderWidth: 0,
        gapWidth: 5,
      },
    },
    {
      itemStyle: {
        gapWidth: 1,
      },
    },
    {
      colorSaturation: [0.35, 0.5],
      itemStyle: {
        gapWidth: 1,
        borderColorSaturation: 0.6,
      },
    },
  ];
}

interface RankItem {
  name: string;
  value: number;
  path: string;
  children: RankItem[];
}

function toRankItem(cateList: Category[]): RankItem[] {
  return cateList.map((v) => {
    return {
      name: v.name,
      value: Category.childrenSize(v) || 1,
      path: v.link,
      children: toRankItem(v.chidren),
    };
  });
}

export default defineComponent({
  props: {
    topLink: {
      type: String,
      default: "",
    },
  },
  components: { KnowledgeRadar },
  data() {
    return {
      rankData: [] as RankItem[],
      chart: null as echarts.ECharts | null,
    };
  },
  watch: {
    topLink() {
      this.initChart();
    }
  },
  methods: {
    async getRankData() {
      const cateList = await CategoryService.getCompiledCategoryList();
      let rankList = toRankItem(cateList);
      if (this.topLink) {
        rankList = this.filterByLink(rankList);
      }
      this.rankData = rankList;
    },
    filterByLink(cateList: RankItem[]): RankItem[] {
      const result: RankItem[] = []
      const stack = [...cateList];
      while(stack.length != 0) {
        const i = stack.pop();
        if (i?.path == this.topLink) {
          result.push(i);
        }
        for(const c of i?.children || []) {
          stack.push(c);
        }
      }
      return result;
    },
    async initChart() {
      if (!this.chart) {
        this.chart = echarts.init(this.$refs.rank as HTMLElement);
      }
      await this.getRankData();
      this.chart.setOption({
        title: {
          text: "Rank",
          left: "center",
        },
        tooltip: {
          formatter: function (info: any) {
            const data = info.data as RankItem;
            return `${DocUtils.docUrl2Id(data.path)}`;
          },
        },
        series: [
          {
            name: "知识",
            type: "treemap",
            visibleMin: 10,
            leafDepth: 2,
            label: {
              show: true,
              formatter: "{b}",
            },
            itemStyle: {
              borderColor: "#fff",
            },
            levels: getLevelOption(),
            data: this.rankData,
          },
        ],
      });
    },
  },
  async mounted() {
    this.$nextTick(this.initChart);
  },
});
</script>

<style lang="less" scoped>
.rank {
  width: 100%;
  height: 600px;
}
</style>
