import { sharedCache } from '@/platform/web/app/sharedCache'
// 合成: 核心 TagService + 注入的 api。ES 模块单例 → 全站共享同一实例。
import api from '@/platform/web/api'
import { TagService } from '@/core/service/TagService'
export default new TagService(api, sharedCache)
