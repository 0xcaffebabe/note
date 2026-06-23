import { sharedCache } from '@/platform/web/app/sharedCache'
import api from '@/platform/web/api'
import { CategoryService } from '@/core/service/CategoryService'
import { Pinyin } from '@/core/util/Pinyin'
import { markedMarkdown } from '@/adapters/libs/MarkedMarkdownAdapter'
import { browserDomParser } from '@/adapters/browser/BrowserDomParser'
import { browserStorage } from '@/adapters/browser/LocalStorageAdapter'
import { tinyPinyin } from '@/adapters/libs/TinyPinyinAdapter'
export default new CategoryService(api, markedMarkdown, browserDomParser, browserStorage, new Pinyin(tinyPinyin), sharedCache)
