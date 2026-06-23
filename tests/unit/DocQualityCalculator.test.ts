import { describe, it, expect } from 'vitest'
import DocQualityCalculator, { QualityInputData } from '@/core/util/DocQualityCalculator'
import CommitInfo from '@/core/domain/CommitInfo'
import { KnowledgeNode } from '@/core/domain/KnowledgeNode'

// 文档质量分驱动首页排序/聚类权重; 计算公式是纯函数, 适合用确定输入锁定各分项与加权口径
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString()
const commitsOn = (...dates: string[]): CommitInfo[] =>
  dates.map(d => Object.assign(new CommitInfo(), { date: d }))

// 仅保留待测分项, 其余清零, 便于反推单项贡献
const baseInput = (over: Partial<QualityInputData>): QualityInputData => ({
  docId: 'doc',
  contentLength: 0,
  outLinksCount: 0,
  inLinksCount: 0,
  commitList: [],
  metadata: '',
  knowledgeNodes: [],
  ...over,
})

describe('内容分 contentQuality', () => {
  it('常规长度 = 长度/1000', () => {
    const q = DocQualityCalculator.calculateQuality(baseInput({ contentLength: 5000 }))
    expect(q.contentQuality).toBeCloseTo(5, 6)
  })
  it('过短(<200)打 5 折', () => {
    const q = DocQualityCalculator.calculateQuality(baseInput({ contentLength: 100 }))
    expect(q.contentQuality).toBeCloseTo(0.05, 6) // 0.1 * 0.5
  })
  it('边界: 恰好 10000 不触发长文加成, 得 10', () => {
    const q = DocQualityCalculator.calculateQuality(baseInput({ contentLength: 10000 }))
    expect(q.contentQuality).toBeCloseTo(10, 6) // min(10,10)=10, 非 >10000
  })
  // [BUG] 源码先 min(..,10) 封顶再 *1.1, 封顶被击穿; 注释自称"有上限"却失效。
  // 暂不修原因: 同 [BUG] 链接权重二次施加 —— 评分公式驱动全站排序/聚类权重/徽章, 改算法会改动「整库已部署的质量分」,
  // 应作为一次专门的评分口径调整(连带分数复核与产物重建), 而非随手修。
  it('[BUG] 超长(>10000)封顶后再 *1.1 击穿上限, 实得 11(>maxContentScore=10)', () => {
    const q = DocQualityCalculator.calculateQuality(baseInput({ contentLength: 20000 }))
    expect(q.contentQuality).toBeCloseTo(11, 6) // min(20,10)=10 -> *1.1 = 11
  })
})

describe('链接分 linkQuality', () => {
  it('外链*0.15 + 内链*0.2', () => {
    const q = DocQualityCalculator.calculateQuality(baseInput({ outLinksCount: 2, inLinksCount: 3 }))
    expect(q.linkQuality).toBeCloseTo(0.9, 6) // 2*0.15 + 3*0.2
  })
  it('封顶 maxLinkScore=10', () => {
    const q = DocQualityCalculator.calculateQuality(baseInput({ outLinksCount: 100, inLinksCount: 100 }))
    expect(q.linkQuality).toBeCloseTo(10, 6)
  })
})

describe('更新活跃度 updateActivity(按提交时间衰减)', () => {
  it('空提交为 0', () => {
    const q = DocQualityCalculator.calculateQuality(baseInput({ commitList: [] }))
    expect(q.updateActivity).toBe(0)
  })
  it('按 30/90/365 天分档加权累计', () => {
    const q = DocQualityCalculator.calculateQuality(
      baseInput({ commitList: commitsOn(daysAgo(10), daysAgo(60), daysAgo(200), daysAgo(400)) }),
    )
    expect(q.updateActivity).toBeCloseTo(1.7, 6) // 1 + 0.5 + 0.2 + 0
  })
  it('封顶 maxUpdateActivityScore=5', () => {
    const recent = commitsOn(...Array.from({ length: 10 }, () => daysAgo(5)))
    const q = DocQualityCalculator.calculateQuality(baseInput({ commitList: recent }))
    expect(q.updateActivity).toBeCloseTo(5, 6)
  })
})

describe('PageRank 分(内部分项, 经综合分体现)', () => {
  const nodes = (links: KnowledgeNode[]): KnowledgeNode[] => links
  // 综合分里 pagerank 权重 0.1, 其余分项清零时 quality == pagerankScore * 0.1
  const prOf = (docId: string, ns: KnowledgeNode[]) =>
    DocQualityCalculator.calculateQuality(baseInput({ docId, knowledgeNodes: ns })).quality / 0.1

  it('文档不在知识图谱中得 0', () => {
    expect(prOf('missing', nodes([{ id: 'a', links: [] }]))).toBeCloseTo(0, 6)
  })
  it('孤立单节点收敛到 (1-d)/n = 0.15', () => {
    expect(prOf('a', nodes([{ id: 'a', links: [] }]))).toBeCloseTo(0.15, 5)
  })
  it('双向互链(A<->B)对称收敛到 0.5', () => {
    const g = nodes([
      { id: 'a', links: [{ id: 'b', name: 'B' }] },
      { id: 'b', links: [{ id: 'a', name: 'A' }] },
    ])
    expect(prOf('a', g)).toBeCloseTo(0.5, 5)
    expect(prOf('b', g)).toBeCloseTo(0.5, 5)
  })
  // [BUG] KnowledgeNode.links 类型上可选, 但 calculatePageRankScore 直接 .links.some/.length 无空判
  it('[BUG] 节点缺少 links 字段时崩溃(TypeError, 而非按空链接处理)', () => {
    expect(() =>
      DocQualityCalculator.calculateQuality(baseInput({ knowledgeNodes: [{ id: 'a' } as KnowledgeNode] })),
    ).toThrow(TypeError)
  })
  it('空知识图谱(knowledgeNodes=[])不崩溃且 pagerank 贡献为 0', () => {
    // allNodes 为空时 calculatePageRankScore 的循环体不执行, 不会出现 1/0(initialRank/length), 直接返回 0
    const q = DocQualityCalculator.calculateQuality(baseInput({ docId: 'x', knowledgeNodes: [] }))
    expect(q.quality).toBeCloseTo(0, 6) // 各分项均清零, 综合分为 0
  })
})

describe('综合分与批量', () => {
  it('quality 为各分项加权和, 并回填 id 与分项', () => {
    const input = baseInput({
      docId: 'x',
      contentLength: 1000, // contentScore = 1
      outLinksCount: 2,
      inLinksCount: 3, // linkScore = 0.9 (注: 此处链接权重已被二次施加, 见下方说明)
      commitList: commitsOn(daysAgo(400) /*旧*/), // commitScore=log10(2)*2, updateActivity=0
      knowledgeNodes: [], // pagerank=0
    })
    const q = DocQualityCalculator.calculateQuality(input)
    // 用独立字面量(非 config 常量)反推, 避免与被测公式同源而互相"自证"
    const expected =
      1 * 0.25 + // content
      0.9 * 0.35 + // link: linkScore 已乘过单条权重, 综合分再乘 (0.2+0.15) —— 见 [BUG] 链接权重二次施加
      (Math.log10(2) * 2) * 0.15 + // commit
      0 + // updateActivity
      0 // pagerank
    expect(q.id).toBe('x')
    expect(q.contentQuality).toBeCloseTo(1, 6)
    expect(q.linkQuality).toBeCloseTo(0.9, 6)
    expect(q.updateActivity).toBe(0)
    expect(q.quality).toBeCloseTo(expected, 6)
    expect(q.totalQuality).toBeCloseTo(expected, 6) // 对独立期望值校验, 而非 == q.quality(那是空断言)
  })

  it('calculateBatchQuality 逐项映射, 保持顺序与数量', () => {
    const list = [baseInput({ docId: 'a' }), baseInput({ docId: 'b' }), baseInput({ docId: 'c' })]
    const out = DocQualityCalculator.calculateBatchQuality(list)
    expect(out.map(q => q.id)).toEqual(['a', 'b', 'c'])
  })
})
