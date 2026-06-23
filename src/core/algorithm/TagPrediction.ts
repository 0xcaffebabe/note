import { sim } from './clusterMath'

// 基于文档向量的标签预测(平台无关, 纯数值): 对每个候选 tag, 取该 tag 下所有成员文档向量
// 与目标文档向量的平均余弦相似度作为打分, 取分最高的前 topN 个 tag。
// 提取自 build/scripts/generateDocCluster.generateDocTagPrediction —— 向量化(getDocVec, 带 jieba/fs)
// 留驱动, 驱动把 docVec 与 tag->成员向量[][] 备好喂入。

/**
 * @param docVec    目标文档向量
 * @param tagToVecs tag -> 该 tag 下成员文档向量列表(保持 tag 迭代序与各 tag 内成员序)
 * @param topN      取前 N 个 tag(默认 10)
 * ⚠️ 逐字保持: sumDis 严格按数组序累加; [tag,avgDis] 按 Map 迭代序 push;
 *    `.sort((b,a)=>a[1]-b[1])`(降序, 平手靠 V8 稳定排序保原序); `.splice(0,topN)`; 取 tag 名。
 */
export function predictTagsByVector(docVec: number[], tagToVecs: Map<string, number[][]>, topN = 10): string[] {
  const scored: [string, number][] = []
  for (const [tag, memberVecs] of tagToVecs) {
    let sumDis = 0
    for (const v of memberVecs) {
      sumDis += sim(docVec, v)
    }
    const avgDis = sumDis / memberVecs.length
    scored.push([tag, avgDis])
  }
  scored.sort((b, a) => a[1] - b[1])
  return scored.splice(0, topN).map(v => v[0])
}
