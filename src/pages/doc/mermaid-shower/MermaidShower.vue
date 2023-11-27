<template>
  <el-dialog
    v-model="showDialog"
    title="查看"
    width="80%"
    top="5vh"
  >
    <div ref="container" id="mermaidshower"></div>
  </el-dialog>

</template>

<script lang="ts">
import { defineComponent } from 'vue'
import mermaid from "mermaid"
import svgPanZoom from 'svg-pan-zoom'

export default defineComponent({
  data() {
    return {
      showDialog: false
    }
  },
  methods: {
    show(diagram: string) {
      console.log(diagram)
      this.showDialog = true
      mermaid.render('mermaidshower-svg', diagram)
        .then(data => {
          (this.$refs.container as HTMLElement).innerHTML = data.svg.replace(/[ ]*max-width:[ 0-9\.]*px;/i , 'height:80vh')
        })
        .then(() => {
          svgPanZoom('#mermaidshower svg', {
            zoomEnabled: true,
            controlIconsEnabled: true,
            mouseWheelZoomEnabled: true,
            fit: true,
            center: true
          })
        })
      
    }
  }
})
</script>

<style lang="less" scoped>
</style>
