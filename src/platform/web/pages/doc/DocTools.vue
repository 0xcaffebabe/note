<template>
  <div class="document-actions" role="group" aria-label="文档工具">
    <p class="document-actions-title">文档工具</p>
    <button
      v-for="action in visibleActions"
      :key="action.action"
      type="button"
      class="document-action"
      :class="{ divided: action.divided }"
      @click="dispatch(action.action)"
    >
      <el-icon class="action-icon" :class="'tone-' + action.type"><component :is="action.icon" /></el-icon>
      <span class="action-name">{{ action.name }}</span>
      <span v-if="action.key && !isTouch" class="action-keys"><kbd>Alt</kbd><kbd>{{ action.key }}</kbd></span>
    </button>
  </div>
  <el-drawer v-model="showSettings" title="更多设置" :lock-scroll="false" size="300px" class="setting-drawer" append-to-body>
    <div class="font-setting">
      <span class="setting-label">字体大小</span>
      <el-slider v-model="fontSize" :min="isMobile ? 16 : 14" :max="isMobile ? 48 : 24" :step="1" aria-label="字体大小" @input="handleFontSizeChange" />
      <span class="setting-value">{{ fontSize }}px</span>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type Component } from 'vue';
import { Share, Connection, DataAnalysis, MagicStick, Position, CopyDocument, EditPen, Refresh, Setting } from '@element-plus/icons-vue';
import { isMobile, isTouch, isFull } from '@/platform/web/composables/useBreakpoint';
import { useServices } from '@/platform/web/app/useServices';

type DocAction = 'showMindGraph' | 'showKnowledgeNetwork' | 'showKnowledgeReviewer' | 'showLlm' | 'copyDocPath' | 'copyDocContent' | 'openInEditor' | 'handleRandomReview';
type ActionType = DocAction | 'showMoreSetting';
interface Action {
  name: string;
  type: string;
  action: ActionType;
  icon: Component;
  key?: string;
  divided?: boolean;
  fullOnly?: boolean;
}

const emit = defineEmits(['select', 'showMindGraph', 'showKnowledgeNetwork', 'showKnowledgeReviewer', 'showLlm', 'copyDocPath', 'copyDocContent', 'openInEditor', 'handleRandomReview']);
const { configService } = useServices();
const showSettings = ref(false);
const fontSize = ref(Number(configService.get('fontSize')) || 16);
const actions: Action[] = [
  { name: '思维导图', type: 'success', action: 'showMindGraph', icon: Share, key: 'l' },
  { name: '知识网络', type: 'warning', action: 'showKnowledgeNetwork', icon: Connection, key: 'k' },
  { name: '知识回顾', type: 'primary', action: 'showKnowledgeReviewer', icon: DataAnalysis, key: 'r' },
  { name: '知识助手', type: 'warning', action: 'showLlm', icon: MagicStick, key: 'i' },
  { name: '路径复制', type: 'success', action: 'copyDocPath', icon: Position, key: 'c', divided: true },
  { name: '知识复制', type: 'warning', action: 'copyDocContent', icon: CopyDocument, key: 'x' },
  { name: '在VSC打开', type: 'danger', action: 'openInEditor', icon: EditPen, key: 'v', fullOnly: true },
  { name: '随机复习', type: 'primary', action: 'handleRandomReview', icon: Refresh, key: 'n' },
  { name: '更多设置', type: 'info', action: 'showMoreSetting', icon: Setting, divided: true },
];
const visibleActions = computed(() => actions.filter(action => !action.fullOnly || isFull.value));

function dispatch(action: ActionType) {
  emit('select');
  if (action === 'showMoreSetting') showSettings.value = true;
  else emit(action);
}

function handleKeyDown(event: KeyboardEvent) {
  const target = event.target;
  const typing = target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])');
  if (isTouch.value || event.defaultPrevented || event.repeat || typing || !event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const key = event.key.toLowerCase();
  const code = event.code.toLowerCase().replace('key', '');
  const action = visibleActions.value.find(action => action.key && [key, code].includes(action.key));
  if (action) {
    event.preventDefault();
    dispatch(action.action);
  }
}

function handleFontSizeChange(value: number) {
  const content = document.querySelector<HTMLElement>('.main.markdown-section');
  if (content) content.style.fontSize = value + 'px';
  configService.set('fontSize', value);
}

onMounted(() => document.addEventListener('keydown', handleKeyDown));
onBeforeUnmount(() => document.removeEventListener('keydown', handleKeyDown));
</script>

<style lang="less" scoped>
.document-actions {
  padding-bottom: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color);
}
.document-actions-title {
  margin: var(--spacing-sm);
  color: var(--secondary-text-color);
  font-size: var(--font-size-sm);
}
.document-action {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  min-height: var(--site-control-size);
  padding: var(--spacing-sm);
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--main-text-color);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--transition-fast);
  &:hover { background: var(--hover-bg-color); }
  &.divided { border-top: 1px solid var(--border-color); border-radius: 0; }
}
.action-icon {
  flex-shrink: 0;
  font-size: var(--font-size-lg);
  &.tone-success { color: var(--success-color); }
  &.tone-warning { color: var(--warning-color); }
  &.tone-primary { color: var(--primary-color); }
  &.tone-danger { color: var(--danger-color); }
  &.tone-info { color: var(--secondary-text-color); }
}
.action-name { flex: 1; }
.action-keys {
  display: flex;
  gap: var(--spacing-xs);
  flex-shrink: 0;
  kbd {
    padding-inline: var(--spacing-xs);
    border: 1px solid var(--border-color);
    border-bottom-width: 2px;
    border-radius: var(--radius-sm);
    background: var(--hover-bg-color);
    color: var(--secondary-text-color);
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
  }
}
.font-setting {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  .setting-label, .setting-value { flex-shrink: 0; }
  .setting-label { color: var(--secondary-text-color); }
  .setting-value { color: var(--primary-color); }
}
</style>
