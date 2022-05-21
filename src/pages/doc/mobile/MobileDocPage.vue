<template>
  <el-container>
    <mobile-doc-side-category :doc="doc" :showAside="showAside" @toggle-aside="showAside = !showAside" ref="docSideCategory" />
    <el-main>
      <div class="markdown-section" v-html="contentHtml"></div>
    </el-main>
  </el-container>
  <link-popover />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import DocFileInfo from '@/dto/DocFileInfo'
import DocService from '@/service/DocService'
import './mobile-markdown-v1.less'
import MobileDocSideCategory from './aside/MobileDocSideCategory.vue'
import LinkPopover from '../LinkPopover.vue'

export default defineComponent({
  components: {
    MobileDocSideCategory,
    LinkPopover
  },
  setup() {
    
  },
  computed: {
    contentHtml(): string {
      return DocService.renderMd(this.file);
    },
  },
  data() {
    return {
      doc: "" as string,
      file: new DocFileInfo() as DocFileInfo,
      showAside: true,
    }
  },
  methods: {
    async init() {
      this.file = await DocService.getDocFileInfo(this.doc)
    }
  },
  beforeRouteUpdate(to, from) {
    this.doc = to.params.doc.toString()
    this.init()
  },
  async created() {
    this.doc = this.$route.params.doc.toString()
    this.init()
  }
})
</script>

<style lang="less" scoped>
.el-main {
  padding-top: 0;
}
</style>
