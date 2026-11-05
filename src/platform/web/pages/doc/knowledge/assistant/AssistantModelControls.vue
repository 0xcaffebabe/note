<template>
  <label class="qa-select-field">
    <span class="qa-sr-only">模型</span>
    <select
      v-model="modelKey"
      aria-label="模型"
      :disabled="busy || !hasModels"
      @change="emit('selectModel')"
    >
      <option v-if="!hasModels" value="">选择模型</option>
      <optgroup v-for="group in groups" :key="group.id" :label="group.name">
        <option v-for="item in group.models" :key="item.key" :value="item.key">
          {{ item.name === item.id ? item.id : `${item.name} · ${item.id}` }}
        </option>
      </optgroup>
    </select>
  </label>
  <label class="qa-select-field qa-effort">
    <span class="qa-sr-only">思考强度</span>
    <select
      v-model="effort"
      aria-label="思考强度"
      @change="emit('selectEffort')"
      :disabled="busy || !hasProviders || efforts.length <= 1"
    >
      <option v-for="value in efforts" :key="value" :value="value">
        {{ effortLabels[value] }}
      </option>
    </select>
  </label>
</template>

<script setup lang="ts">
import type { AiEffort } from '@/core/ports/AiBridgePort'
import type { AssistantModelGroup } from './AssistantModelOption'

defineProps<{
  busy: boolean
  groups: AssistantModelGroup[]
  hasModels: boolean
  hasProviders: boolean
  efforts: AiEffort[]
}>()
const modelKey = defineModel<string>('modelKey', { required: true })
const effort = defineModel<AiEffort>('effort', { required: true })
const emit = defineEmits<{
  selectModel: []
  selectEffort: []
}>()
const effortLabels: Record<AiEffort, string> = {
  default: '默认强度',
  none: '不思考',
  minimal: '最低强度',
  low: '低强度',
  medium: '中等强度',
  high: '高强度',
  xhigh: '更高强度',
  max: '最高强度',
  ultra: '超高强度',
}
</script>

<style scoped lang="less">
@import './assistantShared.less';

.qa-select-field {
  min-width: 0;
}
.qa-select-field select {
  max-width: 220px;
  width: 100%;
  padding: var(--spacing-xs);
  font-size: var(--font-size-xs);
  border: 0;
  border-radius: var(--radius-md);
  background: var(--card-bg-color);
  text-overflow: ellipsis;
}
.qa-effort select {
  color: var(--secondary-text-color);
  max-width: 100px;
}
@media (max-width: @bp-mobile) {
  .qa-select-field select {
    max-width: 160px;
  }
  .qa-effort select {
    max-width: 82px;
  }
}
</style>
