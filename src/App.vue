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
      <el-button @click="showHeader = !showHeader" size="mini">
        <el-icon>
          <arrow-up-bold v-if="showHeader" />
          <arrow-down-bold v-else />
        </el-icon>
      </el-button>
    </div>
    <el-main>
      <keep-alive>
        <router-view></router-view>
      </keep-alive>
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
import { ArrowUpBold, ArrowDownBold } from "@element-plus/icons";
import EventBus from "./components/EventBus";
import MermaidUtils from "./util/MermaidUtils";
import ConfigService from "./service/ConfigService";

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
  data() {
    return {
      showHeader: true,
    };
  },
  created() {
    // 全局快捷键监听
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key == "q") {
        (this.$refs.categorySearch as any).show();
        e.preventDefault();
      }
      if (e.ctrlKey && e.key == "k") {
        (this.$refs.search as any).show();
        e.preventDefault();
      }
    });
    // 设置默认主题
    const theme = localStorage.getItem('system::theme');
    if (theme == 'dark') {
      this.$store.commit('setIsDarkMode', true);
      document.body.setAttribute('theme', 'dark');
      MermaidUtils.initWithDark()
    }
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
}
</style>
