<template>
  <div class="header">
    <div class="header-wrapper">
      <div class="container">
        <div class="logo">
          <el-link href="#" @click.prevent="$router.push('/home')">
                {{ siteName }}
          </el-link>
        </div>
        <theme-switcher />
        <el-button class="header-btn" text @click="$emit('showSearch')" aria-label="全文搜索">
          <el-icon><Search /></el-icon>
        </el-button>
        <el-button class="header-btn" text @click="$emit('showCategorySearch')" aria-label="目录搜索">
          <el-icon><Folder /></el-icon>
        </el-button>
        <el-button class="header-btn" text @click="$store.commit('setShowCategory', true)" aria-label="展开目录">
          <el-icon><Expand /></el-icon>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import ThemeSwitcher from '../ThemeSwitcher.vue';
</script>

<script lang="ts">
import { defineComponent } from 'vue'
import { Expand, Search, Folder } from '@element-plus/icons-vue';
import config from "@/config";

export default defineComponent({
  emits: ['showSearch', 'showCategorySearch'],
  computed: {
    siteName() {
      return config.siteName;
    },
  },
})
</script>

<style lang="less" scoped>
.header {
  height: 40px;
  padding: 0;
  background-color: var(--main-bg-color);
}
.header-wrapper {
  padding: 4px;
}
.container {
  display: flex;
  justify-content: space-between;
  align-items: center;
   .logo {
    display: flex;
    align-items: center;
    a {
      text-decoration: none;
      font-size: 1rem;
      font-weight: 600;
      position: relative;
    }
  }
}

// 触控目标不小于44x44
.header-btn {
  min-width: 44px;
  min-height: 40px;
  margin: 0;

  .el-icon {
    font-size: 18px;
  }
}
</style>