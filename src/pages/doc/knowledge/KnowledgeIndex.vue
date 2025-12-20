<template>
  <el-drawer
    v-model="showDrawer"
    :size="$isMobile() ? '50%' : '44%'"
    :direction="$isMobile() ? 'btt': 'rtl'"
    :with-header="false"
    :modal="false"
    modal-penetrable
    resizable
    class="knowledge-index-drawer"
    title="知识索引"
    @close="$emit('close')"
    :lock-scroll="false"
  >
    <KnowledgeIndexContent
      ref="contentRef"
      :doc="doc"
      @close="showDrawer = false"
      @navigate="handleNavigate"
    />
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import KnowledgeIndexContent from "./KnowledgeIndexContent.vue";

export default defineComponent({
  components: {
    KnowledgeIndexContent
  },
  props: {
    doc: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      showDrawer: false,
    };
  },
  methods: {
    show() {
      this.showDrawer = true;
    },
    init() {
      (this.$refs.contentRef as any)?.init();
    },
    handleNavigate(path: string) {
      this.$emit('navigate', path);
      this.showDrawer = false;
    }
  },
});
</script>

<style lang="less">
.el-drawer__body {
  padding: 0;
}
</style>