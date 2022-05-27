<template>
  <router-view />
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { SysUtils } from './util/SysUtils';

function mobileAndPerferDark() {
  return SysUtils.isMobile() && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export default defineComponent({
  setup() {
    
  },
  created() {
    // 设置默认主题
    const theme = localStorage.getItem('system::theme');
    if (theme == 'dark' || mobileAndPerferDark()) {
      SysUtils.enterDarkMode(this)
    }

    // 监听颜色模式变化
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        if (e.matches)  {
          SysUtils.enterDarkMode(this)
        }else {
          SysUtils.enterLightMode(this)
        }
      })
  }
})
</script>
