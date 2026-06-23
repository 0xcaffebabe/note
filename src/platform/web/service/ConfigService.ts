import { ConfigService } from '@/core/service/ConfigService'
import { browserStorage } from '@/adapters/browser/LocalStorageAdapter'
export default new ConfigService(browserStorage)
