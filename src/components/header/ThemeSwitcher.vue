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
import { SysUtils } from '@/util/SysUtils';

export default defineComponent({
  setup() {},
  data() {
    return {
      showMode: false as boolean,
    }
  },
  watch: {
    isDark() {
      this.showMode = this.isDark
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
        SysUtils.enterLightMode(this)
      }else {
        SysUtils.enterDarkMode(this)
      }
    },
  }
});
</script>


<style lang="less" scoped>
</style>