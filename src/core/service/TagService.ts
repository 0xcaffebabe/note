import Cacheable from '../cache/Cacheable'
import Cache from '../cache/Cache'
import type { CachePort } from '../ports/CachePort'
import TagSumItem from '../domain/tag/TagSumItem'
import DocUtils from '../util/DocUtils'
import type { Api } from '../data/Api'

const cache = Cache()

export class TagService implements Cacheable {
  private tagSumList: TagSumItem[] = []
  private tagList: [string, string[]][] = []
  private docTagPredictions: [string, string[]][] = []

  constructor(private readonly api: Api, private readonly cache: CachePort) {
    this.init()
  }

  private async init() {
    this.tagList = await this.api.getTagMapping()
    this.docTagPredictions = await this.api.getDocTagPrediction()
    this.tagSumList = this.tagList.map(v => ({ tag: v[0], count: v[1].length }))
  }

  name(): string {
    return 'tag-service'
  }

  @cache
  public getTagSumList(): TagSumItem[] {
    return JSON.parse(JSON.stringify(this.tagSumList))
  }

  @cache
  public getTagList(): string[] {
    return this.tagList.map(v => v[0])
  }

  @cache
  public getPredictTag(doc: string): string[] {
    if (!doc) {
      return []
    }
    const hit = this.docTagPredictions.filter(v => DocUtils.docUrl2Id(v[0]) == doc)
    return hit.length ? hit[0][1] : []
  }

  @cache
  public getListByTag(tag: string): string[] {
    return this.tagList
      .filter(v => v[0] == tag)
      .map(v => v[1])
      .flatMap(v => v)
  }
}
