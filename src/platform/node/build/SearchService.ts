import BaseService from "./BaseService";
import DocService from "./DocService";
import { nodeFileSystem } from '../../../adapters/node/NodeFileSystem'
import { algoliaIndexer } from '../../../adapters/node/AlgoliaIndexer'
import SearchIndexItem from "../../../core/domain/search/SearchIndexItem";
import { buildIndexItems } from "../../../core/service/SearchIndexBuilder";

// 忽略文件(仓库特定搜索黑名单, 全路径等值; 刻意留 platform——与聚类 stopFiles/DocBuild 排除
// 三份名单语义/极性各异, 统一会改 Algolia 索引集合)。
const ignoreFiles: string[] = ['doc/README.md', 'doc/SUMMARY.md', 'doc/个人/书单.md',
'doc/个人/学习计划.md', 'doc/个人/技术栈参考.md', 'doc/参考文献.md', 'doc/算法与数据结构/leetcode/leetcode.md']

class SearchService extends BaseService {


  /**
   *
   * 将doc文档转为json索引数据
   * @static
   * @return {*}  {Promise<SearchIndexItem[]>}
   * @memberof SearchService
   */
  static async generateIndex(): Promise<SearchIndexItem[]> {
    const mdFiles = BaseService.listFilesBySuffix('md', 'doc')
      .filter(v => ignoreFiles.indexOf(v) == -1)
    const taskList: Promise<{ file: string, content: string }>[] = []
    for (let file of mdFiles) {
      taskList.push(
        nodeFileSystem.readFile(file).then(data => ({ file, content: data.toString() }))
      )
    }
    const entries = await Promise.all(taskList)
    // doc 前缀剥离 + 索引项组装已下沉 core/service/SearchIndexBuilder; md 分段与时钟注入。
    return buildIndexItems(entries, {
      md2Seg: (md) => DocService.md2TextSegement(md),
      now: () => new Date().toISOString(),
    })
  }


  /**
   *
   * 全量更新ALGOLIA索引
   * @static
   * @memberof SearchService
   */
  static async totalAmountUpdateIndex(appId: string, secret: string, indexName: string, indexData: SearchIndexItem[]) {
    await algoliaIndexer.replaceAllObjects(appId, secret, indexName, indexData)
  }
}

export default SearchService