<template>
  <el-container class="doc-layout">
    <doc-side-category :doc="doc" :showAside="showAside" @toggle-aside="showAside = !showAside" ref="docSideCategory" />
    <el-main class="main">
      <keep-alive>
        <doc-tab-nav @dbclick="handleTabNavDbclick" />
      </keep-alive>
      <!-- 加载失败兜底: 提供重试入口 不再停留在骨架屏 -->
      <el-result v-if="loadError" icon="error" title="文档加载失败" sub-title="网络异常或文档不存在" class="doc-error">
        <template #extra>
          <el-button type="primary" @click="showDoc(doc)">重试</el-button>
          <el-button @click="$router.push('/home.html')">返回首页</el-button>
        </template>
      </el-result>
      <el-skeleton v-else :rows="25" animated :loading="loading" :throttle="50" class="doc-skeleton">
        <template #default>
          <div class="main-content">
            <doc-breadcrumb-nav />
            <doc-metadata-info :file="file" @link-click="link => eventManager?.openOutterLink(link)"/>
            <!-- doc主体开始 -->
            <div class="main markdown-section" ref="markdownSection" v-html="contentHtml"></div>
            <!-- doc主体结束 -->
            <!-- 上一篇/下一篇 -->
            <doc-prev-next :doc="doc" />
            <!-- 提交历史开始 -->
            <div>
              <el-divider />
              <div class="footer-wrapper">
                <history-list :file="file" :doc="doc" />
              </div>
            </div>
            <!-- 提交历史结束 -->
          </div>
        </template>
      </el-skeleton>
    </el-main>
    <!-- 右侧TOC与知识面板列 -->
    <doc-contents-and-panel
      :doc="doc"
      :parentShowHeader="parentShowHeader"
      @item-click="handleTocItemClick"
      @toggle-contents="showContentsList = $event"
    />
  </el-container>
  <!-- 工具栏开始 -->
  <tool-box
    @showMindGraph="showMindGraph();showAside = false;isDrawerShow = true"
    @showKnowledgeNetwork="showKnowledgeNetwork();showAside = false;isDrawerShow = true"
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
  <el-backtop :bottom="32" :right="28" />
  <!-- 相关链接: 右侧悬浮标签 悬停展开(关联内容 + 文内其他文档链接) -->
  <related-content :related="relatedLinks" :doc-links="docLinks" />
  <!-- 隐藏面板按需挂载: 首次打开时才下载与渲染对应chunk -->
  <mind-graph v-if="panels.mindGraph" ref="mindGraph" @close="showAside = true;isDrawerShow = false" />
  <link-list v-if="panels.linkList" :html="contentHtml" ref="linkList"/>
  <knowledge-reviewer v-if="panels.knowledgeReviewer" ref="knowledgeReviewer" :doc="doc"/>
  <mermaid-shower ref="mermaidShower"/>
  <knowledge-network v-if="panels.knowledgeNetwork" ref="knowledgeNetwork" :doc="doc" @close="showAside = true;isDrawerShow = false"/>
  <LLM v-if="panels.llm" :doc="doc" ref="llm" @close="showAside = true;isDrawerShow = false"/>
  <image-viewer ref="imageViewer" />
  <instant-previewer ref="instantPreviewer"/>
  <resource-brower ref="resourceBrower" />

  
</template>


<script lang="ts">
import { defineComponent, defineAsyncComponent, reactive, ref } from "vue";
import Content from "@/dto/Content";
import docService from "@/service/DocService";
import HistoryList from "./commit/HistoryList.vue";
import ToolBox from './ToolBox.vue';
import LinkPopover from "./LinkPopover.vue";
import RelatedContent from "./RelatedContent.vue";
import { RelatedLink } from "@/dto/RelatedLink";
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
import DocPrevNext from "./nav/DocPrevNext.vue";
import DocPageEventMnager from './DocPageEventManager';
import ResourceBrower from "./ResourceBrower.vue";
import ImageViewer from "@/components/ImageViewer.vue";
import DocMetadataInfo from './metadata/DocMetadataInfo.vue'
import InstantPreviewer from './tool/InstantPreviewer.vue'
import { SysUtils } from "@/util/SysUtils";
import ConfigService from "@/service/ConfigService";
import config from '@/config';
import api from "@/api";
import MermaidShower from './mermaid-shower/MermaidShower.vue';
import DocContentsAndPanel from './contents/DocContentsAndPanel.vue';

// 重量级隐藏面板(echarts/jsmind/LLM)按需异步加载: 首次打开时才挂载与下载对应chunk
const MindGraph = defineAsyncComponent(() => import('./mind/MindGraph.vue'))
const LinkList = defineAsyncComponent(() => import('./LinkList.vue'))
const KnowledgeNetwork = defineAsyncComponent(() => import('./knowledge/KnowledgeNetwork.vue'))
const KnowledgeReviewer = defineAsyncComponent(() => import('./knowledge/KnowledgeReviewer.vue'))
const LLM = defineAsyncComponent(() => import('./knowledge/LLM.vue'))

export default defineComponent({
  inject: ['showHeader'],
  components: {
    HistoryList,
    MindGraph,
    ToolBox,
    LinkPopover,
    DocSideCategory,
    LinkList,
    KnowledgeNetwork,
    DocBreadcrumbNav,
    DocTabNav,
    DocPrevNext,
    ResourceBrower,
    ImageViewer,
    KnowledgeReviewer,
    DocMetadataInfo,
    InstantPreviewer,
    MermaidShower,
    LLM,
    DocContentsAndPanel,
    RelatedContent,
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
    // 面板挂载开关: 首次打开时才渲染(联动defineAsyncComponent实现chunk按需下载)
    const panels = reactive({
      mindGraph: false,
      knowledgeNetwork: false,
      linkList: false,
      knowledgeReviewer: false,
      llm: false,
    })
    const mindGraph = ref<any>()
    const knowledgeNetwork = ref<any>()
    const linkList = ref<any>()
    const knowledgeReviewer = ref<any>()
    const llm = ref<any>()
    const refMap: Record<keyof typeof panels, typeof mindGraph> = {
      mindGraph, knowledgeNetwork, linkList, knowledgeReviewer, llm,
    }
    const openPanel = async (name: keyof typeof panels) => {
      const firstOpen = !panels[name]
      panels[name] = true
      // 异步组件首次挂载需等chunk下载完成 ref就绪后才能调用show(最多等5秒)
      for (let i = 0; i < 100 && !refMap[name].value; i++) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      refMap[name].value?.show()
      // 知识网络首次挂载后需要初始化当前文档的数据
      if (name == 'knowledgeNetwork' && firstOpen) {
        refMap[name].value?.init?.()
      }
    }
    return {
      panels,
      mindGraph, showMindGraph: () => openPanel('mindGraph'),
      knowledgeNetwork, showKnowledgeNetwork: () => openPanel('knowledgeNetwork'),
      linkList, showLinkList: () => openPanel('linkList'),
      knowledgeReviewer, showKnowledgeReviewer: () => openPanel('knowledgeReviewer'),
      llm, showLLM: () => openPanel('llm'),
    }
  },
  data() {
    return {
      file: new DocFileInfo() as DocFileInfo,
      contentsList: [] as Content[],
      doc: "" as string,
      kw: "" as string,
      loading: true as boolean,
      loadError: false as boolean,
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
    },
    relatedLinks(): RelatedLink[] {
      // 关联链接已在接口取文档时抽取并从正文剥离(DocService.getDocFileInfo)
      return this.file.relatedLinks || [];
    },
    // 正文里指向其他文档的链接(排除已在关联内容中的)
    docLinks(): RelatedLink[] {
      return DocService.resolveDocLinks(this.contentHtml, this.doc, this.relatedLinks.map(l => l.href));
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
          // 用 replaceState 将 headingId 同步进当前URL(保留其他query) 让刷新/分享能回到当前小节 不触发router导航
          const url = new URL(window.location.href);
          url.searchParams.set('headingId', id);
          window.history.replaceState(window.history.state, '', url.toString());
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
      // 将滚动条设置为上一次的状态(瞬时跳转 避免全局smooth造成长距离滚动动画)
      window.scrollTo({top: docService.getDocReadRecord(doc), behavior: 'instant' as ScrollBehavior})
      this.loading = true;
      this.loadError = false;
      this.doc = doc;
      this.kw = kw || "";
      try {
        this.file = await DocService.getDocFileInfo(doc);
        SysUtils.setDocTitle(this.file.name)
        this.generateTOC();
        this.$nextTick(() => this.postRender(headingId, kw));
      } catch (err: any) {
        // 加载失败(文档不存在/网络异常/响应非JSON)切换到错误态
        this.loadError = true;
        ElMessage.error(err.message)
      } finally {
        this.loading = false;
      }
    },
    // 内容上屏后的渲染后处理: el-skeleton的throttle会延迟内容挂载 ref未就绪时短暂重试
    postRender(headingId?: string, kw?: string, attempt: number = 0) {
      const docEl = this.$refs.markdownSection as HTMLElement | undefined;
      if (!docEl) {
        if (attempt < 20) {
          setTimeout(() => this.postRender(headingId, kw, attempt + 1), 50);
        }
        return;
      }
      // 恢复阅读字号偏好
      const fontSize = ConfigService.get('fontSize')
      if (fontSize) {
        docEl.style.fontSize = fontSize + 'px'
      }
      if (!kw) {
        this.eventManager!.renderMermaid();
      }
      // 同步滚动markdown-section到headingId区域
      this.eventManager!.syncHeading(headingId);
      // 同步滚动左侧目录 让当前激活目录位于可视区域
      this.syncCategoryListScrollBar();
      // 更新知识网络(面板按需挂载 未打开过时跳过)
      (this.$refs.knowledgeNetwork as any)?.init?.();
      // 渲染数学公式
      this.eventManager!.renderLatex(docEl);
      // 代码块高亮
      this.eventManager!.renderCodeHighlight(docEl);
      this.registerNecessaryEvent(docEl)
      // 正文就绪后再拉取非关键的质量数据(dev端生成昂贵 不能抢占文档请求)
      setTimeout(() => DocService.ensureQualityLoaded(), 3000)
    },
    registerNecessaryEvent(docEl: HTMLElement) {
      // 注册一些针对markdown-section的必要的事件
      this.eventManager!.registerLinkRouter(docEl);
      this.eventManager!.registerImageClick(docEl);
      this.eventManager!.registerHeadingClick(docEl);
      this.eventManager!.registerCodeCopy(docEl);
      this.eventManager!.registerDocTagSupClick(docEl);
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
  },
  beforeRouteUpdate(to, from) {
    const doc = DocUtils.routeDocId(to);
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
    this.showDoc(DocUtils.routeDocId(this.$route), this.$route.query.headingId?.toString(), this.$route.query.kw?.toString());
  },
  unmounted(){
    // 一些清理操作
    this.eventManager!.cancelPendingRender();
    this.eventManager!.removeAllScrollListener();
  }
});
</script>

<style lang="less" scoped>
// 三栏布局: 侧栏(280) + 正文(自适应 内部限宽居中) + TOC列(300/0)
// 各栏为真实文档流元素 不再依赖fixed定位与魔法数字拼接
.doc-layout {
  display: flex;
  align-items: stretch;
}

.main {
  flex: 1;
  min-width: 0;
  background-color: var(--card-bg-color);
  padding: 0 var(--spacing-xl) 40px;
  min-height: 100vh;
}

// 仅loading态生效(el-skeleton类只在加载中存在 避免class透传影响内容根节点)
.el-skeleton.doc-skeleton {
  max-width: 820px;
  margin: 76px auto 0;
}

.doc-error {
  margin-top: 10vh;
}

.main-content {
  max-width: 860px;
  margin: 0 auto;
  padding-top: var(--spacing-md);
}

.footer-wrapper {
  display: flex;
  justify-content: space-between;
}

.markdown-section {
  :deep(mark) {
    color: white;
    background-color: var(--warning-color);
    border-radius: var(--radius-sm);
    padding: 0 2px;
  }
}

.el-backtop {
  transition: var(--transition-smooth);
}

.el-backtop:hover {
  background-color: var(--hover-bg-color);
}
</style>
