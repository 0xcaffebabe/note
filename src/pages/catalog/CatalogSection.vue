<template>
  <section class="catalog-card">
    <!-- 卡头: 分类自身有概述文档(link 非空)时整行可点跳概述, 否则纯展示 -->
    <router-link v-if="category.link" class="catalog-card-head" :to="headHref">
      <span v-if="emoji" class="catalog-card-emoji">{{ emoji }}</span>
      <span class="catalog-card-name" v-html="nameHtml"></span>
      <span class="catalog-card-count">{{ docCount }}</span>
    </router-link>
    <div v-else class="catalog-card-head">
      <span v-if="emoji" class="catalog-card-emoji">{{ emoji }}</span>
      <span class="catalog-card-name" v-html="nameHtml"></span>
      <span class="catalog-card-count">{{ docCount }}</span>
    </div>

    <div class="catalog-card-body">
      <catalog-node
        v-for="(child, i) in category.chidren"
        :key="i"
        :node="child"
        :filter-text="filterText"
      />
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import Category from '@/dto/Category'
import DocUtils from '@/util/DocUtils'
import CatalogNode from './CatalogNode.vue'
import { leadingEmoji, stripEmoji, countDocs, highlightName, safeMatch } from '@/util/CatalogUtils'

export default defineComponent({
  components: { CatalogNode },
  props: {
    category: {
      type: Object as PropType<Category>,
      required: true,
    },
    filterText: {
      type: String,
      default: '',
    },
  },
  computed: {
    emoji(): string {
      return leadingEmoji(this.category.name)
    },
    displayName(): string {
      // 卡头 emoji 单独成块展示, 名称去掉前缀 emoji
      return stripEmoji(this.category.name) || this.category.name
    },
    docCount(): number {
      return countDocs(this.category)
    },
    headHref(): string {
      if (!this.category.link) {
        return ''
      }
      try {
        return DocUtils.docId2HtmlPath(DocUtils.docUrl2Id(this.category.link))
      } catch {
        return ''
      }
    },
    nameHtml(): string {
      const kw = (this.filterText || '').trim()
      const hit = kw ? safeMatch(this.category, kw) : false
      return highlightName(this.displayName, kw, hit)
    },
  },
})
</script>

<style lang="less" scoped>
.catalog-card {
  // 全宽分区卡, 复用 qa-card 视觉语言(纵向间距由父级 gap 管)
  background-color: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--card-pad);
  box-shadow: var(--shadow-sm);
  // 速跳/深链定位时给全局顶栏留出空间
  scroll-margin-top: var(--spacing-3xl);
}

.catalog-card-head {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0 0 var(--spacing-sm);
  color: var(--main-text-color);
  text-decoration: none;
}

a.catalog-card-head:hover .catalog-card-name {
  color: var(--primary-color);
}

.catalog-card-emoji {
  flex: none;
  font-size: var(--font-size-lg);
  line-height: 1;
}

.catalog-card-name {
  flex: 1;
  min-width: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color var(--transition-fast);
}

.catalog-card-count {
  flex: none;
  color: var(--secondary-text-color);
  font-size: var(--font-size-xs);
  background-color: var(--hover-bg-color);
  border-radius: 999px;
  padding: 1px 8px;
}

// 叶子在全宽卡内用 CSS 多栏紧凑铺排; 子组(CatalogNode)整体不跨栏拆分
.catalog-card-body {
  column-width: 260px;
  column-gap: var(--spacing-xl);
}

// 卡头名称命中高亮(v-html 注入)
:deep(mark) {
  background-color: var(--primary-light-color);
  color: var(--primary-color);
  border-radius: var(--radius-sm);
}
:deep(.pinyin-hit) {
  color: var(--primary-color);
}
</style>
