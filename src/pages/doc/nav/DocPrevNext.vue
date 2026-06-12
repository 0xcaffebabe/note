<template>
  <nav class="doc-prev-next" v-if="prev || next" aria-label="文档翻页导航">
    <router-link v-if="prev" class="pn-card prev" :to="docLink(prev)">
      <span class="pn-label">‹ 上一篇</span>
      <span class="pn-title">{{ prev.name }}</span>
    </router-link>
    <span v-else class="pn-placeholder"></span>
    <router-link v-if="next" class="pn-card next" :to="docLink(next)">
      <span class="pn-label">下一篇 ›</span>
      <span class="pn-title">{{ next.name }}</span>
    </router-link>
  </nav>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Category from '@/dto/Category'
import CategoryService from '@/service/CategoryService'
import DocUtils from '@/util/DocUtils'

export default defineComponent({
  props: {
    doc: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      orderedList: [] as Category[],
    }
  },
  computed: {
    currentIndex(): number {
      return this.orderedList.findIndex(c => DocUtils.docUrl2Id(c.link) == this.doc)
    },
    prev(): Category | null {
      return this.currentIndex > 0 ? this.orderedList[this.currentIndex - 1] : null
    },
    next(): Category | null {
      return this.currentIndex >= 0 && this.currentIndex < this.orderedList.length - 1
        ? this.orderedList[this.currentIndex + 1]
        : null
    },
  },
  methods: {
    docLink(category: Category): string {
      const path = DocUtils.docId2HtmlPath(DocUtils.docUrl2Id(category.link))
      return this.$route.path.startsWith('/m/') ? '/m' + path : path
    },
  },
  async created() {
    this.orderedList = await CategoryService.getOrderedDocList()
  },
})
</script>

<style lang="less" scoped>
.doc-prev-next {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-md);
  margin: var(--spacing-xl) 0 var(--spacing-md);
}

.pn-placeholder {
  flex: 1;
}

.pn-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background-color: var(--card-bg-color);
  text-decoration: none;
  min-width: 0;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast);

  &:hover {
    border-color: var(--primary-color);
    box-shadow: var(--shadow-sm);
    transform: translateY(-1px);
  }

  &.next {
    text-align: right;
  }
}

.pn-label {
  font-size: var(--font-size-xs);
  color: var(--secondary-text-color);
}

.pn-title {
  font-size: var(--font-size-base);
  color: var(--primary-color);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
