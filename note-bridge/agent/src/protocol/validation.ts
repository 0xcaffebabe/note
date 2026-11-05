import type { AttachmentSelection } from '../domain/TurnSubmission.js';
import { AgentError } from '../domain/AgentError.js';
import type { Effort } from '../domain/Model.js';

/** 只验证客户端输入，避免业务服务隐式接受越界分页、附件和 effort。 */
export function requireString(value: unknown, name: string): string {
  if (typeof value !== 'string' || !value || value.length > 4096) {
    throw new AgentError('invalid_request', `${name} 无效`);
  }
  return value;
}

export function parseEffort(value: unknown): Effort {
  const effort = value ?? 'default';
  if (
    ![
      'default',
      'none',
      'minimal',
      'low',
      'medium',
      'high',
      'xhigh',
      'max',
      'ultra',
    ].includes(String(effort))
  ) {
    throw new AgentError('invalid_request', 'effort 无效');
  }
  return effort as Effort;
}

export function pageLimit(value: unknown) {
  if (value === undefined) {
    return 20;
  }
  if (!Number.isInteger(value) || Number(value) < 1 || Number(value) > 50) {
    throw new AgentError('invalid_request', '分页数量须为 1 至 50');
  }
  return Number(value);
}

export function pageCursor(value: unknown) {
  return value === undefined ? undefined : requireString(value, 'cursor');
}

export function parseAttachments(value: unknown): AttachmentSelection[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value) || value.length > 3) {
    throw new AgentError('invalid_request', '最多选择 3 篇附件');
  }
  return value.map((a) => {
    if (!a || typeof a !== 'object') {
      throw new AgentError('invalid_request', '附件无效');
    }
    const docId = requireString(a.docId, 'docId');
    if (
      a.headingIds !== undefined &&
      (!Array.isArray(a.headingIds) ||
        a.headingIds.length > 200 ||
        a.headingIds.some(
          (id: unknown) => typeof id !== 'string' || id.length > 500,
        ))
    ) {
      throw new AgentError('invalid_request', '附件章节无效');
    }
    return {
      docId,
      ...(a.headingIds
        ? { headingIds: [...new Set(a.headingIds)] as string[] }
        : {}),
      ...(a.contentHash
        ? { contentHash: requireString(a.contentHash, 'contentHash') }
        : {}),
    };
  });
}
