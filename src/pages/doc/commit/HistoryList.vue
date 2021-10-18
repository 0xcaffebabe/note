<template>
  <div class="block">
    <p style="text-align:left">更新历史</p>
    <el-timeline>
      <el-timeline-item
        v-for="(commit, index) in file.commitList"
        :key="index"
        :timestamp="commit.date"
      >
        <p class="history-message">
          <a :href="config.repositoryUrl + '/commit/' +commit.hash" target="_blank">{{ commit.message }}</a>
        </p>
      </el-timeline-item>
      <el-timeline-item v-if="file.hasMoreCommit">
        <p class="history-message"><a href="#">全部历史({{file.totalCommits}}条)</a></p>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<script lang="ts">
import DocFileInfo from '@/dto/DocFileInfo'
import { defineComponent } from 'vue'
import config from '@/config'

export default defineComponent({
  props: {
    file: {
      type: DocFileInfo,
      required: true
    }
  },
  setup() {
    
  },
  data() {
    return {
      config
    }
  }
})
</script>

<style lang="less" scoped>
.history-message {
  text-align:left;
  padding:0;
  margin: 0;
  a {
    text-decoration: none;
    color: #74818d;
    font-weight: 400;
    font-size: 14px;
  }
  a:hover {
    color: #3E90E8 !important;
  }
}
</style>