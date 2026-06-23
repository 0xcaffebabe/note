import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'

/**
 * 架构边界守护(六边形分层的持久护栏):
 * src/core 是纯逻辑核心层 —— 必须能脱离当前框架/库独立编译运行, 逻辑可迁移到其它平台。
 * 因此 core 内任何文件都不得:
 *   1. import 任何框架/UI 库(vue/vuex/vue-router/element-plus/echarts/jsmind/mermaid/svg-pan-zoom)
 *   2. import 任何受限第三方逻辑库(marked/katex/prismjs/js-yaml/tiny-pinyin/algoliasearch/nodejieba/
 *      simple-git/jsdom) —— 这些一律经 core/ports 端口接口注入, 实现放在 adapters/
 *   3. import 任何 Node 内置模块(fs/path/...) —— core 与运行环境无关
 *   4. import 任何指向 outer 层的别名路径(@/...) —— core 只用相对 import, 完全自包含
 *
 * 依赖方向只能 outer -> core; 这条测试一旦变红, 说明有人把外层依赖泄漏进了核心层。
 */

const CORE_DIR = resolve(__dirname, '../../src/core')

// 递归列出 core 下所有 .ts
function listTs(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      out.push(...listTs(p))
    } else if (name.endsWith('.ts')) {
      out.push(p)
    }
  }
  return out
}

// 抽取一个文件里所有 import/export ... from '来源' 的来源串(含 import type / 动态 import)
function importSources(code: string): string[] {
  const sources: string[] = []
  const re = /(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(code))) {
    sources.push(m[1])
  }
  const dynRe = /import\(\s*['"]([^'"]+)['"]\s*\)/g
  while ((m = dynRe.exec(code))) {
    sources.push(m[1])
  }
  return sources
}

const FORBIDDEN_LIBS = [
  'vue', 'vuex', 'vue-router', 'element-plus', '@element-plus',
  'echarts', 'echarts-gl', 'jsmind', 'mermaid', 'svg-pan-zoom',
  'marked', 'katex', 'prismjs', 'js-yaml', 'tiny-pinyin', 'algoliasearch', '@algolia',
  'nodejieba', 'simple-git', 'jsdom',
]
const NODE_BUILTINS = ['fs', 'path', 'os', 'crypto', 'http', 'https', 'child_process', 'url', 'util']

function isForbidden(src: string): string | null {
  if (src.startsWith('@/')) return 'outer 别名路径(@/), core 必须相对 import 且自包含'
  if (src.startsWith('node:')) return 'Node 内置模块'
  if (NODE_BUILTINS.includes(src)) return 'Node 内置模块'
  for (const lib of FORBIDDEN_LIBS) {
    if (src === lib || src.startsWith(lib + '/')) return `受限库/框架: ${lib}(应经端口注入)`
  }
  return null
}

describe('core 层架构边界(依赖只能 outer -> core)', () => {
  const files = listTs(CORE_DIR)

  it('core 目录非空(防止路径写错导致守护空跑)', () => {
    expect(files.length).toBeGreaterThan(30)
  })

  it('core 内每个文件都不依赖框架/库/Node内置/outer别名', () => {
    const violations: string[] = []
    for (const file of files) {
      const code = readFileSync(file, 'utf-8')
      for (const src of importSources(code)) {
        const reason = isForbidden(src)
        if (reason) {
          violations.push(`${file.replace(CORE_DIR, 'src/core')}  ->  "${src}"  [${reason}]`)
        }
      }
    }
    expect(violations, '\n违反 core 边界的 import:\n' + violations.join('\n')).toEqual([])
  })
})
