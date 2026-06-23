import { describe, it, expect } from 'vitest'
import { DocContentService } from '@/core/service/DocContentService'
import { nodeMarkdown } from '@/adapters/node/NodeMarkdownAdapter'
import { nodeDomParser } from '@/adapters/node/NodeDomParser'
import { foldTagMapping } from '@/core/service/doc/TagMapping'
import DocUtils from '@/core/util/DocUtils'
import CommitInfo from '@/core/domain/CommitInfo'
import type { KnowledgeNode } from '@/core/domain/KnowledgeNode'

// 守护从 build/DocService 下沉到 DocContentService 的纯塑形(buildFileInfo / buildQualityInputList)
// 与 core/service/doc/TagMapping.foldTagMapping。buildFileInfo/buildQualityInputList 只用
// resolveMetadata/cleanText(不碰 markdown/dom 端口), 但构造仍需注入端口, 故用 node 适配器装配。
const svc = new DocContentService(nodeMarkdown, nodeDomParser)
const commit = (date: string): CommitInfo => Object.assign(new CommitInfo(), { date })

describe('DocContentService.buildFileInfo 原始 md + 提交 -> DocFileInfo', () => {
  it('剥 frontmatter 得 body, metadata 取内层, name 取末段去 .md, id 走 docUrl2Id', () => {
    const raw = '---\ntitle: x\n---\n# Body\ntext'
    const info = svc.buildFileInfo('doc/java/Spring.md', raw, [commit('2024-01-01')])
    expect(info.name).toBe('Spring')
    expect(info.id).toBe(DocUtils.docUrl2Id('doc/java/Spring.md'))
    expect(info.metadata).toBe('title: x')
    expect(info.content).toBe('# Body\ntext')
    expect(info.createTime).toBe('2024-01-01')
  })

  it('无 frontmatter: content 原样, metadata 为空串', () => {
    const info = svc.buildFileInfo('doc/a.md', '# 只是正文\n内容', [])
    expect(info.content).toBe('# 只是正文\n内容')
    expect(info.metadata).toBe('')
    expect(info.createTime).toBe('')
  })

  it('commitList 取前 10, hasMoreCommit/totalCommits 反映总数', () => {
    const commits = Array.from({ length: 13 }, (_, i) => commit(`2024-01-${i + 1}`))
    const info = svc.buildFileInfo('doc/a.md', 'body', commits)
    expect(info.totalCommits).toBe(13)
    expect(info.hasMoreCommit).toBe(true)
    expect(info.commitList).toHaveLength(10)
    // createTime 取最后一条
    expect(info.createTime).toBe('2024-01-13')
  })

  it('正好 10 条提交时 hasMoreCommit 为 false', () => {
    const commits = Array.from({ length: 10 }, (_, i) => commit(`2024-02-${i + 1}`))
    const info = svc.buildFileInfo('doc/a.md', 'body', commits)
    expect(info.hasMoreCommit).toBe(false)
    expect(info.commitList).toHaveLength(10)
  })
})

describe('DocContentService.buildQualityInputList 按 docId 装配质量输入', () => {
  it('contentLength=cleanText(内容).len, 内/外链数按 docId 取, 缺省 0/空', () => {
    const fileList = ['doc/a.md', 'doc/b.md']
    const contents = new Map<string, string>([['a', 'content a'], ['b', '']])
    const commits = new Map<string, CommitInfo[]>([['a', [commit('2024-01-01')]]])
    const nodes: KnowledgeNode[] = []
    const inLinks = new Map<string, number>([['a', 2]])
    const outLinks = new Map<string, number>([['a', 3]])

    const out = svc.buildQualityInputList(fileList, contents, commits, nodes, inLinks, outLinks)
    expect(out).toHaveLength(2)

    expect(out[0].docId).toBe('a')
    expect(out[0].contentLength).toBe('content a'.length) // cleanText 单行无 ``` 原样
    expect(out[0].inLinksCount).toBe(2)
    expect(out[0].outLinksCount).toBe(3)
    expect(out[0].commitList).toHaveLength(1)

    // b: 内容空 -> 0; 无链/无提交 -> 0/[]
    expect(out[1].docId).toBe('b')
    expect(out[1].contentLength).toBe(0)
    expect(out[1].inLinksCount).toBe(0)
    expect(out[1].outLinksCount).toBe(0)
    expect(out[1].commitList).toEqual([])
  })
})

describe('foldTagMapping tag -> 文件名列表 反转聚合', () => {
  it('保插入序; 空 tags 项不贡献', () => {
    const map = foldTagMapping([
      { tags: ['a', 'b'], filename: 'f1' },
      { tags: ['a'], filename: 'f2' },
      { tags: [], filename: 'f3' },
    ])
    expect([...map.keys()]).toEqual(['a', 'b'])
    expect(map.get('a')).toEqual(['f1', 'f2'])
    expect(map.get('b')).toEqual(['f1'])
  })

  it('空输入 -> 空 Map', () => {
    expect(foldTagMapping([]).size).toBe(0)
  })
})
