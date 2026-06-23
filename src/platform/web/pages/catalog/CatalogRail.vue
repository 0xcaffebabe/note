<template>
  <nav class="catalog-rail-inner" aria-label="分类速跳">
    <button
      v-for="s in sections"
      :key="s.slug"
      type="button"
      class="rail-item"
      :class="{ 'is-active': s.slug === activeSlug }"
      :title="s.name"
      @click="$emit('jump', s.slug)"
    >
      <span class="rail-name">{{ s.name }}</span>
      <span class="rail-count">{{ s.count }}</span>
    </button>
  </nav>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

interface SectionMeta {
  slug: string
  name: string
  count: number
}

export default defineComponent({
  props: {
    sections: {
      type: Array as PropType<SectionMeta[]>,
      required: true,
    },
    activeSlug: {
      type: String,
      default: '',
    },
  },
  emits: ['jump'],
})
</script>

<style lang="less" scoped>
.catalog-rail-inner {
  display: flex;
  flex-direction: column;
  gap: 2px;
  // 速跳栏自身可滚动, 分类增多时不撑破粘性区域
  max-height: calc(100vh - 2 * var(--spacing-2xl));
  overflow-y: auto;
}

.rail-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  width: 100%;
  padding: 6px var(--spacing-sm);
  border: 0;
  border-left: 3px solid transparent;
  border-radius: var(--radius-sm);
  background: none;
  color: var(--secondary-text-color);
  font-size: var(--font-size-sm);
  text-align: left;
  cursor: pointer;
  transition: background-color var(--transition-fast), color var(--transition-fast);

  &:hover {
    background-color: var(--hover-bg-color);
    color: var(--main-text-color);
  }

  // 当前可视分区高亮: 复用 CategoryTree .is-active 的主色竖条配方
  &.is-active {
    color: var(--primary-color);
    background-color: var(--primary-light-color);
    border-left-color: var(--primary-color);
    font-weight: 600;
  }
}

.rail-name {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rail-count {
  flex: none;
  font-size: var(--font-size-xs);
  color: var(--secondary-text-color);
}
</style>
