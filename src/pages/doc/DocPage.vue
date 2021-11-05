<template>
  <el-container>
    <el-aside width="280px" v-show="showAside" :lock-scroll="false">
      <div class="category-wrapper">
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
          <div class="markdown-section" v-html="contentHtml" :style="{'width': isDrawerShow ? '960px': '74%'}"></div>
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
          />
          <!-- 工具栏结束 -->
        </template>
      </el-skeleton>
      <div class="toc-wrapper">
        <keep-alive>
          <contents-list :contentsList="contentsList" />
        </keep-alive>
      </div>
    </el-main>
  </el-container>
  <el-backtop :bottom="40" :right="326" />
  <reading-history ref="readingHistory" />
  <mind-graph ref="mindGraph" @close="showAside = true;isDrawerShow = false" />
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
import ToolBox from './ToolBox.vue';
import KnowledgeNetwork from "./knowledge/KnowledgeNetwork.vue";
import api from "@/api";
import DocFileInfo from "@/dto/DocFileInfo";
import DocService from "@/service/DocService";
import { ElMessage } from 'element-plus'
import { ArrowLeftBold, ArrowRightBold } from "@element-plus/icons";
import './markdown-lark.css'
import './code-hl-vsc.css'

let timer: NodeJS.Timeout;
export default defineComponent({
  components: {
    CategoryList,
    ContentsList,
    HistoryList,
    ReadingHistory,
    MindGraph,
    BookMark,
    ToolBox,
    KnowledgeNetwork,
    ArrowLeftBold,
    ArrowRightBold
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
      imageUrlList: [] as string[]
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
    // 管理业内图片点击行为
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
  position: fixed;
  overflow-y: scroll;
  height: calc(100% - 60px);
  width: 280px;
}
.main {
  padding-left: 4em;
  padding-bottom: 20px;
}
.toc-wrapper {
  position: fixed;
  top: 80px;
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
</style>
