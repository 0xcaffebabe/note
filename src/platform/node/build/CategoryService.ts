import Category from "../../../core/domain/Category";
import BaseService from "./BaseService";
import { nodeFileSystem } from '../../../adapters/node/NodeFileSystem'
import { nodeMarkdown } from '../../../adapters/node/NodeMarkdownAdapter';
import { nodeDomParser } from '../../../adapters/node/NodeDomParser';
import { parseSummary } from '../../../core/category/SummaryParse';

// SUMMARY.md 解析(parseSummary/categoryParse/resolveCategory)已下沉 core/category/SummaryParse,
// 与 runtime CategoryService 统一同一口径(消除 section link 分叉)。本服务用 node 适配器装配。

class CategoryService extends BaseService {
  private static instance: CategoryService

  public static getInstance(): CategoryService {
    if (!this.instance) {
      this.instance = new CategoryService()
    }
    return this.instance
  }
  /**
   *
   * 获取当前文档的目录列表
   * @return {*}  {Promise<Category[]>}
   * @memberof CategoryService
   */
   public async getCategoryList() : Promise<Category[]>{
     const rawData = (await nodeFileSystem.readFile('doc/SUMMARY.md')).toString();
     const home = new Category();
     home.name = '首页';
     home.link = './README.md';
     return [
       home,
       ...parseSummary(rawData, nodeMarkdown, nodeDomParser)
     ]
   }
}

export default CategoryService.getInstance()
