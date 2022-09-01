<template>
  <div class="container">
    <!-- <h1>能力目标</h1> -->
    <ablity-graph />
    <el-divider />
    <ablity-composition />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import AblityGraph from './AblityGraph.vue';
import AblityComposition from './AblityComposition.vue';

export default defineComponent({
  components: { AblityGraph, AblityComposition },
    setup() {
    },
})
</script>

<style lang="less" scoped>
  .container {
    padding: 0 10px;
    padding-top: 20px;
  }
</style>