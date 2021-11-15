<template>
  <div class="container">
    <div class="banner">
      <p>{{ name }}</p>
      <p>点击以开始</p>
      <el-button type="primary" round size="medium" @click="$router.push('/doc/README')">开始</el-button>
      <el-button type="success" round size="medium" @click="handleContinueRead">继续阅读</el-button>
    </div>
  </div>
  <keep-alive>
    <statistic />
  </keep-alive>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import docService from '@/service/DocService'
import Statistic from './statistic/Statistic.vue'
import config from '@/config'

export default defineComponent({
  components: {
    Statistic
  },
  setup() {

  },
  data() {
    return {
      name: config.siteName
    }
  },
  methods:{
    handleContinueRead(){
      const doc = docService.getLastReadRecord()
      if (doc) {
        this.$router.push("/doc/" + doc)
      }else {
        this.$router.push("/doc/README")
      }
    }
  }
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