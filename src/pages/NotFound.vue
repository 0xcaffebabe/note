<template>
  <div class="not-found">
    <el-result icon="warning" title="页面不存在" sub-title="你访问的地址没有对应的文档或页面，可能已被移动或删除">
      <template #extra>
        <el-button type="primary" @click="$router.push('/home.html')">返回首页</el-button>
        <el-button @click="$router.push('/')">继续上次阅读</el-button>
      </template>
    </el-result>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({})
</script>

<style lang="less" scoped>
.not-found {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
