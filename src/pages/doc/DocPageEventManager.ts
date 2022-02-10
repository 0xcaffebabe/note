import DocUtils from "@/util/DocUtils";
import DocPage from "./DocPage.vue";
import LinkPopover from "./LinkPopover.vue";
import { ElMessage } from 'element-plus'
import DocService from "@/service/DocService";
import ResourceBrower from "./ResourceBrower.vue";
import EventBus from "@/components/EventBus";
import ImageViewerVue from "@/components/ImageViewer.vue";
import MermaidUtils from "@/util/MermaidUtils";

class DocPageEventManager {

  private docPageInstance: InstanceType<typeof DocPage>

  constructor(docPageInstance: InstanceType<typeof DocPage>) {
    this.docPageInstance = docPageInstance;
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
      this.docPageInstance.showAside = false;
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
    console.log(outterLinkList);
    // 文档链接
    for (let i = 0; i < docLinkList.length; i++) {
      const a = docLinkList[i];
      a.onclick = (e: Event) => {
        const href = a.getAttribute("href");
        if (href?.startsWith("doc") || href?.startsWith("/doc")) {
          this.docPageInstance.$router.push(href);
          e.preventDefault();
          e.stopPropagation();
        }
      };
      a.addEventListener('contextmenu', (e: MouseEvent) => {
        const originLink = a.getAttribute('origin-link')!;
        (this.getRef('linkPopover') as InstanceType<typeof LinkPopover>).show(originLink, e.clientX, e.clientY);
        e.preventDefault();
        e.stopPropagation();
        return false;
      });
    }
    // 外部链接
    for(let i = 0;i < outterLinkList.length;i++){
      const a = outterLinkList[i];
      a.onclick = (e: Event) => {
        const href = a.getAttribute("href");
        (this.getRef('resourceBrower') as InstanceType<typeof ResourceBrower>).show(href!);
        e.preventDefault();
        e.stopPropagation();
      };
    }
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
    for (let i = 0; i < imgList.length; i++) {
      const img = imgList[i];
      img.onclick = (e: Event) => {
        // 展示大图
        const src = img.querySelector('img')?.getAttribute('src') || '';
        (this.getRef("imageViewer") as InstanceType<typeof ImageViewerVue>).show(src);
      };
    }
  }


  /**
   *
   * 管理文档主体heading点击行为
   * @param {HTMLElement} docEl
   * @memberof DocPageEventManager
   */
  public registerHeadingClick(docEl: HTMLElement) {
    const document = docEl;
    const headingList: NodeListOf<HTMLElement> = document.querySelectorAll(
      'h1,h2,h3,h4,h5,h6'
    );
    for (let i = 0; i < headingList.length; i++) {
      const heading = headingList[i];
      heading.onclick = async (e) => {
        const id = heading.innerText;
        const url = "/" + DocUtils.docId2Url(this.docPageInstance.doc) + "#" + id;
        await navigator.clipboard.writeText(url);
        ElMessage.success('复制成功: ' + url);
      }
    }
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
    let timer: NodeJS.Timeout;
    document.addEventListener("scroll", (e) => {
      // 限流更新阅读位置
      clearTimeout(timer);
      timer = setTimeout(() => {
        DocService.setDocReadRecrod(this.docPageInstance.doc, window.scrollY);
      }, 1000);
      // 滚动的同时将link-popover隐藏掉
      this.getRef('linkPopover') && (this.getRef('linkPopover') as InstanceType<typeof LinkPopover>).hide();
    });
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
    document.onscroll = null
  }


  /**
   *
   * 同步滚动当前文档标题
   * @param {string} [headingId]
   * @memberof DocPageEventManager
   */
  public syncHeading(headingId?: string) {
    if (headingId) {
      const elm: HTMLElement = document.querySelector('#' + headingId)!;
      if (elm) {
        window.scrollTo(0, elm.offsetTop - 80)
      }
    }
  }
}

export default DocPageEventManager;