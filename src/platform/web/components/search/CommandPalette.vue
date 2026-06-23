<template>
  <el-dialog
    v-model="visible"
    :width="dialogWidth"
    top="10vh"
    class="command-palette"
    :show-close="false"
    @opened="focusInput"
    @closed="reset"
  >
    <template #header>
      <div class="palette-input-row">
        <el-icon class="palette-search-icon"><Search /></el-icon>
        <input
          ref="input"
          v-model="kw"
          class="palette-input"
          type="text"
          :placeholder="mode == 'category' ? '搜索目录(支持拼音)…' : '全文搜索, 回车立即执行…'"
          @input="handleInput"
          @keydown="handleKeydown"
        />
        <div class="palette-modes" role="tablist">
          <button
            type="button"
            class="palette-mode"
            :class="{active: mode == 'category'}"
            @click="switchMode('category')"
          >目录</button>
          <button
            type="button"
            class="palette-mode"
            :class="{active: mode == 'fulltext'}"
            @click="switchMode('fulltext')"
          >全文</button>
        </div>
      </div>
    </template>

    <div class="palette-body" v-loading="loading">
      <div class="palette-hint" v-if="hintText">{{ hintText }}</div>
      <div class="palette-list" ref="list">
        <a
          v-for="(item, index) in items"
          :key="index"
          class="palette-item"
          :class="{active: index == activeIndex, segment: item.type == 'segment'}"
          :href="item.href"
          @click.prevent="open(item)"
          @mousemove="activeIndex = index"
        >
          <span class="item-title" v-html="item.title"></span>
          <span class="item-subtitle" v-if="item.subtitle" v-html="item.subtitle"></span>
        </a>
      </div>
      <el-empty
        v-if="!loading && items.length == 0"
        :image-size="48"
        :description="emptyText"
      />
      <div class="palette-footer">
        <span><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
        <span><kbd>Enter</kbd> 打开</span>
        <span><kbd>Tab</kbd> 切换模式</span>
        <span><kbd>Esc</kbd> 关闭</span>
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Search } from '@element-plus/icons-vue'
import Category from '@/core/domain/Category'
import DocUtils from '@/core/util/DocUtils'
import { escapeHtml, escapeRegExp } from '@/core/util/StringUtils'
import { isWide as isWideBp } from '@/platform/web/composables/useBreakpoint'

type PaletteMode = 'category' | 'fulltext'

interface PaletteItem {
  type: 'category' | 'recent' | 'doc' | 'segment'
  title: string
  subtitle?: string
  href: string
  // 跳转所需参数
  docId: string
  headingId?: string
  kw?: string
  category?: Category
}

const MAX_CATEGORY_RESULTS = 15

export default defineComponent({
  components: { Search },
  data() {
    return {
      visible: false as boolean,
      mode: 'category' as PaletteMode,
      kw: '' as string,
      loading: false as boolean,
      searched: false as boolean,
      activeIndex: 0,
      flatCategoryList: [] as Category[],
      items: [] as PaletteItem[],
      searchTimer: 0 as ReturnType<typeof setTimeout> | 0,
    }
  },
  computed: {
    // 命令面板宽度: 移动 92% / 大屏宽档 760 / 其余 640
    dialogWidth(): string {
      if (this.$isMobile()) return '92%'
      return isWideBp.value ? '760px' : '640px'
    },
    hintText(): string {
      if (this.mode == 'category' && !this.kw && this.items.length > 0) {
        return '最近访问'
      }
      return ''
    },
    emptyText(): string {
      if (this.mode == 'category') {
        return this.kw ? `没有匹配「${this.kw}」的目录` : '输入关键词搜索目录'
      }
      if (!this.searched) {
        return '输入关键词后回车执行全文搜索'
      }
      return `未找到与「${this.kw}」相关的内容`
    },
  },
  methods: {
    show(mode?: PaletteMode) {
      if (mode) {
        this.mode = mode
      }
      this.visible = true
      this.refresh()
    },
    hide() {
      this.visible = false
    },
    focusInput() {
      (this.$refs.input as HTMLInputElement)?.focus()
    },
    reset() {
      this.kw = ''
      this.items = []
      this.activeIndex = 0
      this.searched = false
      this.loading = false
    },
    switchMode(mode: PaletteMode) {
      if (this.mode == mode) {
        return
      }
      this.mode = mode
      this.searched = false
      this.refresh()
      this.focusInput()
    },
    handleInput() {
      this.refresh()
    },
    refresh() {
      this.activeIndex = 0
      if (this.mode == 'category') {
        this.refreshCategory()
      } else {
        // 全文搜索: 输入即搜(防抖) 回车立即执行
        clearTimeout(this.searchTimer)
        if (!this.kw) {
          this.items = []
          this.searched = false
          return
        }
        this.searchTimer = setTimeout(() => this.searchFulltext(), 300)
      }
    },
    refreshCategory() {
      if (!this.kw) {
        // 空输入展示最近访问记录(service已按最近在前返回)
        this.items = this.$services.categoryService.getCategorySearchRecords()
          .map(c => this.categoryToItem(c, 'recent'))
        return
      }
      this.items = this.flatCategoryList
        .filter(c => this.$services.categoryService.categoryIsMatch(c, this.kw))
        .slice(0, MAX_CATEGORY_RESULTS)
        .map(c => this.categoryToItem(c, 'category'))
    },
    categoryToItem(category: Category, type: 'category' | 'recent'): PaletteItem {
      const docId = DocUtils.docUrl2Id(category.link)
      return {
        type,
        title: this.highlight(category.name),
        subtitle: this.highlight(docId),
        href: DocUtils.docId2HtmlPath(docId),
        docId,
        category,
      }
    },
    async searchFulltext() {
      if (!this.kw) {
        return
      }
      this.loading = true
      try {
        const result = await this.$services.searchService.search(this.kw)
        const items: PaletteItem[] = []
        for (const doc of result.list) {
          const docId = doc.url.startsWith('/') || doc.url.startsWith('./')
            ? this.docUrl2Id(doc.url)
            : this.docUrl2Id('/' + doc.url)
          items.push({
            type: 'doc',
            title: doc.hilighedUrl,
            href: DocUtils.docId2HtmlPath(docId),
            docId,
            kw: this.kw,
          })
          for (const segment of doc.hilighedSegement || []) {
            items.push({
              type: 'segment',
              title: segment.id,
              subtitle: segment.txt,
              href: DocUtils.docId2HtmlPath(docId),
              docId,
              headingId: segment.id.replace(/<\/?mark>/gi, ''),
              kw: this.kw,
            })
          }
        }
        this.items = items
      } finally {
        this.loading = false
        this.searched = true
        this.activeIndex = 0
      }
    },
    handleKeydown(e: KeyboardEvent) {
      if (e.key == 'ArrowDown' || e.key == 'ArrowUp') {
        e.preventDefault()
        if (this.items.length == 0) {
          return
        }
        const step = e.key == 'ArrowDown' ? 1 : -1
        this.activeIndex = (this.activeIndex + step + this.items.length) % this.items.length
        this.scrollActiveIntoView()
        return
      }
      if (e.key == 'Tab') {
        e.preventDefault()
        this.switchMode(this.mode == 'category' ? 'fulltext' : 'category')
        return
      }
      if (e.key == 'Enter') {
        e.preventDefault()
        if (this.mode == 'fulltext' && !this.searched && this.kw) {
          // 回车立即搜索 跳过防抖
          clearTimeout(this.searchTimer)
          this.searchFulltext()
          return
        }
        const item = this.items[this.activeIndex]
        if (item) {
          this.open(item)
        }
      }
    },
    scrollActiveIntoView() {
      this.$nextTick(() => {
        const list = this.$refs.list as HTMLElement
        const active = list?.children[this.activeIndex] as HTMLElement
        active?.scrollIntoView({block: 'nearest'})
      })
    },
    open(item: PaletteItem) {
      if (item.category) {
        // 记录目录点击历史
        this.$services.categoryService.addCategorySearchRecord({
          name: item.category.name,
          link: item.category.link,
          chidren: [],
        } as unknown as Category)
      }
      this.$router.push({
        path: DocUtils.docId2HtmlPath(item.docId),
        query: item.headingId || item.kw
          ? {headingId: item.headingId, kw: item.kw}
          : undefined,
      })
      this.hide()
    },
    highlight(raw: string): string {
      const html = escapeHtml(raw)
      const kw = (this.kw || '').trim()
      if (!kw) {
        return html
      }
      let result = html
      for (const part of kw.split(' ').filter(Boolean)) {
        try {
          result = result.replace(new RegExp(escapeRegExp(part), 'gi'), (s: string) => `<mark>${s}</mark>`)
        } catch { /* 非法正则字符已转义 此处兜底 */ }
      }
      return result
    },
    docUrl2Id(url: string): string {
      return DocUtils.docUrl2Id(url)
    },
  },
  async created() {
    const list = await this.$services.categoryService.getCategoryList()
    const flat: Category[] = []
    const walk = (nodes: Category[]) => {
      for (const node of nodes) {
        if (node.name) {
          flat.push(node)
        }
        if (node.chidren?.length) {
          walk(node.chidren)
        }
      }
    }
    walk(list)
    this.flatCategoryList = flat
  },
})
</script>

<style lang="less">
// 命令面板对话框结构样式(需作用于el-dialog内部 非scoped)
.command-palette {
  border-radius: var(--radius-xl);
  overflow: hidden;

  .el-dialog__header {
    padding: 0;
    margin: 0;
    border-bottom: 1px solid var(--border-color);
  }

  .el-dialog__body {
    padding: 0;
  }
}
</style>

<style lang="less" scoped>
.palette-input-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
}

.palette-search-icon {
  color: var(--secondary-text-color);
  font-size: 18px;
}

.palette-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: var(--font-size-lg);
  color: var(--main-text-color);
  padding: var(--spacing-sm) 0;

  &::placeholder {
    color: var(--secondary-text-color);
  }
}

.palette-modes {
  display: flex;
  gap: 4px;
}

.palette-mode {
  padding: 4px 12px;
  font-size: var(--font-size-sm);
  color: var(--secondary-text-color);
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: color var(--transition-fast), border-color var(--transition-fast), background-color var(--transition-fast);

  &.active {
    color: var(--primary-color);
    border-color: var(--primary-color);
    background-color: var(--primary-light-color);
  }
}

.palette-body {
  min-height: 120px;
  display: flex;
  flex-direction: column;
}

.palette-hint {
  padding: var(--spacing-sm) var(--spacing-md) 0;
  font-size: var(--font-size-xs);
  color: var(--secondary-text-color);
}

.palette-list {
  max-height: 46vh;
  overflow-y: auto;
  padding: var(--spacing-sm);
}

// 大屏宽档: 列表更高, 一屏展示更多结果
@media (min-width: @bp-wide) {
  .palette-list {
    max-height: 56vh;
  }
}

.palette-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  text-decoration: none;
  cursor: pointer;

  &.segment {
    margin-left: var(--spacing-lg);
  }

  &.active {
    background-color: var(--primary-light-color);
  }

  .item-title {
    color: var(--main-text-color);
    font-size: var(--font-size-base);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    :deep(mark) {
      color: var(--primary-color);
      background: transparent;
      font-weight: 600;
    }
  }

  .item-subtitle {
    color: var(--secondary-text-color);
    font-size: var(--font-size-xs);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    :deep(mark) {
      color: var(--primary-color);
      background: transparent;
    }
  }
}

.palette-footer {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  border-top: 1px solid var(--border-color);
  font-size: var(--font-size-xs);
  color: var(--secondary-text-color);

  kbd {
    display: inline-block;
    padding: 1px 5px;
    margin-right: 3px;
    font-family: var(--font-mono);
    font-size: 11px;
    border: 1px solid var(--border-color);
    border-bottom-width: 2px;
    border-radius: var(--radius-sm);
    background-color: var(--hover-bg-color);
  }
}
</style>
