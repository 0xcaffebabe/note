import ReadHistoryItem from '../../domain/ReadHistoryItem'
import type { StoragePort } from '../../ports'

/**
 * 文档阅读记录子服务: 阅读进度 / 最后阅读 / 阅读历史的 localStorage 持久化。
 *
 * 从 DocService 原样搬出, 行为字节级保持:
 *  - 存储键精确为 'doc-service:last-read'(单冒号) /
 *    'doc-service::read-history-list' / 'doc-service::read-record'(双冒号);
 *  - 历史列表去重(先删后追加移到末尾) + 上限 20(超出 shift 最旧);
 *  - getReadHistoryList 先 reverse 再把 ISO 时间转 toLocaleString。
 *
 * 这些方法纯属 Storage 端口读写, 不参与 @cache 记忆化, 故无需注入 cache。
 */
export class DocReadHistoryService {
  constructor(private readonly storage: StoragePort) {}

  public setDocReadRecrod(doc: string, position: number) {
    const readingRecords = this.getReadingRecords()
    readingRecords.set(doc, position)
    this.setLastReadRecord(doc)
    this.storage.setItem('doc-service::read-record', JSON.stringify([...readingRecords]))
  }

  public setLastReadRecord(doc: string) {
    this.storage.setItem('doc-service:last-read', doc)
    const rawData = this.storage.getItem('doc-service::read-history-list')
    let readHistoryList: ReadHistoryItem[] = []
    if (rawData) {
      readHistoryList = JSON.parse(rawData)
    }
    const index = readHistoryList.findIndex(v => v.doc == doc)
    if (index != -1) {
      readHistoryList.splice(index, 1)
    }
    readHistoryList.push({
      doc, time: new Date().toISOString(),
    })
    if (readHistoryList.length > 20) {
      readHistoryList.shift()
    }
    this.storage.setItem('doc-service::read-history-list', JSON.stringify(readHistoryList))
  }

  public getReadHistoryList(): ReadHistoryItem[] {
    const rawData = this.storage.getItem('doc-service::read-history-list')
    let readHistoryList: ReadHistoryItem[] = []
    if (rawData) {
      readHistoryList = JSON.parse(rawData)
    }
    readHistoryList = readHistoryList.reverse()
    readHistoryList.forEach(v => v.time = new Date(v.time).toLocaleString())
    return readHistoryList
  }

  public getLastReadRecord(): string {
    return this.storage.getItem('doc-service:last-read') || ''
  }

  public getDocReadRecord(doc: string): number {
    const readingRecords = this.getReadingRecords()
    return readingRecords.get(doc) || 0
  }

  private getReadingRecords(): Map<string, number> {
    const rawData = this.storage.getItem('doc-service::read-record')
    let readingRecords: Map<string, number>
    if (!rawData) {
      readingRecords = new Map()
    } else {
      readingRecords = new Map(JSON.parse(rawData))
    }
    return readingRecords
  }
}
