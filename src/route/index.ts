
import { createRouter, createWebHistory, RouteLocationNormalized, RouteRecordRaw } from 'vue-router'
import DocService from '@/service/DocService'
import CategoryService from '@/service/CategoryService'
import DocUtils from '@/util/DocUtils'
import UrlUtils from '@/util/UrlUtils'
import { SysUtils } from '@/util/SysUtils'

// 每次导航时求值: 新访客(无阅读记录)落到首页 老用户续读上次文档
function lastReadRedirect(prefix: string = '') {
  return () => {
    const lastRead = DocService.getLastReadRecord()
    return lastRead ? prefix + DocUtils.docId2HtmlPath(lastRead) : prefix + '/home.html'
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

/**
 * 兜底路由自愈: CDN(Cloudflare Pages)对/xxx.html强制308重定向去掉后缀 且Location头
 * 未按RFC-3986编码中文路径(原始UTF-8字节被浏览器按Latin-1误读) 刷新/直接访问文档页
 * 会落到 /%C3%A8%C2%BD%C2%AF... 这样的乱码无后缀路径
 * 进入404前先尝试: 修复Latin-1双重编码 + 为真实存在的文档补回.html 修复不了才展示404
 */
async function recoverDocPath(to: RouteLocationNormalized) {
  let path: string
  try {
    path = decodeURIComponent(to.path)
  } catch {
    // 含原始'%'的非法路径无从判定 直接进404
    return true
  }
  const repaired = UrlUtils.repairLatin1Mojibake(path)
  path = repaired || path
  const mobilePrefix = path.startsWith('/m/') ? '/m' : ''
  let docPath = path.substring(mobilePrefix.length)
  if (!/\.html$/i.test(docPath)) {
    docPath = docPath.replace(/\/+$/, '') + '.html'
  }
  try {
    if (!await docIdExists(DocUtils.htmlUrl2Id(docPath))) {
      return true
    }
  } catch {
    // 目录加载失败(离线/网络异常)时无从校验 仅在确认乱码特征时仍然跳转
    if (!repaired) {
      return true
    }
  }
  // 乱码重定向同样会污染query值(如headingId) 一并修复
  const fixValue = (v: any) => typeof v == 'string' ? (UrlUtils.repairLatin1Mojibake(v) || v) : v
  const query = Object.fromEntries(Object.entries(to.query)
    .map(([k, v]) => [k, Array.isArray(v) ? v.map(fixValue) : fixValue(v)]))
  return { path: mobilePrefix + docPath, query, hash: to.hash, replace: true }
}

function tablet2Mobile(to: RouteLocationNormalized, from: RouteLocationNormalized, next: Function) {
  if (SysUtils.isMobile()) {
    next("/m" + to.fullPath)
  }else {
    next()
  }
}
function mobile2Tablet(to: RouteLocationNormalized, from: RouteLocationNormalized, next: Function) {
  if (!SysUtils.isMobile()) {
    next(to.fullPath.replace("/m", ''))
  }else {
    next()
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("@/App.vue"),
    redirect: lastReadRedirect(),
    beforeEnter: tablet2Mobile,
    children: [
      // 应用页面同样以.html为规范地址 旧的无后缀路径重定向保持兼容
      { path: "/home", redirect: to => ({ path: "/home.html", query: to.query }) },
      { path: "/home.html", component: () => import("@/pages/home/HomePage.vue") },
      // 兼容旧的/doc/:doc地址 站内导航与历史外链统一重定向到.html规范地址
      {
        path: "/doc/:doc",
        redirect: to => ({ path: DocUtils.docId2HtmlPath(to.params.doc.toString()), query: to.query })
      },
      { path: "/index.html", redirect: "/" },
      { path: "/tag", redirect: to => ({ path: "/tag.html", query: to.query }) },
      { path: "/tag.html", component: () => import("@/pages/tag/TagListPage.vue") },
      { path: "/cluster", component: () => import("@/pages/DocCluster.vue") },
      // .html静态化入口 /运维/Docker.html -> 文档页
      {
        path: "/:docPath(.*\\.html)",
        component: () => import("@/pages/doc/DocPage.vue"),
        beforeEnter: tablet2Mobile
      },
    ]
  },
  {
    path: '/m',
    // 共用同一响应式外壳(取代已退役的 MobileApp.vue); /m 子树将在路由合流阶段整体删除
    component: () => import("@/App.vue"),
    redirect: lastReadRedirect('/m'),
    children: [
      { path: "/m/home", redirect: to => ({ path: "/m/home.html", query: to.query }) },
      { path: "/m/home.html", component: () => import("@/pages/home/mobile/MobileHomePage.vue"), beforeEnter: mobile2Tablet },
      {
        path: "/m/doc/:doc",
        redirect: to => ({ path: '/m' + DocUtils.docId2HtmlPath(to.params.doc.toString()), query: to.query })
      },
      { path: "/m/tag", redirect: to => ({ path: "/m/tag.html", query: to.query }) },
      { path: "/m/tag.html", component: () => import("@/pages/tag/TagListPage.vue"), beforeEnter: mobile2Tablet },
      {
        // 已折叠为单一响应式 DocPage(取代 MobileDocPage); /m 子树将在路由合流阶段(P5)整体删除
        path: "/m/:docPath(.*\\.html)",
        component: () => import("@/pages/doc/DocPage.vue"),
        beforeEnter: mobile2Tablet
      },
    ]
  },
  // 兜底404: 未匹配任何路由的路径不再渲染空白 进入前先尝试自愈乱码/无后缀文档路径
  {
    path: "/:pathMatch(.*)*",
    beforeEnter: recoverDocPath,
    component: () => import("@/pages/NotFound.vue")
  }
]
export default function () {
  return createRouter({
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
}
