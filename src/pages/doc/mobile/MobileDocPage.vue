<template>
  <el-container>
    <mobile-doc-side-category :doc="doc" ref="docSideCategory" />
    <el-main ref="mainEl" class="mobile-doc-main">
      <doc-metadata-info :file="file"/>
      <!-- 加载失败兜底: 提供重试入口 不再停留在骨架屏 -->
      <el-result v-if="loadError" icon="error" title="文档加载失败" sub-title="网络异常或文档不存在">
        <template #extra>
          <el-button type="primary" @click="init(doc)">重试</el-button>
          <el-button @click="$router.push('/m/home.html')">返回首页</el-button>
        </template>
      </el-result>
      <el-skeleton v-else :rows="12" animated :loading="loading" :throttle="50">
        <template #default>
          <div class="markdown-section" v-html="contentHtml" ref="markdownSection"></div>
        </template>
      </el-skeleton>
      <doc-prev-next v-if="!loading && !loadError" :doc="doc" />
    </el-main>
  </el-container>
  <!-- 底部操作栏: 高频入口拇指可达 -->
  <nav class="mobile-bottom-bar">
    <button type="button" @click="openCategory" aria-label="打开站点目录">
      <el-icon><Memo /></el-icon><span>目录</span>
    </button>
    <button type="button" @click="openToc" aria-label="打开本页章节">
      <el-icon><Tickets /></el-icon><span>章节</span>
    </button>
    <button type="button" @click="openSearch" aria-label="打开搜索">
      <el-icon><Search /></el-icon><span>搜索</span>
    </button>
    <button type="button" @click="scrollToTop" aria-label="回到顶部">
      <el-icon><Top /></el-icon><span>回顶</span>
    </button>
  </nav>
  <mobile-toc ref="mobileToc" :contents-list="contentsList" @item-click="handleTocItemClick" />
  <link-popover ref="linkPopover"/>
  <!-- 关联内容: 右侧悬浮标签 点按展开(触屏) -->
  <related-content :links="file.relatedLinks || []" />
  <mind-graph v-if="panels.mindGraph" ref="mindGraph" />
  <image-viewer ref="imageViewer" />
  <knowledge-reviewer v-if="panels.knowledgeReviewer" ref="knowledgeReviewer" :doc="doc" />
  <knowledge-network v-if="panels.knowledgeNetwork" ref="knowledgeNetwork" :doc="doc"/>
  <mermaid-shower ref="mermaidShower"/>
  <mobile-tool-box
    @showMindGraph="showMindGraph"
    @showKnowledgeReviewer="showKnowledgeReviewer"
    @showKnowledgeNetwork="showKnowledgeNetwork"
    @showLlm="showLLM"
  />
  <LLM v-if="panels.llm" :doc="doc" ref="llm"/>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent, reactive, ref } from 'vue'
import DocFileInfo from '@/dto/DocFileInfo'
import Content from '@/dto/Content'
import DocService from '@/service/DocService'
import DocUtils from '@/util/DocUtils'
import '../markdown-v1.less'
import '../code-hl-vsc.less'
import MobileDocSideCategory from './aside/MobileDocSideCategory.vue'
import LinkPopover from '../LinkPopover.vue'
import ImageViewer from '@/components/ImageViewer.vue'
import DocPageEventManager from '../DocPageEventManager'
import MobileToolBox from '../MobileToolBox.vue'
import DocMetadataInfo from '../metadata/DocMetadataInfo.vue'
import TouchUtils from '@/util/TouchUtils'
import MermaidShower from '../mermaid-shower/MermaidShower.vue';
import { SysUtils } from '@/util/SysUtils';
import ConfigService from '@/service/ConfigService';
import DocPrevNext from '../nav/DocPrevNext.vue';
import MobileToc from './MobileToc.vue';
import RelatedContent from '../RelatedContent.vue';
import EventBus from '@/components/EventBus';
import { Memo, Tickets, Search, Top } from '@element-plus/icons-vue';

// 重量级隐藏面板(echarts/jsmind/LLM)按需异步加载: 首次打开时才挂载与下载对应chunk
const KnowledgeReviewer = defineAsyncComponent(() => import('../knowledge/KnowledgeReviewer.vue'))
const KnowledgeNetwork = defineAsyncComponent(() => import('../knowledge/KnowledgeNetwork.vue'))
const MindGraph = defineAsyncComponent(() => import('../mind/MindGraph.vue'))
const LLM = defineAsyncComponent(() => import('../knowledge/LLM.vue'))

export default defineComponent({
  components: {
    MobileDocSideCategory,
    LinkPopover,
    ImageViewer,
    MobileToolBox,
    KnowledgeReviewer,
    KnowledgeNetwork,
    DocMetadataInfo,
    MindGraph,
    MermaidShower,
    LLM,
    DocPrevNext,
    MobileToc,
    RelatedContent,
    Memo, Tickets, Search, Top,
},
  setup() {
    // 面板挂载开关: 首次打开时才渲染(联动defineAsyncComponent实现chunk按需下载)
    const panels = reactive({
      mindGraph: false,
      knowledgeReviewer: false,
      knowledgeNetwork: false,
      llm: false,
    })
    const knowledgeReviewer = ref<any>()
    const knowledgeNetwork = ref<any>()
    const mindGraph = ref<any>()
    const llm = ref<any>()
    const refMap: Record<keyof typeof panels, typeof mindGraph> = {
      mindGraph, knowledgeReviewer, knowledgeNetwork, llm,
    }
    const openPanel = async (name: keyof typeof panels) => {
      panels[name] = true
      // 异步组件首次挂载需等chunk下载完成 ref就绪后才能调用show(最多等5秒)
      for (let i = 0; i < 100 && !refMap[name].value; i++) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      refMap[name].value?.show()
    }
    return {
      panels,
      knowledgeReviewer, showKnowledgeReviewer: () => openPanel('knowledgeReviewer'),
      knowledgeNetwork, showKnowledgeNetwork: () => openPanel('knowledgeNetwork'),
      mindGraph, showMindGraph: () => openPanel('mindGraph'),
      llm, showLLM: () => openPanel('llm'),
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
      loading: true as boolean,
      loadError: false as boolean,
      contentsList: [] as Content[],
    }
  },
  methods: {
    async init(doc: string, headingId?: string, kw?: string) {
      this.loading = true
      this.loadError = false
      try {
        this.file = await DocService.getDocFileInfo(this.doc)
        this.kw = kw || "";
        SysUtils.setDocTitle(this.file.name)
        this.contentsList = DocService.getContent(this.contentHtml)
        this.$nextTick(() => this.postRender(headingId))
      } catch (err) {
        // 加载失败(文档不存在/网络异常/响应非JSON)切换到错误态
        this.loadError = true
      } finally {
        this.loading = false
      }
    },
    // 内容上屏后的渲染后处理: el-skeleton的throttle会延迟内容挂载 ref未就绪时短暂重试
    postRender(headingId?: string, attempt: number = 0) {
      const docEl = this.$refs.markdownSection as HTMLElement | undefined
      if (!docEl) {
        if (attempt < 20) {
          setTimeout(() => this.postRender(headingId, attempt + 1), 50)
        }
        return
      }
      // 恢复阅读字号偏好
      const fontSize = ConfigService.get('fontSize')
      if (fontSize) {
        docEl.style.fontSize = fontSize + 'px'
      }
      // 将滚动条设置为上一次的状态(与保存侧的window.scrollY对齐 瞬时跳转避免长距离滚动动画)
      window.scrollTo({top: DocService.getDocReadRecord(this.doc), behavior: 'instant' as ScrollBehavior})
      this.eventManager!.renderMermaid();
      this.eventManager!.syncHeading(headingId);
      // 渲染数学公式
      this.eventManager!.renderLatex(docEl);
      // 代码块高亮
      this.eventManager!.renderCodeHighlight(docEl);
      this.registerNecessaryEvent(docEl);
      // 正文就绪后再拉取非关键的质量数据(dev端生成昂贵 不能抢占文档请求)
      setTimeout(() => DocService.ensureQualityLoaded(), 3000)
    },
    registerNecessaryEvent(docEl: HTMLElement) {
      this.eventManager?.registerImageClick(docEl)
      this.eventManager!.registerLinkRouter(docEl);
      this.eventManager!.registerHeadingClick(docEl);
      this.eventManager!.registerCodeCopy(docEl);
      this.eventManager!.registerMermaidFullScreenClick(docEl);
    },
    openCategory() {
      (this.$refs.docSideCategory as InstanceType<typeof MobileDocSideCategory>).showCategory = true
    },
    openToc() {
      (this.$refs.mobileToc as InstanceType<typeof MobileToc>).show()
    },
    openSearch() {
      EventBus.emit('show-mobile-search', null)
    },
    scrollToTop() {
      window.scrollTo({top: 0, behavior: 'smooth'})
    },
    handleTocItemClick(link: string) {
      this.eventManager?.syncHeading(link)
    },
  },
  beforeRouteUpdate(to, from) {
    this.doc = DocUtils.routeDocId(to)
    const headingId = to.query.headingId?.toString()
    const kw = this.$route.query.kw?.toString()
    this.init(this.doc, headingId, kw)
  },
  mounted() {
    // 监听手势(挂在el-main容器上 不依赖正文渲染时机)
    const mainEl = (this.$refs.mainEl as any).$el as HTMLElement
    TouchUtils.onSwipe(mainEl, (direction, delta, start) => {
      // 忽略发生在横向滚动容器内的滑动 避免滚动代码块/表格被误判为手势
      const target = start.target as HTMLElement | null
      if (target?.closest?.('pre, .table-wrapper, .mermaid-wrapper')) {
        return
      }
      // 横向位移须显著大于纵向 才视为横滑手势
      if (delta[0] < 150 || delta[0] < delta[1] * 2) {
        return
      }
      if (direction[0] == 'left') {
        (this.$refs.docSideCategory as InstanceType<typeof MobileDocSideCategory>).showCategory = true
      }
      // 返回手势限定从屏幕左缘起始 防误触
      if (direction[0] == 'right' && start.x < window.innerWidth * 0.15) {
        history.back()
      }
    })
  },
  beforeRouteLeave() {
    SysUtils.resetDocTitle()
  },
  async created() {
    this.doc = DocUtils.routeDocId(this.$route)
    const headingId = this.$route.query.headingId?.toString()
    const kw = this.$route.query.kw?.toString()
    this.init(this.doc, headingId, kw)
    this.eventManager = new DocPageEventManager(this, true)
    this.eventManager!.registerScrollListener();
  },
  unmounted() {
    this.eventManager!.cancelPendingRender();
    this.eventManager!.removeAllScrollListener();
  }
})
</script>

<style lang="less" scoped>
.mobile-doc-main {
  // 给底部操作栏留出空间
  padding-bottom: calc(64px + env(safe-area-inset-bottom));
}

.mobile-bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-float);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  height: 52px;
  padding-bottom: env(safe-area-inset-bottom);
  background-color: var(--card-bg-color);
  border-top: 1px solid var(--border-color);

  button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-height: 44px;
    border: none;
    background: transparent;
    color: var(--secondary-text-color);
    font-size: 11px;
    cursor: pointer;

    .el-icon {
      font-size: 18px;
    }

    &:active {
      color: var(--primary-color);
      background-color: var(--hover-bg-color);
    }
  }
}

// 移动端markdown排版微调(共享桌面markdown-v1.less 仅做小屏适配)
.markdown-section {
  :deep(h1) {
    font-size: 1.7em;
  }

  :deep(h2) {
    font-size: 1.4em;
  }

  :deep(h3) {
    font-size: 1.2em;
  }
}
</style>
