<template>
  <div class="statistic-wrapper">
    <el-descriptions
      class="margin-top"
      title="统计"
      :column="12"
      border
    >
      <el-descriptions-item>
        <template #label>
          <el-icon>
            <coin />
          </el-icon>
          仓库尺寸
        </template>
        {{ repositorySizeReadable() }} MB
      </el-descriptions-item>
      <el-descriptions-item :span="3">
        <template #label>
          <el-icon>
            <check />
          </el-icon>
          提交统计
        </template>
        {{ info.commit.commitPerDay }}次/天, {{ info.commit.linePerDay.toLocaleString("en-US") }}行/天
      </el-descriptions-item>
      <el-descriptions-item :span="3">
        <template #label>
          <el-icon>
            <document />
          </el-icon>
          字数统计
        </template>
        {{ info.word.total.toLocaleString("en-US") }}字, {{ info.word.wordPerDay.toLocaleString("en-US") }}字/天
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label>
          <el-icon>
            <notebook />
          </el-icon>
          章节数
        </template>
        {{ info.chapterCount }}
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label>
          <el-icon>
        <picture-filled />
      </el-icon>
          图片数
        </template>
        {{ info.imageCount }}
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label>
          <el-icon>
          <clock />
      </el-icon>
          首次提交
        </template>
        {{ new Date(info.firstCommitDate).toLocaleString() }}
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label>
          <el-icon>
          <clock />
      </el-icon>
          最后更新
        </template>
        {{ new Date(info.generateTime).toLocaleString() }}
      </el-descriptions-item>
      <el-descriptions-item :span="1" v-for="item in 1" :key="item">
      </el-descriptions-item>
      <el-descriptions-item :span="12">
        <template #label>
          <el-icon>
        <aim />
      </el-icon>
          代码统计
        </template>
        <code-frequency :codeFrequency="info.codeFrequency"/>
      </el-descriptions-item>
      <el-descriptions-item :span="12">
        <template #label>
          <el-icon>
            <calendar />
          </el-icon>
          提交分布
        </template>
        <heat-map />
        <hour-commit-heatmap />
        <commit-total-trend />
      </el-descriptions-item>
      <el-descriptions-item :span="12">
        <template #label>
          <el-icon>
            <calendar />
          </el-icon>
          词云统计
        </template>
        <word-cloud />
      </el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<script setup lang="ts">
import HourCommitHeatmap from "./HourCommitHeatmap.vue"
import CommitTotalTrend from "./CommitTotalTrend.vue";
</script>

<script lang="ts">
import { Coin, Check, Document, Notebook, PictureFilled, Aim, Clock, Calendar } from "@element-plus/icons";
import { defineComponent } from "vue";
import api from "@/api";
import { CodeFrequencyItem, StatisticInfo } from "@/dto/StatisticInfo";
import HeatMap from './HeatMap.vue'
import WordCloud from './WordCloud.vue'
import CodeFrequency from './CodeFrequency.vue'

export default defineComponent({
  components: {
    Coin,
    Check,
    Document,
    Notebook,
    PictureFilled,
    Aim,
    Clock,
    Calendar,
    HeatMap,
    WordCloud,
    CodeFrequency
  },
  setup() {},
  data() {
    return {
      info: new StatisticInfo() as StatisticInfo,
      codeFrequency: [] as CodeFrequencyItem[]
    };
  },
  methods: {
    repositoryPercentage() {
      return Math.ceil((this.info.repositorySize / (1024 * 1024 * 1024)) * 100);
    },
    repositorySizeReadable() {
      return Math.ceil(this.info.repositorySize / (1024 * 1024));
    },
    calcCodeFrequency(){
      const total = this.info.codeFrequency
                              .map(v => v.frequency)
                              .reduce((a, b) => a + b, 0)
      return this.info.codeFrequency
                      .map(v => {
                        return {
                          lang: v.lang,
                          frequency: Math.ceil((v.frequency / total) * 100)
                        } as CodeFrequencyItem
                      })
                      .splice(0, 10)
    }
  },
  async created() {
    this.info = await api.getStatisticInfo();
    this.codeFrequency = this.calcCodeFrequency();
  },
});
</script>

<style lang="less" scoped>
.statistic-wrapper {
  height: 100%;
  padding: 0 40px;
}
:deep(.el-icon) {
  vertical-align: middle;
}

body[theme=dark] {
  .statistic-wrapper {
    background-color:var(--main-dark-bg-color);
    color: var(--main-dark-text-color);
  }
  :deep(.el-descriptions__body) {
    background-color:var(--main-dark-bg-color);
    color: var(--main-dark-text-color);
  }
}
</style>