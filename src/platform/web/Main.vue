<template>
  <router-view />
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { SysUtils } from './util/SysUtils';

function systemPrefersDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export default defineComponent({
  setup() {

  },
  created() {
    // 设置默认主题: 用户手动选择优先 否则跟随系统(不限设备)
    const theme = localStorage.getItem('system::theme');
    if (theme ? theme == 'dark' : systemPrefersDark()) {
      SysUtils.enterDarkMode(this, false)
    }

    // 监听系统颜色模式变化: 仅当用户没有手动选择过主题时跟随
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        if (localStorage.getItem('system::theme')) {
          return
        }
        if (e.matches)  {
          SysUtils.enterDarkMode(this, false)
        }else {
          SysUtils.enterLightMode(this, false)
        }
      })
  }
})
</script>
