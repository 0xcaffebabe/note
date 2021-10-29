import DatasourceItem from "@/dto/DatasourceItem"
import axios from 'axios'

class DatasourceService {

  public static listDatasourceList():DatasourceItem[] {
    return [
      {
        id: 'local',
        url: '/',
        desc: '与本文档同源'
      },
      {
        id: 'proxy-cf',
        url: '//proxy.ismy.wang/',
        desc: 'cloudflare代理'
      },
      {
        id: 'proxy-cn',
        url: 'http://proxy-cn.ismy.wang/api/',
        desc: '百度云加速'
      },
      {
        id: 'jsdelivr',
        url: '//cdn.jsdelivr.net/gh/0xcaffebabe/note@gh-pages/',
        desc: 'jsdelivr-cdn'
      }
    ]
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

  private static getDatasourceById(id: string): DatasourceItem {
    const candicate =  DatasourceService.listDatasourceList().filter(v => v.id == id)
    if (!candicate) {
      throw new Error('指定ID的数据源不存在')
    }
    return candicate[0]
  }

  public static async testDelay(id: string): Promise<number> {
    const startTime = new Date().getTime();
    await axios.get(DatasourceService.getDatasourceById(id).url + 'SUMMARY.md')
    const endTime = new Date().getTime();
    return endTime - startTime;
  }
}

export default DatasourceService