<template>
  <div class="chapter-zone" v-show="chapters && chapters.length != 0">
      <el-table :data="chapters" style="width: 100%">
        <el-table-column label="匹配文章">
          <template #default="scope">
            <el-icon><timer /></el-icon>
            <span style="margin-left: 10px">
              <el-link type="primary" @click="$router.push('/doc/' + docUrl2Id(scope.row))" @contextmenu="handleDocLinkContextMenu(scope.row, $event)">{{docUrl2Id(scope.row)}}</el-link>
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <!-- <link-popover ref="linkPopover" /> -->
</template>

<script lang="ts" setup>
// import LinkPopover from "../doc/LinkPopover.vue";
</script>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import {Timer} from '@element-plus/icons-vue'
import DocUtils from "@/util/DocUtils";

export default defineComponent({
  components: {
    Timer
  },
  props: {
    chapters: {
      required: true,
      type: Object as PropType<string[]>
    }
  },
  setup() {
    
  },
  methods: {
    docUrl2Id(url: string): string{
      return DocUtils.docUrl2Id(url);
    },
    handleDocLinkContextMenu(docLink: string, event: MouseEvent) {
      (this.$refs.linkPopover as any).show(docLink, event.clientX, event.clientY);
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }
})
</script>

<style lang="less" scoped>
.chapter-zone {
  // max-width: 60%;
  text-align: center;
  margin: 0 auto;
}
</style>