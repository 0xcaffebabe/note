<template>
  <el-drawer
    v-model="showCategory"
    direction="rtl"
    :with-header="false"
    size="70%"
    :close-on-click-modal="true"
    :append-to-body="false"
    custom-class="mobile-category-drawer"
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
      <div class="category-content">
        <category-list :doc="doc" @first-load="handleFirstLoad"/>
      </div>
    </div>
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import CategoryList from "../../category/CategoryList.vue";
import { ArrowRightBold } from "@element-plus/icons-vue";

export default defineComponent({
  props: {
    doc: {
      required: true,
      type: String,
    },
  },
  computed: {
    showCategory: {
      get() {
        return this.$store.state.showCategory
      },
      set(newVal: boolean) {
        this.$store.commit('setShowCategory', newVal)
      }
    }
  },
  watch: {
    showCategory() {
      if (this.showCategory) {
        this.$nextTick(() => {
          this.syncCategoryListScrollBar()
        })
      }
    }
  },
  methods: {
    handleFirstLoad() {
      this.$nextTick(() => {
        this.syncCategoryListScrollBar()
      })
    },
    // 移动目录的滚动条 让当前选中菜单项处于可视区域
    syncCategoryListScrollBar() {
      const activeMenu: HTMLElement = document.querySelector(
        ".el-menu-item.is-active"
      ) as HTMLElement;
      if (!activeMenu) {
        return
      }
      activeMenu.scrollIntoView({behavior: 'smooth'})
    },
  },
  components: { CategoryList, ArrowRightBold },
  data() {
    return {
    };
  },
});
</script>

<style lang="less">
.mobile-category-drawer {
  .el-drawer__body {
    padding: 0 !important;
    background-color: var(--card-bg-color);
  }
}
</style>
<style lang="less" scoped>
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

.category-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-sm);
  
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

body[theme=dark] {
  .mobile-category-drawer {
    .el-drawer__body {
      background-color: var(--dark-card-bg-color);
    }
  }
  
  .mobile-category-wrapper {
    background-color: var(--dark-card-bg-color);
  }
  
  .drawer-header {
    border-bottom: 1px solid var(--default-dark-border-color);
    background-color: var(--dark-card-bg-color);
    
    .close-btn {
      background-color: var(--dark-card-bg-color);
      border: 1px solid var(--default-dark-border-color);
      
      &:hover {
        background-color: var(--dark-hover-bg-color);
      }
    }
    
    .drawer-title {
      color: var(--dark-text-color);
    }
  }
}
</style>