<template>
  <el-image-viewer @close="close" v-if="showImageViewer" :initial-index="imgIndex" :url-list="imageUrlList" :hide-on-click-modal="true" :infinite="false"/>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  data() {
    return {
      showImageViewer: false,
      imageUrlList: [] as string[],
      imgIndex: 0
    }
  },
  methods: {
    show(url: string[], index: number){
      if (index < 0 || index > url.length) {
        return
      }
      this.imgIndex = index
      this.imageUrlList = [...url]
      this.showImageViewer = true
      document.body.classList.add('image-viewer-stop-scroll')
    },
    close(){
      this.showImageViewer = false;
      document.body.classList.remove('image-viewer-stop-scroll')
    }
  }
})
</script>


<style lang="less" scoped>

</style>