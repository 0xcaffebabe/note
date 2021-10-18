<template>
  <div class="container">
    <div class="banner">
      <div>This is {{ name }} homepage</div>
      <p>For instead gitbook</p>
      <el-button type="primary" round size="medium" @click="$router.push('/doc/README')">开始</el-button>
      <el-button type="success" round size="medium" @click="handleContinueRead">继续阅读</el-button>
    </div>
  </div>
    <statistic />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import api from '../../api'
import docService from '@/service/DocService'
import Statistic from './Statistic.vue'

export default defineComponent({
  components: {
    Statistic
  },
  setup() {

  },
  data() {
    return {
      name: "my-book"
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