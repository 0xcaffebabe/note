<template>
  <div class="header">
    <div class="header-wrapper">
      <div class="container">
        <el-button size="default" text @click="$store.commit('setShowCategory', true)">
          <el-icon><Expand /></el-icon>
        </el-button>
        <div class="logo">
           <el-link href="#" @click.prevent="$router.push('/home')">
                {{ siteName }}
          </el-link>
        </div>
        <theme-switcher />
        <el-button size="default" text @click="$emit('showSearch')">
          <el-icon><Search /></el-icon>
        </el-button>
        <el-button size="default" text @click="$emit('showCategorySearch')">
          <el-icon><Folder /></el-icon>
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
  setup() {
    
  },
  computed: {
    siteName() {
      return config.siteName;
    },
  }
})
</script>

<style lang="less" scoped>
.header {
  height: 40px;
  padding: 0;
  background-color:#f2f2f2;
}
.header-wrapper {
  padding: 4px;
}
.container {
  display: flex;
  justify-content: space-between;
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
body[theme=dark] {
  .header {
    background-color:var(--second-dark-bg-color);
  }
}
</style>