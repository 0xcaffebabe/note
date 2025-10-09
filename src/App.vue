<template>
  <el-container class="main-layout">
    <el-header v-show="showHeader">
      <el-affix :offset="0">
        <Header
          @search="showSearch"
          @category-search="showCategorySearch"
        />
      </el-affix>
    </el-header>
    <div class="header-toggle-button" :style="{'margin-top': showHeader ? '60px' : '10px'}">
      <el-button 
        @click="showHeader = !showHeader" 
        size="small" 
        type="default"
        :icon="showHeader ? ArrowUpBold : ArrowDownBold"
        circle
        :title="showHeader ? '隐藏顶部栏' : '显示顶部栏'"
      />
    </div>
    <el-main>
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-main>
  </el-container>
  <Search ref="search" />
  <category-search ref="categorySearch" />
</template>

<script lang="ts">
import { defineComponent, computed, ref } from "vue";
import Header from "./components/header/Header.vue";
import Search from "@/components/search/Search.vue";
import CategorySearch from "@/components/search/CategorySearch.vue";
import { ArrowUpBold, ArrowDownBold } from "@element-plus/icons-vue";
import EventBus from "./components/EventBus";
import ConfigService from "./service/ConfigService";
import CacheService from "./service/CacheService";
import { ElMessage } from "element-plus";

const cateListKey='system::currentCategoryList';
export default defineComponent({
  components: {
    Header,
    Search,
    CategorySearch,
    ArrowUpBold,
    ArrowDownBold,
  },
  setup() {
    const search = ref<InstanceType<typeof Search>>()
    const categorySearch = ref<InstanceType<typeof CategorySearch>>()
    const showSearch = () => {
      search.value?.show()
    }
    const showCategorySearch = () => {
      categorySearch.value?.show()
    }
    return {
      search, showSearch,
      categorySearch, showCategorySearch,
      ArrowUpBold,
      ArrowDownBold
    }
  },
  watch : {
    showHeader(val: boolean) {
      ConfigService.set('showHeader', val)
    }
  },
  provide(){
    return {
      showHeader: computed(() => this.showHeader)
    }
  },
  methods: {
    clearCache(){
      CacheService.getInstance().clear();
      ElMessage.success('清除缓存完成');
    },
  }, 
  data() {
    return {
      showHeader: true,
      lastClickTime: 0,
    };
  },
  created() {
    // 全局快捷键监听
    const actionList = [
      {
        hotkey: 'ctrl + q',
        action: () => (this.$refs.categorySearch as any).show()
      },
      {
        hotkey: 'ctrl + k',
        action: () => (this.$refs.search as any).show()
      },
      {
        hotkey: 'ctrl + l',
        action: () => this.clearCache()
      },
      {
        hotkey: 'db + shift',
        action: () => (this.$refs.categorySearch as any).show()
      },
      {
        hotkey: 'db + s',
        action: () => (this.$refs.search as any).show()
      },
    ]
    const clickTimeMap = new Map<string, number>()
    document.addEventListener('keydown', (e) => {
      for(let action of actionList) {
        const mainKey = action.hotkey.split('+')[0].trim();
        const subKey = action.hotkey.split('+')[1].trim();
        let mainKeyPressed = false;
        if (mainKey == 'alt') {
          mainKeyPressed = e.altKey;
        }
        if (mainKey == 'ctrl') {
          mainKeyPressed = e.ctrlKey;
        }
        if (mainKey == 'shift') {
          mainKeyPressed = e.shiftKey;
        }
        // 双击按键处理
        if (mainKey == 'db' && e.key.toLowerCase() == subKey) {
          const diff = new Date().getTime() - (clickTimeMap.get(subKey)! || 0);
          if (diff <= 300) {
            action.action()
            return e.preventDefault()
          }
          clickTimeMap.set(subKey, new Date().getTime())
        }
        // 组合按键处理
        if (mainKeyPressed && e.key.toUpperCase() == subKey.toUpperCase()) {
          action.action()
          return e.preventDefault();
        }
      }
    })
    // 恢复目录列表
    const raw = localStorage.getItem(cateListKey);
    if (raw){
      this.$store.commit('setCurrentCategoryList', JSON.parse(raw));
    }
    // 事件总线监听
    EventBus.on('enter-zen-mode', () => {
      this.showHeader = false
    })
    // 设置showHeader初始值
    const showHeader = ConfigService.get('showHeader') as boolean
    if (typeof showHeader != 'undefined') {
      this.showHeader = showHeader
    }
  },
});
</script>

<style lang="less" scoped>
.main-layout {
  min-height: 100vh;
  transition: all 0.3s ease;
}

.el-main {
  padding: 0;
  transition: all 0.3s ease;
}

.header-toggle-button {
  position: fixed;
  right: 16px;
  z-index: 1000;
  transition: all 0.3s ease;
  
  .el-button {
    padding: 8px;
    width: 32px;
    height: 32px;
    border: none;
    box-shadow: var(--shadow-md);
    background-color: var(--card-bg-color);
    transition: all 0.2s ease;
    
    &:hover {
      box-shadow: var(--shadow-lg);
      transform: translateY(-1px);
    }
  }
}

// 页面过渡动画
.page-enter-active,
.page-leave-active {
  transition: all 0.25s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

body[theme=dark] {
  .header-toggle-button {
    .el-button {
      background-color: var(--dark-card-bg-color);
      border: 1px solid var(--default-dark-border-color);
    }
  }
}
</style>
