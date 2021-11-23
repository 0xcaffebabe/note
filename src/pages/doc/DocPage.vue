<template>
  <el-container>
    <doc-side-category :doc="doc" :showAside="showAside" @toggle-aside="showAside = !showAside" ref="docSideCategory" />
    <el-main class="main">
      <el-skeleton :rows="25" animated :loading="loading" :throttle="50" style="max-width: 80%">
        <template #default>
          <doc-breadcrumb-nav />
          <p class="create-time">⏰创建时间: {{file.createTime}}</p>
          <!-- doc主体开始 -->
          <div class="markdown-section" :class="{'center': showAside}" v-html="contentHtml" :style="{'width': isDrawerShow ? '960px': '74%'}"></div>
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
          <div class="toc-wrapper" :style="{'top': parentShowHeader ? '80px': '20px'}">
            <keep-alive>
              <contents-list :contentsList="contentsList" />
            </keep-alive>
          </div>
          <!-- toc结束 -->
        </template>
      </el-skeleton>
    </el-main>
  </el-container>
  <!-- 工具栏开始 -->
  <tool-box 
    @showReadingHistory="showReadingHistory"
    @showMindGraph="showMindGraph();showAside = false;isDrawerShow = true"
    @showKnowledgeNetwork="showKnowledgeNetwork();showAside = false;isDrawerShow = true"
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
  <el-image-viewer @close="showImageViewer = false" v-show="showImageViewer" :url-list="imageUrlList" :hide-on-click-modal="true"/>
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
import './markdown-v1.css'
import './code-hl-vsc.css'
import DocUtils from "@/util/DocUtils";
import DocSideCategory from './aside/DocSideCategory.vue';
import DocBreadcrumbNav from "./DocBreadcrumbNav.vue";

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
    DocBreadcrumbNav,
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
    };
  },
  computed: {
    contentHtml(): string {
      return DocService.renderMd(this.file.content);
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
        this.registerLinkRouter();
        this.registerImageClick();
        this.registerHeadingClick();
        this.registerDocTagSupClick();
        this.syncHeading(headingId);
        (this.$refs.docSideCategory as any).syncCategoryListScrollBar();
      });
      this.loading = false;
    },
    syncHeading(headingId?: string){
      if (headingId) {
       const elm : HTMLElement = document.querySelector('#' + headingId)!;
      if (elm) {
        window.scrollTo(0, elm.offsetTop - 80)
      } 
    }
    },
    generateTOC() {
      this.contentsList = docService.getContent(this.contentHtml);
    },
    // 管理内页doc链接跳转 hover行为
    registerLinkRouter() {
      const aList: NodeListOf<HTMLElement> = document.querySelectorAll(
        ".markdown-section a[origin-link]"
      );
      for (let i = 0; i < aList.length; i++) {
        const a = aList[i];
        a.onclick = (e: Event) => {
          const href = a.getAttribute("href");
          if (href?.startsWith("doc") || href?.startsWith("/doc")) {
            this.$router.push(href);
            e.preventDefault();
          }
        };
        a.addEventListener('contextmenu', (e: MouseEvent) => {
          const originLink = a.getAttribute('origin-link');
          (this.$refs.linkPopover as any).show(originLink, e.clientX, e.clientY);
          e.preventDefault();
          e.stopPropagation();
          return false;
        });
      }
    },
    // 管理页内图片点击行为
    registerImageClick(){
      const imgList: NodeListOf<HTMLElement> = document.querySelectorAll(
        ".markdown-section .img-wrapper"
      );
      for (let i = 0; i < imgList.length; i++) {
        const img = imgList[i];
        img.onclick = (e: Event) => {
          // 展示大图
          const src = img.querySelector('img')?.getAttribute('src') || '';
          this.imageUrlList = [src];
          this.showImageViewer = true;
        };
      }
    },
    // 管理页内heading点击行为
    registerHeadingClick(){
      const headingList: NodeListOf<HTMLElement> = document.querySelectorAll(
        `.markdown-section h1,
         .markdown-section h2,
         .markdown-section h3,
         .markdown-section h4,
         .markdown-section h5,
         .markdown-section h6`
      );
      for(let i = 0;i<headingList.length;i++){
        const heading = headingList[i];
        heading.onclick= async (e) => {
          const id = heading.innerText;
          const url = "/" + DocUtils.docId2Url(this.doc) + "#" + id;
          await navigator.clipboard.writeText(url);
          ElMessage.success('复制成功: ' + url);
        }
      }
    },
    // 管理doc-tag点击
    registerDocTagSupClick(){
      const supList: NodeListOf<HTMLElement> = document.querySelectorAll(
        ".markdown-section .doc-tag-main"
      );
      for (let i = 0; i < supList.length; i++) {
        const sup = supList[i];
        sup.onclick = (e: Event) => {
          const tag = sup.innerText
          this.$router.push('/tag?tag=' + tag)
          e.preventDefault();
          e.stopPropagation();
        };
      }
    },
    // 滚动监听
    registerScrollListener() {
      let timer: NodeJS.Timeout;
      document.addEventListener("scroll", (e) => {
        // 限流更新阅读位置
        timer = setTimeout(() => {
          clearTimeout(timer);
          docService.setDocReadRecrod(this.doc, window.scrollY);
        }, 1000);
        // 滚动的同时将link-popover隐藏掉
        (this.$refs.linkPopover as any).hide();
      });
    },
  },
  beforeRouteUpdate(to, from) {
    const doc = to.params.doc.toString();
    this.showDoc(doc, to.query.headingId?.toString());
    (this.$refs.docSideCategory as any).updateCurrentCategory(doc);
  },
  async created() {
    this.registerScrollListener();
    this.showDoc(this.$route.params.doc.toString(), this.$route.query.headingId?.toString());
  },
  unmounted(){
    // 一些清理操作
    document.onscroll = null
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
@media screen and(max-width: 1366px) {
  .center {
    padding-left: 0rem;
  }
  .toc-wrapper {
  right: 2px;
}
}
</style>
