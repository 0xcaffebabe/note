// 搜索索引端口: 全量替换某个索引的对象(更新索引脚本用 Algolia 实现)。
export interface SearchIndexPort {
  replaceAllObjects(appId: string, secret: string, indexName: string, objects: unknown[]): Promise<void>
}
