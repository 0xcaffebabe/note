<template>
  <el-container>
    <mobile-doc-side-category :doc="doc" :showAside="showAside" @toggle-aside="showAside = !showAside" ref="docSideCategory" />
    <el-main>
      <div class="markdown-section" v-html="contentHtml" ref="markdownSection"></div>
    </el-main>
  </el-container>
  <link-popover ref="linkPopover"/>
  <mobile-image-viewer ref="imageViewer" />
  <knowledge-reviewer ref="knowledgeReviewer" />
  <knowledge-network ref="knowledgeNetwork" :doc="doc"/>
  <knowledge-trend ref="knowledgeTrend"/>
  <reading-history ref="readingHistory" />
  <mobile-tool-box 
    @showReadingHistory="showReadingHistory"
    @showKnowledgeReviewer="showKnowledgeReviewer"
    @showKnowledgeNetwork="showKnowledgeNetwork"
    @showKnowledgeTrend="showKnowledgeTrend"
  />
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import DocFileInfo from '@/dto/DocFileInfo'
import DocService from '@/service/DocService'
import './mobile-markdown-v1.less'
import '../code-hl-vsc.less'
import MobileDocSideCategory from './aside/MobileDocSideCategory.vue'
import LinkPopover from '../LinkPopover.vue'
import MobileImageViewer from '@/components/mobile/MobileImageViewer.vue'
import DocPageEventManager from '../DocPageEventManager'
import MobileToolBox from '../MobileToolBox.vue'
import KnowledgeReviewer from '../knowledge/KnowledgeReviewer.vue'
import KnowledgeNetwork from '../knowledge/KnowledgeNetwork.vue'
import KnowledgeTrend from '../knowledge/trend/KnowledgeTrend.vue'
import ReadingHistory from '../history/ReadingHistory.vue'

export default defineComponent({
  components: {
    MobileDocSideCategory,
    LinkPopover,
    MobileImageViewer,
    MobileToolBox,
    KnowledgeReviewer,
    KnowledgeNetwork,
    KnowledgeTrend,
    ReadingHistory,
  },
  setup() {
    const knowledgeReviewer = ref<InstanceType<typeof KnowledgeReviewer>>()
    const knowledgeNetwork = ref<InstanceType<typeof KnowledgeNetwork>>()
    const readingHistory = ref<InstanceType<typeof ReadingHistory>>()
    const showReadingHistory = () => {
      readingHistory.value?.show()
    }
    const showKnowledgeReviewer = () => {
      knowledgeReviewer.value?.show();
    }
    const showKnowledgeNetwork = () => {
      knowledgeNetwork.value?.show()
    }
    return {
      readingHistory,showReadingHistory,
      knowledgeReviewer, showKnowledgeReviewer,
      knowledgeNetwork, showKnowledgeNetwork,
    }
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
      eventManager: null as DocPageEventManager | null
    }
  },
  methods: {
    async init() {
      this.file = await DocService.getDocFileInfo(this.doc)
      this.$nextTick(() => {
        const docEl = this.$refs.markdownSection as HTMLElement
        this.eventManager!.renderMermaid();
        this.eventManager?.registerImageClick(docEl)
        this.eventManager!.registerLinkRouter(docEl);
      })
    },
    showKnowledgeTrend() {
      (this.$refs.knowledgeTrend as InstanceType<typeof KnowledgeTrend>).show(this.file)
    },
  },
  beforeRouteUpdate(to, from) {
    this.doc = to.params.doc.toString()
    this.init()
  },
  async created() {
    this.doc = this.$route.params.doc.toString()
    this.init()
    this.eventManager = new DocPageEventManager(this)
  }
})
</script>

<style lang="less" scoped>
</style>
