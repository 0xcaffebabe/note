<template>
  <div ref="root" v-show="showAside">
    <el-aside width="280px" :lock-scroll="false" class="doc-aside">
      <div
        class="category-wrapper"
        :style="{ height: parentShowHeader ? 'calc(100vh - 60px)' : '100vh' }"
      >
        <div class="category-header">
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

<script lang="ts">
import { defineComponent } from "vue";
import CategoryList from "../category/CategoryList.vue";
import { ArrowLeftBold, ArrowRightBold, Reading } from "@element-plus/icons-vue";
import config from "@/config";

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
    siteName() {
      return config.siteName;
    },
  },
  methods: {
    // 移动目录的滚动条 让当前选中菜单项处于可视区域
    syncCategoryListScrollBar() {
      const document = this.$refs.root as HTMLElement;
      const activeMenu: HTMLElement = document.querySelector(
        ".el-menu-item.is-active"
      ) as HTMLElement;
      if (!activeMenu) {
        return
      }
      activeMenu.scrollIntoView({behavior: 'smooth'})
    },
    updateCurrentCategory(doc: string) {
      const categoryListRef: any = this.$refs.categoryList;
      categoryListRef.updateCurrentCategory(doc);
    },
  },
  watch: {
    showHeader: {
      handler(val) {
        this.parentShowHeader = val;
      },
      immediate: true,
    },
  },
  setup() {
    return {
      ArrowLeftBold,
      ArrowRightBold,
      Reading,
    }
  },
});
</script>


<style lang="less" scoped>
.doc-aside {
  background-color: transparent;
  border: none;
  box-shadow: none;
}

.category-wrapper {
  transition: all 0.3s ease;
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
  width: 280px;
  background-color: var(--card-bg-color);
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
  box-shadow: var(--shadow-lg);
  z-index: 9;
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
    background: linear-gradient(135deg, #409eff 0%, #6979f8 100%);
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
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.1);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(0,0,0,0.2);
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

body[theme=dark] {
  .category-wrapper {
    background-color: var(--dark-card-bg-color);
    border: 1px solid var(--default-dark-border-color);
  }

  .category-header {
    border-bottom: 1px solid var(--default-dark-border-color);
  }

  .sidebar-logo .logo-text {
    color: var(--dark-text-color);
  }

  .aside-toggle-btn {
    background-color: var(--dark-card-bg-color);
    border: 1px solid var(--default-dark-border-color);
    
    &:hover {
      background-color: var(--dark-hover-bg-color);
    }
  }
}
</style>