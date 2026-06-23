// 键值持久化端口: core 通过它读写持久状态(阅读记录/书签/配置/分类历史),
// 不直接依赖浏览器 localStorage。接口形状与 Web Storage 子集一致,
// 浏览器适配器用 localStorage、node/测试适配器用内存 Map 实现。

export interface StoragePort {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}
