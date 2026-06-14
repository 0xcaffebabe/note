<template>
  <!-- 桌面: 文档流内的粘性侧栏 + 收起按钮 -->
  <template v-if="!isMobile">
    <div ref="root" v-show="showAside">
      <el-aside width="280px" :lock-scroll="false" class="doc-aside">
        <div
          class="category-wrapper"
          :style="{
            height: parentShowHeader ? 'calc(100vh - 60px)' : '100vh',
            top: parentShowHeader ? '60px' : '0',
          }"
        >
          <!-- 顶栏显示时不重复展示品牌区 避免双logo堆叠 -->
          <div class="category-header" v-if="!parentShowHeader">
            <router-link to="/home" class="sidebar-logo">
              <div class="logo-icon">
                <el-icon><Reading /></el-icon>
              </div>
              <span class="logo-text">{{ siteName }}</span>
            </router-link>
          </div>
          <div class="category-content">
            <keep-alive>
              <category-list ref="categoryList" :doc="doc" />
            </keep-alive>
          </div>
        </div>
      </el-aside>
    </div>
    <!-- TODO(P-later): :offset=384 为视觉垂直定位魔法值, 后续可改为基于视口的居中计算 -->
    <el-affix :offset="384" class="toggle-affix">
      <el-button
        class="aside-toggle-btn"
        type="default"
        size="small"
        @click="$emit('toggleAside')"
        :class="{ active: showAside }"
        :icon="showAside ? ArrowLeftBold : ArrowRightBold"
        circle
        :title="showAside ? '隐藏侧边栏' : '显示侧边栏'"
      />
    </el-affix>
  </template>

  <!-- 移动: 右侧抽屉(由 store.showCategory 控制, 供底部操作栏/左滑手势开启) -->
  <el-drawer
    v-else
    v-model="showCategory"
    direction="rtl"
    :with-header="false"
    size="70%"
    :close-on-click-modal="true"
    :append-to-body="false"
    class="mobile-category-drawer"
    :show-close="false"
  >
    <div class="mobile-category-wrapper">
      <div class="drawer-header">
        <el-button
          type="default"
          size="small"
          @click="showCategory = false"
          :icon="ArrowRightBold"
          circle
          class="close-btn"
        />
        <h3 class="drawer-title">目录</h3>
      </div>
      <div class="category-content mobile">
        <category-list ref="categoryList" :doc="doc" @first-load="handleFirstLoad" />
      </div>
    </div>
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import CategoryList from "../category/CategoryList.vue";
import { ArrowLeftBold, ArrowRightBold, Reading } from "@element-plus/icons-vue";
import config from "@/config";
import { isMobile } from "@/composables/useBreakpoint";

export default defineComponent({
  components: {
    CategoryList,
  },
  emits: ["toggleAside"],
  inject: ["showHeader"],
  props: {
    showAside: Boolean,
    doc: String,
  },
  data() {
    return {
      parentShowHeader: true,
    };
  },
  computed: {
    isMobile() {
      return isMobile.value;
    },
    siteName() {
      return config.siteName;
    },
    // 移动抽屉显隐: 由全局 store 承载(底部操作栏 / 左滑手势 / 路由切换 均可控制)
    showCategory: {
      get(): boolean {
        return this.$store.state.showCategory;
      },
      set(val: boolean) {
        this.$store.commit("setShowCategory", val);
      },
    },
  },
  methods: {
    // 移动目录的滚动条 让当前选中菜单项处于可视区域
    syncCategoryListScrollBar() {
      const activeMenu = document.querySelector(
        ".el-menu-item.is-active"
      ) as HTMLElement | null;
      if (!activeMenu) {
        return;
      }
      activeMenu.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    handleFirstLoad() {
      this.$nextTick(() => this.syncCategoryListScrollBar());
    },
    updateCurrentCategory(doc: string) {
      // 移动抽屉懒渲染时 categoryList 可能尚未挂载, 空安全调用
      (this.$refs.categoryList as any)?.updateCurrentCategory(doc);
    },
  },
  watch: {
    showHeader: {
      handler(val) {
        this.parentShowHeader = val;
      },
      immediate: true,
    },
    // 移动抽屉打开后 滚动到当前选中项
    showCategory(val: boolean) {
      if (val && this.isMobile) {
        this.$nextTick(() => this.syncCategoryListScrollBar());
      }
    },
  },
  setup() {
    return {
      ArrowLeftBold,
      ArrowRightBold,
      Reading,
    };
  },
});
</script>


<style lang="less" scoped>
.doc-aside {
  background-color: transparent;
  border: none;
  box-shadow: none;
  // 撑满整列高度: sticky的category-wrapper需要在父容器内有可滑动行程才能生效
  height: 100%;
}

// 粘性侧栏: 跟随文档流占位 不再用fixed+魔法坐标拼接
.category-wrapper {
  transition: all 0.3s ease;
  position: sticky;
  overflow: hidden;
  width: 280px;
  background-color: var(--card-bg-color);
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
  box-shadow: var(--shadow-lg);
  z-index: var(--z-aside);
  display: flex;
  flex-direction: column;
}

.category-header {
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;

  .logo-icon {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-md);
    background: linear-gradient(135deg, var(--primary-color) 0%, #6979f8 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 16px;
    flex-shrink: 0;
  }

  .logo-text {
    font-size: 1.05em;
    font-weight: 600;
    color: var(--main-text-color);
    white-space: nowrap;
  }

  &:hover .logo-text {
    color: var(--primary-color);
  }
}

.category-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-sm) 0;

  &.mobile {
    padding: var(--spacing-sm);
  }

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb-color);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover-color);
  }
}

.toggle-affix {
  flex: 0 0 0;
  width: 0;
  overflow: visible;
  height: 100px;
}

.aside-toggle-btn {
  padding: 10px;
  width: 36px;
  height: 36px;
  border: none;
  background-color: var(--card-bg-color);
  box-shadow: var(--shadow-md);
  transition: all 0.25s ease;
  z-index: 10;

  &:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
    background-color: var(--hover-bg-color);
  }

  &.active {
    margin-left: 10px;
  }
}

// 移动抽屉
.mobile-category-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--card-bg-color);
}

.drawer-header {
  padding: var(--spacing-md) var(--spacing-md) var(--spacing-sm);
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--card-bg-color);

  .close-btn {
    margin-right: var(--spacing-sm);
    padding: 8px;
    width: 32px;
    height: 32px;
    border: none;
    box-shadow: var(--shadow-md);
    background-color: var(--card-bg-color);
    transition: all 0.25s ease;

    &:hover {
      box-shadow: var(--shadow-lg);
      transform: translateY(-1px);
      background-color: var(--hover-bg-color);
    }
  }

  .drawer-title {
    margin: 0;
    font-size: 1.2em;
    font-weight: 600;
    color: var(--main-text-color);
  }
}

// 暗色专属: 暗色下卡片与悬浮按钮依赖1px描边区分层级 亮色侧无边框 并入单轨会给亮色新增边框 故保留
body[theme=dark] {
  .category-wrapper {
    border: 1px solid var(--border-color);
  }

  .aside-toggle-btn {
    border: 1px solid var(--border-color);
  }

  .drawer-header .close-btn {
    border: 1px solid var(--border-color);
  }
}
</style>

<style lang="less">
// 抽屉体内边距清零(非 scoped 才能命中 el-drawer__body)
.mobile-category-drawer {
  .el-drawer__body {
    padding: 0 !important;
    background-color: var(--card-bg-color);
  }
}
</style>
