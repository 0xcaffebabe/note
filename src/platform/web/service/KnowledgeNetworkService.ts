import { sharedCache } from '@/platform/web/app/sharedCache'
import api from '@/platform/web/api'
import { KnowledgeNetworkService } from '@/core/service/KnowledgeNetworkService'
export default new KnowledgeNetworkService(api, sharedCache)
