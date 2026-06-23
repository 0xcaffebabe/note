import DocQuality from '../../domain/doc/DocQuality'
import type { Api } from '../../data/Api'

/**
 * 文档质量子服务: 懒加载质量数据 + 中位数/排名/百分比格式化。
 *
 * 从 DocService 原样搬出, 行为字节级保持:
 *  - ensureQualityLoaded 带一次性闸门 qualityRequested, 整个进程内只真正 init 一次;
 *  - init 计算中位数(偶数取中间两数均值)并建立 id->质量 / id->排名 两张表;
 *  - calcQuanlityStr 的格式串与原实现逐字符一致(含 toFixed 位数与缺省 -1)。
 *
 * 这些方法本就未被 @cache 修饰(getDocQuality/calcQuanlityStr 直接读内部 Map),
 * 故子服务自身不参与记忆化, 无需注入 cache。
 */
export class DocQualityService {
  private docQaulity: DocQuality[] = []
  private medianQuality: number = 1
  private docQualityMap = new Map<string, DocQuality>()
  private docQualityOrderMap = new Map<string, number>()
  private qualityRequested = false

  constructor(private readonly api: Api) {}

  /**
   * 懒加载文档质量数据
   */
  public ensureQualityLoaded() {
    if (this.qualityRequested) {
      return
    }
    this.qualityRequested = true
    this.init()
  }

  private async init() {
    this.docQaulity = await this.api.getDocQualityData()
    const sorted = this.docQaulity.map(v => v.quality).sort((a, b) => a - b)
    const midPos = Math.floor(sorted.length / 2)
    if (sorted.length % 2 == 0) {
      this.medianQuality = (sorted[midPos] + sorted[midPos - 1]) / 2
    } else {
      this.medianQuality = sorted[midPos]
    }
    for (let i = 0; i < this.docQaulity.length; i++) {
      const quality = this.docQaulity[i]
      this.docQualityMap.set(quality.id, quality)
      this.docQualityOrderMap.set(quality.id, i + 1)
    }
  }

  public getDocQuality(id: string): DocQuality | null {
    return this.docQualityMap.get(id) || null
  }

  public calcQuanlityStr(id: string): string {
    const docQuality = this.getDocQuality(id)
    if (!docQuality) {
      return '未知'
    }
    const farToMid = ((docQuality.quality / this.medianQuality) * 100).toFixed(0)
    return `${docQuality.quality.toFixed(2)}(${this.docQualityOrderMap.get(id) || -1}/${this.docQaulity.length}, ${farToMid}%)`
  }
}
