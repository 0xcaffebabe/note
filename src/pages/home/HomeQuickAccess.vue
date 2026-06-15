<template>
  <div class="quick-access" v-if="recentList.length > 0 || categoryList.length > 0 || tagList.length > 0">
    <div class="qa-card qa-card-recent" v-if="recentList.length > 0">
      <h2 class="qa-title">最近更新</h2>
      <!-- router-link 保留真实 href + 修饰键(Ctrl/中键新标签页) -->
      <router-link
        v-for="item in recentList"
        :key="item.docId"
        :to="item.href"
        class="qa-row"
      >
        <span class="qa-row-main">
          <!-- 面包屑在前: 同名文件(概述/index)靠所属分类区分 -->
          <span v-if="item.breadcrumb" class="qa-crumb" :title="item.breadcrumb">{{ item.breadcrumb }}</span>
          <span class="qa-name" :title="item.name">{{ item.name }}</span>
        </span>
        <!-- title 显示绝对日期 -->
        <span class="qa-date" :title="item.fullDate">{{ item.dateLabel }}</span>
      </router-link>
    </div>
    <div class="qa-card qa-card-category" v-if="categoryList.length > 0">
      <h2 class="qa-title">知识分类</h2>
      <div class="qa-grid">
        <!-- href 非空 -> 真实链接(router-link); 为空 -> 非交互展示, 不渲染死链 -->
        <router-link
          v-for="cat in linkedCategories"
          :key="cat.name"
          :to="cat.href"
          class="qa-cat"
        >
          <span class="qa-cat-name" :title="cat.name">{{ cat.name }}</span>
          <span class="qa-cat-count">{{ cat.count }}</span>
        </router-link>
        <div
          v-for="cat in staticCategories"
          :key="cat.name"
          class="qa-cat qa-cat-static"
        >
          <span class="qa-cat-name" :title="cat.name">{{ cat.name }}</span>
          <span class="qa-cat-count">{{ cat.count }}</span>
        </div>
      </div>
    </div>
    <div class="qa-card qa-card-tag" v-if="tagList.length > 0">
      <h2 class="qa-title">热门标签</h2>
      <div class="qa-tags">
        <!-- /tag.html?tag=xx 落点: TagListPage 读 query.tag 预选该标签并列出关联文档 -->
        <router-link
          v-for="tag in tagList"
          :key="tag.name"
          :to="{ path: '/tag.html', query: { tag: tag.name } }"
          class="qa-tag"
          :title="`${tag.name}(${tag.count})`"
        >
          {{ tag.name }}
          <span class="qa-tag-count">{{ tag.count }}</span>
        </router-link>
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
  breadcrumb: string // 所属分类路径(去末段) 区分同名文件
  href: string
  dateLabel: string // 相对时间
  fullDate: string // 绝对日期(title/无障碍)
}

interface CategoryEntry {
  name: string
  count: number
  href: string
}

interface TagEntry {
  name: string
  count: number
}

const RECENT_COUNT = 8
const TAG_COUNT = 12

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

// 绝对日期(本地化短格式) 解析失败返回空串(不渲染 title)
function absoluteDateLabel(date: string): string {
  const d = new Date(date)
  if (isNaN(d.getTime())) {
    return ''
  }
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export default defineComponent({
  data() {
    return {
      recentList: [] as RecentItem[],
      categoryList: [] as CategoryEntry[],
      tagList: [] as TagEntry[],
    }
  },
  computed: {
    // 有可达文档的分类(router-link)
    linkedCategories(): CategoryEntry[] {
      return this.categoryList.filter(c => c.href)
    },
    // 无可达文档的分类(非交互展示 不渲染死链)
    staticCategories(): CategoryEntry[] {
      return this.categoryList.filter(c => !c.href)
    },
  },
  async created() {
    // 最近更新文档
    try {
      const commitDocList = await api.getDescCommitDocList()
      // 数据源按提交时间升序(最旧在前/最新在后) 取末尾 RECENT_COUNT 条并反转 使最新更新排在最前
      // 数据源中的key本身就是docId(层级以'-'连接) 不要再当URL转换
      this.recentList = commitDocList.slice(-RECENT_COUNT).reverse().map(([docId, commit]) => {
        // 经docId2Url还原真实路径再取末段 正确处理'@@'转义
        const segments = DocUtils.docId2Url(docId).replace(/\.md$/, '').split('/')
        return {
          docId,
          name: segments[segments.length - 1],
          // 中间各段(去末段)作面包屑 docId2Url不带前导'/' 故无空首段
          breadcrumb: segments.slice(0, -1).join(' / '),
          href: DocUtils.docId2HtmlPath(docId),
          dateLabel: relativeDateLabel(commit.date),
          fullDate: absoluteDateLabel(commit.date),
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
    // 热门标签: 按关联文档数降序取前 TAG_COUNT
    try {
      const tagMapping = await api.getTagMapping()
      this.tagList = tagMapping
        .map(([name, docs]) => ({ name, count: docs.length }))
        .sort((a, b) => b.count - a.count)
        .slice(0, TAG_COUNT)
    } catch { /* 数据缺失时不展示该卡片 */ }
  },
})
</script>

<style lang="less" scoped>
.quick-access {
  // 最近更新 + 知识分类 一行(5/7), 热门标签单独跨整行
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: var(--spacing-lg);
  max-width: var(--home-max);
  margin: 0 auto; // 父级 gap 管纵向间距
  padding: 0 var(--content-pad); // 与 Banner/Statistic 同一横向内边距令牌, 三块边缘对齐
}

.qa-card-tag {
  grid-column: 1 / -1; // 跨满整行
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

.qa-row-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0; // 允许子项 ellipsis 生效
}

.qa-crumb {
  color: var(--secondary-text-color);
  font-size: var(--font-size-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

// 无可达文档的分类: 非交互展示 不抬升不变色不改鼠标态
.qa-cat-static {
  cursor: default;

  &:hover {
    border-color: var(--border-color);
    transform: none;
    box-shadow: none;
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
  border-radius: 999px; // 胶囊形
  padding: 1px 8px;
}

.qa-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

// 复用 qa-cat-count 胶囊风格: hover 底色 + 圆角 + xs 字号
.qa-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  background-color: var(--hover-bg-color);
  color: var(--main-text-color);
  font-size: var(--font-size-xs);
  border-radius: 999px; // 胶囊形
  text-decoration: none;
  transition: background-color var(--transition-fast), color var(--transition-fast);

  &:hover {
    background-color: var(--primary-color);
    color: #fff;

    .qa-tag-count {
      color: #fff;
    }
  }
}

.qa-tag-count {
  color: var(--secondary-text-color);
  transition: color var(--transition-fast);
}

@media (max-width: @bp-mobile) {
  .quick-access {
    grid-template-columns: 1fr; // 移动端单列
  }
}
</style>
