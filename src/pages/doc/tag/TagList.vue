<template>
  <div>
    <el-popover
    :width="400"
    v-for="item in tags"
    :key="item"
    trigger="hover"
    @show="handleChpaterShow(item)"
  >
    <template #reference>
      <el-tag
      size="small"
      :type="calcTagType(item)"
      @click="$router.push('/tag?tag=' + item)"
      effect="dark"
      >{{ item }}</el-tag
    >
    </template>
    <div style="height:220px;overflow-y:scroll">
      <tag-chapter-zone :chapters="chapters"/>
    </div>
  </el-popover>
    
  </div>
</template>

<script lang="ts" setup>
import TagChapterZone from '@/pages/tag/TagChapterZone.vue'
</script>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import TagUtils from "@/pages/tag/TagUtils";
import TagService from "@/service/TagService";

export default defineComponent({
  props: {
    tags: {
      required: true,
      type: Object as PropType<string[]>
    }
  },
  data() {
    return {
      tag: ''
    }
  },
  computed: {
    chapters() {
      if (!this.tag) {
        return []
      }
      return TagService.getListByTag(this.tag)
    }
  },
  setup() {},
  methods: {
    // 计算标签的颜色
    calcTagType(tag: string): string {
      return TagUtils.calcTagType(tag);
    },
    handleChpaterShow(tag: string) {
      this.tag = tag
    }
  }
});
</script>

<style lang="less" scoped>
.el-tag {
  cursor: pointer;
  margin-left: 4px;
  margin-bottom: 4px;
}
</style>