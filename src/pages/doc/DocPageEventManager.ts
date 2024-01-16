import DocUtils from "@/util/DocUtils";
import DocPage from "./DocPage.vue";
import LinkPopover from "./LinkPopover.vue";
import DocService from "@/service/DocService";
import ResourceBrower from "./ResourceBrower.vue";
import EventBus from "@/components/EventBus";
import ImageViewerVue from "@/components/ImageViewer.vue";
import MermaidUtils from "@/util/MermaidUtils";
import MobileDocPage from "./mobile/MobileDocPage.vue";
import Hammer from 'hammerjs'
import SelectionPopover from "./tool/SelectionPopover.vue";
import InstantPreviewer from './tool/InstantPreviewer.vue'
import MermaidShower from './mermaid-shower/MermaidShower.vue';
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import katex from 'katex'
import 'katex/dist/katex.css'

class DocPageEventManager {

  private docPageInstance: InstanceType<typeof DocPage | typeof MobileDocPage>
  private isMobile: boolean;

  constructor(docPageInstance: InstanceType<typeof DocPage | typeof MobileDocPage>, isMobile: boolean = false) {
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
        const href = a.getAttribute("href");
        if (href?.startsWith("doc") || href?.startsWith("/doc")) {
          if (e.altKey) {
            (this.getRef('instantPreviewer') as InstanceType<typeof InstantPreviewer>).preview('/#' + href);
            console.log(href)
          }else {
            this.docPageInstance.$router.push(href);
          }
          e.preventDefault();
          e.stopPropagation();
          return false
        }
      };
      if (!this.isMobile) {
        const action = (e: MouseEvent) => {
          const originLink = a.getAttribute('origin-link')!;
          (this.getRef('linkPopover') as InstanceType<typeof LinkPopover>).show(originLink, e.clientX, e.clientY);
          e.preventDefault();
          e.stopPropagation();
        }
        a.addEventListener('contextmenu', (e: MouseEvent) => {
          action(e)
          return false;
        });
        a.addEventListener('mouseover', (e: MouseEvent) => {
          action(e)
          return false
        })
      }else {
        new Hammer(a).on('press', e => {
          const originLink = a.getAttribute('origin-link')!;
          (this.getRef('linkPopover') as InstanceType<typeof LinkPopover>).show(originLink, e.center.x, e.center.y);
          return false;
        })
      }
    }
    // 外部链接
    for(let i = 0;i < outterLinkList.length;i++){
      const a = outterLinkList[i];
      a.onclick = (e: Event) => {
        const href = a.getAttribute("href");
        this.openOutterLink(href!)
        e.preventDefault();
        e.stopPropagation();
      };
    }
  }

  public openOutterLink(link: string) {
    (this.getRef('resourceBrower') as InstanceType<typeof ResourceBrower>).show(link);
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
   * 渲染数学公式
   * @param {HTMLElement} docEl
   * @memberof DocPageEventManager
   */
  public renderLatex(docEl: HTMLElement) {
    docEl.querySelectorAll('.tex')
        .forEach(e => {
          const element = e as HTMLElement
          katex.render(
              // 如果在`%`字符前没有`\`字符，则在`%`前添加`\`后再渲染
              element.textContent!.replace(/[^\\](%)/g, (match)=>{return match[0] + '\\' + '%'}),
              element,
              {
                  // 取消对中文内容渲染的警告
                  strict: false
              }
          )
        })
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


  /**
   *
   * 监听文本选中
   * @param {HTMLElement} docEl
   * @memberof DocPageEventManager
   */
  public registerTextSelected(docEl: HTMLElement) {
    docEl.addEventListener('mouseup', (e: MouseEvent) => {
      const selection = document.getSelection()?.toString()
      if (selection) {
        this.getRef('selectionPopover') && (this.getRef('selectionPopover') as InstanceType<typeof SelectionPopover>).show(selection, e.clientX- 50, e.clientY + 20)
      }else {
        this.getRef('selectionPopover') && (this.getRef('selectionPopover') as InstanceType<typeof SelectionPopover>).hide()
      }
    })
    docEl.addEventListener('touchend', (e: TouchEvent) => {
      const selection = document.getSelection()?.toString()
      if (selection) {
        this.getRef('selectionPopover') && (this.getRef('selectionPopover') as InstanceType<typeof SelectionPopover>).show(selection, e.changedTouches[0].clientX - 50, e.changedTouches[0].clientY+ 20)
      }else {
        this.getRef('selectionPopover') && (this.getRef('selectionPopover') as InstanceType<typeof SelectionPopover>).hide()
      }
    })
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