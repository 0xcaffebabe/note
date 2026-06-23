// SearchIndexPort 的实现: 包裹 algoliasearch。唯一接触 algolia 索引 SDK 的位置。
import type { SearchIndexPort } from '../../core/ports/SearchIndexPort'
import algoliasearch from 'algoliasearch'

export class AlgoliaIndexer implements SearchIndexPort {
  async replaceAllObjects(appId: string, secret: string, indexName: string, objects: unknown[]): Promise<void> {
    const client = algoliasearch(appId, secret)
    const index = client.initIndex(indexName)
    await index.replaceAllObjects(objects as any)
  }
}

export const algoliaIndexer = new AlgoliaIndexer()
