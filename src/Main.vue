<template>
  <router-view />
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import MermaidUtils from '@/util/MermaidUtils';

export default defineComponent({
  setup() {
    
  },
  created() {
    // 设置默认主题
    const theme = localStorage.getItem('system::theme');
    if (theme == 'dark') {
      this.$store.commit('setIsDarkMode', true);
      document.body.setAttribute('theme', 'dark');
      document.documentElement.classList.add('dark');
      MermaidUtils.initWithDark()
    }
  }
})
</script>
