<template>
  <el-switch
    v-model="showMode"
    :inline-prompt="true"
    :active-icon="Moon"
    :inactive-icon="Sunny"
    @click="toggleDarkMode"
    active-color="#000"
    inactive-color="#409EFF"
  >
  </el-switch>
</template>

<script lang="ts" setup>
import {Sunny, Moon } from '@element-plus/icons-vue';
</script>

<script lang="ts">
import { defineComponent } from "vue";
import MermaidUtils from '@/util/MermaidUtils';

export default defineComponent({
  setup() {},
  data() {
    return {
      showMode: false as boolean,
    }
  },
  computed: {
    isDark(){
      return this.$store.state.isDarkMode;
    }
  },
  created() {
    this.showMode = this.isDark;
  },
  methods: {
    toggleDarkMode(){
      const theme = document.body.getAttribute('theme');
      if (theme == 'dark') {
        document.body.setAttribute('theme', 'light');
        document.documentElement.classList.remove("dark");
        this.$store.commit('setIsDarkMode', false);
        localStorage.setItem('system::theme', "light");
        MermaidUtils.initWithNormal();
      }else {
        document.body.setAttribute('theme', 'dark');
        document.documentElement.classList.add("dark");
        this.$store.commit('setIsDarkMode', true);
        localStorage.setItem('system::theme', "dark");
        MermaidUtils.initWithNormal();
      }
    },
  }
});
</script>


<style lang="less" scoped>
</style>