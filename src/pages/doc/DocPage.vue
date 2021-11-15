<template>
  <el-container>
    <el-aside width="280px" v-show="showAside" :lock-scroll="false">
      <div class="category-wrapper" :style="{'height': parentShowHeader ? 'calc(100% - 60px)': '100%'}">
        <keep-alive>
          <category-list ref="categoryList" :doc="doc" />
        </keep-alive>
      </div>
    </el-aside>
    <el-affix :offset="384" style="height:100px">
      <el-button
        class="cate-fix-btn"
        type="default"
        size="mini"
        @click="showAside = !showAside"
        :class="{ 'active': showAside }"
      >
        <el-icon>
          <arrow-left-bold v-if="showAside" />
          <arrow-right-bold v-else />
        </el-icon>
      </el-button>
    </el-affix>
    <el-main class="main">
      <el-skeleton :rows="25" animated :loading="loading" :throttle="50" style="max-width: 80%">
        <template #default>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item
              :to="{ path: '/doc/' + docUrl2Id(chain.link) }"
              v-for="chain in categoryChainList"
              :key="chain.name"
            >{{ chain.name }}</el-breadcrumb-item>
          </el-breadcrumb>
          <p class="create-time">⏰创建时间: {{file.createTime}}</p>
          <div class="markdown-section" :class="{'center': showAside}" v-html="contentHtml" :style="{'width': isDrawerShow ? '960px': '74%'}"></div>
          <!-- 提交历史开始 -->
          <div style="text-align: center">
            <el-divider style="width:72%" />
            <div class="footer-wrapper">
              <history-list :file="file" :doc="doc" />
            </div>
          </div>
          <!-- 提交历史结束 -->
          <!-- 工具栏开始 -->
          <tool-box 
            @showReadingHistory="$refs.readingHistory.show()"
            @showMindGraph="$refs.mindGraph.show();showAside = false;isDrawerShow = true"
            @showKnowledgeNetwork="$refs.knowledgeNetwork.show();showAside = false;isDrawerShow = true"
            @showBookMarkAdder="$refs.bookMark.showAdder()"
            @showBookMarkList="$refs.bookMark.showMarkList()"
            @copyDocPath="handleCopyDocPath"
            @showLinkList="$refs.linkList.show()"
          />
          <!-- 工具栏结束 -->
        </template>
      </el-skeleton>
      <div class="toc-wrapper" :style="{'top': parentShowHeader ? '80px': '20px'}">
        <keep-alive>
          <contents-list :contentsList="contentsList" />
        </keep-alive>
      </div>
    </el-main>
  </el-container>
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
import { defineComponent } from "vue";
import Category from "@/dto/Category";
import Content from "@/dto/Content";
import categoryService from "@/service/CategoryService";
import docService from "@/service/DocService";
import CategoryList from "./category/CategoryList.vue";
import ContentsList from "./contents/ContentsList.vue";
import HistoryList from "./commit/HistoryList.vue";
import ReadingHistory from "./history/ReadingHistory.vue"
import MindGraph from './mind/MindGraph.vue'
import BookMark from './book-mark/BookMark.vue'
import LinkList from './LinkList.vue';
import ToolBox from './ToolBox.vue';
import KnowledgeNetwork from "./knowledge/KnowledgeNetwork.vue";
import api from "@/api";
import DocFileInfo from "@/dto/DocFileInfo";
import DocService from "@/service/DocService";
import { ElMessage } from 'element-plus'
import { ArrowLeftBold, ArrowRightBold } from "@element-plus/icons";
import './markdown-v1.css'
import './code-hl-vsc.css'
import DocUtils from "@/util/DocUtils";

let timer: NodeJS.Timeout;
export default defineComponent({
  inject: ['showHeader'],
  components: {
    CategoryList,
    ContentsList,
    HistoryList,
    ReadingHistory,
    MindGraph,
    BookMark,
    ToolBox,
    LinkList,
    KnowledgeNetwork,
    ArrowLeftBold,
    ArrowRightBold
  },
  watch: {
    showHeader: {
      handler(val){
        this.parentShowHeader = val;
      },
      immediate: true,
    }
    
  },
  data() {
    return {
      cateList: [] as Category[],
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
    currentCategory(): Category {
      return this.$store.state.currentCategory;
    },
    categoryChainList(): Category[] {
      if (!this.currentCategory) {
        return [];
      }
      return this.getCategoryChain(this.currentCategory);
    },
  },
  methods: {
    docUrl2Id(url: string) {
      return docService.docUrl2Id(url);
    },
    getCategoryChain(value: Category) {
      const chainList: Category[] = [value];
      while (value.parent) {
        chainList.push(value.parent);
        value = value.parent;
      }
      return chainList.reverse();
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
        this.syncCategoryListScrollBar();
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
    // 移动目录的滚动条 让当前选中菜单项处于可视区域
    syncCategoryListScrollBar(){
      const categoryWrapper :HTMLElement = document.querySelector('.category-wrapper')!;
      const activeMenu :HTMLElement = (document.querySelector('.el-menu-item.is-active') as HTMLElement);
      const activeMenuPos: number = activeMenu.getBoundingClientRect().y;
      const amount = activeMenuPos < 350? -50: 50;
      let timer = setInterval(() => {
        const activeMenuPos1: number = activeMenu.getBoundingClientRect().y;
        if ((activeMenuPos1 >= 350 && activeMenuPos1 <= categoryWrapper.offsetHeight) || categoryWrapper.scrollTop + amount < 0) {
          clearInterval(timer)
          return
        }
        categoryWrapper.scrollTo(0, categoryWrapper.scrollTop + amount)
      }, 4)
    },
    generateTOC() {
      this.contentsList = docService.getContent(this.contentHtml);
    },
    // 管理内页链接跳转行为
    registerLinkRouter() {
      const aList: NodeListOf<HTMLElement> = document.querySelectorAll(
        ".markdown-section a"
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
    // 管理doc-tag角标点击行为
    registerDocTagSupClick(){
      const supList: NodeListOf<HTMLElement> = document.querySelectorAll(
        ".markdown-section .doc-tag"
      );
      for (let i = 0; i < supList.length; i++) {
        const sup = supList[i];
        sup.onclick = (e: Event) => {
          const tag = sup.getAttribute('tag') || '';
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
      });
    },
  },
  beforeRouteUpdate(to, from) {
    const doc = to.params.doc.toString();
    this.showDoc(doc, to.query.headingId?.toString());
    const categoryListRef: any = this.$refs.categoryList;
    categoryListRef.updateCurrentCategory(doc);
  },
  async created() {
    this.registerScrollListener();
    this.showDoc(this.$route.params.doc.toString(), this.$route.query.headingId?.toString());
    this.cateList = await categoryService.getCategoryList();
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
.category-wrapper {
  transition: all 0.2s;
  position: fixed;
  overflow-y: scroll;
  width: 280px;
}
.main {
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
.cate-fix-btn {
  padding: 7px 2px;
  margin-left: 26px;
}
.el-affix .active {
  margin-left: -26px;
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
