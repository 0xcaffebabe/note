<template>
  <el-drawer
    v-model="showDrawer"
    :size="$isMobile() ? '50%' : '44%'"
    :direction="$isMobile() ? 'btt': 'rtl'"
    :with-header="false"
    :modal="false"
    modal-penetrable
    resizable
    class="knowledge-network-drawer"
    title="知识网络"
    @close="$emit('close')"
    :lock-scroll="false"
  >
    <KnowledgeNetworkContent
      ref="contentRef"
      :doc="doc"
      @close="showDrawer = false"
    />
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import KnowledgeNetworkContent from "./KnowledgeNetworkContent.vue";

export default defineComponent({
  components: {
    KnowledgeNetworkContent
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
  },
});
</script>

<style lang="less">
.el-drawer__body {
  padding: 0;
}
</style>