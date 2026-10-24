// 合成根聚合: 把各服务模块就地合成的实例汇总为一个容器, 供 Vue provide/inject 使用。
// 各 @/platform/web/service/* 模块是各自的合成点(核心类 + 浏览器/库适配器), 经 ES 模块单例共享。
import api from '@/platform/web/api'
import docService from '@/platform/web/service/DocService'
import categoryService from '@/platform/web/service/CategoryService'
import tagService from '@/platform/web/service/TagService'
import knowledgeNetworkService from '@/platform/web/service/KnowledgeNetworkService'
import searchService from '@/platform/web/service/SearchService'
import configService from '@/platform/web/service/ConfigService'
import { AiContextService } from '@/core/service/AiContextService'
import { BrowserAiBridge } from '@/adapters/browser/BrowserAiBridge'
import { browserDomParser } from '@/adapters/browser/BrowserDomParser'
import { browserStorage } from '@/adapters/browser/LocalStorageAdapter'
import { AiChatHistoryService } from '@/core/service/AiChatHistoryService'
import { AiDocumentTools } from '@/core/service/AiDocumentTools'

const aiContextService = new AiContextService(docService, browserDomParser)
const aiBridge = new BrowserAiBridge()
const aiChatHistory = new AiChatHistoryService(browserStorage)
const aiDocumentTools = new AiDocumentTools(aiContextService, docService, categoryService, api)
aiBridge.configureTools(aiDocumentTools.definitions, (name, args, signal) => aiDocumentTools.execute(name, args, signal))

export const services = {
  api,
  docService,
  categoryService,
  tagService,
  knowledgeNetworkService,
  searchService,
  configService,
  aiContextService,
  aiBridge,
  aiChatHistory,
  aiDocumentTools,
}

export type Services = typeof services

export {
  api,
  docService,
  categoryService,
  tagService,
  knowledgeNetworkService,
  searchService,
  configService,
}
