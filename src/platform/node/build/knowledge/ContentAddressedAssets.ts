import { createHash } from 'node:crypto'
import type { KnowledgeResource } from '../../../../core/domain/knowledge/KnowledgePublication'

const MAX_RESOURCE_BYTES = 16 * 1024 * 1024

/** 以实际发布的 UTF-8 JSON 字节计算摘要，避免资源名与下载内容不一致。 */
export function knowledgeDigest(body: string): string {
  return createHash('sha256').update(body).digest('hex')
}

/**
 * 单次构建的内容寻址资源集合，集中维护摘要、大小上限和插入顺序。
 * 保留 JSON 属性顺序；相同内容只占用一个地址，最后由构建器追加 manifest。
 */
export class ContentAddressedAssets {
  public readonly assets = new Map<string, string>()

  /** 序列化不可变资源；超过独立客户端支持的 16 MiB 边界时中止构建。 */
  public put(value: unknown): KnowledgeResource {
    const body = JSON.stringify(value)
    const hash = knowledgeDigest(body)
    const bytes = Buffer.byteLength(body)
    if (bytes > MAX_RESOURCE_BYTES) {
      throw new Error('AI knowledge resource exceeds 16 MiB')
    }

    const resource: KnowledgeResource = {
      path: `/ai/objects/${hash}.json`,
      sha256: hash,
      bytes,
    }
    this.assets.set(resource.path, body)
    return resource
  }
}
