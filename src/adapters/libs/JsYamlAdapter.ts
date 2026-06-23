// YamlPort 的实现: 委托 js-yaml。浏览器与 node 通用。
import type { YamlPort } from '@/core/ports'
import yaml from 'js-yaml'

export class JsYamlAdapter implements YamlPort {
  load(content: string): unknown {
    return yaml.load(content)
  }
}

export const jsYaml = new JsYamlAdapter()
