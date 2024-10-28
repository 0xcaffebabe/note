<template>
  <el-container>
    <doc-side-category :doc="doc" :showAside="showAside" @toggle-aside="showAside = !showAside" ref="docSideCategory" />
    <el-main class="main">
      <keep-alive>
        <doc-tab-nav @dbclick="handleTabNavDbclick" />
      </keep-alive>
      <el-skeleton :rows="25" animated :loading="loading" :throttle="50" style="max-width: 80%;margin-top:20px;position:fixed">
        <template #default>
          <div class="main-content">
            <doc-breadcrumb-nav />
            <doc-metadata-info :file="file" @link-click="link => eventManager?.openOutterLink(link)"/>
            <!-- doc主体开始 -->
            <div class="main markdown-section" ref="markdownSection" :class="{'center': showAside}" v-html="contentHtml" :style="{'width': isDrawerShow ? '920px': '74%'}"></div>
            <!-- doc主体结束 -->
            <!-- 提交历史开始 -->
            <div style="text-align: center">
              <el-divider style="width:72%" />
              <div class="footer-wrapper">
                <history-list :file="file" :doc="doc" />
              </div>
            </div>
            <!-- 提交历史结束 -->
            <!-- toc开始 -->
            <div class="toc-wrapper" :style="{'top': parentShowHeader ? '66px': '6px', 'height': parentShowHeader ? 'calc(80 % - 60px)': '80%'}">
              <keep-alive>
                <contents-list :doc="doc" @item-click="handleTocItemClick"/>
              </keep-alive>
              <keep-alive>
                <mind-note/>
              </keep-alive>
            </div>
            <!-- toc结束 -->
          </div>
        </template>
      </el-skeleton>
    </el-main>
  </el-container>
  <!-- 工具栏开始 -->
  <tool-box 
    @showMindGraph="showMindGraph();showAside = false;isDrawerShow = true"
    @showKnowledgeNetwork="showKnowledgeNetwork();showAside = false;isDrawerShow = true"
    @showKnowledgeTrend="showKnowledgeTrend()"
    @copyDocPath="handleCopyDocPath"
    @showLinkList="showLinkList"
    @showKnowledgeReviewer="showKnowledgeReviewer"
    @show-llm="showLLM();showAside = false;isDrawerShow = true"
    @open-in-editor="openInEditor"
  />
  <!-- 工具栏结束 -->
  <link-popover ref="linkPopover"/>
  <selection-popover ref="selectionPopover" @showKnowledgeTrend="showKnowledgeTrend"/>
  <el-backtop :bottom="220" :right="26" />
  <mind-graph ref="mindGraph" @close="showAside = true;isDrawerShow = false" />
  <link-list :html="contentHtml" ref="linkList"/>
  <knowledge-reviewer ref="knowledgeReviewer" :doc="doc"/>
  <mermaid-shower ref="mermaidShower"/>
  <keep-alive>
    <knowledge-network ref="knowledgeNetwork" :doc="doc" @close="showAside = true;isDrawerShow = false"/>
  </keep-alive>
  <keep-alive>
    <knowledge-trend ref="knowledgeTrend"/>
  </keep-alive>
  <keep-alive>
    <LLM :doc="doc" ref="llm" @close="showAside = true;isDrawerShow = false"/>
  </keep-alive>
  <image-viewer ref="imageViewer" />
  <instant-previewer ref="instantPreviewer"/>
  <resource-brower ref="resourceBrower" />
</template>


<script lang="ts">
import { defineComponent, ref } from "vue";
import Content from "@/dto/Content";
import docService from "@/service/DocService";
import ContentsList from "./contents/ContentsList.vue";
import HistoryList from "./commit/HistoryList.vue";
import MindGraph from './mind/MindGraph.vue'
import MindNote from './mind/MindNote.vue'
import LinkList from './LinkList.vue';
import ToolBox from './ToolBox.vue';
import KnowledgeNetwork from "./knowledge/KnowledgeNetwork.vue";
import LinkPopover from "./LinkPopover.vue";
import DocFileInfo from "@/dto/DocFileInfo";
import DocService from "@/service/DocService";
import 'element-plus/es/components/message/style/css'
import { ElMessage } from 'element-plus'
import './markdown-v1.less'
import './code-hl-vsc.less'
import DocUtils from "@/util/DocUtils";
import DocSideCategory from './aside/DocSideCategory.vue';
import DocBreadcrumbNav from "./nav/DocBreadcrumbNav.vue";
import DocTabNav from "./nav/DocTabNav.vue";
import DocPageEventMnager from './DocPageEventManager';
import ResourceBrower from "./ResourceBrower.vue";
import ImageViewer from "@/components/ImageViewer.vue";
import KnowledgeReviewer from "./knowledge/KnowledgeReviewer.vue";
import KnowledgeTrend from './knowledge/trend/KnowledgeTrend.vue'
import DocMetadataInfo from './metadata/DocMetadataInfo.vue'
import SelectionPopover from './tool/SelectionPopover.vue'
import InstantPreviewer from './tool/InstantPreviewer.vue'
import { SysUtils } from "@/util/SysUtils";
import config from '@/config';
import MermaidShower from './mermaid-shower/MermaidShower.vue';
import LLM from './knowledge/LLM.vue';

export default defineComponent({
  inject: ['showHeader'],
  components: {
    ContentsList,
    HistoryList,
    MindGraph,
    MindNote,
    ToolBox,
    LinkPopover,
    DocSideCategory,
    LinkList,
    KnowledgeNetwork,
    DocBreadcrumbNav,
    DocTabNav,
    ResourceBrower,
    ImageViewer,
    KnowledgeReviewer,
    KnowledgeTrend,
    DocMetadataInfo,
    SelectionPopover,
    InstantPreviewer,
    MermaidShower,
    LLM
},
  watch: {
    showHeader: {
      handler(val){
        this.parentShowHeader = val;
      },
      immediate: true,
    }
    
  },
  setup(){
    const mindGraph = ref<InstanceType<typeof MindGraph>>()
    const knowledgeNetwork = ref<InstanceType<typeof KnowledgeNetwork>>()
    const linkList = ref<InstanceType<typeof LinkList>>()
    const knowledgeReviewer = ref<InstanceType<typeof KnowledgeReviewer>>()
    const llm = ref<InstanceType<typeof LLM>>()
    const showMindGraph = () => {
      mindGraph.value?.show()
    }
    const showKnowledgeNetwork = () => {
      knowledgeNetwork.value?.show()
    }
    const showLinkList = () => {
      linkList.value?.show()
    }
    const showKnowledgeReviewer = () => {
      knowledgeReviewer.value?.show();
    }
    const showLLM = () => {
      llm.value?.show();
    }
    return {
      mindGraph, showMindGraph, 
      knowledgeNetwork, showKnowledgeNetwork,
      linkList, showLinkList,
      knowledgeReviewer, showKnowledgeReviewer,
      llm, showLLM
    }
  },
  data() {
    return {
      file: new DocFileInfo() as DocFileInfo,
      contentsList: [] as Content[],
      doc: "" as string,
      kw: "" as string,
      loading: true as boolean,
      showAside: true as boolean,
      isDrawerShow: false as boolean,
      parentShowHeader: true as boolean,
      eventManager: null as DocPageEventMnager | null
    };
  },
  computed: {
    contentHtml(): string {
      return DocService.renderMd(this.file);
    }
  },
  methods: {
    docUrl2Id(url: string) {
      return docService.docUrl2Id(url);
    },
    async handleCopyDocPath(){
      const url = "/" + DocUtils.docId2Url(this.doc);
      await navigator.clipboard.writeText(url);
      ElMessage.success('复制成功: ' + url);
    },
    handleTocItemClick(id: string) {
      const elmList:NodeListOf<HTMLElement> = document.querySelector('.main.markdown-section')?.querySelectorAll('h1,h2,h3,h4,h5,h6')!
      for(let elm of elmList) {
        if (elm.id.replace(/<mark>/gi, '').replace(/<\/mark>/gi, '') == id) {
          window.scrollTo(0, elm.offsetTop - 80)
          break
        }
      }
    },
    handleTabNavDbclick() {
      this.syncCategoryListScrollBar();
    },
    syncCategoryListScrollBar() {
      (this.$refs.docSideCategory as any).syncCategoryListScrollBar();
    },
    openInEditor() {
      window.open(`vscode://file/${config.localUrl}/${docService.docId2Url(this.doc)}/`, '_blank')
    },
    async showDoc(doc: string, headingId?: string, kw?: string) {
      // 将滚动条设置为上一次的状态
      document.body.scrollTo(0, docService.getDocReadRecord(doc))
      this.loading = true;
      this.doc = doc;
      this.kw = kw || "";
      try {
        this.file = await DocService.getDocFileInfo(doc);
      } catch (err: any) {
        ElMessage.error(err.message)
      }
      SysUtils.setDocTitle(this.file.name)
      this.generateTOC();
      this.$nextTick(() => {
        const docEl = this.$refs.markdownSection as HTMLElement;
        if (!kw) {
          this.eventManager!.renderMermaid();
        }
        // 同步滚动markdown-section到headingId区域
        this.eventManager!.syncHeading(headingId);
        // 同步滚动左侧目录 让当前激活目录位于可视区域
        this.syncCategoryListScrollBar();
        // 更新知识网络
        (this.$refs.knowledgeNetwork as InstanceType<typeof KnowledgeNetwork>).init();
        // 渲染数学公式
        this.eventManager!.renderLatex(docEl);
        this.registerNecessaryEvent(docEl)
      });
      this.loading = false;
    },
    registerNecessaryEvent(docEl: HTMLElement) {
      // 注册一些针对markdown-section的必要的事件
      this.eventManager!.registerLinkRouter(docEl);
      this.eventManager!.registerImageClick(docEl);
      this.eventManager!.registerHeadingClick(docEl);
      this.eventManager!.registerDocTagSupClick(docEl);
      this.eventManager!.registerTextSelected(docEl);
      this.eventManager!.registerMermaidFullScreenClick(docEl);
    },
    generateTOC() {
      this.contentsList = docService.getContent(this.contentHtml);
    },
    showKnowledgeTrend(kw?: string) {
      (this.$refs.knowledgeTrend as InstanceType<typeof KnowledgeTrend>).show(this.file, kw)
    },
  },
  beforeRouteUpdate(to, from) {
    const doc = to.params.doc.toString();
    this.showDoc(doc, to.query.headingId?.toString(), to.query.kw?.toString());
    (this.$refs.docSideCategory as any).updateCurrentCategory(doc);
  },
  beforeRouteLeave() {
    SysUtils.resetDocTitle()
  },
  async created() {
    this.eventManager = new DocPageEventMnager(this);
    this.eventManager!.registerScrollListener();
    this.eventManager!.listenEventBus();
    this.showDoc(this.$route.params.doc.toString(), this.$route.query.headingId?.toString(), this.$route.query.kw?.toString());
  },
  unmounted(){
    // 一些清理操作
    this.eventManager!.removeAllScrollListener();
  }
});
</script>

<style lang="less" scoped>
.el-container {
  display: flex;
  justify-content: space-between;
}
.main {
  background-color: #fff;
  padding-left: 4em;
  padding-bottom: 20px;
}
.toc-wrapper {
  transition: all 0.2s;
  position: fixed;
  right: 16px;
}
.footer-wrapper {
  display: flex;
  justify-content: space-between;
}
.center {
  transition: all 0.2s;
  padding-left: 1rem;
}
.main-content {
  padding-top: 24px;
}
.markdown-section {
  :deep(mark) {
    color: white;
    background-color: #E6A23C;
  }
}
@media screen and(max-width: 1366px) {
  .center {
    padding-left: 0rem;
  }
  .toc-wrapper {
    right: 2px;
  }
}
@media screen and(max-width: 1180px) {
  .center {
    padding-left: 0rem;
  }
  .markdown-section {
    width: 66%!important;
  }
}
.el-backtop {
  transition: all .1s;
}

body[theme=dark] {
  background-color:var(--main-dark-bg-color);
  color: var(--main-dark-text-color);
  .main {
    background-color:var(--main-dark-bg-color);
    color: var(--main-dark-text-color);
  }
  .el-backtop {
    background-color: var(--second-dark-bg-color);
  }
  .el-backtop:hover {
    background-color: #666;
  }
}
</style>
