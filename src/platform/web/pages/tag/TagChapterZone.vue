<template>
  <div class="chapter-zone" v-if="items.length">
    <h2 class="chapter-title">匹配文章<span class="chapter-count">{{ items.length }}</span></h2>
    <ul class="chapter-list">
      <li v-for="it in items" :key="it.href">
        <!-- router-link 走规范 .html 地址, 保留 Ctrl/中键新标签页 -->
        <router-link :to="it.href" class="chapter-link">
          <span v-if="it.breadcrumb" class="chapter-crumb" :title="it.breadcrumb">{{ it.breadcrumb }}</span>
          <span class="chapter-name" :title="it.name">{{ it.name }}</span>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import DocUtils from '@/core/util/DocUtils'

interface MatchedItem {
  href: string
  name: string
  breadcrumb: string // 所属分类路径(去末段) 区分同名文件
}

export default defineComponent({
  props: {
    chapters: {
      required: true,
      type: Array as PropType<string[]>,
    },
  },
  computed: {
    items(): MatchedItem[] {
      return this.chapters.map((c) => {
        const id = DocUtils.docUrl2Id(c)
        // 还原真实路径取末段为名, 中间各段作面包屑(辨识 概述/index 这类同名文件)
        const segments = DocUtils.docId2Segments(id)
        return {
          href: DocUtils.docId2HtmlPath(id),
          name: segments[segments.length - 1],
          breadcrumb: segments.slice(0, -1).join(' / '),
        }
      })
    },
  },
})
</script>

<style lang="less" scoped>
// 无卡片外壳: 由父级(TagListPage 数据卡 / TagList 悬浮层)决定容器, 本组件只产出标题 + 列表
.chapter-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--main-text-color);
  margin: 0 0 var(--spacing-md);
  // 复用方(TagList 悬浮层)是 220px 滚动容器时标题吸顶常驻; 卡片场景无滚动则无副作用
  position: sticky;
  top: 0;
  background-color: var(--card-bg-color);
  padding-bottom: var(--spacing-xs);
}
.chapter-count {
  color: var(--secondary-text-color);
  font-weight: 400;
  font-size: var(--font-size-sm);
  margin-left: 6px;
}
.chapter-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.chapter-list > li {
  min-width: 0; // 允许子项在受限宽度(如 400px 悬浮层)内收缩, 使面包屑 ellipsis 生效
}
.chapter-link {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: 7px var(--spacing-sm);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: background-color var(--transition-fast);

  &:hover {
    background-color: var(--hover-bg-color);

    .chapter-name {
      color: var(--primary-color);
    }
  }
}
.chapter-crumb {
  font-size: var(--font-size-xs);
  color: var(--secondary-text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chapter-name {
  font-size: var(--font-size-base);
  color: var(--main-text-color);
  transition: color var(--transition-fast);
}
</style>
