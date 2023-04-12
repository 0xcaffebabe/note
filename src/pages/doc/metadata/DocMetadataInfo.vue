<template>
  <p class="create-time">
    ⏰<span>创建时间: </span>{{ new Date(file.createTime).toLocaleString() }}
  </p>
  <p class="last-update">
    🪵<span>最后更新: {{new Date(firstCommit.date).toLocaleString()}} </span> <a :href="config.repositoryUrl + '/commit/' +firstCommit.hash" target="_blank">{{ firstCommit.message }}</a>
  </p>
  <p class="quality-score">⚽<span>质量分数: </span>{{ quality }}</p>
  <link-list :links="file.formattedMetadata.links" @link-click="handleLinkClick" v-if="file.formattedMetadata.links.length > 0"/>
  <book :file="file" />
  <tag-list :tags="file.formattedMetadata.tags" :doc="file.id"/>
</template>

<script lang="ts" setup>
import TagList from '../tag/TagList.vue'
import Book from './Book.vue'
import LinkList from './LinkList.vue';
</script>

<script lang="ts">
import DocFileInfo from "@/dto/DocFileInfo";
import { defineComponent, PropType } from "vue";
import DocService from '@/service/DocService';
import CommitInfo from '@/dto/CommitInfo';
import config from '@/config'

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
    quality(): string {
      return DocService.calcQuanlityStr(this.file.id);
    },
    firstCommit(): CommitInfo {
      return this.file.commitList[0] || new CommitInfo()
    }
  }
});
</script>

<style lang="less" scoped>
.create-time, .last-update {
  padding-top: 10px;
  margin: 0;
  font-size: 12px;
  span {
    color: #888;
  }
  a {
    text-decoration: none;
    color: #74818d;
    font-weight: 400;
  }
  a:hover {
    color: #3E90E8 !important;
  }
}
.last-update {
  padding-top: 0;
}
.quality-score {
  padding: 2px;
  margin: 0;
  font-size: 12px;
  span {
    color: #888;
  }
}

.el-dropdown-link {
  cursor: pointer;
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
}
</style>