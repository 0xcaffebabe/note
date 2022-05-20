
import { createRouter, createWebHashHistory, RouteLocationNormalized, RouteRecordRaw } from 'vue-router'
import DocService from '@/service/DocService'

const lastRead = DocService.getLastReadRecord() || 'README'

const routes: RouteRecordRaw[] = [
  { path: "/", redirect: `/doc/${lastRead}` },
  { path: "/home", component: () => import("@/pages/home/HomePage.vue") },
  { path: "/doc/:doc", component: () => import("@/pages/doc/DocPage.vue") },
  { path: "/tag", component: () => import("@/pages/tag/TagListPage.vue") },
  { path: "/ppt/:doc", component: () => import("@/pages/ppt/PptPage.vue") },
  { path: "/cluster", component: () => import("@/pages/DocCluster.vue") },
  { path: "/world", component: () => import("@/pages/doc/knowledge/trend/components/World.vue") },
]
export default function () {
  return createRouter({
    history: createWebHashHistory(),
    routes
  })
}