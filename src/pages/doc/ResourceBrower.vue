<template>
  <el-drawer
    v-model="showDrawer"
    size="80%"
    :with-header="false"
    title="资源浏览器"
    :append-to-body="false"
    modal-class="drawer-modal-class"
  >
  <el-tabs type="card">
    <el-tab-pane label="时光机最新存档">
      <iframe :src="'https://web.archive.org/web/' + src" sandbox="allow-scripts allow-same-origin" name="main" target="main" frameborder="0"></iframe>
    </el-tab-pane>
    <el-tab-pane label="原始">
      <iframe :src="src" sandbox="allow-scripts allow-same-origin" frameborder="0"></iframe>
    </el-tab-pane>
    <el-tab-pane label="时光机历史">
      <iframe :src="'https://web.archive.org/web/*/' + src" sandbox="allow-scripts allow-same-origin" name="main" target="main" frameborder="0"></iframe>
    </el-tab-pane>
  </el-tabs>
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  setup() {
    
  },
  methods: {
    show(src: string) {
      this.src = src;
      this.showDrawer = true;
    }
  },
  data(){
    return {
      showDrawer: false,
      src: ''
    }
  }
})
</script>

<style lang="less" scoped>
iframe {
  width:100%;
  height:100%;
}
.el-tabs {
  height: calc(100% - 60px);
  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }
  :deep(.el-tabs__content) {
    height:100%;
  }
  :deep(.el-tab-pane) {
    height:100%;
  }
}

body[theme=dark] {
  iframe {
    // filter: invert(180%);
  }
}
</style>
