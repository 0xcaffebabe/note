import { sharedCache } from '@/platform/web/app/sharedCache'
// api 合成点(浏览器): 用核心 Api 类 + 浏览器 HttpClient 适配器装配出 api 实例。
// 测试通过 vi.mock('@/platform/web/api') 在此边界替换为假数据。
import { Api } from '@/core/data/Api'
import { browserHttpClient } from '@/adapters/browser/FetchHttpClient'

export default new Api(browserHttpClient, sharedCache)
