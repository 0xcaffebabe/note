
class CacheService {
  private static instance: CacheService = new CacheService()
  private cacheMap : Map<string, Map<string, any>> = new Map()
  // 每个scope最多保留的条目数 超出按LRU淘汰 防止长会话内存无限增长
  private static readonly MAX_ENTRIES_PER_SCOPE = 200
  private constructor(){}

  public static getInstance(): CacheService {
    return this.instance
  }



  /**
   *
   * 缓存添加/更新
   * @param {string} id
   * @param {string} cacheKey
   * @return {*}  {*}
   * @memberof CacheService
   */
  public set(id: string, cacheKey: string, cacheValue: any): void {
    this.ensureScopeCacheExists(id)
    const scopeCache = this.cacheMap.get(id)!
    // Map按插入序迭代 删除后重插使其保持LRU顺序
    if (scopeCache.has(cacheKey)) {
      scopeCache.delete(cacheKey)
    }
    scopeCache.set(cacheKey, cacheValue)
    if (scopeCache.size > CacheService.MAX_ENTRIES_PER_SCOPE) {
      scopeCache.delete(scopeCache.keys().next().value!)
    }
  }


  /**
   *
   * 获取缓存
   * @param {string} id
   * @param {string} cacheKey
   * @return {*}  {*}
   * @memberof CacheService
   */
  public get(id: string, cacheKey: string): any {
    const scopeCache = this.cacheMap.get(id)
    if (!scopeCache || !scopeCache.has(cacheKey)) {
      return undefined
    }
    const value = scopeCache.get(cacheKey)
    // LRU访问刷新
    scopeCache.delete(cacheKey)
    scopeCache.set(cacheKey, value)
    return value
  }


  /**
   *
   * 清空缓存
   * @memberof CacheService
   */
  public clear(){
    this.cacheMap.clear();
  }

  public has(id: string, cacheKey: string): boolean {
    const scopeCache = this.cacheMap.get(id)
    return !!scopeCache && scopeCache.has(cacheKey)
  }

  private ensureScopeCacheExists(id: string) {
    if (!this.cacheMap.has(id)) {
      this.cacheMap.set(id, new Map<string, any>())
    }
  }
}

export default CacheService
