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


export default defineComponent({
  components: {
    Statistic,
    Banner
},
  setup() {

  },
})
</script>