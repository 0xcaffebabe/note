<template>
  <div class="not-found">
    <div class="nf-card">
      <div class="nf-code" aria-hidden="true">404</div>
      <h1 class="nf-title">页面不存在</h1>
      <p class="nf-desc">你访问的地址没有对应的文档或页面，可能已被移动或删除</p>
      <code class="nf-path" v-if="failedPath" :title="failedPath">{{ failedPath }}</code>
      <div class="nf-actions">
        <el-button type="primary" @click="$router.push('/home.html')">返回首页</el-button>
        <el-button @click="$router.push('/')">继续上次阅读</el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  computed: {
    // 展示出错的原始地址 便于用户自查/反馈(解码失败的非法路径原样展示)
    failedPath(): string {
      try {
        return decodeURIComponent(this.$route.fullPath)
      } catch {
        return this.$route.fullPath
      }
    }
  }
})
</script>

<style lang="less" scoped>
.not-found {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
}

.nf-card {
  text-align: center;
  max-width: 480px;
  animation: nf-enter 0.4s ease both;
}

// 与侧栏logo同款品牌渐变 文字镂空填充
.nf-code {
  font-size: clamp(80px, 18vw, 140px);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  background: linear-gradient(135deg, var(--primary-color) 0%, #6979f8 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  user-select: none;
}

.nf-title {
  margin: var(--spacing-md) 0 var(--spacing-sm);
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--main-text-color);
}

.nf-desc {
  margin: 0 0 var(--spacing-md);
  font-size: var(--font-size-base);
  color: var(--secondary-text-color);
  line-height: var(--leading-normal);
}

.nf-path {
  display: inline-block;
  max-width: 100%;
  margin-bottom: var(--spacing-lg);
  padding: 4px 12px;
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  color: var(--secondary-text-color);
  background-color: var(--hover-bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nf-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-sm);
}

@keyframes nf-enter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
