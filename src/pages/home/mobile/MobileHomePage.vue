<template>
  <banner />
  <div style="width:100%;overflow-x:scroll">
  <statistic/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Banner from '../Banner.vue'
import Statistic from '../statistic/Statistic.vue'

export default defineComponent({
  components: { Banner, Statistic },
  setup() {
    
  },
})
</script>

<style lang="less" scoped>
.container {
  display: flex;
  align-items: center;
  text-align: center;
  height: 668px;
  margin: 0 auto;
  .banner {
    width: 100%;
  }
}
</style>