import type { KnowledgeToolArgs, KnowledgeToolResult } from './contracts.js';
import { KnowledgeError } from './KnowledgeError.js';
import { KNOWLEDGE_TOOL_RESULT_BYTES } from './limits.js';
import { bytes, display } from './resultBounds.js';

const INPUT_LABELS: Record<string, string> = {
  docId: '文档',
  query: '关键词',
  section: '章节',
  offset: '起始位置',
  limit: '条数',
  maxChars: '最大字符',
  direction: '方向',
  category: '分类',
  scope: '范围',
};

/**
 * 补充可展示的调用概览并校验最终结果大小。
 * 所有普通工具与附件都经过此出口，概览不能使主体越过 192 KiB 上限。
 */
export function finishKnowledgeResult(
  name: string,
  args: KnowledgeToolArgs,
  result: KnowledgeToolResult,
): KnowledgeToolResult {
  const items = overviewItems(result.data);
  const notes = overviewNotes(name, result.data);
  const summary = overviewSummary(name, result.data, items.length);
  const displayItems = items
    .slice(0, 8)
    .map((item) =>
      display(String((item as Record<string, unknown>).title || ''), 160),
    )
    .filter(Boolean);
  result.overview = {
    input: Object.entries(args)
      .slice(0, 8)
      .map(([key, value]) => ({
        label: display(INPUT_LABELS[key] || key, 32),
        value: display(String(value), 200),
      })),
    summary: display(summary, 320),
    ...(displayItems.length ? { items: displayItems } : {}),
    ...(notes.length ? { note: display(notes.join(' '), 400) } : {}),
  };
  if (bytes(result) > KNOWLEDGE_TOOL_RESULT_BYTES) {
    throw new KnowledgeError(
      'result_too_large',
      '知识工具结果过大，请缩小 limit 或 maxChars',
    );
  }
  return result;
}

function overviewItems(data: Record<string, unknown>): unknown[] {
  if (Array.isArray(data.documents)) {
    return data.documents;
  }
  if (Array.isArray(data.headings)) {
    return data.headings;
  }
  if (Array.isArray(data.nodes)) {
    return data.nodes;
  }
  return [];
}

function overviewSummary(
  name: string,
  data: Record<string, unknown>,
  count: number,
): string {
  switch (name) {
    case 'get_document':
      return `读取《${String(data.title)} · ${String(data.sectionTitle)}》，${String(data.text || '').length} 字符`;
    case 'get_knowledge_network':
      return `返回 ${count} 篇文档间的 ${(data.edges as unknown[]).length} 条关联，共 ${String(data.totalEdges)} 条。`;
    case 'get_knowledge_overview':
      return `知识库共 ${String(data.totalDocuments)} 篇文档、${String(data.totalCategories)} 个分类，本次返回 ${count} 篇。`;
    case 'get_toc':
      return `返回 ${count} / ${String(data.total)} 个章节。`;
    case 'search_documents':
    case 'get_related_documents':
      return `找到 ${String(data.total)} 篇${name === 'search_documents' ? '匹配' : '相关'}文档，本次返回 ${count} 篇。`;
    case 'attachment':
      return `附加 ${(data.sections as unknown[]).length} 个章节。`;
    default:
      return `返回 ${count} 项`;
  }
}

function overviewNotes(name: string, data: Record<string, unknown>): string[] {
  const notes =
    data.truncated || data.nextOffset != null
      ? ['结果已分页，可继续读取后续内容。']
      : [];
  if (name === 'get_document' && data.nextSection != null) {
    notes.push('文档还有其他章节，本次仅读取当前章节。');
  }
  if (name === 'search_documents') {
    const fulltext = data.fulltext as { status: string };
    if (fulltext.status === 'unavailable' || fulltext.status === 'failed') {
      notes.push('全文检索不可用，本次回退到目录标题和路径匹配。');
    } else if (fulltext.status === 'ok') {
      notes.push('全文索引独立更新、最多检索 200 个候选；片段需读取正文核实。');
    }
  }
  return notes;
}
