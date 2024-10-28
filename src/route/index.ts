
import { createRouter, createWebHashHistory, RouteLocationNormalized, RouteRecordRaw } from 'vue-router'
import DocService from '@/service/DocService'
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
    redirect: `/doc/${lastRead}`, 
    beforeEnter: tablet2Mobile, 
    children: [
      { path: "/home", component: () => import("@/pages/home/HomePage.vue") },
      { 
        path: "/doc/:doc", 
        component: () => import("@/pages/doc/DocPage.vue"), 
        beforeEnter: tablet2Mobile
      },
      { path: "/tag", component: () => import("@/pages/tag/TagListPage.vue") },
      { path: "/cluster", component: () => import("@/pages/DocCluster.vue") },
    ] 
  },
  {
    path: '/m',
    component: () => import("@/MobileApp.vue"),
    redirect: `/m/doc/${lastRead}`, 
    children: [
      { path: "/m/home", component: () => import("@/pages/home/mobile/MobileHomePage.vue"), beforeEnter: mobile2Tablet },
      { 
        path: "/m/doc/:doc", 
        component: () => import("@/pages/doc/mobile/MobileDocPage.vue"),
        beforeEnter: mobile2Tablet
      },
      { path: "/m/tag", component: () => import("@/pages/tag/TagListPage.vue"), beforeEnter: mobile2Tablet },
    ]
  }
]
export default function () {
  return createRouter({
    history: createWebHashHistory(),
    routes
  })
}