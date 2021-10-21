<template>
  <el-container>
    <el-header>
      <el-affix :offset="0">
        <Header @search="$refs.search.show()" @category-search="$refs.categorySearch.show()"/>
      </el-affix>
    </el-header>
    <el-main>
      <router-view></router-view>
    </el-main>
  </el-container>
  <Search ref="search"/>
  <category-search ref="categorySearch" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Header from './components/header/Header.vue'
import Search from '@/components/search/Search.vue'
import CategorySearch from '@/components/search/CategorySearch.vue'

export default defineComponent({
  components: {
    Header,
    Search,
    CategorySearch
  },
  setup() {

  },
  data() {
    return {}
  },
  created(){
    document.addEventListener('keydown',(e) => {
      if (e.ctrlKey && e.key == 'q') {
        (this.$refs.categorySearch as any).show()
        e.preventDefault()
      }
      if (e.ctrlKey && e.key == 'k') {
        (this.$refs.search as any).show()
        e.preventDefault()
      }
    })
  }
})
</script>

<style lang="less" scoped>
  .el-container {
    height: 100%;
  }
  .el-main {
    height: 100%;
    padding: 0;
  }
  .el-header {
    padding: 0;
    background-color: #fff;
  }
</style>
