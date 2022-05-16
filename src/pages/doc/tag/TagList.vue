<template>
  <div>
    <el-tag
      v-for="item in tags"
      :key="item"
      size="mini"
      :type="calcTagType(item)"
      @click="$router.push('/tag?tag=' + item)"
      effect="dark"
      >{{ item }}</el-tag
    >
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import TagUtils from "@/pages/tag/TagUtils";

export default defineComponent({
  props: {
    tags: {
      required: true,
      type: Object as PropType<string[]>
    }
  },
  setup() {},
  methods: {
    // 计算标签的颜色
    calcTagType(tag: string): string {
      return TagUtils.calcTagType(tag);
    },
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