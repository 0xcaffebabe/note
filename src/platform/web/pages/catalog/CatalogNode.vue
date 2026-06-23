<template>
  <div class="catalog-node">
    <!-- 分组节点: 子标题(自身有 link 则可点) + 递归子级 -->
    <template v-if="hasChildren">
      <router-link v-if="node.link" class="catalog-subhead is-link" :to="href">
        <span v-html="nameHtml"></span>
      </router-link>
      <div v-else class="catalog-subhead">
        <span v-html="nameHtml"></span>
      </div>
      <div class="catalog-children">
        <catalog-node
          v-for="(child, i) in node.chidren"
          :key="i"
          :node="child"
          :filter-text="filterText"
        />
      </div>
    </template>
    <!-- 叶子节点: 有 link 渲染为文档链接, 无 link(纯分组末端)渲染为灰字, 不产生死链 -->
    <template v-else>
      <router-link v-if="node.link" class="catalog-leaf" :to="href">
        <span v-html="nameHtml"></span>
      </router-link>
      <span v-else class="catalog-leaf is-dead">
        <span v-html="nameHtml"></span>
      </span>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import Category from '@/core/domain/Category'
import DocUtils from '@/core/util/DocUtils'
import { highlightName, safeMatch } from '@/platform/web/util/CatalogUtils'

export default defineComponent({
  // 命名以支持模板内递归调用 <catalog-node>
  name: 'CatalogNode',
  props: {
    node: {
      type: Object as PropType<Category>,
      required: true,
    },
    filterText: {
      type: String,
      default: '',
    },
  },
  computed: {
    hasChildren(): boolean {
      return !!(this.node.chidren && this.node.chidren.length)
    },
    href(): string {
      if (!this.node.link) {
        return ''
      }
      try {
        return DocUtils.docId2HtmlPath(DocUtils.docUrl2Id(this.node.link))
      } catch {
        return ''
      }
    },
    nameHtml(): string {
      const kw = (this.filterText || '').trim()
      const hit = kw ? safeMatch(this.node, kw) : false
      return highlightName(this.node.name, kw, hit)
    },
  },
})
</script>

<style lang="less" scoped>
// 子组(子标题 + 其子级)在卡内多栏中整体不跨栏拆分, 避免标题与内容分离
.catalog-node {
  break-inside: avoid;
}

.catalog-subhead {
  display: block;
  margin: var(--spacing-sm) 0 2px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--secondary-text-color);
  text-decoration: none;

  &.is-link:hover {
    color: var(--primary-color);
  }
}

// 子级缩进 + 左侧引导线, 用嵌套天然形成层级而非靠 depth 计算
.catalog-children {
  margin-left: 2px;
  padding-left: var(--spacing-md);
  border-left: 1px solid var(--border-color);
}

.catalog-leaf {
  display: block;
  padding: 3px var(--spacing-xs);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  color: var(--main-text-color);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background-color var(--transition-fast), color var(--transition-fast);

  &:not(.is-dead):hover {
    background-color: var(--hover-bg-color);
    color: var(--primary-color);
  }

  // 无可达文档的末端节点: 非交互灰字, 不渲染死链
  &.is-dead {
    color: var(--secondary-text-color);
    cursor: default;
  }
}

// 过滤命中高亮(v-html 注入): 与 CategoryTree 同款
:deep(mark) {
  background-color: var(--primary-light-color);
  color: var(--primary-color);
  border-radius: var(--radius-sm);
}
:deep(.pinyin-hit) {
  color: var(--primary-color);
}
</style>
