<template>
  <div class="block">
    <p style="text-align:left">更新历史</p>
    <el-timeline>
      <el-timeline-item
        v-for="(commit, index) in file.commitList"
        :key="index"
        :timestamp="new Date(commit.date).toLocaleString()"
      >
        <p class="history-message">
          <a :href="config.repositoryUrl + '/commit/' +commit.hash" target="_blank">{{ commit.message }}</a>
        </p>
      </el-timeline-item>
      <el-timeline-item v-if="file.hasMoreCommit">
        <p class="history-message"><a target="_blank" :href="config.repositoryUrl + '/tree/master/doc/' + docId2Url(doc)" class="all">全部历史({{file.totalCommits}}条)</a></p>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<script lang="ts">
import DocFileInfo from '@/dto/DocFileInfo'
import { defineComponent, PropType } from 'vue'
import config from '@/config'
import DocUtils from '@/util/DocUtils'

export default defineComponent({
  props: {
    file: {
      type: Object as PropType<DocFileInfo>,
      required: true
    },
    doc: {
      type: String,
      required: true
    }
  },
  setup() {
    
  },
  methods: {
    docId2Url: DocUtils.docId2Url
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
  .all {
    color: #3E90E8 !important;
  }
}
  :deep(.el-timeline-item__timestamp) {
    text-align: left!important;;
  }

body[theme=dark] {
  .history-message {
    a {
      color: var(--main-dark-text-color);
    }
  }
}
</style>