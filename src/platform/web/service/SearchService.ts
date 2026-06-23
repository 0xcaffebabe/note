import { sharedCache } from '@/platform/web/app/sharedCache'
import { SearchService } from '@/core/service/SearchService'
import { algoliaSearch } from '@/adapters/libs/AlgoliaSearchAdapter'
export default new SearchService(algoliaSearch, sharedCache)
