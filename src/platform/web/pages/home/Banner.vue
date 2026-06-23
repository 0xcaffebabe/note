<template>
  <div class="hero">
    <div class="hero-inner">
      <h1 class="hero-title">{{ name }}</h1>
      <p class="hero-subtitle">结构化沉淀 · 体系化学习 · 长期主义的个人知识库</p>
      <!-- 轻量元信息行: 数据取不到时整行不渲染(优雅降级) -->
      <p class="hero-meta" v-if="metaText">{{ metaText }}</p>
      <div class="hero-actions">
        <el-button type="primary" round size="large" @click="handleContinueRead">
          {{ lastReadName ? `继续阅读 · ${lastReadName}` : '开始阅读' }}
        </el-button>
        <el-button round size="large" @click="$router.push('/catalog.html')">浏览总目录</el-button>
      </div>
      <!-- 伪搜索框: 视觉上像输入框 实际是按钮 点击/回车/空格唤起命令面板 -->
      <div
        class="hero-search"
        role="button"
        tabindex="0"
        aria-label="搜索笔记"
        @click="openSearch"
        @keydown.enter.prevent="openSearch"
        @keydown.space.prevent="openSearch"
      >
        <el-icon class="hero-search-icon"><Search /></el-icon>
        <span class="hero-search-placeholder">搜索笔记…</span>
        <span class="hero-search-kbd">{{ searchKbd }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Search } from '@element-plus/icons-vue'
import config from '@/core/config/config'
import DocUtils from '@/core/util/DocUtils'
import EventBus from '@/platform/web/components/EventBus'
import { relativeLabel } from '@/core/util/DateUtils'
import { isMac } from '@/adapters/browser/Platform'

export default defineComponent({
  components: { Search },
  data() {
    return {
      name: config.siteName,
      // lastRead 在 created() 同步段(首次渲染前)从 docService 取, 避免 data() 内 this 类型限制
      lastRead: null as string | null,
      // 统计行文案 取不到则为空(整行不渲染)
      metaText: '' as string,
      // 新访客"开始阅读"的目标 created 中算好 无 lastRead 时指向阅读顺序首篇
      startReadHref: '' as string,
    }
  },
  computed: {
    lastReadName(): string {
      if (!this.lastRead || this.lastRead == 'README') {
        return ''
      }
      // lastRead是docId(层级以'-'连接 '@@'转义连字符) 经docId2Url还原真实路径取末段
      const segments = DocUtils.docId2Segments(this.lastRead)
      return segments[segments.length - 1]
    },
    // 实际快捷键是 Ctrl/Cmd+K, 按平台显示对应修饰键(非 Mac 不再误导为 ⌘)
    searchKbd(): string {
      return isMac() ? '⌘K' : 'Ctrl K'
    },
  },
  async created() {
    // 上次阅读记录: 在首个 await 之前同步取, 保证首次渲染前 lastRead 已就绪(行为与原 data() 初始化等价)
    this.lastRead = this.$services.docService.getLastReadRecord() as string | null
    // 统计行: 零新增请求(API 有缓存) 取不到任一字段就不展示整行
    try {
      const commitDocList = await this.$services.api.getDescCommitDocList()
      const categoryList = await this.$services.categoryService.getCompiledCategoryList()
      const noteCount = commitDocList.length
      const catCount = categoryList.filter(c => c.name && c.name != '首页').length
      // 数据源按提交时间升序(最旧在前/最新在后) 取末尾元素即最近更新
      const last = commitDocList[commitDocList.length - 1]
      const updateLabel = last ? relativeLabel(last[1].date) : ''
      if (noteCount && updateLabel) {
        this.metaText = `${noteCount} 篇笔记 · ${catCount} 个分类 · 最近更新于 ${updateLabel}`
      }
    } catch { /* 取不到则不展示统计行 */ }
    // 新访客"开始阅读"目标: 阅读顺序首篇(避免与"浏览总目录"重复跳 README)
    try {
      const list = await this.$services.categoryService.getOrderedDocList()
      const first = list.find(c => c.link)
      if (first) {
        this.startReadHref = DocUtils.docId2HtmlPath(DocUtils.docUrl2Id(first.link))
      }
    } catch { /* 取不到则回退到 README */ }
  },
  methods: {
    handleContinueRead() {
      if (this.lastRead) {
        // 有阅读记录: 继续上次的文档
        this.$router.push(DocUtils.docId2HtmlPath(this.lastRead))
        return
      }
      // 新访客: 跳阅读顺序首篇 算不出时兜底 README
      this.$router.push(this.startReadHref || DocUtils.docId2HtmlPath('README'))
    },
    openSearch() {
      // 复用 App.vue 的全局命令面板实例(它监听 show-mobile-search), 不再自挂第二实例
      EventBus.emit('show-mobile-search', null)
    },
  },
})
</script>

<style lang="less" scoped>
.hero {
  // 渐变背景全宽 内容由 .hero-inner 限宽居中(横向内边距放内层 与下方两块对齐同一中线)
  padding: clamp(var(--spacing-2xl), 8vw, 72px) 0 clamp(var(--spacing-xl), 6vw, 56px);
  background:
    radial-gradient(ellipse 70% 100% at 50% 0%, color-mix(in srgb, var(--primary-color) 8%, transparent), transparent);
}

.hero-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  max-width: var(--home-max);
  margin: 0 auto;
  // 与 HomeQuickAccess / Statistic 同一横向内边距令牌, 三块内容边缘对齐
  padding: 0 var(--content-pad);
}

.hero-title {
  margin: 0;
  font-size: clamp(32px, 5vw, 52px);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--main-text-color);
}

// 大屏宽档: 标题/搜索入口随宽屏放大(下界保持原值, <=1280 不变)
@media (min-width: @bp-wide) {
  .hero-title {
    font-size: clamp(52px, 4vw, 64px);
  }
  .hero-search {
    max-width: 560px;
  }
}

.hero-subtitle {
  margin: var(--spacing-md) 0 var(--spacing-sm);
  font-size: var(--font-size-lg);
  color: var(--secondary-text-color);
}

.hero-meta {
  margin: 0 0 var(--spacing-xl);
  font-size: var(--font-size-sm);
  color: var(--secondary-text-color);
}

.hero-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  justify-content: center;
}

.hero-search {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  max-width: 420px;
  margin-top: var(--spacing-lg);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  background-color: var(--card-bg-color);
  cursor: pointer;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);

  &:hover,
  &:focus-visible {
    border-color: var(--primary-color);
    box-shadow: var(--shadow-sm);
  }
  // 键盘聚焦保留全局焦点环(不再 outline:none), 与 hover 区分
}

.hero-search-icon {
  color: var(--secondary-text-color);
  font-size: var(--font-size-lg);
}

.hero-search-placeholder {
  flex: 1;
  text-align: left;
  color: var(--secondary-text-color);
  font-size: var(--font-size-base);
}

.hero-search-kbd {
  color: var(--secondary-text-color);
  font-size: var(--font-size-xs);
  font-family: var(--font-mono);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 1px 6px;
}
</style>
