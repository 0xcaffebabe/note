<template>
  <div class="root" ref="root" v-show="visible">
    <el-button-group>
      <el-button @click="$emit('showKnowledgeTrend', kw)">知识趋势</el-button>
    </el-button-group>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  emits: ['showKnowledgeTrend'],
  data() {
    return {
      visible: false,
      kw: ''
    }
  },
  methods: {
    show(kw: string, x: number, y: number) {
      this.visible = true
      this.kw = kw
      const root = this.$refs.root as HTMLElement
      root.style.top = y + 'px'
      root.style.left = x + 'px'
    },
    hide() {
      this.visible = false
    }
  }
})
</script>

<style lang="less" scoped>
.root {
  transition: all 0.2s;
  position: fixed;
}
</style>
