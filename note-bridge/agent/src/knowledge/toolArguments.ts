import type { KnowledgeToolArgs } from './contracts.js';
import { KNOWLEDGE_TOOL_DEFINITIONS } from './toolDefinitions.js';
import { KnowledgeError, invalid } from './KnowledgeError.js';
import { record, validDocId } from './validation.js';
import { bytes } from './resultBounds.js';

/** 以模型收到的 schema 校验参数，禁止多余字段、超限输入和未知工具。 */
export function validateArgs(name: string, value: unknown): KnowledgeToolArgs {
  const definition = KNOWLEDGE_TOOL_DEFINITIONS.find(
    (tool) => tool.name === name,
  );
  if (!definition) {
    throw new KnowledgeError('unknown_tool', '未知知识工具');
  }
  const args = record(value);
  if (bytes(args) > 4096) {
    invalid('工具参数过大');
  }
  const properties = definition.inputSchema.properties as Record<
    string,
    {
      type: string;
      minimum?: number;
      maximum?: number;
      minLength?: number;
      maxLength?: number;
      enum?: string[];
    }
  >;
  if (
    definition.inputSchema.required.some((key) => !Object.hasOwn(args, key))
  ) {
    invalid('缺少必要工具参数');
  }
  for (const [key, item] of Object.entries(args)) {
    if (!Object.hasOwn(properties, key)) {
      invalid(`不支持的工具参数: ${key}`);
    }
    const property = properties[key];
    if (property.type === 'integer') {
      if (
        typeof item !== 'number' ||
        !Number.isSafeInteger(item) ||
        item < property.minimum! ||
        item > property.maximum!
      ) {
        invalid(`工具参数 ${key} 超出范围`);
      }
    } else if (
      typeof item !== 'string' ||
      item.length < (property.minLength || 0) ||
      item.length > (property.maxLength || 512) ||
      (property.enum && !property.enum.includes(item))
    ) {
      invalid(`工具参数 ${key} 无效`);
    }
  }
  if (args.docId !== undefined && !validDocId(String(args.docId))) {
    invalid('工具文档 ID 无效');
  }
  return args as KnowledgeToolArgs;
}
