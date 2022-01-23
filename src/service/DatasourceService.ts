import DatasourceConst from "@/const/DatasourceConst"
import DatasourceItem from "@/dto/DatasourceItem"
import { StatisticInfo } from "@/dto/StatisticInfo"
import axios from 'axios'

class DatasourceService {

  public static listDatasourceList():DatasourceItem[] {
    return DatasourceConst
  }

  public static getCurrentDatasource(): DatasourceItem {
    const id = localStorage.getItem('datasource-servier::current')
    const localSource = {
      id: 'local',
      url: '/',
      desc: '与本文档同源'
    }
    if (!id) {
      return localSource
    }
    const candicate =  DatasourceService.listDatasourceList().filter(v => v.id == id)
    if (!candicate) {
      return localSource;
    }
    return candicate[0]
  }

  public static setCurrentDatasource(datasource: DatasourceItem) {
    localStorage.setItem('datasource-servier::current', datasource.id)
  }

  public static getDatasourceById(id: string): DatasourceItem {
    const candicate =  DatasourceService.listDatasourceList().filter(v => v.id == id)
    if (!candicate) {
      throw new Error('指定ID的数据源不存在')
    }
    return candicate[0]
  }

  
  /**
   *
   * 测试延迟 并获取该数据源的最后更新时间
   * @static
   * @param {string} id
   * @return {*}  {Promise<[number, string]>} [延迟, 最后更新时间]
   * @memberof DatasourceService
   */
  public static async testDelay(id: string): Promise<[number, string]> {
    const startTime = new Date().getTime();
    const data: StatisticInfo = (await axios.get(DatasourceService.getDatasourceById(id).url + 'info.json')).data
    const endTime = new Date().getTime();
    return [endTime - startTime, data.generateTime];
  }
}

export default DatasourceService