
import { createRouter, createWebHistory, RouteLocationNormalized, RouteRecordRaw } from 'vue-router'
import DocService from '@/service/DocService'
import DocUtils from '@/util/DocUtils'
import { SysUtils } from '@/util/SysUtils'

const lastRead = DocService.getLastReadRecord() || 'README'

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
    redirect: () => DocUtils.docId2HtmlPath(lastRead),
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
    component: () => import("@/MobileApp.vue"),
    redirect: () => '/m' + DocUtils.docId2HtmlPath(lastRead),
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
        path: "/m/:docPath(.*\\.html)",
        component: () => import("@/pages/doc/mobile/MobileDocPage.vue"),
        beforeEnter: mobile2Tablet
      },
    ]
  }
]
export default function () {
  return createRouter({
    history: createWebHistory(),
    routes
  })
}
