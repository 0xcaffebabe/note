<template>
  <div class="hero">
    <h1 class="hero-title">{{ name }}</h1>
    <p class="hero-subtitle">结构化沉淀 · 体系化学习 · 长期主义的个人知识库</p>
    <div class="hero-actions">
      <el-button type="primary" round size="large" @click="handleContinueRead">
        {{ lastReadName ? `继续阅读 · ${lastReadName}` : '开始阅读' }}
      </el-button>
      <el-button round size="large" @click="$router.push('/README.html')">浏览总目录</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import config from '@/config'
import docService from '@/service/DocService'
import DocUtils from '@/util/DocUtils'

export default defineComponent({
  data() {
    return {
      name: config.siteName,
      lastRead: docService.getLastReadRecord() as string | null,
    }
  },
  computed: {
    lastReadName(): string {
      if (!this.lastRead || this.lastRead == 'README') {
        return ''
      }
      // lastRead是docId(层级以'-'连接 '@@'转义连字符) 经docId2Url还原真实路径取末段
      const segments = DocUtils.docId2Url(this.lastRead).replace(/\.md$/, '').split('/')
      return segments[segments.length - 1]
    },
  },
  methods: {
    handleContinueRead() {
      const doc = this.lastRead || 'README'
      this.$router.push(DocUtils.docId2HtmlPath(doc))
    },
  },
})
</script>

<style lang="less" scoped>
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 72px var(--spacing-lg) 56px;
  background:
    radial-gradient(ellipse 70% 100% at 50% 0%, color-mix(in srgb, var(--primary-color) 8%, transparent), transparent);
}

.hero-title {
  margin: 0;
  font-size: clamp(32px, 5vw, 52px);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--main-text-color);
}

.hero-subtitle {
  margin: var(--spacing-md) 0 var(--spacing-xl);
  font-size: var(--font-size-lg);
  color: var(--secondary-text-color);
}

.hero-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  justify-content: center;
}
</style>
