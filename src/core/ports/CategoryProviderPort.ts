import Category from '../domain/Category'

// 目录提供端口: core 编排"知识丰富度"时需要拿到目录树。驱动层(build/CategoryService)实现。
export interface CategoryProviderPort {
  getCategoryList(): Promise<Category[]>
}
