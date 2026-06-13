<template>
  <!-- 右侧悬浮标签: 悬停展开关联内容面板 (面板是标签的DOM后代 移到面板上不会触发mouseleave 形成悬停桥) -->
  <div
    class="related-floating"
    v-if="links.length"
    @mouseenter="reveal"
    @mouseleave="scheduleHide"
  >
    <transition name="rf">
      <div class="rf-panel" v-show="open" role="region" aria-label="关联内容">
        <div class="rf-panel-head">
          <el-icon class="rf-head-icon"><Connection /></el-icon>
          <span class="rf-head-title">关联内容</span>
          <span class="rf-head-count">{{ links.length }}</span>
        </div>
        <div class="rf-list">
          <a
            v-for="(link, index) in links"
            :key="link.href + '-' + index"
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
        </div>
      </div>
    </transition>
    <button
      type="button"
      class="rf-tab"
      :class="{ active: open }"
      :aria-expanded="open"
      aria-label="关联内容"
      @click="toggle"
    >
      <el-icon class="rf-tab-icon"><Connection /></el-icon>
      <span class="rf-tab-count">{{ links.length }}</span>
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Connection } from '@element-plus/icons-vue'
import { RelatedLink } from '@/dto/RelatedLink'

export default defineComponent({
  components: { Connection },
  props: {
    links: {
      type: Array as PropType<RelatedLink[]>,
      default: () => [],
    },
  },
  data() {
    return {
      open: false,
      leaveTimer: 0 as ReturnType<typeof setTimeout> | 0,
    }
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
    go(href: string) {
      // 清理待执行的关闭计时器: 否则跳转后(组件复用)它会在新文档上误触发关闭
      clearTimeout(this.leaveTimer)
      this.open = false
      const prefix = this.$route.path.startsWith('/m/') ? '/m' : ''
      this.$router.push(prefix + href)
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

.rf-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
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

.rf-item {
  display: block;
  padding: var(--spacing-sm) var(--spacing-md);
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
