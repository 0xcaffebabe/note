<template>
  <el-container>
    <doc-side-category :doc="doc" :showAside="showAside" @toggle-aside="showAside = !showAside" ref="docSideCategory" />
    <el-main class="main">
      <doc-tab-nav />
      <el-skeleton :rows="25" animated :loading="loading" :throttle="50" style="max-width: 80%">
        <template #default>
          <div class="main-content">
            <doc-breadcrumb-nav />
            <p class="create-time">⏰创建时间: {{new Date(file.createTime).toLocaleString()}}</p>
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
            <div class="toc-wrapper" :style="{'top': parentShowHeader ? '66px': '6px'}">
              <keep-alive>
                <contents-list :contentsList="contentsList" />
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
    @showBookMarkAdder="showBookmarkAdder"
    @showBookMarkList="showBookmarkList"
    @copyDocPath="handleCopyDocPath"
    @showLinkList="showLinkList"
  />
  <!-- 工具栏结束 -->
  <link-popover ref="linkPopover"/>
  <el-backtop :bottom="40" :right="326" />
  <reading-history ref="readingHistory" />
  <mind-graph ref="mindGraph" @close="showAside = true;isDrawerShow = false" />
  <link-list :html="contentHtml" ref="linkList"/>
  <book-mark ref="bookMark" :doc="doc" />
  <keep-alive>
    <knowledge-network ref="knowledgeNetwork" :doc="doc" @close="showAside = true;isDrawerShow = false"/>
  </keep-alive>
  <keep-alive>
    <knowledge-system ref="knowledgeSystem" @close="showAside = true;isDrawerShow = false"/>
  </keep-alive>
  <el-image-viewer @close="showImageViewer = false" v-show="showImageViewer" :url-list="imageUrlList" :hide-on-click-modal="true"/>
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
import './code-hl-vsc.css'
import DocUtils from "@/util/DocUtils";
import DocSideCategory from './aside/DocSideCategory.vue';
import DocBreadcrumbNav from "./nav/DocBreadcrumbNav.vue";
import DocTabNav from "./nav/DocTabNav.vue";
import KnowledgeSystem from "./knowledge/KnowledgeSystem.vue";
import DocPageEventMnager from './DocPageEventManager';
import ResourceBrower from "./ResourceBrower.vue";

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
    return {
      readingHistory,showReadingHistory, 
      mindGraph, showMindGraph, 
      knowledgeNetwork, showKnowledgeNetwork,
      knowledgeSystem, showKnowledgeSystem,
      bookMark, showBookmarkAdder, showBookmarkList, 
      linkList, showLinkList
    }
  },
  data() {
    return {
      file: new DocFileInfo() as DocFileInfo,
      contentsList: [] as Content[],
      doc: "" as string,
      loading: true as boolean,
      showAside: true as boolean,
      showImageViewer: false as boolean,
      isDrawerShow: false as boolean,
      imageUrlList: [] as string[],
      parentShowHeader: true as boolean,
      eventManager: null as DocPageEventMnager | null
    };
  },
  computed: {
    contentHtml(): string {
      return DocService.renderMd(this.file);
    },
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
    async showDoc(doc: string, headingId?: string) {
      // 将滚动条设置为上一次的状态
      document.body.scrollTo(0, docService.getDocReadRecord(doc))
      this.loading = true;
      this.doc = doc;
      try {
        this.file = await api.getDocFileInfo(doc);
      } catch (err: any) {
        ElMessage.error(err.message)
      }
      this.generateTOC();
      this.$nextTick(() => {
        const docEl = this.$refs.markdownSection as HTMLElement;
        // 注册一些针对markdown-section的必要的事件
        this.eventManager!.registerLinkRouter(docEl);
        this.eventManager!.registerImageClick(docEl);
        this.eventManager!.registerHeadingClick(docEl);
        this.eventManager!.registerDocTagSupClick(docEl);
        // 同步滚动markdown-section到headingId区域
        this.eventManager!.syncHeading(headingId);
        // 同步滚动左侧目录 让当前激活目录位于可视区域
        (this.$refs.docSideCategory as any).syncCategoryListScrollBar();
        // 更新知识网络
        (this.$refs.knowledgeNetwork as InstanceType<typeof KnowledgeNetwork>).init();
      });
      this.loading = false;
    },
    generateTOC() {
      this.contentsList = docService.getContent(this.contentHtml);
    },
  },
  beforeRouteUpdate(to, from) {
    const doc = to.params.doc.toString();
    this.showDoc(doc, to.query.headingId?.toString());
    (this.$refs.docSideCategory as any).updateCurrentCategory(doc);
  },
  async created() {
    this.eventManager = new DocPageEventMnager(this);
    this.eventManager!.registerScrollListener();
    this.showDoc(this.$route.params.doc.toString(), this.$route.query.headingId?.toString());
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
  color: #888;
}
.toc-wrapper {
  transition: all 0.2s;
  position: fixed;
  right: 16px;
  height: calc(100% - 60px);
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
