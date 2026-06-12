<template>
  <transition name="ctx">
    <div ref="root" class="context-menu" role="menu" v-show="visible" @contextmenu.prevent>
      <button
        type="button"
        class="menu-item"
        role="menuitem"
        @click="$emit('toggleFixed');hide()"
      >
        <el-icon><place /></el-icon>
        <span>{{ fixed ? '取消固定标签栏' : '固定标签栏' }}</span>
      </button>
      <div class="menu-divider" role="separator"></div>
      <button
        type="button"
        class="menu-item"
        role="menuitem"
        :disabled="cateList.length <= 1"
        @click="closeCurrent"
      >
        <el-icon><close /></el-icon>
        <span>关闭标签</span>
      </button>
      <button
        type="button"
        class="menu-item"
        role="menuitem"
        :disabled="cateList.length <= 1"
        @click="closeOthers"
      >
        <el-icon><circle-close /></el-icon>
        <span>关闭其他标签</span>
      </button>
    </div>
  </transition>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Close, CircleClose, Place } from "@element-plus/icons-vue";
import Category from "@/dto/Category";
import DocUtils from "@/util/DocUtils";

export default defineComponent({
  props: {
    fixed: {
      type: Boolean,
      required: true
    }
  },
  components: {
    Close,
    CircleClose,
    Place
  },
  emits: ['toggleFixed'],
  data() {
    return {
      docLink: "",
      visible: false,
      cateLink: "",
    };
  },
  computed: {
    cateList(): string[] {
      return this.$store.state.currentCategoryList
    },
    currentCate(): Category {
      return this.$store.state.currentCategory;
    }
  },
  methods: {
    show(cateLink: string, x: number, y: number) {
      this.cateLink = cateLink;
      const popover: HTMLElement = this.$refs.root as HTMLElement;
      this.visible = true;
      popover.style.top = y + "px";
      popover.style.left = x + "px";
      // 渲染出尺寸后夹紧到视口内 贴边右键时不再溢出
      this.$nextTick(() => {
        const rect = popover.getBoundingClientRect();
        popover.style.left = Math.min(x, window.innerWidth - rect.width - 8) + "px";
        popover.style.top = Math.min(y, window.innerHeight - rect.height - 8) + "px";
        // 焦点入菜单 方向键/Esc直接可用; preventScroll避免聚焦触发滚动被"滚动即关"误杀
        (popover.querySelector('.menu-item:not(:disabled)') as HTMLElement)?.focus({ preventScroll: true });
      });
    },
    hide() {
      this.visible = false;
    },
    closeCurrent(){
      let index = this.cateList.indexOf(this.cateLink);
      this.$store.commit('removeFromCategoryList', this.cateLink);
      if (index > 0) {
        index--;
      }
      const docId = DocUtils.docUrl2Id(this.cateList[index]);
      // 只有在当前目录与要被关闭的菜单项相同时才跳转
      if (this.currentCate.link == this.cateLink) {
        this.$router.push('/doc/' + docId);
      }
      this.hide();
    },
    close(cateLink: string) {
      this.cateLink = cateLink
      this.closeCurrent()
    },
    closeOthers(){
      this.$store.commit('removeFromCategoryListExcept', this.cateLink);
      // 右键的不是当前文档时才需要跳转
      if (this.currentCate.link != this.cateLink) {
        this.$router.push('/doc/' + DocUtils.docUrl2Id(this.cateList[0]));
      }
      this.hide();
    },
    // ---- 标准右键菜单消失行为: 点外部/右键外部/Esc/滚动/失焦窗口 ----
    onGlobalPointer(e: Event) {
      if (!this.visible) {
        return
      }
      const root = this.$refs.root as HTMLElement;
      if (!root.contains(e.target as Node)) {
        this.hide();
      }
    },
    onGlobalKeydown(e: KeyboardEvent) {
      if (!this.visible) {
        return
      }
      if (e.key == 'Escape') {
        this.hide();
        return;
      }
      // 方向键在菜单项间循环
      if (e.key == 'ArrowDown' || e.key == 'ArrowUp') {
        e.preventDefault();
        const root = this.$refs.root as HTMLElement;
        const items = Array.from(root.querySelectorAll('.menu-item:not(:disabled)')) as HTMLElement[];
        if (!items.length) {
          return;
        }
        const i = items.indexOf(document.activeElement as HTMLElement);
        const next = e.key == 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
        items[next].focus();
      }
    },
    onGlobalScroll() {
      if (this.visible) {
        this.hide();
      }
    }
  },
  mounted(){
    document.addEventListener('click', this.onGlobalPointer);
    // 标签上的右键被DocTabNav stopPropagation 不会传到这里; 其他区域右键则收起菜单
    document.addEventListener('contextmenu', this.onGlobalPointer);
    document.addEventListener('keydown', this.onGlobalKeydown);
    // capture捕获window与任意嵌套容器的滚动
    document.addEventListener('scroll', this.onGlobalScroll, true);
    window.addEventListener('blur', this.hide);
  },
  unmounted(){
    document.removeEventListener('click', this.onGlobalPointer);
    document.removeEventListener('contextmenu', this.onGlobalPointer);
    document.removeEventListener('keydown', this.onGlobalKeydown);
    document.removeEventListener('scroll', this.onGlobalScroll, true);
    window.removeEventListener('blur', this.hide);
  },
});
</script>

<style lang="less" scoped>
.context-menu {
  position: fixed;
  z-index: var(--z-popup);
  min-width: 170px;
  padding: var(--spacing-xs);
  background-color: var(--elevated-bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  // 注意: 不要过渡top/left 连续在不同标签右键时菜单应直接出现在新位置而非滑过去
}

.menu-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  padding: 7px 10px;
  border: none;
  background: none;
  border-radius: var(--radius-md);
  color: var(--main-text-color);
  font-size: var(--font-size-sm);
  text-align: left;
  cursor: pointer;
  transition: background-color var(--transition-fast);

  .el-icon {
    font-size: var(--font-size-base);
    color: var(--secondary-text-color);
  }

  &:hover:not(:disabled),
  &:focus-visible:not(:disabled) {
    background-color: var(--hover-bg-color);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.menu-divider {
  height: 1px;
  margin: var(--spacing-xs) 6px;
  background-color: var(--divider-color);
}

// 出现: 自右键点位轻微放大浮现; 消失: 快速淡出
.ctx-enter-active {
  transition: opacity var(--transition-fast), transform var(--transition-fast);
  transform-origin: top left;
}

.ctx-leave-active {
  transition: opacity var(--transition-fast);
}

.ctx-enter-from {
  opacity: 0;
  transform: scale(0.96) translateY(-2px);
}

.ctx-leave-to {
  opacity: 0;
}
</style>
