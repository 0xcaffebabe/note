<template>
  <div class="frequency-wrapper">
    <el-progress
      :text-inside="true"
      :stroke-width="26"
      :percentage="item.frequency"
      v-for="item in codeFrequency"
      :key="item.lang"
    >
      {{ item.lang }} {{ item.frequency }}%
    </el-progress>
  </div>
</template>

<script lang="ts">
import { CodeFrequencyItem } from "@/dto/StatisticInfo";
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    codeFrequency: {
      type: Array,
      required: true,
    },
  },
  setup() {},
});
</script>

<style lang="less" scoped>
.frequency-wrapper {
  max-width: 1200px;
  margin: 0 auto;
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
.el-progress {
  padding-bottom: 10px;
}
</style>