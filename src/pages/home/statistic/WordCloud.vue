<template>
  <div class="wordcloud-wrapper">
    <div id="wordcloud"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as echarts from "echarts/core";
import {
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import "echarts-wordcloud";
import api from "@/api";

echarts.use([
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer,
]);

export default defineComponent({
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
  watch: {
    isDark() {
      this.init();
    }
  },
  methods: {
    async init() {
      let list = await api.getWordCloud();
      const chart = echarts.init(document.getElementById("wordcloud")!);
      const option = {
        tooltip: {
          backgroundColor: this.isDark ? "#666" : "#fff",
          textStyle: {
            color: this.isDark ? "#bbb" : "",
          },
        },
        series: [
          {
            type: "wordCloud",
            gridSize: 2,
            sizeRange: [12, 108],
            rotationRange: [0, 0],
            shape: "diamond",
            width: "100%",
            height: "85%",
            textStyle: {
              color: function () {
                return (
                  "rgb(" +
                  [
                    Math.round(Math.random() * 160),
                    Math.round(Math.random() * 160),
                    Math.round(Math.random() * 160),
                  ].join(",") +
                  ")"
                );
              },
              emphasis: {
                textStyle: {
                  shadowBlur: 10,
                  shadowColor: "#333",
                  color: "#409EFF",
                },
              },
            },
            data: list.map((v) => {
              return { name: v[0], value: v[1] };
            }),
          },
        ],
      };

      chart.setOption(option);
      chart.on("click", (params) => {
        const kw = (params.data as any).name;
        this.$store.commit("setSearchKw", kw);
      });
    },
  },
  async mounted() {
    this.init();
  },
});
</script>

<style lang="less" scoped>
.wordcloud-wrapper {
  width: 100%;
}
#wordcloud {
  width: 1000px;
  height: 500px;
  margin: 0 auto;
}
</style>
