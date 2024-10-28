<template>
  <el-container>
    <mobile-doc-side-category :doc="doc" ref="docSideCategory" />
    <el-main>
      <doc-metadata-info :file="file"/>
      <div class="markdown-section" v-html="contentHtml" ref="markdownSection"></div>
    </el-main>
  </el-container>
  <link-popover ref="linkPopover"/>
  <selection-popover ref="selectionPopover" @showKnowledgeTrend="showKnowledgeTrend"/>
  <mind-graph ref="mindGraph" />
  <mobile-image-viewer ref="imageViewer" />
  <knowledge-reviewer ref="knowledgeReviewer" :doc="doc" />
  <knowledge-network ref="knowledgeNetwork" :doc="doc"/>
  <knowledge-trend ref="knowledgeTrend"/>
  <mermaid-shower ref="mermaidShower"/>
  <selection-popover />
  <mobile-tool-box 
    @showMindGraph="showMindGraph"
    @showKnowledgeReviewer="showKnowledgeReviewer"
    @showKnowledgeNetwork="showKnowledgeNetwork"
    @showKnowledgeTrend="showKnowledgeTrend"
    @showLlm="showLLM"
  />
  <LLM :doc="doc" ref="llm"/>
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
import DocMetadataInfo from '../metadata/DocMetadataInfo.vue'
import MindGraph from '../mind/MindGraph.vue'
import TouchUtils from '@/util/TouchUtils'
import SelectionPopover from '../tool/SelectionPopover.vue'
import MermaidShower from '../mermaid-shower/MermaidShower.vue';
import LLM from '../knowledge/LLM.vue';

export default defineComponent({
  components: {
    MobileDocSideCategory,
    LinkPopover,
    MobileImageViewer,
    MobileToolBox,
    KnowledgeReviewer,
    KnowledgeNetwork,
    KnowledgeTrend,
    DocMetadataInfo,
    MindGraph,
    SelectionPopover,
    MermaidShower,
    LLM,
},
  setup() {
    const knowledgeReviewer = ref<InstanceType<typeof KnowledgeReviewer>>()
    const knowledgeNetwork = ref<InstanceType<typeof KnowledgeNetwork>>()
    const mindGraph = ref<InstanceType<typeof MindGraph>>()
    const llm = ref<InstanceType<typeof LLM>>()
    const showMindGraph = () => {
      mindGraph.value?.show()
    }
    const showKnowledgeReviewer = () => {
      knowledgeReviewer.value?.show();
    }
    const showKnowledgeNetwork = () => {
      knowledgeNetwork.value?.show()
    }
    const showLLM = () => {
      llm.value?.show();
    }
    return {
      knowledgeReviewer, showKnowledgeReviewer,
      knowledgeNetwork, showKnowledgeNetwork,
      mindGraph, showMindGraph,
      llm, showLLM,
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
      eventManager: null as DocPageEventManager | null,
      kw: '',
    }
  },
  methods: {
    async init(doc: string, headingId?: string, kw?: string) {
      this.file = await DocService.getDocFileInfo(this.doc)
      this.kw = kw || "";
      this.$nextTick(() => {
        const docEl = this.$refs.markdownSection as HTMLElement
        // 将滚动条设置为上一次的状态
        document.body.scrollTo(0, DocService.getDocReadRecord(this.doc))
        this.eventManager!.renderMermaid();
        this.eventManager!.syncHeading(headingId);
        // 渲染数学公式
        this.eventManager!.renderLatex(docEl);
        this.registerNecessaryEvent(docEl);
      })
    },
    registerNecessaryEvent(docEl: HTMLElement) {
      this.eventManager?.registerImageClick(docEl)
      this.eventManager!.registerLinkRouter(docEl);
      this.eventManager!.registerTextSelected(docEl);
      this.eventManager!.registerMermaidFullScreenClick(docEl);
    },
    showKnowledgeTrend(kw?: string) {
      (this.$refs.knowledgeTrend as InstanceType<typeof KnowledgeTrend>).show(this.file, kw)
    },
  },
  beforeRouteUpdate(to, from) {
    this.doc = to.params.doc.toString()
    const headingId = to.query.headingId?.toString()
    const kw = this.$route.query.kw?.toString()
    this.init(this.doc, headingId, kw)
  },
  mounted() {
    // 监听手势
    TouchUtils.onSwipe(this.$refs.markdownSection as HTMLElement, (direction, delta) => {
      console.log(direction, delta)
      if (direction[0] == 'left' && delta[0] > 150) {
        (this.$refs.docSideCategory as InstanceType<typeof MobileDocSideCategory>).showCategory = true
      }
      if (direction[0] == 'right' && delta[0] > 150) {
        history.back()
      }
      if (direction[1] == 'down' && delta[1] > 500) {
        location.reload()
      }
    })
  },
  async created() {
    this.doc = this.$route.params.doc.toString()
    const headingId = this.$route.query.headingId?.toString()
    const kw = this.$route.query.kw?.toString()
    this.init(this.doc, headingId, kw)
    this.eventManager = new DocPageEventManager(this, true)
    this.eventManager!.registerScrollListener();
  }
})
</script>

<style lang="less" src="./mobile-markdown-v1.less" scoped>
</style>
