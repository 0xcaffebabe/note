<template>
  <div class="doc-meta">
    <span class="meta-item" v-if="file.createTime">
      <el-icon><Calendar /></el-icon>
      <span>{{ new Date(file.createTime).toLocaleDateString() }} 创建</span>
    </span>
    <span class="meta-item" v-if="firstCommit.date">
      <el-icon><Clock /></el-icon>
      <a :href="config.repositoryUrl + '/commit/' + firstCommit.hash" target="_blank" rel="noopener" :title="firstCommit.message">
        {{ new Date(firstCommit.date).toLocaleDateString() }} 更新
      </a>
    </span>
    <span class="meta-item" v-if="readingTime">
      <el-icon><Reading /></el-icon>
      <span>约 {{ wordCount }} 字 · {{ readingTime }}</span>
    </span>
  </div>
  <link-list :links="file.formattedMetadata.links" @link-click="handleLinkClick" v-if="file.formattedMetadata.links.length > 0"/>
  <tag-list :tags="file.formattedMetadata.tags" :doc="file.id"/>
</template>

<script lang="ts" setup>
import TagList from '../tag/TagList.vue'
import LinkList from './LinkList.vue';
import { Calendar, Clock, Reading } from '@element-plus/icons-vue';
</script>

<script lang="ts">
import DocFileInfo from "@/core/domain/DocFileInfo";
import { defineComponent, PropType } from "vue";
import CommitInfo from '@/core/domain/CommitInfo';
import config from '@/core/config/config'

export default defineComponent({
  props: {
    file: {
      required: true,
      type: Object as PropType<DocFileInfo>,
    },
  },
  data() {
    return {config}
  },
  emits: ['linkClick'],
  methods: {
    handleLinkClick(link: string) {
      this.$emit('linkClick', link)
    }
  },
  computed: {
    firstCommit(): CommitInfo {
      return this.file.commitList[0] || new CommitInfo()
    },
    wordCount(): number {
      return (this.file.content || '').replace(/\s/g, '').length
    },
    readingTime(): string {
      if (!this.wordCount) {
        return ''
      }
      // 按400字/分钟估算中文阅读速度
      const minutes = Math.max(1, Math.round(this.wordCount / 400))
      return `${minutes} 分钟`
    },
  }
});
</script>

<style lang="less" scoped>
.doc-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-md);
  padding-top: 10px;
  font-size: var(--font-size-xs);
  color: var(--secondary-text-color);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  .el-icon {
    font-size: 13px;
  }

  a {
    text-decoration: none;
    color: var(--secondary-text-color);
    transition: color var(--transition-fast);

    &:hover {
      color: var(--primary-color);
    }
  }
}
</style>
