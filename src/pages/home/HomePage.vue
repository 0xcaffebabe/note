<template>
  <banner />
  <home-quick-access />
  <!-- 移动端统计图表暂可能超出视口宽: 以横向滚动兜底(P6 图表响应式后移除该包裹) -->
  <div :class="{ 'statistic-scroll': $isMobile() }">
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
.statistic-scroll {
  width: 100%;
  overflow-x: auto;
}
</style>
