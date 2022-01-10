<template>
  <el-image-viewer @close="showImageViewer = false" v-show="showImageViewer" :url-list="imageUrlList" :hide-on-click-modal="true"/>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  data() {
    return {
      showImageViewer: false,
      imageUrlList: [] as string[]
    }
  },
  methods: {
    show(...url: string[]){
      this.imageUrlList = [...url]
      this.showImageViewer = true
    },
    close(){
      this.showImageViewer = false;
    }
  }
})
</script>


<style lang="less" scoped>

</style>