<template>
  <el-container>
    <el-header>
      <el-affix>
        <mobile-header />
      </el-affix>
    </el-header>
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import MobileHeader from './components/header/mobile/MobileHeader.vue'

export default defineComponent({
  components: {
    MobileHeader
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