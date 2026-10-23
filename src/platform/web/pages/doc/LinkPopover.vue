<template>
  <!-- teleport到body: 宿主(侧栏等)自带z-index会创建层叠上下文 浮窗在其内部永远盖不过外部浮动控件 -->
  <teleport to="body">
  <transition name="fade">
    <div
      ref="popover"
      class="popover"
      :class="{ 'has-custom-size': hasCustomSize }"
      :style="{ zIndex: `calc(var(--z-popup) + ${stackOrder})` }"
      v-show="visible && !minimized"
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
          <button type="button" class="action-btn" title="隐藏预览" aria-label="隐藏预览" @click.stop="$emit('minimize')">
            <el-icon><minus /></el-icon>
          </button>
          <button type="button" class="action-btn" title="关闭 (Esc)" aria-label="关闭预览" @click="hide0">
            <el-icon><close /></el-icon>
          </button>
        </div>
      </div>
      <div class="popover-content">
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
          <template v-else>
            <div class="markdown-section preview-markdown" ref="previewSection" v-html="contentHtml" draggable="false" @click="onPreviewClick"></div>
            <footer class="preview-history" aria-label="提交历史">
              <history-list v-if="file.commitList.length" :file="file" :doc="docId" />
              <p v-else>暂无提交历史</p>
            </footer>
          </template>
        </div>
        <aside
          v-if="ready && (contents.length || relatedLinks.length || docLinks.length)"
          class="preview-nav"
          aria-label="预览导航"
          @mouseleave="activeNavigation = ''"
          @focusout="onNavigationFocusOut"
        >
          <div class="preview-nav-tabs">
            <button
              v-if="contents.length"
              type="button"
              class="preview-nav-tab"
              aria-label="本页章节"
              :title="`本页章节（${headingCount}）`"
              :aria-expanded="activeNavigation === 'toc'"
              @mouseenter="activeNavigation = 'toc'"
              @focus="activeNavigation = 'toc'"
              @click="activeNavigation = 'toc'"
            >
              <el-icon><Tickets /></el-icon>
              <span class="preview-nav-count" aria-hidden="true">{{ headingCount }}</span>
            </button>
            <button
              v-if="relatedLinks.length || docLinks.length"
              type="button"
              class="preview-nav-tab"
              aria-label="相关链接"
              :title="`相关链接（${relatedLinks.length + docLinks.length}）`"
              :aria-expanded="activeNavigation === 'related'"
              @mouseenter="activeNavigation = 'related'"
              @focus="activeNavigation = 'related'"
              @click="activeNavigation = 'related'"
            >
              <el-icon><Connection /></el-icon>
              <span class="preview-nav-count" aria-hidden="true">{{ relatedLinks.length + docLinks.length }}</span>
            </button>
          </div>
          <section v-if="contents.length" v-show="activeNavigation === 'toc'" class="preview-nav-panel" aria-label="本页章节">
            <div class="preview-nav-heading">本页章节</div>
            <contents-list :doc="docId" :contents="contents" :content-root="previewRoot!" :scroll-container="previewScrollRoot!" mode="drawer" @item-click="scrollToHeading" />
          </section>
          <div v-if="relatedLinks.length || docLinks.length" v-show="activeNavigation === 'related'" class="preview-nav-panel">
            <related-content inline :related="relatedLinks" :doc-links="docLinks" :content-root="previewRoot!" :scroll-container="previewScrollRoot!" @navigate="hide" />
          </div>
        </aside>
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
import { Close, Connection, Minus, Place, Tickets, TopRight } from "@element-plus/icons-vue";
import CategoryItemContent from "./category/CategoryItemContent.vue";
import DocFileInfo from "@/core/domain/DocFileInfo";
import DocUtils from "@/core/util/DocUtils";
import { clamp, clampToBounds } from "@/core/util/GeometryUtils";
import { readLinkPreviewState, saveLinkPreviewState } from "./LinkPreviewState";
import { showLinkPreview } from "./LinkPreview";
import DocPostRender from "@/platform/web/render/DocPostRender";
import MermaidUtils from "@/platform/web/util/MermaidUtils";
import MermaidShower from "./mermaid-shower/MermaidShower.vue";
import ContentsList from "./contents/ContentsList.vue";
import RelatedContent from "./RelatedContent.vue";
import HistoryList from "./commit/HistoryList.vue";
import Content from "@/core/domain/Content";
import { RelatedLink } from "@/core/domain/RelatedLink";

export default defineComponent({
  components: {
    Close,
    Minus,
    Place,
    TopRight,
    CategoryItemContent,
    MermaidShower,
    ContentsList,
    RelatedContent,
    HistoryList,
    Tickets,
    Connection,
  },
  props: {
    docId: { type: String, required: true },
    docLink: { type: String, required: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    stackOrder: { type: Number, default: 0 },
    pinned: { type: Boolean, default: false },
    minimized: { type: Boolean, default: false },
  },
  emits: ['activate', 'close', 'pin-change', 'minimize'],
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
      activeNavigation: '' as '' | 'toc' | 'related',
      previewRoot: null as HTMLElement | null,
      previewScrollRoot: null as HTMLElement | null,
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
    },
    contents(): Content[] {
      return this.$services.docService.getContent(this.contentHtml);
    },
    headingCount(): number {
      const count = (items: Content[]): number => items.reduce((total, item) => total + 1 + count(item.chidren), 0);
      return count(this.contents);
    },
    relatedLinks(): RelatedLink[] {
      return this.file.relatedLinks || [];
    },
    docLinks(): RelatedLink[] {
      return this.$services.docService.resolveDocLinks(this.contentHtml, this.docId, this.relatedLinks.map(link => link.href));
    },
  },
  watch: {
    minimized(value: boolean) {
      if (value) {
        this.activeNavigation = '';
        this.stopInteraction?.();
        // watcher 在 DOM 隐藏前保存阅读位置，保持卡片及异步内容挂载。
        this.rememberLayout(false);
        clearTimeout(this.scrollTimer);
        this.armed = false;
      } else {
        this.pendingScrollTop ??= this.layout?.scrollTop ?? 0;
        this.$nextTick(() => {
          this.clampToViewport();
          this.restoreScroll();
          this.armed = true;
        });
      }
    },
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
        this.armed = !this.minimized;
      });
      this.initDoc();
    },
    focus() {
      (this.$refs.popover as HTMLElement).focus({ preventScroll: true });
    },
    clampToViewport() {
      if (!this.visible || this.minimized) {
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
      this.activeNavigation = '';
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
      this.previewRoot = previewSection;
      this.previewScrollRoot = this.$refs.body as HTMLElement;
      this.ready = true;
      // 加载时固定/切到后台可能先保存了骨架屏尺寸，正文就绪后补记自动展开的大小。
      if (!this.layout || !this.hasCustomSize) this.rememberLayout();
    },
    onNavigationFocusOut(e: FocusEvent) {
      const navigation = e.currentTarget as HTMLElement;
      // 鼠标切换面板会隐藏旧面板中已聚焦的链接，此时仍停留在导航内。
      if (!navigation.contains(e.relatedTarget as Node | null) && !navigation.matches(':hover')) {
        this.activeNavigation = '';
      }
    },
    scrollToHeading(id: string) {
      const heading = Array.from(this.previewRoot?.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6') || [])
        .find(element => element.id === id);
      const body = this.previewScrollRoot;
      if (!heading || !body) return;
      this.cancelScrollRestore();
      body.scrollTo({
        top: body.scrollTop + heading.getBoundingClientRect().top - body.getBoundingClientRect().top,
        behavior: 'smooth',
      });
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
      // 已收起的卡片没有布局尺寸，不能覆盖此前保存的布局与阅读位置。
      if (!el.offsetWidth || !el.offsetHeight) return;
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
      if (!this.ready || this.minimized || this.pendingScrollTop !== null) return;
      clearTimeout(this.scrollTimer);
      this.scrollTimer = setTimeout(() => this.rememberLayout(false), 100);
    },
    restoreScroll() {
      if (this.pendingScrollTop === null || !this.visible || this.minimized) return;
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
      if (this.pin || this.showingMermaid || this.minimized) {
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
      if (!this.visible || this.minimized || !this.armed) {
        return;
      }
      // 导航中的预览入口需要保留临时卡片，才能在菜单中一键收起全部。
      if (e.composedPath().some(target => target instanceof HTMLElement && target.hasAttribute('data-link-preview-control'))) {
        return;
      }
      const root = this.$refs.popover as HTMLElement;
      // 重试等操作可能在冒泡结束前移除按钮，事件原始路径仍能识别为卡片内部点击。
      if (!e.composedPath().includes(root)) {
        this.hide();
      }
    },
    onScrollCapture(e: Event) {
      if (!this.visible || this.minimized) {
        return;
      }
      // 卡片内部滚动（包括恢复阅读位置）不能关闭其他已恢复的临时卡片。
      if (e.target instanceof Element && e.target.closest('.popover')) {
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
  --preview-nav-width: calc(var(--spacing-xl) + var(--spacing-sm));
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

.popover-content {
  position: relative;
  container-type: inline-size;
  display: flex;
  flex: 1;
  min-height: 0;
  max-height: min(600px, 70vh);
  overflow: hidden;
}

.popover-body {
  padding: var(--spacing-sm) var(--preview-nav-width) var(--spacing-md) var(--spacing-sm);
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  // 位置由恢复逻辑管理，避免正文替换骨架屏后浏览器再次按底部历史调整滚动。
  overflow-anchor: none;
  cursor: default;
}

.has-custom-size .popover-content {
  max-height: none;
}

.preview-history {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-color);
  color: var(--secondary-text-color);
  font-size: var(--font-size-sm);
  overflow-wrap: anywhere;
}

// 导航吸附在卡片右缘，展开面板覆盖正文，不挤压阅读列；离开或移出焦点后收起。
.preview-nav {
  position: absolute;
  top: var(--spacing-sm);
  right: 0;
  bottom: var(--spacing-sm);
  width: var(--preview-nav-width);
}

.preview-nav-tabs {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.preview-nav-tab {
  display: flex;
  flex: 0 1 var(--spacing-3xl);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  width: 100%;
  height: var(--spacing-3xl);
  min-height: var(--spacing-2xl);
  box-sizing: border-box;
  padding: var(--spacing-xs) 0;
  border: 1px solid var(--border-color);
  border-right: 0;
  border-radius: var(--radius-lg) 0 0 var(--radius-lg);
  background: var(--card-bg-color);
  color: var(--secondary-text-color);
  font-size: var(--font-size-lg);
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: color var(--transition-fast), box-shadow var(--transition-fast);

  &:hover, &[aria-expanded='true'] {
    color: var(--primary-color);
    box-shadow: var(--shadow-lg);
  }
}

.preview-nav-count {
  flex-shrink: 0;
  min-width: var(--spacing-md);
  padding: 0 var(--spacing-xs);
  border-radius: 999px;
  background: var(--primary-color);
  color: var(--el-color-white);
  font-size: var(--font-size-xs);
  font-weight: 600;
  line-height: var(--font-size-xl);
}

.preview-nav-panel {
  position: absolute;
  top: 0;
  right: 100%;
  bottom: 0;
  width: min(var(--doc-related-w), calc(100cqw - var(--spacing-2xl)));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--elevated-bg-color);
  box-shadow: var(--shadow-md);

  :deep(.toc-container) {
    min-width: 0;
    min-height: 0;
  }

  :deep(.related-inline), :deep(.rf-panel) {
    height: 100%;
    max-height: none;
    min-height: 0;
  }

  :deep(.rf-panel) {
    box-sizing: border-box;
    border: 0;
  }
}

.preview-nav-heading {
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--divider-color);
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--main-text-color);
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
