import { sharedCache } from '@/platform/web/app/sharedCache'
import api from '@/platform/web/api'
import tagService from '@/platform/web/service/TagService'
import knowledgeNetworkService from '@/platform/web/service/KnowledgeNetworkService'
import { DocService } from '@/core/service/DocService'
import DocRender from '@/core/render/DocRender'
import { markedMarkdown } from '@/adapters/libs/MarkedMarkdownAdapter'
import { browserDomParser } from '@/adapters/browser/BrowserDomParser'
import { browserStorage } from '@/adapters/browser/LocalStorageAdapter'
import { jsYaml } from '@/adapters/libs/JsYamlAdapter'

const docRender = new DocRender(markedMarkdown, browserDomParser)
export default new DocService(api, docRender, tagService, knowledgeNetworkService, browserStorage, browserDomParser, jsYaml, sharedCache)
