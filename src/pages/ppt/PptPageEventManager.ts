import ImageViewerVue from "@/components/ImageViewer.vue";
import PptPage from "./PptPage.vue";
import MermaidUtils from "@/util/MermaidUtils";

class PptPageEventManager {
  private pptPageInstance: InstanceType<typeof PptPage>

  constructor(pptPageInstance: InstanceType<typeof PptPage>) {
    this.pptPageInstance = pptPageInstance
  }

  private getRef<T>(name: string): any {
    return this.pptPageInstance.$refs[name]
  }

  /**
   *
   * 管理文档主体图片点击行为
   * @param {HTMLElement} docEl
   * @memberof DocPageEventManager
   */
   public registerImageClick(docEl: HTMLElement) {
    docEl.addEventListener('click', (e : MouseEvent) => {
      if (e.target && (e.target as HTMLElement).tagName == 'IMG') {
        const img: HTMLElement = e.target as HTMLElement;
        // 展示大图
        const src = img.getAttribute('src') || '';
        (this.getRef("imageViewer") as InstanceType<typeof ImageViewerVue>).show(src);
        e.stopPropagation();
        e.preventDefault();
      }
    })
  }

  public renderMermaid() {
    MermaidUtils.initAllNode()
  }

}

export default PptPageEventManager