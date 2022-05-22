<template>
  <el-container>
    <mobile-doc-side-category :doc="doc" :showAside="showAside" @toggle-aside="showAside = !showAside" ref="docSideCategory" />
    <el-main>
      <div class="markdown-section" v-html="contentHtml" ref="markdownSection"></div>
    </el-main>
  </el-container>
  <link-popover />
  <mobile-image-viewer ref="imageViewer" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import DocFileInfo from '@/dto/DocFileInfo'
import DocService from '@/service/DocService'
import './mobile-markdown-v1.less'
import '../code-hl-vsc.less'
import MobileDocSideCategory from './aside/MobileDocSideCategory.vue'
import LinkPopover from '../LinkPopover.vue'
import MobileImageViewer from '@/components/mobile/MobileImageViewer.vue'
import DocPageEventManager from '../DocPageEventManager'

export default defineComponent({
  components: {
    MobileDocSideCategory,
    LinkPopover,
    MobileImageViewer
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
      eventManger: null as DocPageEventManager | null
    }
  },
  methods: {
    async init() {
      this.file = await DocService.getDocFileInfo(this.doc)
      this.$nextTick(() => {
        const docEl = this.$refs.markdownSection as HTMLElement
        this.eventManger?.registerImageClick(docEl)
      })
    }
  },
  beforeRouteUpdate(to, from) {
    this.doc = to.params.doc.toString()
    this.init()
  },
  async created() {
    this.doc = this.$route.params.doc.toString()
    this.init()
    this.eventManger = new DocPageEventManager(this)
  }
})
</script>

<style lang="less" scoped>
.el-main {
  padding-top: 0;
}
</style>
