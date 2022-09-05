<template>
  <el-drawer v-model="showDrawer" size="84%">
    <div style="width:100%">
      <ablity-page/>
    </div>
  </el-drawer>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import AblityPage from '@/pages/ablity/AblityPage.vue';

export default defineComponent({
  components: {
    AblityPage
  },
  data() {
    return {
      showDrawer: false
    }
  },
  methods: {
    show() {
      this.showDrawer = true;
    }
  }
})
</script>
