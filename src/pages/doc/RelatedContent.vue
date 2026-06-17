<template>
  <!-- 右侧悬浮标签: 悬停展开"相关链接"面板 上下两组 关联内容(跳转) / 其他链接(滚到正文位置) -->
  <div
    :class="inline ? 'related-inline' : 'related-floating'"
    v-if="total"
    @mouseenter="!inline && reveal()"
    @mouseleave="!inline && scheduleHide()"
  >
    <transition name="rf">
      <div class="rf-panel" v-show="inline || open" role="region" aria-label="相关链接">
        <div class="rf-panel-head">
          <el-icon class="rf-head-icon"><Connection /></el-icon>
          <span class="rf-head-title">相关链接</span>
          <span class="rf-head-count">{{ total }}</span>
        </div>
        <div class="rf-body">
          <template v-if="related.length">
            <div class="rf-group">关联内容 <span class="rf-group-num">{{ related.length }}</span></div>
            <a
              v-for="(link, i) in related"
              :key="'r-' + link.href + i"
              class="rf-item"
              :href="link.href"
              @click.prevent="go(link.href)"
            >
              <div class="rf-item-head">
                <span class="rf-name">{{ docName(link.path) }}</span>
                <span class="rf-breadcrumb" v-if="breadcrumb(link.path)">{{ breadcrumb(link.path) }}</span>
              </div>
              <p class="rf-desc" v-if="link.desc">{{ link.desc }}</p>
            </a>
          </template>
          <template v-if="docLinks.length">
            <div class="rf-group">其他链接 <span class="rf-group-num">{{ docLinks.length }}</span></div>
            <a
              v-for="(link, i) in docLinks"
              :key="'d-' + link.href + i"
              class="rf-item"
              :href="link.href"
              @click.prevent="locate(link.href)"
            >
              <div class="rf-item-head">
                <span class="rf-name">{{ docName(link.path) }}</span>
                <span class="rf-breadcrumb" v-if="breadcrumb(link.path)">{{ breadcrumb(link.path) }}</span>
              </div>
              <p class="rf-context" v-if="link.context">
                <span class="rf-ctx-side">{{ link.context.before }}</span>
                <span class="rf-ctx-hit">{{ link.context.text }}</span>
                <span class="rf-ctx-side">{{ link.context.after }}</span>
              </p>
            </a>
          </template>
        </div>
      </div>
    </transition>
    <button
      v-if="!inline"
      type="button"
      class="rf-tab"
      :class="{ active: open }"
      :aria-expanded="open"
      aria-label="相关链接"
      @click="toggle"
    >
      <el-icon class="rf-tab-icon"><Connection /></el-icon>
      <span class="rf-tab-count">{{ total }}</span>
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Connection } from '@element-plus/icons-vue'
import { RelatedLink } from '@/dto/RelatedLink'
import DocUtils from '@/util/DocUtils'

export default defineComponent({
  components: { Connection },
  props: {
    // 关联内容章节(带关联理由, 点击跳转到目标文档)
    related: {
      type: Array as PropType<RelatedLink[]>,
      default: () => [],
    },
    // 正文里指向其他文档的链接(点击滚动到正文中该链接的位置)
    docLinks: {
      type: Array as PropType<RelatedLink[]>,
      default: () => [],
    },
    // 内联(常驻)模式: 大屏宽档嵌入右列, 面板常显不浮动(无悬浮标签/无 hover 桥)
    inline: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      open: false,
      leaveTimer: 0 as ReturnType<typeof setTimeout> | 0,
    }
  },
  computed: {
    total(): number {
      return this.related.length + this.docLinks.length
    },
  },
  methods: {
    reveal() {
      clearTimeout(this.leaveTimer)
      this.open = true
    },
    // 离开留一点延迟 容忍指针在标签与面板边界的细微抖动
    scheduleHide() {
      this.leaveTimer = setTimeout(() => { this.open = false }, 120)
    },
    toggle() {
      this.open = !this.open
    },
    onKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape' && this.open) {
        clearTimeout(this.leaveTimer)
        this.open = false
      }
    },
    // 路径末段作为文档名
    docName(path: string): string {
      return path.replace(/\.md$/i, '').split('/').filter(Boolean).pop() || path
    },
    // 路径中间层级作为分类面包屑
    breadcrumb(path: string): string {
      const parts = path.replace(/\.md$/i, '').split('/').filter(Boolean)
      parts.pop()
      return parts.join(' / ')
    },
    // 关联内容: 跳转到目标文档
    go(href: string) {
      // 保持面板打开: 跳转后组件复用 清掉待执行的关闭计时器避免被误关
      clearTimeout(this.leaveTimer)
      this.$router.push(href)
    },
    // 其他链接: 滚动到正文中该链接首次出现的位置 并短暂高亮
    locate(href: string) {
      let docId = ''
      try {
        docId = DocUtils.htmlUrl2Id(href.split(/[?#]/)[0])
      } catch {
        return
      }
      const section = document.querySelector('.main.markdown-section') || document.querySelector('.markdown-section')
      if (!section) {
        return
      }
      const anchors = Array.from(section.querySelectorAll('a[href]')) as HTMLElement[]
      const target = anchors.find(a => {
        try {
          return DocUtils.htmlUrl2Id((a.getAttribute('href') || '').split(/[?#]/)[0]) === docId
        } catch {
          return false
        }
      })
      if (!target) {
        return
      }
      // 保持面板打开 取消可能待执行的关闭计时器
      clearTimeout(this.leaveTimer)
      // 让目标停在视口竖直中间, 一眼可见(而非贴着顶栏)
      const rect = target.getBoundingClientRect()
      const top = window.scrollY + rect.top - (window.innerHeight - rect.height) / 2
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
      // 短暂高亮被定位的链接
      const orig = target.style.backgroundColor
      target.style.transition = 'background-color 0.3s ease'
      target.style.backgroundColor = 'var(--primary-light-color)'
      setTimeout(() => { target.style.backgroundColor = orig }, 1600)
    },
  },
  mounted() {
    document.addEventListener('keydown', this.onKeydown)
  },
  unmounted() {
    document.removeEventListener('keydown', this.onKeydown)
    clearTimeout(this.leaveTimer)
  },
})
</script>

<style lang="less" scoped>
.related-floating {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: var(--z-overlay);
}

// 大屏宽档: 居中壳后, 把右缘竖标签从视口边移到壳右缘(否则悬在右侧死白里, 与正文脱节)
@media (min-width: @bp-wide) {
  .related-floating {
    right: calc((100vw - var(--doc-shell-max)) / 2);
  }
}

// 边缘竖标签: 常驻可见 半藏在右边缘
.rf-tab {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 38px;
  padding: 14px 0;
  border: 1px solid var(--border-color);
  border-right: none;
  border-radius: var(--radius-lg) 0 0 var(--radius-lg);
  background-color: var(--card-bg-color);
  color: var(--secondary-text-color);
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: color var(--transition-fast), box-shadow var(--transition-fast);

  &:hover,
  &.active {
    color: var(--primary-color);
    box-shadow: var(--shadow-lg);
  }
}

.rf-tab-icon {
  font-size: 18px;
}

.rf-tab-count {
  min-width: 16px;
  padding: 1px 5px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
  text-align: center;
  color: white;
  background-color: var(--primary-color);
  border-radius: 999px;
}

// 展开面板: 贴在标签左侧 (right=标签宽 无间隙保证悬停桥连续)
.rf-panel {
  position: absolute;
  right: 38px;
  top: 50%;
  transform: translateY(-50%);
  width: min(380px, calc(100vw - 56px));
  max-height: 72vh;
  display: flex;
  flex-direction: column;
  background-color: var(--elevated-bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

// 内联(常驻)模式: 面板静态嵌入右列, 常显、弱阴影、跟随列宽
.related-inline {
  width: 100%;
}
.related-inline .rf-panel {
  position: static;
  transform: none;
  width: 100%;
  max-height: 38vh;
  box-shadow: none;
  background-color: var(--card-bg-color);
}

.rf-panel-head {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
  padding: 10px var(--spacing-md);
  border-bottom: 1px solid var(--divider-color);
  background-color: var(--card-bg-color);
}

.rf-head-icon {
  color: var(--primary-color);
}

.rf-head-title {
  flex: 1;
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--main-text-color);
}

.rf-head-count {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--secondary-text-color);
  background-color: var(--hover-bg-color);
  padding: 0 8px;
  line-height: 18px;
  border-radius: 999px;
}

.rf-body {
  overflow-y: auto;
  padding: var(--spacing-sm);

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb-color);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover-color);
  }
}

// 分组标题: 关联内容 / 其他链接
.rf-group {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--spacing-sm) var(--spacing-sm) 4px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--secondary-text-color);

  &:first-child {
    padding-top: 2px;
  }
}

.rf-group-num {
  font-weight: 500;
  opacity: 0.8;
}

.rf-item {
  display: block;
  padding: var(--spacing-sm) var(--spacing-md);
  margin-bottom: 2px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: background-color var(--transition-fast), border-color var(--transition-fast);

  &:hover {
    background-color: var(--hover-bg-color);
    border-color: var(--border-color);
  }
}

.rf-item-head {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-sm);
}

.rf-name {
  flex-shrink: 0;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--primary-color);
}

.rf-breadcrumb {
  flex: 1;
  min-width: 0;
  font-size: var(--font-size-xs);
  color: var(--secondary-text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 关联理由完整展示 不截断
.rf-desc {
  margin: 4px 0 0;
  font-size: var(--font-size-sm);
  line-height: var(--leading-normal);
  color: var(--secondary-text-color);
}

// "其他链接"的上下文片段: 链接所在行前后截断的文字, 命中的锚文本高亮
.rf-context {
  margin: 4px 0 0;
  font-size: var(--font-size-xs);
  line-height: var(--leading-normal);
  color: var(--secondary-text-color);
}

.rf-ctx-hit {
  font-weight: 600;
  color: var(--primary-color);
  background-color: var(--primary-light-color);
  border-radius: var(--radius-sm);
  padding: 0 2px;
}

// 展开/收起动画: 自标签向左滑出
.rf-enter-active,
.rf-leave-active {
  transition: opacity var(--transition-normal), transform var(--transition-normal);
}

.rf-enter-from,
.rf-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(12px);
}

// 减弱动态效果时: 只保留淡入淡出 去掉横向位移(避免0.01ms内的位置闪跳, 但保留垂直居中)
@media (prefers-reduced-motion: reduce) {
  .rf-enter-from,
  .rf-leave-to {
    transform: translateY(-50%);
  }
}
</style>
