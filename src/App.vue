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
    <div class="header-toggle-button" :style="{'margin-top': showHeader ?'32px': ''}">
      <el-button @click="showHeader = !showHeader" size="mini">
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
import { ArrowUpBold, ArrowDownBold } from "@element-plus/icons";

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
  },
});
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
.header-toggle-button {
  position: fixed;
  width: 100%;
  z-index: 999;
  .el-button {
    padding: 0 7px;
    margin-left: 280px;
  }
}
</style>
