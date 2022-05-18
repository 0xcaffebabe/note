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
            <p class="create-time">⏰<span>创建时间: </span>{{new Date(file.createTime).toLocaleString()}}</p>
            <p class="quality-score">⚽<span>质量分数: </span>{{quality}}</p>
            <tag-list :tags="file.formattedMetadata.tags"/>
            <!-- doc主体开始 -->
            <div class="markdown-section" ref="markdownSection" :class="{'center': showAside}" v-html="contentHtml" :style="{'width': isDrawerShow ? '960px': '74%'}"></div>
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
            <div class="toc-wrapper" :style="{'top': parentShowHeader ? '66px': '6px', 'height': parentShowHeader ? 'calc(100% - 60px)': '100%'}">
              <keep-alive>
                <contents-list :doc="doc" @item-click="handleTocItemClick"/>
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
    @showReadingHistory="showReadingHistory"
    @showMindGraph="showMindGraph();showAside = false;isDrawerShow = true"
    @showKnowledgeNetwork="showKnowledgeNetwork();showAside = false;isDrawerShow = true"
    @showKnowledgeSystem="showKnowledgeSystem();showAside = false;isDrawerShow = true"
    @showKnowledgeTrend="showKnowledgeTrend()"
    @showBookMarkAdder="showBookmarkAdder"
    @showBookMarkList="showBookmarkList"
    @copyDocPath="handleCopyDocPath"
    @showLinkList="showLinkList"
    @go-to-ppt="goToPpt"
    @downloadPdf="downloadPdf"
    @showKnowledgeReviewer="showKnowledgeReviewer"
  />
  <!-- 工具栏结束 -->
  <!-- 关键词提示器开始 -->
  <key-word-finder ref="kwFinder" :kw="kw" @kwChanged="handleKwChanged"/>
  <!-- 关键词提示器结束 -->
  <link-popover ref="linkPopover"/>
  <el-backtop :bottom="40" :right="326" />
  <reading-history ref="readingHistory" />
  <mind-graph ref="mindGraph" @close="showAside = true;isDrawerShow = false" />
  <link-list :html="contentHtml" ref="linkList"/>
  <book-mark ref="bookMark" :doc="doc" />
  <knowledge-reviewer ref="knowledgeReviewer" />
  <keep-alive>
    <knowledge-network ref="knowledgeNetwork" :doc="doc" @close="showAside = true;isDrawerShow = false"/>
  </keep-alive>
  <keep-alive>
    <knowledge-system ref="knowledgeSystem" @close="showAside = true;isDrawerShow = false"/>
  </keep-alive>
  <keep-alive>
    <knowledge-trend ref="knowledgeTrend"/>
  </keep-alive>
  <!-- <image-viewer ref="imageViewer" /> -->
  <resource-brower ref="resourceBrower" />
</template>


<script lang="ts">
import { defineComponent, ref } from "vue";
import Content from "@/dto/Content";
import docService from "@/service/DocService";
import ContentsList from "./contents/ContentsList.vue";
import HistoryList from "./commit/HistoryList.vue";
import ReadingHistory from "./history/ReadingHistory.vue"
import MindGraph from './mind/MindGraph.vue'
import BookMark from './book-mark/BookMark.vue'
import LinkList from './LinkList.vue';
import ToolBox from './ToolBox.vue';
import KnowledgeNetwork from "./knowledge/KnowledgeNetwork.vue";
import LinkPopover from "./LinkPopover.vue";
import api from "@/api";
import DocFileInfo from "@/dto/DocFileInfo";
import DocService from "@/service/DocService";
import { ElMessage } from 'element-plus'
import './markdown-v1.less'
import './code-hl-vsc.less'
import DocUtils from "@/util/DocUtils";
import PdfUtils from '@/util/PdfUtils';
import DocSideCategory from './aside/DocSideCategory.vue';
import DocBreadcrumbNav from "./nav/DocBreadcrumbNav.vue";
import DocTabNav from "./nav/DocTabNav.vue";
import KnowledgeSystem from "./knowledge/KnowledgeSystem.vue";
import DocPageEventMnager from './DocPageEventManager';
import ResourceBrower from "./ResourceBrower.vue";
import ImageViewer from "@/components/ImageViewer.vue";
import KnowledgeReviewer from "./knowledge/KnowledgeReviewer.vue";
import KeyWordFinder from "./KeyWordFinder.vue";
import KnowledgeTrend from './knowledge/trend/KnowledgeTrend.vue'
import TagList from './tag/TagList.vue'

export default defineComponent({
  inject: ['showHeader'],
  components: {
    ContentsList,
    HistoryList,
    ReadingHistory,
    MindGraph,
    BookMark,
    ToolBox,
    LinkPopover,
    DocSideCategory,
    LinkList,
    KnowledgeNetwork,
    KnowledgeSystem,
    DocBreadcrumbNav,
    DocTabNav,
    ResourceBrower,
    ImageViewer,
    KnowledgeReviewer,
    KeyWordFinder,
    KnowledgeTrend,
    TagList,
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
    const readingHistory = ref<InstanceType<typeof ReadingHistory>>()
    const mindGraph = ref<InstanceType<typeof MindGraph>>()
    const knowledgeNetwork = ref<InstanceType<typeof KnowledgeNetwork>>()
    const knowledgeSystem = ref<InstanceType<typeof KnowledgeSystem>>()
    const bookMark = ref<InstanceType<typeof BookMark>>()
    const linkList = ref<InstanceType<typeof LinkList>>()
    const knowledgeReviewer = ref<InstanceType<typeof KnowledgeReviewer>>()
    const kwFinder = ref<InstanceType<typeof KeyWordFinder>>()
    const showReadingHistory = () => {
      readingHistory.value?.show()
    }
    const showMindGraph = () => {
      mindGraph.value?.show()
    }
    const showKnowledgeNetwork = () => {
      knowledgeNetwork.value?.show()
    }
    const showKnowledgeSystem = () => {
      knowledgeSystem.value?.show();
    }
    const showBookmarkAdder = () => {
      bookMark.value?.showAdder()
    }
    const showBookmarkList = () => {
      bookMark.value?.showMarkList()
    }
    const showLinkList = () => {
      linkList.value?.show()
    }
    const showKnowledgeReviewer = () => {
      knowledgeReviewer.value?.show();
    }
    return {
      readingHistory,showReadingHistory, 
      mindGraph, showMindGraph, 
      knowledgeNetwork, showKnowledgeNetwork,
      knowledgeSystem, showKnowledgeSystem,
      bookMark, showBookmarkAdder, showBookmarkList, 
      linkList, showLinkList,
      knowledgeReviewer, showKnowledgeReviewer,
      kwFinder
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
    },
    quality(): string {
      return DocService.calcQuanlityStr(this.file.id);
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
      const elmList:NodeListOf<HTMLElement> = document.querySelector('.markdown-section')?.querySelectorAll('h1,h2,h3,h4,h5,h6')!
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
      this.generateTOC();
      this.$nextTick(() => {
        const docEl = this.$refs.markdownSection as HTMLElement;
        // 渲染mermaid
        this.eventManager!.renderMermaid();
        // 同步滚动markdown-section到headingId区域
        this.eventManager!.syncHeading(headingId);
        // 同步滚动左侧目录 让当前激活目录位于可视区域
        this.syncCategoryListScrollBar();
        // 更新知识网络
        (this.$refs.knowledgeNetwork as InstanceType<typeof KnowledgeNetwork>).init();
        // 高亮关键词
        this.hilightKeywords(docEl, kw);
        // 更新关键词寻找器状态
        this.kwFinder?.refresh();
        // 如果关键词为空且关键词寻找器为显式状态
        if (!kw && this.kwFinder?.showFinder) {
          this.kwFinder.hide()
        }
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
    },
    generateTOC() {
      this.contentsList = docService.getContent(this.contentHtml);
    },
    handleKwChanged(kw: string){
      const docEl = this.$refs.markdownSection as HTMLElement;
      // 清空高亮关键词
      docEl.querySelectorAll('mark').forEach(e => e.replaceWith(...e.childNodes))
      // 高亮关键词
      this.hilightKeywords(docEl, kw, true);
      // 重新注册事件(高亮关键词替换了html 导致原来的事件失效)
      this.registerNecessaryEvent(docEl)
    },
    hilightKeywords(docEl: HTMLElement, kw?: string, refreshKwFinder: boolean = false) {
      if (!kw) {
        return;
      }
      const kwList = kw.trim().split(' ').filter(v => v);
      let html = docEl.innerHTML;
      for(let i of kwList) {
        html = html.replace(new RegExp(i, "gi"), (str) => `<mark>${str}</mark>`);
      }
      docEl.innerHTML = html;
      if (refreshKwFinder) {
        this.kwFinder?.refresh(kw)
      }
    },
    downloadPdf() {
      try {
        PdfUtils.downloadPdf(this.doc, true)
      }catch(err: any) {
        ElMessage.error(err.message)
      }
    },
    goToPpt(){
      const heading = this.$store.state.currentHeading;
      if (heading) {
        this.$router.push(`/ppt/${this.doc}?headingId=${heading}`)
      }else {
        this.$router.push(`/ppt/${this.doc}`)
      }
    },
    showKnowledgeTrend() {
      const kw = this.doc.split("-")[this.doc.split("-").length - 1];
      (this.$refs.knowledgeTrend as InstanceType<typeof KnowledgeTrend>).show(kw)
    },
  },
  beforeRouteUpdate(to, from) {
    const doc = to.params.doc.toString();
    this.showDoc(doc, to.query.headingId?.toString(), to.query.kw?.toString());
    (this.$refs.docSideCategory as any).updateCurrentCategory(doc);
  },
  async created() {
    this.eventManager = new DocPageEventMnager(this);
    this.eventManager!.registerScrollListener();
    this.eventManager!.listenEventBus();
    this.showDoc(this.$route.params.doc.toString(), this.$route.query.headingId?.toString(), this.$route.query.kw?.toString());
    // 全局快捷键监听
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() == "f") {
        this.kwFinder?.toggle()
        e.preventDefault();
      }
    });
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
.create-time {
  padding-top: 10px;
  margin: 0;
  font-size: 12px;
  span {
    color: #888;
  }
}
.quality-score {
  padding: 2px;
  margin: 0;
  font-size: 12px;
  span {
    color: #888;
  }
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
  padding-left: 4rem;
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

body[theme=dark] {
  background-color:var(--main-dark-bg-color);
  color: var(--main-dark-text-color);
  .main {
    background-color:var(--main-dark-bg-color);
    color: var(--main-dark-text-color);
  }
}
</style>
