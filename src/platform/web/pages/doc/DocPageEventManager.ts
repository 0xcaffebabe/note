import DocUtils from "@/core/util/DocUtils";
import DocPage from "./DocPage.vue";
import LinkPopover from "./LinkPopover.vue";
import DocService from "@/platform/web/service/DocService";
import ResourceBrower from "./ResourceBrower.vue";
import EventBus from "@/platform/web/components/EventBus";
import ImageViewerVue from "@/platform/web/components/ImageViewer.vue";
import MermaidUtils from "@/platform/web/util/MermaidUtils";
import MermaidShower from './mermaid-shower/MermaidShower.vue';
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import DocPostRender from '@/platform/web/render/DocPostRender'
import { resolveHeadingElement, openOutterLinkFallback } from "./DocPageHeadingResolver";
import { writeText } from "@/adapters/browser/Clipboard";

class DocPageEventManager {

  private docPageInstance: InstanceType<typeof DocPage>
  private isMobile: boolean;
  private cancelLatexTask: (() => void) | null = null;
  private cancelHighlightTask: (() => void) | null = null;
  private scrollHandler: ((e: Event) => void) | null = null;
  private scrollTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(docPageInstance: InstanceType<typeof DocPage>, isMobile: boolean = false) {
    this.docPageInstance = docPageInstance;
    this.isMobile = isMobile
  }

  private getRef<T>(name: string): any {
    return this.docPageInstance.$refs[name]
  }


  /**
   *
   * 事件总线事件监听
   * @memberof DocPageEventManager
   */
  public listenEventBus(){
    EventBus.on('enter-zen-mode', () => {
      (this.docPageInstance as InstanceType<typeof DocPage>).showAside = false;
    })
  }

  /**
   * 管理文档主体doc链接跳转、hover行为
   *
   * @param {HTMLElement} docEl
   * @memberof DocPageEventManager
   */
  public registerLinkRouter(docEl: HTMLElement) {
    const document = docEl;
    const docLinkList: NodeListOf<HTMLElement> = document.querySelectorAll("a[origin-link]");
    const outterLinkList: NodeListOf<HTMLElement> = document.querySelectorAll("a:not([origin-link])");
    // 文档链接
    for (let i = 0; i < docLinkList.length; i++) {
      const a = docLinkList[i];
      a.onclick = (e: MouseEvent) => {
        // 修饰键点击交还浏览器默认行为(.html地址是真实入口 可新标签/新窗口打开)
        if (e.ctrlKey || e.metaKey || e.shiftKey) {
          return
        }
        const href = a.getAttribute("href");
        if (href) {
          this.docPageInstance.$router.push(href);
          e.preventDefault();
          e.stopPropagation();
          return false
        }
      };
    }
    // 外部链接
    for(let i = 0;i < outterLinkList.length;i++){
      const a = outterLinkList[i];
      a.onclick = (e: MouseEvent) => {
        // 修饰键/中键点击交还浏览器默认行为(新标签打开)
        if (e.ctrlKey || e.metaKey || e.shiftKey) {
          return
        }
        const href = a.getAttribute("href");
        this.openOutterLink(href!)
        e.preventDefault();
        e.stopPropagation();
      };
    }
  }

  public openOutterLink(link: string) {
    const brower = this.getRef('resourceBrower') as InstanceType<typeof ResourceBrower> | undefined
    // 未挂载资源浏览器(兜底)时退回新标签打开 不再静默崩溃
    openOutterLinkFallback(brower, link)
  }


  /**
   *
   * 管理文档主体图片点击行为
   * @param {HTMLElement} docEl
   * @memberof DocPageEventManager
   */
  public registerImageClick(docEl: HTMLElement) {
    const document = docEl;
    const imgList: NodeListOf<HTMLElement> = document.querySelectorAll(
      ".img-wrapper"
    );
    const srcList = Array.from(imgList).map(v => v.querySelector('img')?.getAttribute('src') || '')
    for (let i = 0; i < imgList.length; i++) {
      const img = imgList[i];
      img.onclick = (e: Event) => {
        // 展示大图
        (this.getRef("imageViewer") as InstanceType<typeof ImageViewerVue>).show(srcList, i);
      };
    }
  }


  /**
   *
   * 管理标题锚点交互: 仅点击hover显现的锚点图标时复制链接 标题本体不再劫持点击
   * @param {HTMLElement} docEl
   * @memberof DocPageEventManager
   */
  public registerHeadingClick(docEl: HTMLElement) {
    const anchorList: NodeListOf<HTMLElement> = docEl.querySelectorAll('.heading-anchor');
    for (let i = 0; i < anchorList.length; i++) {
      const anchor = anchorList[i];
      anchor.onclick = async (e: MouseEvent) => {
        // 修饰键/中键交还浏览器默认行为(href是真实可回跳地址)
        if (e.ctrlKey || e.metaKey || e.shiftKey) {
          return
        }
        e.preventDefault();
        const heading = anchor.closest('h1,h2,h3,h4,h5,h6') as HTMLElement | null;
        const url = location.origin
          + DocUtils.docId2HtmlPath(this.docPageInstance.doc)
          + "?headingId=" + encodeURIComponent(heading?.id || '');
        await writeText(url);
        ElMessage.success('已复制本节链接');
      }
    }
  }

  /**
   *
   * 代码块一键复制(按钮由DocRender输出)
   * @param {HTMLElement} docEl
   * @memberof DocPageEventManager
   */
  public registerCodeCopy(docEl: HTMLElement) {
    const btnList: NodeListOf<HTMLElement> = docEl.querySelectorAll('.code-block .code-copy');
    for (let i = 0; i < btnList.length; i++) {
      const btn = btnList[i];
      btn.onclick = async () => {
        const code = btn.closest('.code-block')?.querySelector('pre code');
        await writeText(code?.textContent || '');
        btn.textContent = '已复制';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = '复制';
          btn.classList.remove('copied');
        }, 1500);
      }
    }
  }


  /**
   *
   * 渲染数学公式（空闲分片执行 不阻塞主线程）
   * @param {HTMLElement} docEl
   * @memberof DocPageEventManager
   */
  public renderLatex(docEl: HTMLElement) {
    this.cancelLatexTask?.()
    this.cancelLatexTask = DocPostRender.renderLatex(docEl)
  }

  /**
   *
   * 代码块高亮（空闲分片执行 不阻塞主线程）
   * @param {HTMLElement} docEl
   * @memberof DocPageEventManager
   */
  public renderCodeHighlight(docEl: HTMLElement) {
    this.cancelHighlightTask?.()
    this.cancelHighlightTask = DocPostRender.highlightCode(docEl)
  }

  /**
   *
   * 取消尚未完成的后处理渲染任务
   * @memberof DocPageEventManager
   */
  public cancelPendingRender() {
    this.cancelLatexTask?.()
    this.cancelHighlightTask?.()
    this.cancelLatexTask = null
    this.cancelHighlightTask = null
  }


  /**
   *
   * 管理文档主体doc-tag徽标及主体点击
   * @param {HTMLElement} docEl
   * @memberof DocPageEventManager
   */
  public registerDocTagSupClick(docEl: HTMLElement) {
    const document = docEl;
    const supList: NodeListOf<HTMLElement> = document.querySelectorAll(
      ".markdown-section [tag]"
    );
    for (let i = 0; i < supList.length; i++) {
      const sup = supList[i];
      sup.onclick = (e: Event) => {
        const tag = sup.getAttribute('tag')
        this.docPageInstance.$router.push('/tag?tag=' + tag)
        e.preventDefault();
        e.stopPropagation();
      };
    }
  }


  /**
   *
   * 滚动监听
   * @memberof DocPageEventManager
   */
  public registerScrollListener() {
    this.removeAllScrollListener();
    this.scrollHandler = () => {
      // 限流更新阅读位置
      clearTimeout(this.scrollTimer);
      this.scrollTimer = setTimeout(() => {
        DocService.setDocReadRecrod(this.docPageInstance.doc, window.scrollY);
      }, 1000);
      // 滚动的同时将link-popover隐藏掉
      this.getRef('linkPopover') && (this.getRef('linkPopover') as InstanceType<typeof LinkPopover>).hide();
    };
    document.addEventListener("scroll", this.scrollHandler);
  }


  /**
   *
   * 注册mermaid全屏按钮点击
   * @param {HTMLElement} docEl
   * @memberof DocPageEventManager
   */
  public registerMermaidFullScreenClick(docEl: HTMLElement) {
    const buttons = docEl.querySelectorAll('.mermaid-wrapper .fullscreen button')
    buttons.forEach(v => v.addEventListener('click', e => {
      this.getRef('mermaidShower') && (this.getRef('mermaidShower') as InstanceType<typeof MermaidShower>).show(v.parentElement?.parentElement?.getAttribute("data-raw")!);
    }))
  }

  public renderMermaid() {
    MermaidUtils.initAllNode()
  }

  /**
   *
   * 清除滚动监听
   * @memberof DocPageEventManager
   */
  public removeAllScrollListener(){
    if (this.scrollHandler) {
      document.removeEventListener("scroll", this.scrollHandler)
      this.scrollHandler = null
    }
    clearTimeout(this.scrollTimer)
  }


  /**
   *
   * 同步滚动当前文档标题
   * @param {string} [headingId]
   * @memberof DocPageEventManager
   */
  public syncHeading(headingId?: string) {
    if (!headingId) {
      return
    }
    // 1) 直接命中 2) slug化后命中(兼容搜索索引/旧链接里的标题原文) 3) 按标题文本匹配
    const elm = resolveHeadingElement(headingId)
    if (elm) {
      window.scrollTo(0, elm.offsetTop - 80)
    }
  }
}

export default DocPageEventManager;