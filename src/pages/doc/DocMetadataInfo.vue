<template>
  <p class="create-time">
    ⏰<span>创建时间: </span>{{ new Date(file.createTime).toLocaleString() }}
  </p>
  <p class="quality-score">⚽<span>质量分数: </span>{{ quality }}</p>
  <book :file="file" />
  <tag-list :tags="file.formattedMetadata.tags" />
</template>

<script lang="ts" setup>
import TagList from './tag/TagList.vue'
import Book from './book/Book.vue'
</script>

<script lang="ts">
import DocFileInfo from "@/dto/DocFileInfo";
import { defineComponent, PropType } from "vue";
import DocService from '@/service/DocService';

export default defineComponent({
  props: {
    file: {
      required: true,
      type: Object as PropType<DocFileInfo>,
    },
  },
  computed: {
    quality(): string {
      return DocService.calcQuanlityStr(this.file.id);
    }
  }
});
</script>

<style lang="less" scoped>
.create-time {
  padding-top: 10px;
  margin: 0;
  font-size: 12px;
  span {
    color: #888;
  }
}
.quality-score {
  padding: 2px;
  margin: 0;
  font-size: 12px;
  span {
    color: #888;
  }
}
</style>