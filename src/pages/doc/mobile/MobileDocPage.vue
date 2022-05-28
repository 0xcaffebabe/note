<template>
  <el-container>
    <mobile-doc-side-category :doc="doc" ref="docSideCategory" />
    <el-main>
      <doc-metadata-info :file="file"/>
      <div class="markdown-section" v-html="contentHtml" ref="markdownSection"></div>
    </el-main>
  </el-container>
  <link-popover ref="linkPopover"/>
  <mind-graph ref="mindGraph" />
  <mobile-image-viewer ref="imageViewer" />
  <knowledge-reviewer ref="knowledgeReviewer" />
  <knowledge-network ref="knowledgeNetwork" :doc="doc"/>
  <knowledge-trend ref="knowledgeTrend"/>
  <reading-history ref="readingHistory" />
  <knowledge-system ref="knowledgeSystem"/>
  <knowledge-redundancy ref="knowledgeRedundancy"/>
  <mobile-tool-box 
    @showReadingHistory="showReadingHistory"
    @showMindGraph="showMindGraph"
    @showKnowledgeReviewer="showKnowledgeReviewer"
    @showKnowledgeNetwork="showKnowledgeNetwork"
    @showKnowledgeTrend="showKnowledgeTrend"
    @showKnowledgeSystem="showKnowledgeSystem"
    @showKnowledgeRedundancy="showKnowledgeRedundancy"
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
import AlloyFinger from 'alloyfinger'
import DocMetadataInfo from '../DocMetadataInfo.vue'
import MindGraph from '../mind/MindGraph.vue'
import KnowledgeSystem from '../knowledge/KnowledgeSystem.vue'
import KnowledgeRedundancy from '../knowledge/KnowledgeRedundancy.vue'

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
    DocMetadataInfo,
    MindGraph,
    KnowledgeSystem,
    KnowledgeRedundancy
},
  setup() {
    const knowledgeReviewer = ref<InstanceType<typeof KnowledgeReviewer>>()
    const knowledgeNetwork = ref<InstanceType<typeof KnowledgeNetwork>>()
    const readingHistory = ref<InstanceType<typeof ReadingHistory>>()
    const mindGraph = ref<InstanceType<typeof MindGraph>>()
    const knowledgeSystem = ref<InstanceType<typeof KnowledgeSystem>>()
    const knowledgeRedundancy = ref<InstanceType<typeof KnowledgeRedundancy>>()
    const showReadingHistory = () => {
      readingHistory.value?.show()
    }
    const showMindGraph = () => {
      mindGraph.value?.show()
    }
    const showKnowledgeReviewer = () => {
      knowledgeReviewer.value?.show();
    }
    const showKnowledgeNetwork = () => {
      knowledgeNetwork.value?.show()
    }
    const showKnowledgeSystem = () => {
      knowledgeSystem.value?.show();
    }
    const showKnowledgeRedundancy = () => {
      knowledgeRedundancy.value?.show();
    }
    return {
      readingHistory,showReadingHistory,
      knowledgeReviewer, showKnowledgeReviewer,
      knowledgeNetwork, showKnowledgeNetwork,
      mindGraph, showMindGraph,
      knowledgeSystem, showKnowledgeSystem,
      knowledgeRedundancy, showKnowledgeRedundancy,
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
      eventManager: null as DocPageEventManager | null
    }
  },
  methods: {
    async init(doc: string, headingId?: string, kw?: string) {
      this.file = await DocService.getDocFileInfo(this.doc)
      // DocService.setLastReadRecord(this.doc)
      this.$nextTick(() => {
        const docEl = this.$refs.markdownSection as HTMLElement
        // 将滚动条设置为上一次的状态
        document.body.scrollTo(0, DocService.getDocReadRecord(this.doc))
        this.eventManager!.renderMermaid();
        this.eventManager?.registerImageClick(docEl)
        this.eventManager!.registerLinkRouter(docEl);
        this.eventManager!.syncHeading(headingId);
      })
    },
    showKnowledgeTrend() {
      (this.$refs.knowledgeTrend as InstanceType<typeof KnowledgeTrend>).show(this.file)
    },
  },
  beforeRouteUpdate(to, from) {
    this.doc = to.params.doc.toString()
    const headingId = to.query.headingId?.toString()
    this.init(this.doc, headingId)
  },
  mounted() {
    // 监听手势
    const vm = this
    new AlloyFinger(this.$refs.markdownSection, {
    swipe: function (evt: TouchEvent & {direction: 'Right' | 'Left' | 'Down' | 'Up'}) {
        if (evt.direction == 'Left') {
          (vm.$refs.docSideCategory as InstanceType<typeof MobileDocSideCategory>).showCategory = true
        }
        if (evt.direction == 'Right') {
          history.back()
        }
    }
});
  },
  async created() {
    this.doc = this.$route.params.doc.toString()
    const headingId = this.$route.query.headingId?.toString()
    this.init(this.doc, headingId)
    this.eventManager = new DocPageEventManager(this, true)
    this.eventManager!.registerScrollListener();
  }
})
</script>

<style lang="less" scoped>
</style>
