<template>
  <div ref="worldContainer" style="width: 100%; height: 100%"></div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import world from "./world.geo.json";
import * as echarts from "echarts/core";
import { MapChart, MapSeriesOption } from "echarts/charts";
import { UniversalTransition } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";
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
} from "echarts/components";
import { ECharts } from "echarts/core";
import GeoMapDataItem from "@/dto/google-trend/GeoMapDataItem";
import i18n_zh from './i18n_zh';

echarts.use([
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  MapChart,
  CanvasRenderer,
  UniversalTransition,
]);

type EChartsOption = echarts.ComposeOption<
  | TitleComponentOption
  | ToolboxComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | LegendComponentOption
  | MapSeriesOption
>;

function localeName(geoCode: string, defaultVal: string): string {
  return (i18n_zh.countries as any)[geoCode] || defaultVal;
}

export default defineComponent({
  props: {
    regionData: {
      required: true,
      type: [] as PropType<GeoMapDataItem[]>,
    },
  },
  setup() {},
  data() {
    return {
      chart: null as echarts.ECharts | null,
    };
  },
  computed: {
    isDark() {
      return this.$store.state.isDarkMode;
    },
  },
  methods: {
    
    init() {
      if (!this.chart) {
        this.chart = echarts.init(this.$refs.worldContainer as HTMLElement);
        echarts.registerMap("WORLD", world as any);
      }
      const data = this.regionData
        .filter((v) => v.hasData[0])
        .map((v) => {
          return { name: v.geoName, value: v.value[0], code: v.geoCode };
        })
        .map((v: any) => {
          if (v.value == 100) {
            v.itemStyle = {
              areaColor: "#0058eb",
            };
          } else {
            v.itemStyle = {
              areaColor: "#adc9f9",
            };
          }
          return v;
        });
      const option: EChartsOption = {
        tooltip: {
          trigger: "item",
        },
        series: [
          {
            name: "世界地图",
            type: "map",
            zoom: 1.23,
            roam: true,
            map: "WORLD", // 自定义扩展图表类型
            tooltip: {
              trigger: "item",
              backgroundColor: this.isDark ? "#666" : "#fff",
              textStyle: {
                color: this.isDark ? "#bbb" : "",
              },
              formatter(params): string {
                const data = params.data as any
                return `${localeName(data.code, data.name)} 流行度: ${data.value}`
              }
            },
            layoutCenter: ["50%", "50%"],
            // 如果宽高比大于 1 则宽度为 100，如果小于 1 则高度为 100，保证了不超过 100x100 的区域
            layoutSize: "",
            label: {
              show: false,
              color: "#fff",
            },
            itemStyle: {
              areaColor: this.isDark ? "#555": "#e0e0e0",
              borderColor: "rgba(0,0,0,0)",
              color: "#fff",
            },
            data: data,
            emphasis: {
              itemStyle: {
                areaColor: "#0058eb",
              },
              label: {
                show: false,
                color: "#fff",
              },
            },
          },
        ],
      };
      this.chart.setOption(option);
    },
  },
  mounted() {},
});
</script>
