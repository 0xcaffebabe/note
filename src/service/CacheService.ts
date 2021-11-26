
class CacheService {
  private static instance: CacheService = new CacheService()
  private cacheMap : Map<string, Map<string, any>> = new Map()
  private constructor(){}

  public static getInstance(): CacheService {
    return this.instance
  }



  /**
   *
   * 缓存添加/更新
   * @param {string} id
   * @param {string} argsStringify
   * @return {*}  {*}
   * @memberof CacheService
   */
  public set(id: string, argsStringify: string, cacheValue: any): void {
    this.ensureScopreCacheExists(id, argsStringify)
    const scopeCache = this.cacheMap.get(id)
    scopeCache!.set(argsStringify, cacheValue)
  }


  /**
   *
   * 获取缓存
   * @param {string} id
   * @param {string} argsStringify
   * @return {*}  {*}
   * @memberof CacheService
   */
  public get(id: string, argsStringify: string): any {
    this.ensureScopreCacheExists(id, argsStringify)
    return this.cacheMap.get(id)!.get(argsStringify)
  }


  /**
   *
   * 清空缓存
   * @memberof CacheService
   */
  public clear(){
    this.cacheMap.clear();
  }

  public has(id: string, argsStringify: string): boolean {
    this.ensureScopreCacheExists(id, argsStringify)
    return this.cacheMap.get(id)!.has(argsStringify)
  }

  private ensureScopreCacheExists(id: string, argsStringify: string) {
    if (!this.cacheMap.has(id)) {
      this.cacheMap.set(id, new Map<string, any>())
    }
  }
}

export default CacheService