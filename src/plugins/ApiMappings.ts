import StatisticService from '../build/StatisticService'
import UrlConst from '../const/UrlConst'
import CategoryService from '../build/CategoryService'
import WordCloudService from '../build/WordCloudService'
import DocService from '../build/DocService'

interface DocApiItem {
  name: string
  path: string
  method: Function
  type?: 'build'|'runtime'|'build&runtime'
}

// api 请求映射
const apiMappings: DocApiItem[] = [
  {
    type: 'build&runtime',
    name: '词云数据',
    path: '/wordcloud.json',
    method: async () => WordCloudService.calcWordFrequency()
  },
  {
    name: '统计数据',
    path: '/info.json',
    method: async () => StatisticService.generateStatistic()
  },
  {
    name: '提交日历图数据',
    path: '/commitHeatmap.json',
    method: async () => StatisticService.generateYearsCommitHeatmap()
  },
  {
    name: '小时提交热力图',
    path: UrlConst.hourCommitHeatmap,
    method: async () => StatisticService.generateCommitHourHeatmap()
  },
  {
    type: 'build&runtime',
    name: '显式知识网络',
    path: '/knowledgeNetwork.json',
    method: async () => DocService.generateKnowledgeNetwork()
  },
  {
    type: 'build&runtime',
    name: '隐式知识网络',
    path: UrlConst.potentialKnowledgeNetwork,
    method: async () => DocService.generatePotentialKnowledgeNetwork()
  },
  {
    type: 'build&runtime',
    name: '倒序提交文档列表',
    path: UrlConst.descCommitTimeDocList,
    method: async () => DocService.generateDocListOrderByLastCommit()
  },
  {
    type: 'build&runtime',
    name: '标签映射',
    path: '/tagMapping.json',
    method: async () => Array.from((await DocService.buildTagMapping()).entries())
  },
  {
    type: 'build&runtime',
    name: '目录',
    path: UrlConst.category,
    method: async () => CategoryService.getCategoryList()
  },
  {
    type: 'build&runtime',
    name: '文档聚类',
    path: UrlConst.docClusterJson,
    method: async () => DocService.getDocCluster()
  },
  {
    name: '提交总量',
    path: UrlConst.commitTotalTrend,
    method: async () => StatisticService.generateCommitTotalTrend()
  },
  {
    type: 'build&runtime',
    name: '文档质量',
    path: UrlConst.docQualityJson,
    method: async () => DocService.generateDocQualityData()
  },
]

export default apiMappings