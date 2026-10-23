<template>
  <el-dialog
    v-model="showDialog"
    title="查看图表"
    width="80%"
    top="5vh"
    append-to-body
    :z-index="zIndex"
    @close="dispose"
    @closed="$emit('closed')"
  >
    <div class="mermaid-viewer" :aria-busy="loading">
      <div class="mermaid-viewer-stage">
        <div ref="container" class="mermaid-viewer-canvas" role="img" aria-label="Mermaid 图表"></div>
        <p v-if="loading" class="mermaid-viewer-status" role="status">图表加载中…</p>
        <p v-else-if="error" class="mermaid-viewer-status" role="alert">{{ error }}</p>
        <el-button-group class="mermaid-viewer-controls" role="group" aria-label="图表缩放控制">
          <el-button size="small" :disabled="!panZoom" aria-label="缩小图表" title="缩小图表" @click="panZoom?.zoomOut()">
            <el-icon><ZoomOut /></el-icon>
          </el-button>
          <el-button size="small" :disabled="!panZoom" aria-label="放大图表" title="放大图表" @click="panZoom?.zoomIn()">
            <el-icon><ZoomIn /></el-icon>
          </el-button>
          <el-button size="small" :disabled="!panZoom" aria-label="重置图表" title="重置图表" @click="panZoom?.reset()">
            <el-icon><RefreshLeft /></el-icon>
          </el-button>
        </el-button-group>
      </div>
    </div>
  </el-dialog>

</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue'
import { RefreshLeft, ZoomIn, ZoomOut } from '@element-plus/icons-vue'
import MermaidUtils from '@/platform/web/util/MermaidUtils'
import { createSvgPanZoom } from './SvgPanZoom'
import IdGenUtils from '@/core/util/IdGenUtils'

export default defineComponent({
  components: { RefreshLeft, ZoomIn, ZoomOut },
  emits: ['closed'],
  data() {
    return {
      showDialog: false,
      loading: false,
      error: '',
      zIndex: 0,
      renderVersion: 0,
      diagram: '',
      panZoom: null as ReturnType<typeof createSvgPanZoom> | null,
    }
  },
  watch: {
    '$store.state.isDarkMode'() {
      if (this.showDialog) this.show(this.diagram)
    },
  },
  methods: {
    async show(diagram: string) {
      this.dispose()
      this.diagram = diagram
      const version = this.renderVersion
      this.showDialog = true
      this.loading = true
      this.error = ''
      const popupLayer = Number(getComputedStyle(document.documentElement).getPropertyValue('--z-popup'))
      const previewLayers = Array.from(document.querySelectorAll<HTMLElement>('.popover'))
        .map(card => Number(getComputedStyle(card).zIndex) || popupLayer)
      this.zIndex = Math.max(popupLayer, ...previewLayers) + 1
      // el-dialog 首次打开时才挂载内容，等待容器就绪后再渲染。
      await this.$nextTick()
      if (version !== this.renderVersion) return
      const container = this.$refs.container as HTMLElement
      container.replaceChildren()
      const renderId = 'mermaid-viewer-' + IdGenUtils.uuid()
      try {
        const data = await MermaidUtils.render(renderId, diagram)
        if (version !== this.renderVersion) {
          return
        }
        container.innerHTML = data.svg
        const svg = container.querySelector('svg')
        if (!svg) throw new Error('未生成 SVG 图表')
        // 不依赖 Mermaid 输出的内联样式格式，各图种都填满同一个画布。
        svg.style.width = '100%'
        svg.style.height = '100%'
        svg.style.maxWidth = 'none'
        svg.style.display = 'block'
        this.loading = false
        await this.$nextTick()
        if (version !== this.renderVersion) {
          return
        }
        // 每个查看器只操作自身 SVG，正文与预览可以独立重复打开。
        this.panZoom = markRaw(createSvgPanZoom(svg))
      } catch (err) {
        document.getElementById('d' + renderId)?.remove()
        if (version === this.renderVersion) {
          container.replaceChildren()
          this.loading = false
          this.error = 'Mermaid 图表渲染失败: ' + ((err as Error)?.message || String(err))
        }
      }
    },
    dispose() {
      this.renderVersion++
      this.panZoom?.destroy()
      this.panZoom = null
    }
  },
  beforeUnmount() {
    this.dispose()
  },
})
</script>

<style lang="less" scoped>
.mermaid-viewer-controls {
  position: absolute;
  right: var(--spacing-sm);
  bottom: var(--spacing-sm);
  z-index: var(--z-aside);
  display: inline-flex;
  background: color-mix(in srgb, var(--card-bg-color) 90%, transparent);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(var(--spacing-xs));

  :deep(.el-button) {
    width: var(--spacing-xl);
    height: var(--spacing-xl);
    padding: 0;
    border: none;
    background: transparent;
    color: var(--secondary-text-color);
    font-size: var(--font-size-base);

    &:not(.is-disabled):hover {
      background: var(--hover-bg-color);
      color: var(--primary-color);
    }

    &.is-disabled {
      color: var(--el-disabled-text-color);
    }

    @media (pointer: coarse) {
      width: var(--site-control-size);
      height: var(--site-control-size);
    }
  }
}

.mermaid-viewer-stage {
  position: relative;
  isolation: isolate;
  height: 72vh;
  height: 72dvh;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.mermaid-viewer-canvas {
  width: 100%;
  height: 100%;
}

.mermaid-viewer-status {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  padding: var(--spacing-md);
  color: var(--secondary-text-color);
  overflow: auto;
}
</style>
