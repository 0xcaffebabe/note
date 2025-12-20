<template>
  <el-container>
    <doc-side-category :doc="doc" :showAside="showAside" @toggle-aside="showAside = !showAside" ref="docSideCategory" />
    <el-main class="main">
      <keep-alive>
        <doc-tab-nav @dbclick="handleTabNavDbclick" :style="{'width': isDrawerShow ? '920px': '74%'}"/>
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
            <div class="toc-wrapper" :style="{'top': parentShowHeader ? '66px': '6px', 'height': parentShowHeader ? 'calc(80 % - 60px)': '80%', 'display': showContentsList ? 'block' : 'none'}">
              <keep-alive>
                <contents-list :doc="doc" @item-click="handleTocItemClick"/>
              </keep-alive>
            </div>
            <!-- toc结束 -->

            <!-- 目录切换按钮 -->
            <div class="toc-toggle-btn" @click="toggleContentsList">
              <el-icon v-if="showContentsList"><FolderOpened /></el-icon>
              <el-icon v-else><Folder /></el-icon>
            </div>

          </div>
        </template>
      </el-skeleton>
    </el-main>
  </el-container>
  <!-- 工具栏开始 -->
  <tool-box
    @showMindGraph="showMindGraph();showAside = false;isDrawerShow = true"
    @showKnowledgeNetwork="showKnowledgeNetwork();showAside = false;isDrawerShow = true"
    @showKnowledgeIndex="showKnowledgeIndex();showAside = false;isDrawerShow = true"
    @copyDocPath="handleCopyDocPath"
    @copyDocContent="handleCopyDocContent"
    @showLinkList="showLinkList"
    @showKnowledgeReviewer="showKnowledgeReviewer"
    @show-llm="showLLM();showAside = false;isDrawerShow = true"
    @open-in-editor="openInEditor"
    @handleRandomReview="handleRandomReview"
  />
  <!-- 工具栏结束 -->
  <link-popover ref="linkPopover"/>
  <el-backtop :bottom="220" :right="26" />
  <mind-graph ref="mindGraph" @close="showAside = true;isDrawerShow = false" />
  <link-list :html="contentHtml" ref="linkList"/>
  <knowledge-reviewer ref="knowledgeReviewer" :doc="doc"/>
  <mermaid-shower ref="mermaidShower"/>
  <keep-alive>
    <knowledge-network ref="knowledgeNetwork" :doc="doc" @close="showAside = true;isDrawerShow = false"/>
  </keep-alive>
  <keep-alive>
    <knowledge-index ref="knowledgeIndex" :doc="doc" @close="showAside = true;isDrawerShow = false" @navigate="handleNavigate"/>
  </keep-alive>
  <keep-alive>
    <LLM :doc="doc" ref="llm" @close="showAside = true;isDrawerShow = false"/>
  </keep-alive>
  <image-viewer ref="imageViewer" />
  <instant-previewer ref="instantPreviewer"/>
  <resource-brower ref="resourceBrower" />

  <!-- 右下角整合面板（思维笔记和知识网络） -->
  <div class="right-bottom-panel-container" v-if="showContentsList">
    <right-bottom-panel :doc="doc" />
  </div>
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
import KnowledgeNetworkContent from "./knowledge/KnowledgeNetworkContent.vue";
import KnowledgeNetworkChart from "./knowledge/KnowledgeNetworkChart.vue";
import KnowledgeIndex from "./knowledge/KnowledgeIndex.vue";
import RightBottomPanel from "./knowledge/RightBottomPanel.vue";
import LinkPopover from "./LinkPopover.vue";
import DocFileInfo from "@/dto/DocFileInfo";
import DocService from "@/service/DocService";
import 'element-plus/es/components/message/style/css'
import { ElMessage } from 'element-plus'
import './markdown-v1.less'
import './code-hl-vsc.less'
import DocUtils from "@/util/DocUtils";
import CategoryService from "@/service/CategoryService";
import DocSideCategory from './aside/DocSideCategory.vue';
import DocBreadcrumbNav from "./nav/DocBreadcrumbNav.vue";
import DocTabNav from "./nav/DocTabNav.vue";
import DocPageEventMnager from './DocPageEventManager';
import ResourceBrower from "./ResourceBrower.vue";
import ImageViewer from "@/components/ImageViewer.vue";
import KnowledgeReviewer from "./knowledge/KnowledgeReviewer.vue";
import DocMetadataInfo from './metadata/DocMetadataInfo.vue'
import InstantPreviewer from './tool/InstantPreviewer.vue'
import { SysUtils } from "@/util/SysUtils";
import config from '@/config';
import api from "@/api";
import MermaidShower from './mermaid-shower/MermaidShower.vue';
import LLM from './knowledge/LLM.vue';
import {Folder, FolderOpened, Management } from '@element-plus/icons-vue';

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
    KnowledgeNetworkContent,
    KnowledgeNetworkChart,
    KnowledgeIndex,
    RightBottomPanel,
    DocBreadcrumbNav,
    DocTabNav,
    ResourceBrower,
    ImageViewer,
    KnowledgeReviewer,
    DocMetadataInfo,
    InstantPreviewer,
    MermaidShower,
    LLM,
    Folder,
    FolderOpened,
    Management
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
    const knowledgeIndex = ref<InstanceType<typeof KnowledgeIndex>>()
    const linkList = ref<InstanceType<typeof LinkList>>()
    const knowledgeReviewer = ref<InstanceType<typeof KnowledgeReviewer>>()
    const llm = ref<InstanceType<typeof LLM>>()
    const showMindGraph = () => {
      mindGraph.value?.show()
    }
    const showKnowledgeNetwork = () => {
      knowledgeNetwork.value?.show()
    }
    const showKnowledgeIndex = () => {
      knowledgeIndex.value?.show()
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
      knowledgeIndex, showKnowledgeIndex,
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
      showContentsList: window.innerWidth > 1180, // 根据屏幕宽度初始化显示状态
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
    async handleCopyDocContent(){
      try {
        // 使用DocService获取文档文件信息，直接获取原始markdown内容
        const fileInfo = await DocService.getDocFileInfo(this.doc);
        if (fileInfo && fileInfo.content) {
          await navigator.clipboard.writeText(fileInfo.content);
          ElMessage.success('知识复制成功！');
        } else {
          ElMessage.error('未能获取文档内容');
        }
      } catch (error) {
        console.error('复制文档内容失败:', error);
        try {
          // 如果无法获取原始markdown，则复制渲染后的文本内容
          const markdownSection = document.querySelector('.main.markdown-section');
          if (markdownSection) {
            await navigator.clipboard.writeText(markdownSection.textContent || '');
            ElMessage.success('知识复制成功（复制了渲染后的内容）！');
          } else {
            ElMessage.error('未能获取文档内容');
          }
        } catch (fallbackError) {
          console.error('复制文档内容失败:', fallbackError);
          ElMessage.error('知识复制失败');
        }
      }
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
      window.scrollTo(0, docService.getDocReadRecord(doc))
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
    toggleContentsList() {
      this.showContentsList = !this.showContentsList;
    },
    async randomizedReview() { 
      // 如果没有关联文档，使用原来的随机策略
      const flatCategoryList = await CategoryService.getFlatCategoryList();
      const randomCategory = flatCategoryList[Math.floor(Math.random() * flatCategoryList.length)];
      this.$router.push("/doc/" + DocUtils.docUrl2Id(randomCategory.link));
    },
    async handleRandomReview() {

        try {
          // 获取知识网络数据
          const network = await api.getKnowledgeNetwork();

          // 找到与当前文档直接关联的文档
          let relatedDocs: string[] = [];

          // 查找当前文档的出链
          const currentNode = network.find(node => node.id === this.doc);
          if (currentNode && currentNode.links) {
            relatedDocs.push(...currentNode.links.map(link => link.id));
          }

          // 查找指向当前文档的入链
          const inboundLinks = network.filter(node =>
            node.links && node.links.some(link => link.id === this.doc)
          );
          relatedDocs.push(...inboundLinks.map(node => node.id));

          // 去重
          relatedDocs = [...new Set(relatedDocs)];

          // 如果有关联文档，则随机选择一个
          if (relatedDocs.length > 0) {
            const randomIndex = Math.floor(Math.random() * relatedDocs.length);
            const selectedDoc = relatedDocs[randomIndex];
            try {
              await DocService.getDocFileInfo(selectedDoc)
            }catch (error) {
              console.error('获取文档信息失败:', error);
              await this.randomizedReview();
              return;
            }
            this.$router.push("/doc/" + selectedDoc);
            console.log('随机选择的文档：', selectedDoc);
          } else {
            await this.randomizedReview();
          }
        } catch (error) {
          console.error('获取知识网络数据失败:', error);
          // 出错时使用原来的随机策略
          const flatCategoryList = await CategoryService.getFlatCategoryList();
          const randomCategory = flatCategoryList[Math.floor(Math.random() * flatCategoryList.length)];
          this.$router.push("/doc/" + DocUtils.docUrl2Id(randomCategory.link));
        }
    },
    handleResize() {
      // 当窗口大小改变时，根据宽度决定是否显示ContentsList
      if (window.innerWidth <= 1180) {
        this.showContentsList = false; // 小屏幕默认隐藏
      } else {
        this.showContentsList = true; // 大屏幕默认显示
      }
    }
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
    
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize);
  },
  unmounted(){
    // 一些清理操作
    this.eventManager!.removeAllScrollListener();
    
    // 移除窗口大小监听器
    window.removeEventListener('resize', this.handleResize);
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
  padding-top: 36px;
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
@media screen and (max-width: 1370px) {
  .markdown-section {
    width: 70%!important;
    margin-right: 40px;
  }
}
@media screen and (max-width: 1180px) {
  .center {
    padding-left: 0rem;
  }
  .markdown-section {
    width: calc(100% - 40px)!important;
    margin-right: 40px;
  }
  .toc-wrapper {
    display: none;
  }
}

.toc-toggle-btn {
  display: none; /* 默认隐藏按钮 */
  position: fixed;
  right: 20px;
  top: 400px;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background-color: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 999;
  transition: all 0.3s ease;
  color: white;
  font-size: 18px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.right-bottom-panel-container {
  position: fixed;
  bottom: 0px;
  right: 0px;
  width: 400px;
  height: 200px;
  z-index: 999;

  :deep(.right-bottom-panel) {
    width: 100%;
    height: 100%;
  }

  :deep(#knowledgeNetwork) {
    height: 100%;
    width: 100%;
  }

  :deep(.mind-note) {
    height: 100%;
    width: 100%;
    position: static;
    border: none;
    box-shadow: none;
    border-radius: 0;
  }
}

@media screen and(max-width: 1366px) {
  .right-bottom-panel-container {
    width: 300px;
    height: 160px;
  }
}

body[theme=dark] .toc-toggle-btn {
  background-color: var(--dark-primary-color);
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
