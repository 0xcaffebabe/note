// 搜索引擎端口(Algolia 路径): core 的高亮过滤/关键词补标逻辑留在 SearchService,
// 端口只负责发起检索并返回 algolia 形状的原始命中。类型在 core 内结构化描述,
// 不引入 @algolia/client-search, 适配器用 algoliasearch 实现。
import SearchSuggestion from '../domain/search/SearchSuggestion'

export interface AlgoliaHighlightValue { value?: string }
export interface AlgoliaSegmentHighlight {
  id?: AlgoliaHighlightValue
  txt?: AlgoliaHighlightValue
}
export interface AlgoliaHit {
  url: string
  createTime: string
  _highlightResult?: {
    url?: AlgoliaHighlightValue
    segments?: AlgoliaSegmentHighlight[]
  }
}
export interface AlgoliaSearchResponse {
  processingTimeMS?: number
  hits: AlgoliaHit[]
}

export interface SearchOptions {
  hitsPerPage: number
  highlightPreTag: string
  highlightPostTag: string
}

export interface SearchEnginePort {
  /** 在文档索引中检索, 返回 algolia 原始命中(可能为空) */
  search(kw: string, opts: SearchOptions): Promise<AlgoliaSearchResponse | undefined>
  /** 查询建议(自动补全) */
  querySuggestions(kw: string, hitsPerPage: number): Promise<SearchSuggestion[]>
}
