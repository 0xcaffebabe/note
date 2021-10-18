
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: "/", component: () => import("@/pages/home/HomePage.vue") },
  { path: "/wc", component: () => import("@/pages/WordCloud.vue") },
  { path: "/doc/:doc", component: () => import("@/pages/doc/DocPage.vue") },
]
export default function () {
  return createRouter({
    history: createWebHistory(),
    routes
  })
}