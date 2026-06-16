<template>
  <el-scrollbar 
    wrap-class="tab-container-wrapper" 
    class="tab-container" 
    v-bind="$attrs"
    ref="tabContainer" 
    :style="{top: parentShowHeader? 60 + 'px': 0, position: fixed? 'sticky': 'static'}"
  >
    <!-- 标签与关闭键为两个平级真按钮(button不可嵌套button) 关闭键因此键盘可达 -->
    <transition-group tag="div" name="tab" class="tab-list">
      <div
        class="nav-tab-item"
        v-for="cate in cateList"
        :key="cate"
        :url="cate"
        :class="{
          'active': docUrl2Id(currentCate.link) == docUrl2Id(cate)
        }"
        @contextmenu="handleContextMenuEvent(cate, $event)"
        @dblclick="$emit('dbclick')"
      >
        <button
          type="button"
          class="tab-main"
          :title="cateName(cate)"
          :aria-current="docUrl2Id(currentCate.link) == docUrl2Id(cate) ? 'page' : undefined"
          @click="$router.push('/doc/' + docUrl2Id(cate))"
        >
          <span class="tab-category" aria-hidden="true">{{findRootCategoryFirstLetter(cate)}}</span>
          <span class="tab-name">{{ cateName(cate) }}</span>
        </button>
        <button
          type="button"
          v-if="cateList.length > 1"
          class="close-btn"
          :aria-label="'关闭 ' + cateName(cate)"
          @click.prevent.stop="close(cate)"
          @dblclick.stop
        >
          <el-icon><close-bold /></el-icon>
        </button>
      </div>
    </transition-group>
  </el-scrollbar>
  <tab-nav-context-menu ref="contextMenu" @toggle-fixed="fixed = !fixed" :fixed="fixed"/>
</template>

<script lang="ts" setup>
import {CloseBold} from '@element-plus/icons-vue'
</script>

<script lang="ts">
import Category from "@/dto/Category";
import DocUtils from "@/util/DocUtils";
import { defineComponent } from "vue";
import TabNavContextMenu from "./TabNavContextMenu.vue";
import CategoryService from '@/service/CategoryService';
import { ElScrollbar } from 'element-plus';

export default defineComponent({
  inject: ['showHeader'],
  emits: ['dbclick'],
  components: {
    TabNavContextMenu
  },
  data(){
    return {
      parentShowHeader: true,
      fixed: true,
      allCateList: [] as Category[]
    }
  },
  watch: {
    showHeader: {
      handler(val){
        this.parentShowHeader = val;
      },
      immediate: true,
    },
    currentCate() {
      this.$nextTick(() => {
        const activeTab = document.querySelector(`.tab-container-wrapper [url="${this.currentCate.link}"]`) as HTMLElement
        if (!activeTab) {
          return
        }
        // nearest: 只做必要的横向滚动 避免裸scrollIntoView把整页垂直滚到标签栏
        activeTab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
      })

    }

  },
  mounted() {
    const dom  = document.querySelector('.tab-container-wrapper') as HTMLElement
    dom.addEventListener('wheel', (e: WheelEvent) => {
      dom.scrollTo(dom.scrollLeft + e.deltaY,0)
      e.stopPropagation()
      return e.preventDefault()
    })
  },
  async created() {
    this.allCateList = await CategoryService.getCategoryList()
  },
  methods: {
    docUrl2Id: DocUtils.docUrl2Id,
    cateName(url: string): string {
      const arr = this.docUrl2Id(url).split("-");
      return arr[arr.length - 1];
    },
    handleContextMenuEvent(cateLink: string, e: MouseEvent) {
      (this.$refs.contextMenu as any).show(cateLink, e.clientX, e.clientY);
      e.preventDefault();
      e.stopPropagation();
    },
    close(cateLink: string) {
      (this.$refs.contextMenu as InstanceType<typeof TabNavContextMenu>).close(cateLink)
    },
    findRootCategoryFirstLetter(cateLink: string): string {
      function findTarget(cateList: Category[]): Category | null {
        if (!cateList) {
          return null
        }
        for(let cate of cateList) {
          if (cate.link == cateLink) {
            return cate
          }
          const fromChildren = findTarget(cate.chidren)
          if (fromChildren) {
            return fromChildren
          }
        }
        return null
      }
      let root = findTarget(this.allCateList)
      if (!root) {
        return '📋'
      }
      return Array.from(root.name)[0] || '📋';
    }
  },
  computed: {
    cateList() {
      return this.$store.state.currentCategoryList;
    },
    currentCate(): Category {
      return this.$store.state.currentCategory;
    },
  },
});
</script>

<style lang="less" scoped>
.tab-container {
  transition: top var(--transition-normal);
  height: 40px;
  white-space: nowrap;
  z-index: var(--z-float);
  padding: 4px 0;
  // sticky吸附时正文从下方滚过 需要不透明背景
  background-color: var(--card-bg-color);
  border-bottom: 1px solid var(--divider-color);

  :deep(.el-scrollbar__bar.is-vertical) {
    display: none;
  }

  :deep(.el-scrollbar__wrap) {
    display: flex;
    align-items: center;
    // 两端渐隐: 提示横向还有更多标签(滚动条仅hover才现身)
    mask-image: linear-gradient(to right, transparent, #000 12px, #000 calc(100% - 12px), transparent);
  }
}

// 标签条在 <=@bp-desktop(1280) 收窄, 给顶栏其余元素留位; 原 1366 游离断点收敛(不污染宽档)
@media screen and (max-width: @bp-desktop) {
  .tab-container {
    max-width: 44%;
  }
}

.tab-list {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 var(--spacing-sm);
}

// 胶囊式标签: 未激活透明 悬浮浅底 激活主色淡底 不再依赖同色底边hack
.nav-tab-item {
  display: inline-flex;
  align-items: center;
  height: 30px;
  min-width: 120px;
  max-width: 200px;
  padding: 0 4px 0 6px;
  border-radius: var(--radius-md);
  background-color: transparent;
  color: var(--secondary-text-color);
  font-size: var(--font-size-sm);
  transition: background-color var(--transition-fast), color var(--transition-fast);
  cursor: pointer;
  position: relative;
  flex-shrink: 0;

  &:hover {
    color: var(--main-text-color);
    background-color: var(--hover-bg-color);
  }

  // 悬浮或键盘焦点进入时显现关闭键
  &:hover .close-btn,
  &:focus-within .close-btn {
    opacity: 1;
    visibility: visible;
  }

  &.active {
    color: var(--primary-color);
    background-color: var(--primary-light-color);
    font-weight: 500;

    .tab-category {
      background-color: var(--primary-color);
      color: white;
    }
  }
}

// 标签主体与关闭键是两个平级按钮 重置原生外观 由外层胶囊承担视觉
.tab-main {
  flex: 1;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 100%;
  padding: 0;
  margin: 0;
  border: none;
  background: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
  text-align: left;
}

.tab-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 根分类首字徽章 前置作"favicon"
.tab-category {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: var(--primary-light-color);
  color: var(--primary-color);
  font-size: var(--font-size-xs);
  font-weight: 600;
  flex-shrink: 0;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.close-btn {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: none;
  border-radius: 50%;
  margin-left: 2px;
  font-size: var(--font-size-xs);
  opacity: 0;
  visibility: hidden;
  transition: opacity var(--transition-fast), background-color var(--transition-fast);
  color: inherit;
  cursor: pointer;

  &:hover {
    background-color: color-mix(in srgb, var(--main-text-color) 12%, transparent);
  }
}

// 标签开/关动画: 新标签淡入上浮 关闭后兄弟标签平滑补位(FLIP move)
.tab-enter-from {
  opacity: 0;
  transform: translateY(4px) scale(0.96);
}

.tab-leave-to {
  opacity: 0;
  transform: scale(0.92);
}

.tab-enter-active,
.tab-leave-active {
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.tab-move {
  transition: transform var(--transition-normal);
}
</style>