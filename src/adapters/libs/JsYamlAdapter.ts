// YamlPort 的实现: 委托 js-yaml。浏览器与 node 通用。
import type { YamlPort } from '@/core/ports'
import { loadAll, YAMLException } from 'js-yaml'

export class JsYamlAdapter implements YamlPort {
  load(content: string): unknown {
    // v5 的 load 不再接受空流；loadAll 保留无 frontmatter / 仅注释时返回 undefined 的行为。
    const documents = loadAll(content)
    if (documents.length > 1) {
      throw new YAMLException('expected a single document in the stream, but found more')
    }
    return documents[0]
  }
}

export const jsYaml = new JsYamlAdapter()
