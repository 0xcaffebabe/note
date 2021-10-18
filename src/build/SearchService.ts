import BaseService from "./BaseService";
import DocService from "./DocService";
import fs from 'fs'
import algoliasearch from 'algoliasearch';

interface IndexItem {
  url: string
  objectID: string
  txt: string
}

class SearchService extends BaseService {


  /**
   *
   * 将doc文档转为json索引数据
   * @static
   * @return {*}  {Promise<IndexItem[]>}
   * @memberof SearchService
   */
  static async generateIndex(): Promise<IndexItem[]> {
    BaseService.listAllMdFile
    const mdFiles = BaseService.listFilesBySuffix('md', 'doc')
    const taskList: Promise<{file:string,content: string}>[] = []
    for (let file of mdFiles) {
      taskList.push(
        fs.promises.readFile(file).then(data => {
          return {
            file,
            content: data.toString()
          }
        })
      )
    }
    const dataList = Promise.all(taskList);
    return (await dataList).map(v => {
      if (v.file.startsWith("doc") || v.file.startsWith("./doc")) {
        v.file = v.file.replace('doc/', '')
      }
      return v
    })
    .map(v => {
      return {
        url: v.file,
        objectID: v.file,
        txt: DocService.md2text(v.content)
      } as IndexItem
    })
  }


  /**
   *
   * 全量更新索引
   * @static
   * @memberof SearchService
   */
  static async totalAmountUpdateIndex(appId: string, secret: string, indexName: string, indexData: IndexItem[]){
    const client = algoliasearch(appId, secret);
    const index = client.initIndex(indexName)
    await index.replaceAllObjects(indexData)
  }
}

export default SearchService