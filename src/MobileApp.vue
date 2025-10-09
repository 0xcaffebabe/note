<template>
  <el-container class="mobile-layout" ref="main">
    <el-header class="mobile-header">
      <el-affix>
        <mobile-header @showSearch="showSearch" @show-category-search="showCategorySearch"/>
      </el-affix>
    </el-header>
    <el-main class="mobile-main">
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
import { defineComponent, } from 'vue'
import MobileHeader from './components/header/mobile/MobileHeader.vue'
import Search from "@/components/search/Search.vue";
import CategorySearch from './components/search/CategorySearch.vue';

export default defineComponent({
  components: {
    MobileHeader, Search, CategorySearch
  },
  methods: {
    showSearch() {
      (this.$refs.search as InstanceType<typeof Search>).show()
    },
    showCategorySearch() {
      (this.$refs.categorySearch as InstanceType<typeof CategorySearch>).show()
    },
  },
  setup() {
    
  },
})
</script>


<style lang="less" scoped>
.mobile-layout {
  min-height: 100vh;
  transition: all 0.3s ease;
}

.mobile-main {
  padding: var(--spacing-sm);
  padding-top: 8px;
  background-color: var(--card-bg-color);
  transition: all 0.3s ease;
}

.mobile-header {
  padding: 0;
  height: 48px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--card-bg-color);
  transition: all 0.3s ease;
}

// 页面过渡动画
.page-enter-active,
.page-leave-active {
  transition: all 0.25s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

body[theme=dark] {
  .mobile-main {
    background-color: var(--dark-card-bg-color);
  }
  .mobile-header {
    background-color: var(--dark-card-bg-color);
    border-bottom: 1px solid var(--default-dark-border-color);
  }
}
</style>

<style lang="less">
#buildTime {
  transition: all .2s;
  font-size: 10px !important;
  bottom: 4px !important;
  right: 4px !important;
}
</style>