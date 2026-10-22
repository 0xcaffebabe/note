<template>
  <!-- teleport到body: 宿主(侧栏等)自带z-index会创建层叠上下文 浮窗在其内部永远盖不过外部浮动控件 -->
  <teleport to="body">
  <transition name="fade">
    <div
      ref="popover"
      class="popover"
      :class="{ 'has-custom-size': hasCustomSize }"
      :style="{ zIndex: `calc(var(--z-popup) + ${stackOrder})` }"
      v-show="visible"
      role="dialog"
      aria-label="文档预览"
      tabindex="-1"
      @pointerdown="$emit('activate')"
      @focusin="$emit('activate')"
    >
      <!-- 标题栏即拖拽把手 正文区不再劫持mousedown 文字可正常选中 -->
      <div class="popover-header" @pointerdown="startDrag">
        <span class="popover-title" :title="docTitle">{{ docTitle }}</span>
        <div class="popover-actions">
          <button
            type="button"
            class="action-btn"
            :class="{ active: pin }"
            :aria-pressed="pin"
            :title="pin ? '取消固定' : '固定(点击外部/滚动不再关闭)'"
            @click="togglePin"
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
      <div
        ref="body"
        class="popover-body"
        @scroll.passive="rememberScroll"
        @wheel.passive="cancelScrollRestore"
        @touchmove.passive="cancelScrollRestore"
        @pointerdown="cancelScrollRestore"
        @load.capture="restoreScroll"
      >
        <category-item-content
          :category-link="docLink"
          ref="categoryItemContent"
        />
        <el-skeleton v-if="loading" :rows="6" animated class="preview-skeleton" />
        <div v-else-if="loadError" role="status" class="preview-error">
          <p>文档预览加载失败</p>
          <button type="button" class="retry-btn" @click="initDoc">重试</button>
        </div>
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
import { readLinkPreviewState, saveLinkPreviewState } from "./LinkPreviewState";
import { showLinkPreview } from "./LinkPreview";
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
  props: {
    docId: { type: String, required: true },
    docLink: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    stackOrder: { type: Number, default: 0 },
    pinned: { type: Boolean, default: false },
  },
  emits: ['activate', 'close', 'pin-change'],
  data() {
    return {
      visible: false,
      loading: false,
      loadError: false,
      ready: false,
      disposed: false,
      file: new DocFileInfo() as DocFileInfo,
      showingMermaid: false,
      // 触发show的那次右键事件会冒泡到document 未"上膛"前不视作外部点击
      armed: false,
      resizeObserver: null as ResizeObserver | null,
      layout: readLinkPreviewState(this.docId),
      hasCustomSize: false,
      stopInteraction: null as (() => void) | null,
      scrollTimer: undefined as ReturnType<typeof setTimeout> | undefined,
      pendingScrollTop: null as number | null,
    };
  },
  computed: {
    pin(): boolean {
      return this.pinned;
    },
    contentHtml(): string {
      return this.$services.docService.renderMd(this.file);
    },
    docTitle(): string {
      return this.file?.name?.replace(/\.md$/i, '') || '文档预览';
    }
  },
  methods: {
    togglePin() {
      this.rememberLayout(false);
      this.$emit('pin-change', !this.pin);
    },
    show() {
      const popover = this.$refs.popover as HTMLElement;
      this.visible = true;
      popover.style.left = (this.layout?.left ?? this.x) + "px";
      popover.style.top = (this.layout?.top ?? this.y) + "px";
      if (this.layout) {
        this.hasCustomSize = true;
        popover.style.width = this.layout.width + "px";
        popover.style.height = this.layout.height + "px";
      }
      // 渲染出尺寸后夹紧到视口内 贴边右键不再溢出
      this.$nextTick(() => {
        this.clampToViewport();
        this.armed = true;
      });
      this.initDoc();
    },
    focus() {
      (this.$refs.popover as HTMLElement).focus({ preventScroll: true });
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
      this.loadError = false;
      this.ready = false;
      try {
        const [file] = await Promise.all([
          this.$services.docService.getDocFileInfo(this.docId),
          (this.$refs.categoryItemContent as InstanceType<typeof CategoryItemContent>).init(this.docLink),
        ]);
        if (this.disposed) return;
        this.file = file;
      } catch {
        if (!this.disposed) this.loadError = true;
      } finally {
        if (!this.disposed) this.loading = false;
      }
      if (this.disposed || this.loadError) return;
      await this.$nextTick();
      if (this.disposed) return;
      const previewSection = this.$refs.previewSection as HTMLElement;
      DocPostRender.highlightCode(previewSection);
      MermaidUtils.initAllNode(previewSection);
      this.clampToViewport();
      this.pendingScrollTop = this.layout?.scrollTop ?? 0;
      this.restoreScroll();
      // 图片、Mermaid 等异步内容增高后继续恢复，用户开始操作时停止。
      this.resizeObserver?.observe(previewSection);
      this.ready = true;
      // 加载时固定/切到后台可能先保存了骨架屏尺寸，正文就绪后补记自动展开的大小。
      if (!this.layout || !this.hasCustomSize) this.rememberLayout();
    },
    onPreviewClick(e: MouseEvent) {
      const link = (e.target as Element).closest('a[origin-link]');
      if (link && e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        const href = link.getAttribute('href') || '';
        if (e.altKey) {
          showLinkPreview(href, e.clientX, e.clientY);
        } else if (href) {
          this.$router.push(href);
          this.hide();
        }
        return;
      }
      const button = (e.target as Element).closest('.mermaid-wrapper .fullscreen button');
      const diagram = button?.closest('.mermaid-wrapper')?.getAttribute('data-raw');
      if (!diagram) {
        return;
      }
      this.showingMermaid = true;
      (this.$refs.mermaidShower as InstanceType<typeof MermaidShower>).show(diagram);
    },
    rememberLayout(updateGeometry = true) {
      if (!this.visible) return;
      const el = this.$refs.popover as HTMLElement;
      // 只有用户拖动/缩放才更新布局偏好；窗口变小造成的夹紧不覆盖原布局。
      const geometry = !updateGeometry && this.layout ? this.layout : {
        left: el.offsetLeft, top: el.offsetTop,
        width: el.offsetWidth, height: el.offsetHeight,
      };
      this.layout = {
        ...geometry,
        scrollTop: this.pendingScrollTop ?? (this.ready ? (this.$refs.body as HTMLElement).scrollTop : (this.layout?.scrollTop ?? 0)),
      };
      saveLinkPreviewState(this.docId, this.layout);
    },
    rememberScroll() {
      if (!this.ready || this.pendingScrollTop !== null) return;
      clearTimeout(this.scrollTimer);
      this.scrollTimer = setTimeout(() => this.rememberLayout(false), 100);
    },
    restoreScroll() {
      if (this.pendingScrollTop === null || !this.visible) return;
      const body = this.$refs.body as HTMLElement;
      body.scrollTop = this.pendingScrollTop;
      if (Math.abs(body.scrollTop - this.pendingScrollTop) < 1) this.pendingScrollTop = null;
    },
    cancelScrollRestore() {
      this.pendingScrollTop = null;
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
      this.$router.push(DocUtils.docId2HtmlPath(this.docId));
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
      this.rememberLayout(false);
      this.visible = false;
      this.$emit('close');
    },
    /* ---- 标准浮层消失行为(固定时点击/滚动豁免，Esc 优先关闭图表查看器) ---- */
    onOutsidePointer(e: Event) {
      if (!this.visible || !this.armed) {
        return;
      }
      const root = this.$refs.popover as HTMLElement;
      // 重试等操作可能在冒泡结束前移除按钮，事件原始路径仍能识别为卡片内部点击。
      if (!e.composedPath().includes(root)) {
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
  },
  mounted() {
    this.show()
    // capture捕获window与嵌套容器(如侧栏)的滚动
    document.addEventListener('scroll', this.onScrollCapture, true)
    document.addEventListener('click', this.onOutsidePointer)
    document.addEventListener('contextmenu', this.onOutsidePointer)
    window.addEventListener('resize', this.clampToViewport)
    // 预览正文/元信息卡片异步加载会持续撑高浮窗 尺寸一变就重新夹紧视口
    this.resizeObserver = new ResizeObserver(() => {
      if (this.visible) {
        this.clampToViewport()
        this.restoreScroll()
      }
    })
    this.resizeObserver.observe(this.$refs.popover as HTMLElement)
  },
  beforeUnmount() {
    this.rememberLayout(false)
    this.disposed = true
    clearTimeout(this.scrollTimer)
    document.removeEventListener('scroll', this.onScrollCapture, true)
    document.removeEventListener('click', this.onOutsidePointer)
    document.removeEventListener('contextmenu', this.onOutsidePointer)
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

.preview-error {
  padding: var(--spacing-md) 0;
  color: var(--secondary-text-color);
}

.retry-btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--card-bg-color);
  color: var(--primary-color);
  cursor: pointer;
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
