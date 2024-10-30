<template>
  <div class="chapter-zone" v-if="chapters && chapters.length != 0">
    <div>
      <p>匹配文章</p>
      <div v-for="c in chapters" :key="c" class="item">
        <span style="margin-left: 10px">
          <el-link type="primary" @click="$router.push('/doc/' + docUrl2Id(c))"
            @contextmenu="handleDocLinkContextMenu(c, $event)">{{ extractDocName(c) }}</el-link>
        </span>
      </div>
    </div>
  </div>
  <!-- <link-popover ref="linkPopover" /> -->
</template>

<script lang="ts" setup>
// import LinkPopover from "../doc/LinkPopover.vue";
</script>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Timer } from '@element-plus/icons-vue'
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
  methods: {
    extractDocName(url: string) {
      const arr = DocUtils.docUrl2Id(url).split("-");
      return arr[arr.length - 1];
    },
    docUrl2Id(url: string): string {
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
.item {
  padding: 4px 0;
  display: inline-block;
  .el-link {
    font-size: 20px;
  }
}
</style>