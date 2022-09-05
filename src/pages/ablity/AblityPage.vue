<template>
  <div class="container">
    <!-- <h1>能力目标</h1> -->
    <ablity-graph :top-link="topLink"/>
    <el-divider />
    <ablity-composition @chapter-click="handleChapterClick" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import AblityGraph from './AblityGraph.vue';
import AblityComposition from './AblityComposition.vue';
import DocUtils from '@/util/DocUtils';

export default defineComponent({
  components: { AblityGraph, AblityComposition },
  data() {
    return {
      topLink: ''
    }
  },
  emits: ['chapterClick'],
  methods: {
    handleChapterClick(link: string) {
      this.topLink = link;
      // this.$emit("chapterClick", link);
      this.$router.push(`/doc/${DocUtils.docUrl2Id(link)}`)
    }
  }
})
</script>

<style lang="less" scoped>
  .container {
    padding: 0 10px;
    padding-top: 20px;
    width: 100%;
  }
</style>