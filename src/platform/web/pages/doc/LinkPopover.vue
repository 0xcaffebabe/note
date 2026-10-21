<template>
  <!-- teleport到body: 宿主(侧栏等)自带z-index会创建层叠上下文 浮窗在其内部永远盖不过外部浮动控件 -->
  <teleport to="body">
  <transition name="fade">
    <div ref="popover" class="popover" :class="{ 'has-custom-size': hasCustomSize }" v-show="visible" role="dialog" aria-label="文档预览">
      <!-- 标题栏即拖拽把手 正文区不再劫持mousedown 文字可正常选中 -->
      <div class="popover-header" @pointerdown="startDrag">
        <span class="popover-title" :title="docTitle">{{ docTitle }}</span>
        <div class="popover-actions">
          <button
            type="button"
            class="action-btn"
            :class="{ active: pin }"
            :title="pin ? '取消固定' : '固定(点击外部/滚动不再关闭)'"
            @click="pin = !pin"
          >
            <el-icon><place /></el-icon>
          </button>
          <button type="button" class="action-btn" title="打开该文档" @click="openDoc">
            <el-icon><top-right /></el-icon>
          </button>
          <button type="button" class="action-btn" title="关闭 (Esc)" aria-label="关闭预览" @click="hide0">
            <el-icon><close /></el-icon>
          </button>
        </div>
      </div>
      <div class="popover-body">
        <category-item-content
          :category-link="docLink"
          ref="categoryItemContent"
        />
        <el-skeleton v-if="loading" :rows="6" animated class="preview-skeleton" />
        <div v-else class="markdown-section preview-markdown" ref="previewSection" v-html="contentHtml" draggable="false" @click="onPreviewClick"></div>
      </div>
      <button
        type="button"
        class="resize-handle"
        aria-label="调整预览大小"
        title="拖动调整宽高，也可使用方向键（Shift 加速）"
        @pointerdown="startResize"
        @keydown="resizeWithKeyboard"
      ></button>
    </div>
  </transition>
  </teleport>
  <mermaid-shower ref="mermaidShower" @closed="showingMermaid = false" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Close, Place, TopRight } from "@element-plus/icons-vue";
import CategoryItemContent from "./category/CategoryItemContent.vue";
import DocFileInfo from "@/core/domain/DocFileInfo";
import DocUtils from "@/core/util/DocUtils";
import { clamp, clampToBounds } from "@/core/util/GeometryUtils";
import { browserStorage } from "@/adapters/browser/LocalStorageAdapter";
import { PREVIEW_LAYOUT_KEY, readPreviewLayout, type PreviewLayout } from "./PreviewLayout";
import DocPostRender from "@/platform/web/render/DocPostRender";
import MermaidUtils from "@/platform/web/util/MermaidUtils";
import MermaidShower from "./mermaid-shower/MermaidShower.vue";

export default defineComponent({
  components: {
    Close,
    Place,
    TopRight,
    CategoryItemContent,
    MermaidShower,
  },
  data() {
    return {
      docLink: "",
      visible: false,
      loading: false,
      file: new DocFileInfo() as DocFileInfo,
      pin: false,
      showingMermaid: false,
      // 触发show的那次右键事件会冒泡到document 未"上膛"前不视作外部点击
      armed: false,
      resizeObserver: null as ResizeObserver | null,
      layout: readPreviewLayout(browserStorage.getItem(PREVIEW_LAYOUT_KEY)),
      hasCustomSize: false,
      stopInteraction: null as (() => void) | null,
    };
  },
  computed: {
    contentHtml(): string {
      return this.$services.docService.renderMd(this.file);
    },
    docTitle(): string {
      return this.file?.name?.replace(/\.md$/i, '') || '文档预览';
    }
  },
  methods: {
    show(docLink: string, x: number, y: number) {
      this.stopInteraction?.();
      this.docLink = docLink;
      this.pin = false;
      this.initDoc();
      (this.$refs.categoryItemContent as any).init(docLink);
      const popover = this.$refs.popover as HTMLElement;
      this.visible = true;
      popover.style.left = (this.layout?.left ?? x) + "px";
      popover.style.top = (this.layout?.top ?? y) + "px";
      if (this.layout) {
        this.hasCustomSize = true;
        popover.style.width = this.layout.width + "px";
        popover.style.height = this.layout.height + "px";
      }
      this.armed = false;
      setTimeout(() => { this.armed = true });
      // 渲染出尺寸后夹紧到视口内 贴边右键不再溢出
      this.$nextTick(() => this.clampToViewport());
    },
    clampToViewport() {
      if (!this.visible) {
        return;
      }
      // offset*取布局尺寸 不受enter动画scale影响(getBoundingClientRect会量到缩放中的尺寸)
      const el = this.$refs.popover as HTMLElement;
      el.style.left = clampToBounds(el.offsetLeft, el.offsetWidth, window.innerWidth) + "px";
      el.style.top = clampToBounds(el.offsetTop, el.offsetHeight, window.innerHeight) + "px";
    },
    async initDoc() {
      this.loading = true;
      try {
        this.file = await this.$services.docService.getDocFileInfo(DocUtils.docUrl2Id(this.docLink));
      } finally {
        this.loading = false;
      }
      this.$nextTick(() => {
        const previewSection = this.$refs.previewSection as HTMLElement;
        // 预览内容的代码块高亮
        DocPostRender.highlightCode(previewSection);
        MermaidUtils.initAllNode(previewSection);
        // 内容撑开高度后再夹一次
        this.clampToViewport();
      });
    },
    onPreviewClick(e: MouseEvent) {
      const button = (e.target as Element).closest('.mermaid-wrapper .fullscreen button');
      const diagram = button?.closest('.mermaid-wrapper')?.getAttribute('data-raw');
      if (!diagram) {
        return;
      }
      this.showingMermaid = true;
      (this.$refs.mermaidShower as InstanceType<typeof MermaidShower>).show(diagram);
    },
    rememberLayout() {
      const el = this.$refs.popover as HTMLElement;
      this.layout = {
        left: el.offsetLeft, top: el.offsetTop,
        width: el.offsetWidth, height: el.offsetHeight,
      } satisfies PreviewLayout;
      browserStorage.setItem(PREVIEW_LAYOUT_KEY, JSON.stringify(this.layout));
    },
    setSize(width: number, height: number) {
      const el = this.$refs.popover as HTMLElement;
      const style = getComputedStyle(el);
      const margin = parseFloat(style.getPropertyValue('--spacing-sm'));
      this.hasCustomSize = true;
      el.style.width = clamp(width, parseFloat(style.minWidth), window.innerWidth - el.offsetLeft - margin) + 'px';
      el.style.height = clamp(height, parseFloat(style.minHeight), window.innerHeight - el.offsetTop - margin) + 'px';
      this.clampToViewport();
    },
    startDrag(e: PointerEvent) {
      // 操作按钮上不发起拖拽
      if ((e.target as HTMLElement).closest('.action-btn')) {
        return;
      }
      this.startInteraction(e, false);
    },
    startResize(e: PointerEvent) {
      this.startInteraction(e, true);
    },
    /* pointer 事件兼容鼠标/触控；结束、失焦、隐藏或卸载时清理监听。 */
    startInteraction(e: PointerEvent, resizing: boolean) {
      if (e.button !== 0 || !e.isPrimary) {
        return;
      }
      this.stopInteraction?.();
      const handle = e.currentTarget as HTMLElement;
      handle.setPointerCapture(e.pointerId);
      const popover = this.$refs.popover as HTMLElement;
      const startX = e.clientX, startY = e.clientY;
      const origLeft = popover.offsetLeft, origTop = popover.offsetTop;
      const origWidth = popover.offsetWidth, origHeight = popover.offsetHeight;
      let changed = false;
      const onMove = (me: PointerEvent) => {
        if (me.pointerId !== e.pointerId) return;
        const dx = me.clientX - startX, dy = me.clientY - startY;
        if (!dx && !dy) return;
        changed = true;
        if (resizing) {
          this.setSize(origWidth + dx, origHeight + dy);
        } else {
          popover.style.left = origLeft + dx + "px";
          popover.style.top = origTop + dy + "px";
          this.clampToViewport();
        }
        me.preventDefault();
      };
      const onUp = (event: Event) => {
        if ('pointerId' in event && event.pointerId !== e.pointerId) return;
        this.stopInteraction?.();
        this.clampToViewport();
        if (changed) this.rememberLayout();
      };
      this.stopInteraction = () => {
        if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', onUp);
        window.removeEventListener('blur', onUp);
        this.stopInteraction = null;
      };
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);
      window.addEventListener('blur', onUp);
      e.preventDefault();
    },
    resizeWithKeyboard(e: KeyboardEvent) {
      const directions: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
      };
      const direction = directions[e.key];
      if (!direction) return;
      const el = this.$refs.popover as HTMLElement;
      const step = e.shiftKey ? 40 : 10;
      this.setSize(el.offsetWidth + direction[0] * step, el.offsetHeight + direction[1] * step);
      this.rememberLayout();
      e.preventDefault();
    },
    openDoc() {
      this.$router.push('/doc/' + DocUtils.docUrl2Id(this.docLink));
      this.hide0();
    },
    hide() {
      if (this.pin || this.showingMermaid) {
        return
      }
      this.hide0()
    },
    hide0() {
      this.stopInteraction?.();
      this.visible = false;
      (this.$refs.categoryItemContent as any).destroy();
    },
    /* ---- 标准浮层消失行为(固定时点击/滚动豁免，Esc 优先关闭图表查看器) ---- */
    onOutsidePointer(e: Event) {
      if (!this.visible || !this.armed) {
        return;
      }
      const root = this.$refs.popover as HTMLElement;
      if (!root.contains(e.target as Node)) {
        this.hide();
      }
    },
    onScrollCapture(e: Event) {
      if (!this.visible) {
        return;
      }
      // 浮窗内部滚动(预览正文)不关闭
      const root = this.$refs.popover as HTMLElement;
      if (root.contains(e.target as Node)) {
        return;
      }
      this.hide();
    },
    handleKeydown(e: KeyboardEvent) {
      // Esc 关闭预览(忽略pin锁定)
      if (e.key == 'Escape' && this.visible && !this.showingMermaid) {
        this.hide0()
      }
    },
  },
  mounted() {
    // capture捕获window与嵌套容器(如侧栏)的滚动
    document.addEventListener('scroll', this.onScrollCapture, true)
    document.addEventListener('click', this.onOutsidePointer)
    document.addEventListener('contextmenu', this.onOutsidePointer)
    document.addEventListener('keydown', this.handleKeydown)
    window.addEventListener('resize', this.clampToViewport)
    // 预览正文/元信息卡片异步加载会持续撑高浮窗 尺寸一变就重新夹紧视口
    this.resizeObserver = new ResizeObserver(() => {
      if (this.visible) {
        this.clampToViewport()
      }
    })
    this.resizeObserver.observe(this.$refs.popover as HTMLElement)
  },
  unmounted() {
    document.removeEventListener('scroll', this.onScrollCapture, true)
    document.removeEventListener('click', this.onOutsidePointer)
    document.removeEventListener('contextmenu', this.onOutsidePointer)
    document.removeEventListener('keydown', this.handleKeydown)
    window.removeEventListener('resize', this.clampToViewport)
    this.stopInteraction?.()
    this.resizeObserver?.disconnect()
  }
});
</script>

<style lang="less" scoped>
.popover {
  --preview-min-width: 280px;
  --preview-min-height: 160px;
  // 注意: 不要给.popover本体加transition 拖拽改top/left时会跟手延迟
  background-color: var(--elevated-bg-color);
  width: min(400px, 92vw);
  min-width: min(var(--preview-min-width), calc(100vw - 2 * var(--spacing-sm)));
  min-height: min(var(--preview-min-height), calc(100vh - 2 * var(--spacing-sm)));
  max-width: calc(100vw - 2 * var(--spacing-sm));
  max-height: calc(100vh - 2 * var(--spacing-sm));
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 80px;
  left: 400px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-popup);
  // 裁掉子元素直角 保证圆角完整
  overflow: hidden;
}

.popover-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 6px var(--spacing-sm) 6px 12px;
  border-bottom: 1px solid var(--divider-color);
  background-color: var(--card-bg-color);
  cursor: move;
  user-select: none;
  touch-action: none;
}

.popover-title {
  flex: 1;
  min-width: 0;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--main-text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.popover-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.action-btn {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: none;
  border-radius: var(--radius-sm);
  color: var(--secondary-text-color);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: background-color var(--transition-fast), color var(--transition-fast);

  &:hover {
    background-color: var(--hover-bg-color);
    color: var(--main-text-color);
  }

  // 图钉固定中: 主色高亮 状态可见
  &.active {
    color: var(--primary-color);
    background-color: var(--primary-light-color);
  }
}

.popover-body {
  padding: 10px 12px;
  flex: 1;
  min-height: 0;
  max-height: min(600px, 70vh);
  overflow-y: auto;
  cursor: default;
}

.has-custom-size .popover-body {
  max-height: none;
}

.resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: var(--spacing-lg);
  height: var(--spacing-lg);
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--elevated-bg-color);
  color: var(--secondary-text-color);
  cursor: nwse-resize;
  touch-action: none;

  &::after {
    content: '';
    position: absolute;
    right: var(--spacing-xs);
    bottom: var(--spacing-xs);
    width: var(--spacing-sm);
    height: var(--spacing-sm);
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
  }

  &:hover, &:focus-visible {
    color: var(--primary-color);
    background: var(--hover-bg-color);
  }

  &:focus-visible {
    outline-offset: calc(-1 * var(--spacing-xs));
  }
}

.preview-skeleton {
  padding: var(--spacing-sm) 0;
}

.preview-markdown {
  margin-top: var(--spacing-sm);
}

// 弹出/收起动画: 仅作用于enter/leave阶段 不影响显示中的拖拽
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-normal), transform var(--transition-normal);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(4px) scale(0.98);
}
</style>
