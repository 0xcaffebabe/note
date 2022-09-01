<template>
  <el-row :gutter="15">
    <!-- <el-col :span="12">
      <knowledge-radar />
    </el-col> -->
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
  name: string
  value: number
  path: string
  children: RankItem[]
}

function toRankItem(cateList: Category[]): RankItem[] {
  return cateList.map(v => {
    return {
      name: v.name,
      value: Category.childrenSize(v) || 1,
      path: v.link,
      children: toRankItem(v.chidren)
    }
  })
}

export default defineComponent({
  components: { KnowledgeRadar },
  data() {
    return {
      rankData: [] as RankItem[]
    };
  },
  methods: {
    async getRankData() {
      const cateList = await CategoryService.getCompiledCategoryList()
      this.rankData = toRankItem(cateList);
    }
  },
  async mounted() {
    var chartDom = this.$refs.rank as HTMLElement;
    var myChart = echarts.init(chartDom);
    await this.getRankData()
    myChart.setOption({
      title: {
        text: "Rank",
        left: "center",
      },
      tooltip: {
        formatter: function(info: any) {
          const data = info.data as RankItem;
          return `${DocUtils.docUrl2Id(data.path)}`
        }
      },
      series: [
        {
          name: "Rank",
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
});
</script>

<style lang="less" scoped>
.rank {
  width: 100%;
  height: 600px;
}
</style>
