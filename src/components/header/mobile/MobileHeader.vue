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
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import ThemeSwitcher from '../ThemeSwitcher.vue';
</script>

<script lang="ts">
import { defineComponent } from 'vue'
import config from "@/config";

export default defineComponent({
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
  box-shadow: var(--el-box-shadow);
  background-color:#fff;
}
.header-wrapper {
  padding: 8px;
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