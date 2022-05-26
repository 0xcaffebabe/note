<template>
  <el-container ref="main">
    <el-header>
      <el-affix>
        <mobile-header @showSearch="showSearch" @show-category-search="showCategorySearch"/>
      </el-affix>
    </el-header>
    <el-main>
      <router-view />
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
.el-main {
    padding: 0 4px;
}
.el-header {
  padding: 0;
  height: 40px;
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

<style lang="less">
#buildTime {
  transition: all .2s;
  font-size: 10px!important;
  bottom: 2px!important;
  right: 2px!important;
}
</style>