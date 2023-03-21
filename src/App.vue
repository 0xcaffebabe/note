<template>
  <el-container>
    <el-header v-show="showHeader">
      <el-affix :offset="0">
        <Header
          @search="showSearch"
          @category-search="showCategorySearch"
        />
      </el-affix>
    </el-header>
    <div class="header-toggle-button" :style="{'margin-top': showHeader ?'66px': '6px'}">
      <el-button @click="showHeader = !showHeader" size="small" type="primary">
        <el-icon>
          <arrow-up-bold v-if="showHeader" />
          <arrow-down-bold v-else />
        </el-icon>
      </el-button>
    </div>
    <el-main>
      <router-view></router-view>
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
      categorySearch, showCategorySearch
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
.el-container {
  height: 100%;
}
.el-main {
  background-color: #fff;
  height: 100%;
  padding: 0;
}
.el-header {
  padding: 0;
  background-color: #fff;
}
.header-toggle-button {
  position: fixed;
  // width: 100%;
  right: 20px;
  z-index: 1000;
  .el-button {
    padding: 0 16px;
    box-shadow: 2px 2px 13px #bbb;
  }
}

body[theme=dark] {
  .el-main {
    background-color:var(--main-dark-bg-color);
    color: var(--main-dark-text-color);
  }
  .el-header {
    background-color:var(--main-dark-bg-color);
    color: var(--main-dark-text-color);
  }
  .header-toggle-button {
    .el-button {
      box-shadow: 2px 2px 13px #111;
    }
  }
}
</style>
