import type Category from '../../../../core/domain/Category'
import type DocFileInfo from '../../../../core/domain/DocFileInfo'
import type {
  KnowledgeCatalogEntry,
  PublishedCatalogDocument,
} from '../../../../core/domain/knowledge/KnowledgePublication'
import type { AiContextService } from '../../../../core/service/AiContextService'
import DocUtils from '../../../../core/util/DocUtils'
import { safeTextPrefix } from '../../../../core/util/StringUtils'
import type { ContentAddressedAssets } from './ContentAddressedAssets'

/**
 * 以分类目录顺序选取可发布文档，过滤外链和缺少正文的条目。
 * 同一文档重复出现时更新显示信息，同时保留其首次出现的位置。
 */
export function collectCatalogEntries(
  categories: Category[],
  files: Map<string, DocFileInfo>,
): Map<string, KnowledgeCatalogEntry> {
  const entries = new Map<string, KnowledgeCatalogEntry>()

  function visit(items: Category[]): void {
    for (const category of items) {
      const isInternalLink = category.link && !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(category.link)
      if (isInternalLink) {
        const id = DocUtils.docUrl2Id(category.link)
        if (files.has(id)) {
          const parts = DocUtils.docId2Segments(id)
          entries.set(id, {
            docId: id,
            title: safeTextPrefix(category.name || parts.at(-1) || id, 200),
            url: DocUtils.docId2HtmlPath(id).split('/').map(encodeURIComponent).join('/'),
            category: parts.length > 1 ? parts[0] : '(root)',
          })
        }
      }
      visit(category.chidren || [])
    }
  }

  visit(categories)
  return entries
}

/** 按目录顺序逐篇渲染和发布正文，避免同时保留数百个文档的 DOM。 */
export async function publishCatalogDocuments(
  entries: Map<string, KnowledgeCatalogEntry>,
  context: AiContextService,
  assets: ContentAddressedAssets,
): Promise<PublishedCatalogDocument[]> {
  const documents: PublishedCatalogDocument[] = []
  for (const entry of entries.values()) {
    const document = await context.load(entry.docId)
    const resource = assets.put({
      schemaVersion: 1,
      docId: entry.docId,
      title: entry.title,
      url: entry.url,
      headings: document.headings,
      sections: document.sources.map(({ headingId, title, text }) => ({ headingId, title, text })),
    })
    documents.push({
      ...entry,
      contentHash: `sha256:${resource.sha256}`,
      resource,
    })
  }
  return documents
}
