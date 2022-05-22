<template>
  <div v-show="visible" class="mask">
    <el-button @click="visible = false" class="close-btn" text>
      <el-icon><full-screen /></el-icon>
    </el-button>
    <ul ref="images" style="display:none">
      <li v-for="src in images" :key="src"><img :src="src"/></li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { FullScreen } from '@element-plus/icons-vue';
import 'viewerjs/dist/viewer.css';
import Viewer from 'viewerjs';


export default defineComponent({
  components: {
    FullScreen
  },
  data() {
    return {
      visible: false,
      images: [] as string[],
      viewer: null as Viewer | null
    }
  },
  mounted() {
    this.viewer = new Viewer(this.$refs.images as HTMLElement, {
          inline: true,
          viewed(e) {
            // viewer.zoomTo(1);
          },
          hide(e) {
            console.log('hide event', e)
          }
        });
  },
  methods: {
    show(srcList: string[], index: number) {
      this.images = srcList
      this.visible = true
      this.$nextTick(() => {
        this.viewer!.update()
        this.viewer?.view(index)
      })
    },
  },
})
</script>

<style lang="less" scoped>
  .mask {
    position: fixed;
    display: flex;
    z-index: 999;
    top: 0;
    background-color: rgba(0,0,0,.5);
    height: 100%;
    width: 100%;
    align-items: center;
  }
  .close-btn {
    position:fixed;
    top:-1px;
    right: -11px;
    z-index:999;
  }
</style>