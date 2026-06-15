<template>
  <div class="home">
    <banner />
    <home-quick-access />
    <keep-alive>
      <statistic />
    </keep-alive>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import Statistic from './statistic/Statistic.vue'
import Banner from './Banner.vue'
import HomeQuickAccess from './HomeQuickAccess.vue'
import { SysUtils } from '@/util/SysUtils'


export default defineComponent({
  components: {
    Statistic,
    Banner,
    HomeQuickAccess,
},
  setup() {

  },
  mounted() {
    SysUtils.setDocTitle('首页')
  },
})
</script>

<style lang="less" scoped>
// 首页三块统一垂直节奏: 由父级 gap 控制块间距, 各块不再各写 margin
.home {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2xl);
  padding-bottom: var(--spacing-3xl);
}
</style>
