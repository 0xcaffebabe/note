<template>
  <div class="quick-access" v-if="recentList.length > 0 || categoryList.length > 0">
    <div class="qa-card" v-if="recentList.length > 0">
      <h3 class="qa-title">最近更新</h3>
      <a
        v-for="item in recentList"
        :key="item.docId"
        :href="item.href"
        class="qa-row"
        @click.prevent="$router.push(item.href)"
      >
        <span class="qa-name">{{ item.name }}</span>
        <span class="qa-date">{{ item.dateLabel }}</span>
      </a>
    </div>
    <div class="qa-card" v-if="categoryList.length > 0">
      <h3 class="qa-title">知识分类</h3>
      <div class="qa-grid">
        <a
          v-for="cat in categoryList"
          :key="cat.name"
          :href="cat.href"
          class="qa-cat"
          @click.prevent="cat.href && $router.push(cat.href)"
        >
          <span class="qa-cat-name">{{ cat.name }}</span>
          <span class="qa-cat-count">{{ cat.count }}</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import api from '@/api'
import Category from '@/dto/Category'
import CategoryService from '@/service/CategoryService'
import DocUtils from '@/util/DocUtils'

interface RecentItem {
  docId: string
  name: string
  href: string
  dateLabel: string
}

interface CategoryEntry {
  name: string
  count: number
  href: string
}

const RECENT_COUNT = 8

function relativeDateLabel(date: string): string {
  const diffMs = Date.now() - new Date(date).getTime()
  const days = Math.floor(diffMs / (24 * 3600 * 1000))
  if (isNaN(days)) {
    return ''
  }
  if (days <= 0) {
    return '今天'
  }
  if (days < 30) {
    return `${days} 天前`
  }
  if (days < 365) {
    return `${Math.floor(days / 30)} 个月前`
  }
  return `${Math.floor(days / 365)} 年前`
}

export default defineComponent({
  data() {
    return {
      recentList: [] as RecentItem[],
      categoryList: [] as CategoryEntry[],
    }
  },
  async created() {
    // 最近更新文档
    try {
      const commitDocList = await api.getDescCommitDocList()
      // 数据源中的key本身就是docId(层级以'-'连接) 不要再当URL转换
      this.recentList = commitDocList.slice(0, RECENT_COUNT).map(([docId, commit]) => {
        // 经docId2Url还原真实路径再取末段 正确处理'@@'转义
        const segments = DocUtils.docId2Url(docId).replace(/\.md$/, '').split('/')
        return {
          docId,
          name: segments[segments.length - 1],
          href: DocUtils.docId2HtmlPath(docId),
          dateLabel: relativeDateLabel(commit.date),
        }
      })
    } catch { /* 数据缺失时不展示该卡片 */ }
    // 顶层分类入口
    try {
      const tree = await CategoryService.getCompiledCategoryList()
      const countDocs = (cat: Category): number => {
        let count = cat.link ? 1 : 0
        for (const child of cat.chidren || []) {
          count += countDocs(child)
        }
        return count
      }
      const firstDoc = (cat: Category): string => {
        if (cat.link) {
          return DocUtils.docId2HtmlPath(DocUtils.docUrl2Id(cat.link))
        }
        for (const child of cat.chidren || []) {
          const found = firstDoc(child)
          if (found) {
            return found
          }
        }
        return ''
      }
      this.categoryList = tree
        .filter(cat => cat.name && cat.name != '首页')
        .map(cat => ({
          name: cat.name,
          count: countDocs(cat),
          href: firstDoc(cat),
        }))
    } catch { /* 数据缺失时不展示该卡片 */ }
  },
})
</script>

<style lang="less" scoped>
.quick-access {
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: var(--spacing-lg);
  max-width: 1080px;
  margin: 0 auto var(--spacing-xl);
  padding: 0 var(--spacing-lg);
}

.qa-card {
  background-color: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.qa-title {
  margin: 0 0 var(--spacing-md);
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--main-text-color);
}

.qa-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: 7px var(--spacing-sm);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: background-color var(--transition-fast);

  &:hover {
    background-color: var(--hover-bg-color);

    .qa-name {
      color: var(--primary-color);
    }
  }
}

.qa-name {
  color: var(--main-text-color);
  font-size: var(--font-size-base);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color var(--transition-fast);
}

.qa-date {
  color: var(--secondary-text-color);
  font-size: var(--font-size-xs);
  white-space: nowrap;
}

.qa-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--spacing-sm);
}

.qa-cat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: border-color var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast);

  &:hover {
    border-color: var(--primary-color);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }
}

.qa-cat-name {
  color: var(--main-text-color);
  font-size: var(--font-size-base);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.qa-cat-count {
  color: var(--secondary-text-color);
  font-size: var(--font-size-xs);
  background-color: var(--hover-bg-color);
  border-radius: 10px;
  padding: 1px 8px;
}

@media (max-width: 860px) {
  .quick-access {
    grid-template-columns: 1fr;
  }
}
</style>
