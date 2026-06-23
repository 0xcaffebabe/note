import ClusterNode from '../domain/ClusterNode'
import ClusterScatter from '../domain/ClusterScatterPoint'

// 文档聚类端口: 聚类/散点/标签预测的生成本身是一条重驱动(分词/读文件/确定性数值计算),
// 留在驱动层(build/scripts/generateDocCluster)。core 编排只经此端口取结果。
export interface DocClusterPort {
  getDocCluster(): Promise<ClusterNode[]>
  getDocClusterScatter(): Promise<ClusterScatter>
  getDocTagPrediction(): Promise<[string, string[]][]>
}
