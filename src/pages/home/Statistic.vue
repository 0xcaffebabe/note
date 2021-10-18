<template>
  <div class="statistic-wrapper">
    <el-descriptions
      class="margin-top"
      title="统计"
      :column="12"
      :size="size"
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
        {{ info.firstCommitDate }}
      </el-descriptions-item>
      <el-descriptions-item :span="1" v-for="item in 2" :key="item">
      </el-descriptions-item>
      <el-descriptions-item :span="12">
        <template #label>
          <el-icon>
        <aim />
      </el-icon>
          代码统计
        </template>
        <el-progress :text-inside="true" :stroke-width="26" :percentage="item.frequency" v-for="item in calcCodeFrequency()" :key="item.lang">
          {{item.lang}} {{item.frequency}}%
        </el-progress>
      </el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<script lang="ts">
import { Coin, Check, Document, Notebook, PictureFilled, Aim, Clock } from "@element-plus/icons";
import { defineComponent } from "vue";
import api from "@/api";
import { CodeFrequencyItem, StatisticInfo } from "@/dto/StatisticInfo";

export default defineComponent({
  components: {
    Coin,
    Check,
    Document,
    Notebook,
    PictureFilled,
    Aim,
    Clock
  },
  setup() {},
  data() {
    return {
      info: new StatisticInfo() as StatisticInfo,
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
  },
});
</script>

<style lang="less" scoped>
.statistic-wrapper {
  padding: 0 40px;
}
.percentage-value {
  display: block;
  margin-top: 10px;
  font-size: 28px;
}

.percentage-label {
  display: block;
  margin-top: 10px;
  font-size: 12px;
}
:deep(.el-icon) {
  vertical-align: middle;
}
.el-progress {
  padding-bottom: 10px;
}
</style>