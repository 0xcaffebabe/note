
import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: "/", component: () => import("@/pages/home/HomePage.vue") },
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