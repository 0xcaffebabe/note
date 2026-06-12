<template>
  <banner />
  <keep-alive>
    <statistic />
  </keep-alive>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import Statistic from './statistic/Statistic.vue'
import Banner from './Banner.vue'
import { SysUtils } from '@/util/SysUtils'


export default defineComponent({
  components: {
    Statistic,
    Banner
},
  setup() {

  },
  mounted() {
    SysUtils.setDocTitle('首页')
  },
})
</script>