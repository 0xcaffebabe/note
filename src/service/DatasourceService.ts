import DatasourceItem from "@/dto/DatasourceItem"


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
        desc: 'cloudflare 代理'
      },
      {
        id: 'proxy-cn',
        url: 'http://proxy-cn.ismy.wang/api/',
        desc: '百度云加速'
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
}

export default DatasourceService