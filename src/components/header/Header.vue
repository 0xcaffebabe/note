<template>
  <div class="header">
    <div class="header-wrapper">
      <div class="container">
        <div class="logo">
          <a href="#" @click="$router.push('/')">
            {{ siteName }}
          </a>
        </div>
        <div class="content">
          <div>
            <el-button
              icon="el-icon-search"
              class="search"
              @click="$emit('search')"
              size="mini"
              round
            ></el-button>
          </div>
          <el-menu mode="horizontal" :router="true">
            <template v-for="(menu, index) in navMenu" :key="index">
              <el-sub-menu :index="menu.router" v-if="menu.children">
                <template #title>{{menu.title}}</template>
                <el-menu-item :index="index + '-' + subIndex" v-for="(subMenu, subIndex) in menu.children" :key="index + '-' + subIndex">{{subMenu.title}}</el-menu-item>
              </el-sub-menu>
              <el-menu-item v-else :index="index + ''">{{menu.title}}</el-menu-item>
            </template> 
          </el-menu>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import config from '@/config'

export default defineComponent({
  setup() {},
  data() {
    return {
      name: "my-book" as string,
    };
  },
  computed: {
    siteName(){
      return config.siteName
    },
    navMenu(){
      return config.navMenu
    }
  },
  created() {},
});
</script>


<style lang="less" scoped>
.header {
  border-bottom: 1px solid #ccc;
  padding: 0;
  background-color: #fff;
}
.header-wrapper {
  padding: 0 32px;
}
.container {
  display: flex;
  justify-content: space-between;
  .logo {
    display: flex;
    align-items: center;
    a {
      text-decoration: none;
      font-size: 1.3rem;
      font-weight: 600;
      color: #2c3e50;
      position: relative;
    }
  }
  .search {
    height: 24px;
    display: flex;
    align-items: center;
  }
  .content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .content /deep/ .el-menu {
    border-bottom: none;
  }
}
</style>