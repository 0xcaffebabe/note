<template>
  <el-drawer v-model="show" size="80%" :with-header="false" :lock-scroll="true">
    <iframe :src="url" style="width:100%;height:100%"></iframe>
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  data() {
    return {
      show: false,
      url: '',
    }
  },
  methods: {
    preview(url: string) {
      this.url = url;
      this.show = true;
    }
  }
})
</script>
