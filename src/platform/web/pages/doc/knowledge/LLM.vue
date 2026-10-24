<template>
  <el-dialog
    v-model="visible"
    class="knowledge-assistant-dialog"
    title="知识助手"
    align-center
    width="min(1200px, 94vw)"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    :z-index="dialogZIndex"
    @close="$emit('close')"
  >
    <DocumentQA v-if="visible" :doc="doc" @open-connection="visible = false" />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { KnowledgeAssistantHandle } from '@/platform/web/app/KnowledgeAssistantHandle'
import DocumentQA from './DocumentQA.vue'

defineProps<{ doc?: string }>()
defineEmits<{ close: [] }>()
const visible = ref(false)
const popupLayer = getComputedStyle(document.documentElement).getPropertyValue('--z-popup')
const dialogZIndex = Number.parseInt(popupLayer, 10) || undefined

/** 应用层可重复唤起弹窗；会话运行和持久化由 bridge 独立管理。 */
function show(): void {
  visible.value = true
}

defineExpose<KnowledgeAssistantHandle>({ show })
</script>

<style lang="less">
.el-dialog.knowledge-assistant-dialog {
  --assistant-height: min(850px, 88dvh);
  --assistant-sidebar-width: 240px;
  --assistant-message-width: 760px;
  height: var(--assistant-height);
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: auto;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  background: var(--card-bg-color);
  box-shadow: var(--shadow-lg);

  > .el-dialog__header {
    flex: 0 0 auto;
    margin: 0;
    padding: var(--spacing-md) var(--spacing-lg);
    border-bottom: 1px solid var(--border-color);
  }
  .el-dialog__title {
    font-size: var(--font-size-lg);
    color: var(--main-text-color);
    font-weight: 600;
  }
  .el-dialog__headerbtn {
    top: var(--spacing-sm);
    right: var(--spacing-sm);
    width: var(--site-control-size);
    height: var(--site-control-size);
  }
  > .el-dialog__body {
    flex: 1;
    min-height: 0;
    padding: 0;
    overflow: hidden;
  }
}
@media (max-width: @bp-mobile) {
  .el-dialog.knowledge-assistant-dialog {
    --assistant-height: calc(100dvh - var(--spacing-md));
    width: calc(100vw - var(--spacing-md));
    max-width: none;
    > .el-dialog__header {
      padding: var(--spacing-md);
    }
  }
}
</style>
