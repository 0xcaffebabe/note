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
    @close="$emit('close')"
    :lock-scroll="false"
  >
    <div class="net-panel">
      <div class="net-panel-header">
        <span class="panel-title">知识网络</span>
        <span class="panel-doc" :title="docName">{{ docName }}</span>
        <button type="button" class="panel-close" title="关闭 (Esc)" aria-label="关闭知识网络" @click="showDrawer = false">
          <el-icon><close /></el-icon>
        </button>
      </div>
      <KnowledgeNetworkContent
        ref="contentRef"
        class="net-panel-body"
        :doc="doc"
        @close="showDrawer = false"
      />
    </div>
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Close } from "@element-plus/icons-vue";
import KnowledgeNetworkContent from "./KnowledgeNetworkContent.vue";
import DocUtils from "@/util/DocUtils";

export default defineComponent({
  components: {
    KnowledgeNetworkContent,
    Close,
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
  computed: {
    // 展示名经docId2Url还原(字面'-'转义为@@ 不能直接split)
    docName(): string {
      try {
        return (DocUtils.docId2Url(this.doc).split('/').pop() || '').replace(/\.md$/i, '');
      } catch {
        return this.doc;
      }
    }
  },
  methods: {
    show() {
      this.showDrawer = true;
    },
    init() {
      (this.$refs.contentRef as any)?.init();
    }
  },
});
</script>

<style lang="less">
.el-drawer__body {
  padding: 0;
}
</style>

<style lang="less" scoped>
.net-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.net-panel-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
  padding: 8px var(--spacing-sm) 8px var(--spacing-md);
  border-bottom: 1px solid var(--divider-color);
  background-color: var(--card-bg-color);
}

.panel-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--main-text-color);
  flex-shrink: 0;
}

.panel-doc {
  flex: 1;
  min-width: 0;
  font-size: var(--font-size-sm);
  color: var(--secondary-text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-close {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: none;
  border-radius: var(--radius-sm);
  color: var(--secondary-text-color);
  cursor: pointer;
  transition: background-color var(--transition-fast), color var(--transition-fast);

  &:hover {
    background-color: var(--hover-bg-color);
    color: var(--main-text-color);
  }
}

.net-panel-body {
  flex: 1;
  min-height: 0;
}
</style>
