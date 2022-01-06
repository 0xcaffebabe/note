import PptPage from "./PptPage.vue";

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
      console.log(e.target)
      if (e.target && (e.target as HTMLElement).tagName == 'IMG') {
        const img: HTMLElement = e.target as HTMLElement;
        img.onclick = (e: Event) => {
          // 展示大图
          const src = img.getAttribute('src') || '';
          console.log(src);
          this.pptPageInstance.imageUrlList = [src];
          this.pptPageInstance.showImageViewer = true;
        };
        e.stopPropagation();
        e.preventDefault();
      }
    })
  }
}

export default PptPageEventManager