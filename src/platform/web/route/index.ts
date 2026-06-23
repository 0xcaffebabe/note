
import { createRouter, createWebHistory, RouteLocationNormalized, RouteRecordRaw } from 'vue-router'
import DocService from '@/platform/web/service/DocService'
import CategoryService from '@/platform/web/service/CategoryService'
import DocUtils from '@/core/util/DocUtils'
import { recoverDocPath as recoverDocPathPure } from '@/core/routing/recoverDocPath'

// 每次导航时求值: 新访客(无阅读记录)落到首页 老用户续读上次文档
function lastReadRedirect() {
  return () => {
    const lastRead = DocService.getLastReadRecord()
    return lastRead ? DocUtils.docId2HtmlPath(lastRead) : '/home.html'
  }
}

// 判断docId是否存在于文档目录中(目录请求有@cache 不会重复拉取)
async function docIdExists(id: string): Promise<boolean> {
  const categoryList = await CategoryService.getFlatCategoryList()
  return categoryList.some(c => {
    try {
      return DocUtils.docUrl2Id(c.link) == id
    } catch {
      // 个别节点链接异常(decodeURI失败)跳过 与CategoryService目录加载的容错策略一致
      return false
    }
  })
}

// 兜底路由自愈(纯逻辑见 @/core/routing/recoverDocPath): 注入本地 docIdExists 后委托执行,
// 保持 beforeEnter 仍为 (to) => ... 的签名, 行为与内联实现逐字节一致
function recoverDocPath(to: RouteLocationNormalized) {
  return recoverDocPathPure(to, docIdExists)
}

const routes: RouteRecordRaw[] = [
  {
    // 单一响应式路由树(移动端/桌面端共用): 由 App.vue 外壳 + 响应式断点驱动布局, 不再有 /m 分流
    path: "/",
    component: () => import("@/platform/web/App.vue"),
    redirect: lastReadRedirect(),
    children: [
      // 应用页面同样以.html为规范地址 旧的无后缀路径重定向保持兼容
      { path: "/home", redirect: to => ({ path: "/home.html", query: to.query }) },
      { path: "/home.html", component: () => import("@/platform/web/pages/home/HomePage.vue") },
      // 兼容旧的/doc/:doc地址 站内导航与历史外链统一重定向到.html规范地址
      {
        path: "/doc/:doc",
        redirect: to => ({ path: DocUtils.docId2HtmlPath(to.params.doc.toString()), query: to.query })
      },
      { path: "/index.html", redirect: "/" },
      { path: "/tag", redirect: to => ({ path: "/tag.html", query: to.query }) },
      { path: "/tag.html", component: () => import("@/platform/web/pages/tag/TagListPage.vue") },
      // 浏览总目录: 由 category.json 结构化驱动(取代旧的跳 /README.html); 须在贪婪的 /:docPath(.*\.html) 之前
      { path: "/catalog", redirect: to => ({ path: "/catalog.html", query: to.query, hash: to.hash }) },
      { path: "/catalog.html", component: () => import("@/platform/web/pages/catalog/CatalogPage.vue") },
      { path: "/cluster", redirect: to => ({ path: "/cluster.html", query: to.query, hash: to.hash }) },
      { path: "/cluster.html", component: () => import("@/platform/web/pages/DocCluster.vue") },
      // .html静态化入口 /运维/Docker.html -> 文档页
      {
        path: "/:docPath(.*\\.html)",
        component: () => import("@/platform/web/pages/doc/DocPage.vue"),
        // 文档页移动端有底部操作栏(目录/搜索), 顶栏据此隐藏重复入口
        meta: { hasBottomBar: true },
      },
    ]
  },
  // 兜底404: 未匹配任何路由的路径不再渲染空白 进入前先尝试自愈乱码/无后缀文档路径
  {
    path: "/:pathMatch(.*)*",
    beforeEnter: recoverDocPath,
    component: () => import("@/platform/web/pages/NotFound.vue")
  }
]
export default function () {
  const router = createRouter({
    history: createWebHistory(),
    routes,
    // 文档页有自己的滚动恢复(阅读进度/headingId定位在异步渲染后执行) 路由层只兜底通用情形:
    // 后退/前进还原浏览器记忆位置 换页回顶 同路径仅query/hash变化(目录锚点跳转)不干预
    scrollBehavior(to, from, savedPosition) {
      if (savedPosition) {
        return savedPosition
      }
      if (to.path == from.path) {
        return
      }
      return { top: 0, behavior: 'instant' as ScrollBehavior }
    }
  })
  // 历史移动端 /m 前缀地址合流到单一路由树: 在匹配前去前缀, 规避 /:docPath(.*\.html)
  // 贪婪匹配吃掉 /m/ 段导致重定向落空; 去后缀的 /m/x 落到 /x 再由 catch-all 自愈补回 .html
  // to.path 为百分号编码: 先 decodeURI 再去前缀, 交回 router 单次编码, 避免双重编码
  router.beforeEach(to => {
    if (to.path === '/m' || to.path === '/m/') {
      return { path: '/', query: to.query, hash: to.hash, replace: true }
    }
    if (to.path.startsWith('/m/')) {
      let decoded: string
      try {
        decoded = decodeURI(to.path)
      } catch {
        decoded = to.path
      }
      return { path: decoded.slice(2), query: to.query, hash: to.hash, replace: true }
    }
  })
  return router
}
