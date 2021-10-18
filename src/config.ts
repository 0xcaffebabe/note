export default {
  // 站点名称
  siteName: 'my-book',
  // 仓库地址 用于更改、编辑等的跳转
  repositoryUrl: 'https://github.com/0xcaffebabe/note',
  // 左上方链接路由
  navMenu: [
    {
      title: '架构',
      router: '/doc/软件工程-架构-架构'
    },
    {
      title: '软件设计',
      children: [
        {
          title: '设计模式',
          router: '/doc/软件工程-设计模式-设计模式'
        }
      ]
    },
    {
      title: '外链',
      children: [
        {
          title: 'Github',
          url: 'https://github.com/0xcaffebabe'
        },
        {
          title: '博客',
          url: 'https://www.ismy.wang/'
        }
      ]
    }
  ]
}