<template>
  <!-- teleport到body: 宿主(侧栏等)自带z-index会创建层叠上下文 浮窗在其内部永远盖不过外部浮动控件 -->
  <teleport to="body">
  <transition name="fade">
    <div ref="popover" class="popover" v-show="visible" role="dialog" aria-label="文档预览">
      <!-- 标题栏即拖拽把手 正文区不再劫持mousedown 文字可正常选中 -->
      <div class="popover-header" @mousedown="startDrag">
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
        <div v-else class="markdown-section preview-markdown" ref="previewSection" v-html="contentHtml" draggable="false"></div>
      </div>
    </div>
  </transition>
  </teleport>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Close, Place, TopRight } from "@element-plus/icons-vue";
import CategoryItemContent from "./category/CategoryItemContent.vue";
import DocFileInfo from "@/core/domain/DocFileInfo";
import DocUtils from "@/core/util/DocUtils";
import { clampToBounds } from "@/core/util/GeometryUtils";
import DocPostRender from "@/platform/web/render/DocPostRender";

export default defineComponent({
  components: {
    Close,
    Place,
    TopRight,
    CategoryItemContent,
  },
  data() {
    return {
      docLink: "",
      visible: false,
      loading: false,
      file: new DocFileInfo() as DocFileInfo,
      pin: false,
      // 触发show的那次右键事件会冒泡到document 未"上膛"前不视作外部点击
      armed: false,
      resizeObserver: null as ResizeObserver | null,
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
      this.docLink = docLink;
      this.pin = false;
      this.initDoc();
      (this.$refs.categoryItemContent as any).init(docLink);
      const popover = this.$refs.popover as HTMLElement;
      this.visible = true;
      popover.style.left = x + "px";
      popover.style.top = y + "px";
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
        // 预览内容的代码块高亮
        DocPostRender.highlightCode(this.$refs.previewSection as HTMLElement);
        // 内容撑开高度后再夹一次
        this.clampToViewport();
      });
    },
    /* 拖拽: 把手仅标题栏 监听挂document 快速拖动不脱手 */
    startDrag(e: MouseEvent) {
      if (e.button != 0) {
        return;
      }
      // 操作按钮上不发起拖拽
      if ((e.target as HTMLElement).closest('.action-btn')) {
        return;
      }
      const popover = this.$refs.popover as HTMLElement;
      const startX = e.clientX, startY = e.clientY;
      const origLeft = popover.offsetLeft, origTop = popover.offsetTop;
      const onMove = (me: MouseEvent) => {
        popover.style.left = origLeft + (me.clientX - startX) + "px";
        popover.style.top = origTop + (me.clientY - startY) + "px";
        me.preventDefault();
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        this.clampToViewport();
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      e.preventDefault();
    },
    openDoc() {
      this.$router.push('/doc/' + DocUtils.docUrl2Id(this.docLink));
      this.hide0();
    },
    hide() {
      if (this.pin) {
        return
      }
      this.hide0()
    },
    hide0() {
      this.visible = false;
      (this.$refs.categoryItemContent as any).destroy();
    },
    /* ---- 标准浮层消失行为(固定时点击/滚动豁免 Esc始终强制关闭) ---- */
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
      if (e.key == 'Escape' && this.visible) {
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
    this.resizeObserver?.disconnect()
  }
});
</script>

<style lang="less" scoped>
.popover {
  // 注意: 不要给.popover本体加transition 拖拽改top/left时会跟手延迟
  background-color: var(--elevated-bg-color);
  width: min(400px, 92vw);
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
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 6px var(--spacing-sm) 6px 12px;
  border-bottom: 1px solid var(--divider-color);
  background-color: var(--card-bg-color);
  cursor: move;
  user-select: none;
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
  max-height: min(600px, 70vh);
  overflow-y: auto;
  cursor: default;
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
