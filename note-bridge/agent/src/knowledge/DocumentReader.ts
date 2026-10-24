import type {
  CatalogEntry,
  KnowledgeCitation,
  KnowledgeToolArgs,
  KnowledgeToolResult,
} from './contracts.js';
import { DocumentRepository } from './DocumentRepository.js';
import { KnowledgeResults } from './KnowledgeResults.js';
import { KnowledgeError, invalid } from './KnowledgeError.js';
import { RESULT_CONTENT_BYTES } from './limits.js';
import {
  bytes,
  number,
  pagination,
  prefix,
  splitSurrogate,
} from './resultBounds.js';
import { finishKnowledgeResult } from './toolOverview.js';

/**
 * 将已验证的发布正文投影为章节、目录和附件工具结果。
 * 只负责读取视图与续读边界，正文获取和缓存委托给 DocumentRepository。
 * 各读取入口共享引用投影，保证附件与后续模型读取可以互相核对。
 */
export class DocumentReader {
  constructor(
    private readonly documents: DocumentRepository,
    private readonly results: KnowledgeResults,
  ) {}

  /** 读取附件选择器所需的文档元数据和有界章节列表。 */
  public async describe(docId: string, signal?: AbortSignal) {
    const doc = this.documents.entry(docId);
    const body = await this.documents.load(doc, signal);
    const all = body.sections.flatMap((section, index) =>
      section.headingId
        ? [
            {
              id: section.headingId,
              title: prefix(section.title, 200),
              section: index,
            },
          ]
        : [],
    );
    const headings = all.slice(0, 1000);
    while (
      headings.length > 1 &&
      bytes(headings) > RESULT_CONTENT_BYTES - 16384
    ) {
      headings.pop();
    }
    return {
      docId,
      title: doc.title,
      url: doc.url,
      contentHash: doc.contentHash,
      headings,
      headingsTruncated: headings.length < all.length,
    };
  }

  /** 按所选锚点构造有界附件，引用 ID 与模型触发的正文读取保持一致。 */
  public async attachment(
    docId: string,
    headingIds?: string[],
    signal?: AbortSignal,
  ): Promise<KnowledgeToolResult> {
    const doc = this.documents.entry(docId);
    const body = await this.documents.load(doc, signal);
    if (
      headingIds &&
      (!Array.isArray(headingIds) ||
        headingIds.length > 256 ||
        headingIds.some(
          (id) =>
            typeof id !== 'string' ||
            !body.sections.some((section) => section.headingId === id),
        ))
    ) {
      invalid('附件章节已变化或不存在');
    }
    const selected = body.sections
      .map((section, index) => ({ ...section, section: index }))
      .filter(
        (section) =>
          !headingIds?.length || headingIds.includes(section.headingId),
      );
    if (!selected.length) {
      invalid('附件没有可读取的正文');
    }
    const sections: Record<string, unknown>[] = [];
    const sources: KnowledgeCitation[] = [];
    let truncated = false;
    for (const section of selected) {
      let text = prefix(section.text, 64000);
      const citation = this.results.citation(
        doc,
        section.section,
        section.headingId,
        section.title,
      );
      let value = {
        ...section,
        title: prefix(section.title, 200),
        text,
        sourceId: citation.sourceId,
      };
      while (
        bytes({
          sections: [...sections, value],
          sources: [...sources, citation],
        }) >
          RESULT_CONTENT_BYTES - 4096 &&
        text.length > 256
      ) {
        text = prefix(text, Math.floor(text.length * 0.8));
        value = { ...value, text };
      }
      if (
        bytes({
          sections: [...sections, value],
          sources: [...sources, citation],
        }) >
        RESULT_CONTENT_BYTES - 4096
      ) {
        truncated = true;
        break;
      }
      sections.push(value);
      sources.push(citation);
      if (text.length < section.text.length) {
        truncated = true;
      }
    }
    return finishKnowledgeResult(
      'attachment',
      { docId },
      {
        data: {
          ...this.results.reference(doc),
          sections,
          truncated,
          totalSections: selected.length,
        },
        sources,
      },
    );
  }

  /** 读取一个章节的有界正文；nextOffset 保留完整字符，并支持精确续读。 */
  public async read(
    doc: CatalogEntry,
    args: KnowledgeToolArgs,
    signal?: AbortSignal,
  ): Promise<KnowledgeToolResult> {
    const body = await this.documents.load(doc, signal);
    const section = number(args, 'section', 0);
    const current = body.sections[section];
    if (!current) {
      throw new KnowledgeError(
        'unknown_section',
        '章节不存在，请先读取 get_toc',
      );
    }
    const offset = number(args, 'offset', 0);
    if (offset > current.text.length || splitSurrogate(current.text, offset)) {
      invalid('正文 offset 无效，请使用上次返回的 nextOffset');
    }
    const citation = this.results.citation(
      doc,
      section,
      current.headingId,
      current.title,
    );
    let text = prefix(
      current.text.slice(offset),
      number(args, 'maxChars', 16000),
    );
    for (;;) {
      const nextOffset =
        offset + text.length < current.text.length
          ? offset + text.length
          : null;
      const result = {
        data: {
          ...this.results.reference(doc),
          sourceId: citation.sourceId,
          section,
          headingId: current.headingId,
          sectionTitle: prefix(current.title, 200),
          text,
          offset,
          nextOffset,
          nextSection: section + 1 < body.sections.length ? section + 1 : null,
          totalSections: body.sections.length,
          truncated: nextOffset !== null,
        },
        sources: [citation],
      };
      if (bytes(result) <= RESULT_CONTENT_BYTES || !text.length) {
        return result;
      }
      text = prefix(text, Math.floor(text.length * 0.8));
    }
  }

  /** 按正文顺序返回真实站点锚点、章节序号与引用证据。 */
  public async toc(
    doc: CatalogEntry,
    args: KnowledgeToolArgs,
    signal?: AbortSignal,
  ): Promise<KnowledgeToolResult> {
    const body = await this.documents.load(doc, signal);
    const offset = number(args, 'offset', 0);
    const headings = body.sections
      .map((item, section) => ({
        ...this.results.citation(doc, section, item.headingId, item.title),
        section,
        headingId: item.headingId,
        title: prefix(item.title, 200),
      }))
      .slice(offset, offset + number(args, 'limit', 100));
    for (;;) {
      const result = {
        data: {
          ...this.results.reference(doc),
          headings,
          total: body.sections.length,
          ...pagination(offset, headings.length, body.sections.length),
        },
        sources: headings.map(
          ({ sourceId, title, url, contentHash, revision }) => ({
            sourceId,
            title,
            url,
            contentHash,
            revision,
          }),
        ),
      };
      if (bytes(result) <= RESULT_CONTENT_BYTES || headings.length <= 1) {
        return result;
      }
      headings.pop();
    }
  }
}
