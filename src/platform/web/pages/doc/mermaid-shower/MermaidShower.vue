<template>
  <el-dialog
    v-model="showDialog"
    title="查看"
    width="80%"
    top="5vh"
    append-to-body
    :z-index="zIndex"
    @close="dispose"
    @closed="$emit('closed')"
  >
    <p v-if="loading" role="status">图表加载中…</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <div ref="container"></div>
  </el-dialog>

</template>

<script lang="ts">
import { defineComponent } from 'vue'
import MermaidUtils from '@/platform/web/util/MermaidUtils'
import svgPanZoom from 'svg-pan-zoom'
import IdGenUtils from '@/core/util/IdGenUtils'

export default defineComponent({
  emits: ['closed'],
  data() {
    return {
      showDialog: false,
      loading: false,
      error: '',
      zIndex: 0,
      renderVersion: 0,
      diagram: '',
      panZoom: null as ReturnType<typeof svgPanZoom> | null,
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
      const container = this.$refs.container as HTMLElement
      container.replaceChildren()
      const renderId = 'mermaid-viewer-' + IdGenUtils.uuid()
      try {
        const data = await MermaidUtils.render(renderId, diagram)
        if (version !== this.renderVersion) {
          return
        }
        container.innerHTML = data.svg.replace(/[ ]*max-width:[ 0-9\.]*px;/i , 'height:80vh')
        this.loading = false
        await this.$nextTick()
        if (version !== this.renderVersion) {
          return
        }
        // 每个查看器只操作自身 SVG，正文与预览可以独立重复打开。
        this.panZoom = svgPanZoom(container.querySelector('svg')!, {
          zoomEnabled: true,
          controlIconsEnabled: true,
          mouseWheelZoomEnabled: true,
          fit: true,
          center: true
        })
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
</style>
