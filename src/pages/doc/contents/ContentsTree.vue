<template>
  <transition-group name="list">
    <li :key="value.link" v-for="value in contentsList" class="toc-item">
      <a 
        :href="'#' + value.link" 
        @click.prevent="handleTocItemClick(value.link)" 
        :title="value.name"
        class="toc-link"
      >
        {{ value.name }}
      </a>
      <ul v-if="value.chidren.length != 0" class="toc-sublist">
        <contents-tree :contentsList="value.chidren" @item-click="handleTocItemClick" />
      </ul>
    </li>
  </transition-group>
</template>

<script lang="ts">
import Category from "@/dto/Category";
import { defineComponent, PropType  } from "vue";

export default defineComponent({
  props: {
    contentsList: {
      type: Array as PropType<Category[]>,
      required: true,
    }
  },
  emits: ['item-click'],
  methods: {
    handleTocItemClick(id: string){
      this.$emit('item-click', id);
    }
  },
  setup() {},
});
</script>

<style lang="less" scoped>
.toc-item {
  list-style: none;
  margin: 0;
  padding: 0;
}

.toc-sublist {
  padding-left: var(--spacing-md);
  margin: 0;
  list-style: none;
}

.toc-link {
  display: block;
  color: var(--secondary-text-color);
  text-decoration: none;
  font-weight: 400;
  font-size: 14px;
  padding: 6px var(--spacing-md);
  margin: 2px 0;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// 动画
.list-enter-active,
.list-leave-active {
  transition: all 0.2s ease-in;
}
.list-enter-from,
.list-leave-to {
  transition: all 0.2s ease-in;
  opacity: 0;
  transform: translateX(-10px);
}

body[theme="dark"] {
  .toc-link {
    color: var(--dark-secondary-text-color);
  }
}
</style>
