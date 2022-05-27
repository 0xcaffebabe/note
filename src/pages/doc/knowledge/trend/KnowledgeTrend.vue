<template>
  <el-drawer
    v-model="showDrawer"
    size="80%"
    :direction="$isMobile() ? 'btt': 'rtl'"
    title="知识趋势"
    :with-header="false"
    :lock-scroll="true"
    custom-class="knowledge-trend"
    v-loading="true"
  >
    <el-select v-model="kw" size="small">
      <el-option v-for="keyword in keywords" :key="keyword" :value="keyword" :label="keyword"></el-option>
    </el-select>
    <div
      ref="chartContainer"
      class="chartContainer"
      style="height: 600px; width: 100%"
    ></div>
    <el-row :gutter="12">
      <el-col :span="24">
        <world ref="world"/>
      </el-col>
      <el-col :md="12" :xs="24">
         <el-card class="data-card">
          <template #header>
            <h1 class="data-title">相关查询</h1>
          </template>
          <el-table :data="releatedQueriesData" height="250" style="width: 100%">
            <el-table-column prop="query" label="查询" />
            <el-table-column prop="value" label="流行度"/>
          </el-table>
        </el-card>
      </el-col>
      <el-col :md="12" :xs="24">
         <el-card class="data-card">
          <template #header>
            <h1 class="data-title">相关主题</h1>
          </template>
          <el-table :data="releatedTopicsData" height="250" style="width: 100%">
            <el-table-column prop="topc.title" label="主题">
               <template #default="scope">
                  {{scope.row.topic.title}}
              </template>
            </el-table-column>
            <el-table-column prop="value" label="流行度"/>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as echarts from "echarts/core";
import i18n_zh from './components/i18n_zh';
import {
  TitleComponent,
  TitleComponentOption,
  ToolboxComponent,
  ToolboxComponentOption,
  TooltipComponent,
  TooltipComponentOption,
  GridComponent,
  GridComponentOption,
  LegendComponent,
  LegendComponentOption,
  DataZoomComponent,
} from "echarts/components";
import { LineChart, LineSeriesOption } from "echarts/charts";
import { UniversalTransition } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";
import GoogleTrendService from "@/service/GoogleTrendService";
import GeoMapDataItem from "@/dto/google-trend/GeoMapDataItem";
import QueriesRankedKeywordItem from "@/dto/google-trend/QueriesRankedKeywordItem";
import TopicsRankedKeywordItem from "@/dto/google-trend/TopicsRankedKeywordItem";
import World from './components/World.vue'
import DocFileInfo from "@/dto/DocFileInfo";

echarts.use([
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  CanvasRenderer,
  UniversalTransition,
  DataZoomComponent,
]);

type EChartsOption = echarts.ComposeOption<
  | TitleComponentOption
  | ToolboxComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | LegendComponentOption
  | LineSeriesOption
>;

export default defineComponent({
  components: {
    World
  },
  setup() {},
  data() {
    return {
      showDrawer: false,
      kw: "",
      interestByRegionData: [] as GeoMapDataItem[],
      releatedQueriesData: [] as QueriesRankedKeywordItem[],
      releatedTopicsData: [] as TopicsRankedKeywordItem[],
      keywords: [] as string[],
    };
  },
  computed: {
    isDark() {
      return this.$store.state.isDarkMode;
    },
  },
  watch: {
    kw() {
      this.init()
    }
  },
  mounted() {
  },
  created() {
    
  },
  methods: {
    localeName(geoCode: string, defaultVal: string) {
      return (i18n_zh.countries as any)[geoCode] || defaultVal
    },
    show(file: DocFileInfo) {
      this.keywords = Array.from(new Set<string>([file.formattedMetadata.standardName,
        file.id.split("-")[file.id.split("-").length - 1],
        ...file.formattedMetadata.alias || []
        ]))
        .filter(v => v && v.length != 0)
      this.kw = this.keywords[0]
      this.showDrawer = true
      this.init();
    },
    init() {
      this.$nextTick(() => {
        this.initInterestOverTime();
        this.initInterestByRegion();
        this.initRelatedQueries();
        this.initRelatedTopics();
      })
    },
    async initInterestOverTime() {
      const data = (await GoogleTrendService.interestOverTime(this.kw)).default
        .timelineData;
      const chartDom = this.$refs.chartContainer as HTMLElement;
      const myChart = echarts.init(chartDom);
      const option: EChartsOption = {
        darkMode: this.isDark,
        dataZoom: [
          {
            start: 0,
            end: 100,
          },
          {
            start: 0,
            end: 100,
          },
        ],
        title: {
          text: "知识趋势: " + this.kw,
          textStyle: {
            color: this.isDark ? "#bbb" : "",
          },
        },
        tooltip: {
          trigger: "axis",
          backgroundColor: this.isDark ? "#666" : "#fff",
          textStyle: {
            color: this.isDark ? "#bbb" : "",
          },
        },
        legend: {
          data: ["流行度"],
          textStyle: {
            color: this.isDark ? "#bbb" : "",
          },
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "3%",
          containLabel: true,
        },
        toolbox: {
          feature: {
            saveAsImage: { show: false },
          },
        },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: data.map((v) => v.formattedAxisTime),
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            name: "流行度",
            type: "line",
            smooth: true,
            data: data.map((v) => v.value[0]),
          },
        ],
      };
      option && myChart.setOption(option);
    },
    async initInterestByRegion() {
      (this.$refs.world as InstanceType<typeof World>).init(this.kw)
    },
    async initRelatedQueries() {
      this.releatedQueriesData = (await GoogleTrendService.relatedQueries(this.kw)).default.rankedList[0].rankedKeyword
    },
    async initRelatedTopics() {
      this.releatedTopicsData = (await GoogleTrendService.relatedTopics(this.kw)).default.rankedList[0].rankedKeyword
      console.log(this.releatedTopicsData)
    }
  },
});
</script>

<style lang="less" scoped>
.data-card {
  margin: 0 10px;
  .data-title {
    padding: 0;
    margin: 0;
  }
}
body[theme=dark] {
  .data-card {
    background-color: var(--main-dark-bg-color);
    color: var(--main-dark-text-color);
  }
}
</style>