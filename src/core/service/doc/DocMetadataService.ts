import DocFileInfo from '../../domain/DocFileInfo'
import { DocMetadata, EMPTY_DOC_METADATA } from '../../domain/doc/DocMetadata'
import type { YamlPort } from '../../ports'

/**
 * 文档 tag/metadata 子服务: 从 YAML frontmatter 解析 tags 与完整元数据。
 *
 * 从 DocService 原样搬出, 行为字节级保持:
 *  - resolveTagList 直接返回 yaml.load(...).tags(无 tags 时 undefined);
 *  - resolveMetadata 对 'undefined' 文本与各缺省字段回填 EMPTY_DOC_METADATA。
 *
 * 记忆化由 DocService 外层 @cacheByFileId 负责(以 file.id 为键), 故本服务持纯实现体即可。
 */
export class DocMetadataService {
  constructor(private readonly yaml: YamlPort) {}

  public resolveTagList(file: DocFileInfo): string[] {
    const json = this.yaml.load(file.metadata) as DocMetadata
    return json?.tags
  }

  public resolveMetadata(file: DocFileInfo): DocMetadata {
    const metadata = this.yaml.load(file.metadata) as DocMetadata
    if (metadata as any == 'undefined') {
      return EMPTY_DOC_METADATA
    }
    if (metadata) {
      for (const key in EMPTY_DOC_METADATA) {
        if ((metadata as any)[key] === undefined || (metadata as any)[key] === null) {
          (metadata as any)[key] = (EMPTY_DOC_METADATA as any)[key]
        }
      }
      return metadata
    }
    return EMPTY_DOC_METADATA
  }
}
