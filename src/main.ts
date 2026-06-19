import {createApp} from 'vue'
import App from './Main.vue'
import createRouter from './route'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './style.less'
import NProgress from '@/util/NProgress'
import createStore from '@/store'
import { isMobile } from '@/composables/useBreakpoint'
import { registerSW } from 'virtual:pwa-register';
import { h } from 'vue'
import { ElNotification } from 'element-plus'
import 'element-plus/es/components/notification/style/css'

const updateSW = registerSW({
  immediate: true,
  // 有新版本时在右下角轻提示 不阻断当前操作 由用户决定何时刷新
  onNeedRefresh() {
    const notification = ElNotification({
      title: '站点内容有更新',
      type: 'info',
      position: 'bottom-right',
      // 不自动消失 但可手动关闭(关闭即"稍后")
      duration: 0,
      offset: 70,
      message: h('div', null, [
        h('span', null, '刷新后即可查看最新内容 '),
        h('a', {
          style: 'color: var(--el-color-primary); cursor: pointer; font-weight: 600; margin-left: 4px;',
          onClick: () => {
            notification.close()
            updateSW(true)
          },
        }, '立即刷新'),
      ]),
    })
  },
  onOfflineReady() {
    ElNotification({
      title: '已缓存完成, 支持离线访问',
      type: 'success',
      position: 'bottom-right',
      duration: 3000,
      offset: 70,
    })
  },
});

// —— 发版后旧 chunk 失效自愈 ——
// 旧版页面挂起期间发新版, 旧 hash chunk 在服务器被删, 此后任何动态 import
// (路由懒加载 / 组件内 import / defineAsyncComponent)都会 404, 表现为"点击无反应"。
// Vite 所有动态 import 都经 __vitePreload, 失败时派发 vite:preloadError, 这里统一兜底。
const CHUNK_RELOAD_AT = 'chunkReloadAt'
window.addEventListener('vite:preloadError', async (event) => {
  event.preventDefault() // 接管恢复, 抑制未捕获 rejection 噪声

  const last = Number(sessionStorage.getItem(CHUNK_RELOAD_AT) || 0)
  // 10s 内已因同样原因刷过且仍失败 => 不是发版陈旧而是真断网/缺资源, 停手避免死循环
  if (Date.now() - last < 10_000) {
    ElNotification({
      title: '部分内容加载失败',
      message: '请检查网络后手动刷新重试',
      type: 'warning',
      position: 'bottom-right',
      duration: 0,
      offset: 70,
    })
    return
  }
  sessionStorage.setItem(CHUNK_RELOAD_AT, String(Date.now()))

  // 关键: registerType 'prompt' 下旧 SW 仍从预缓存返回旧 index.html, 裸 reload 会拿到
  // 旧 chunk 引用形成死循环; 故先激活等待中的新 SW(拿到新 index.html 与新 chunk 名)再刷新。
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    await reg?.update() // 主动拉取最新 SW
    await updateSW(true) // 有 waiting SW 则 skipWaiting + 整页刷新
  } catch {
    /* 落到下面兜底 */
  }
  setTimeout(() => location.reload(), 2000) // SW 未切换(无 waiting)时的兜底刷新
})

// 兼容旧的hash路由链接(/#/doc/xxx): 路由启动前改写为history模式地址
if (location.hash.startsWith('#/')) {
  history.replaceState(history.state, '', location.hash.substring(1))
}

const app = createApp(App)

// 全局变量: $isMobile() 读取响应式断点 .value，模板内调用即被 render 追踪，
// 视口跨断点时自动重渲染(取代旧的非响应式 SysUtils.isMobile)
app.config.globalProperties.$isMobile = () => isMobile.value

app.use(createStore())
const router = createRouter()


// 屏幕顶端进度条: 一次逻辑导航最多占用一个pending
// 守卫重定向(自愈/移动端跳转)会让beforeEach触发多次而afterEach只触发一次
// 守卫异常/懒加载chunk失败则只触发onError 不配对会让pending永不归零 进度条永驻
let navInProgress = false
router.beforeEach((to, from, next) => {
  if (!navInProgress) {
    navInProgress = true
    NProgress.start()
  }
  next()
})
const finishNav = () => {
  if (navInProgress) {
    navInProgress = false
    NProgress.done()
  }
}
router.afterEach(finishNav)
router.onError(finishNav)
// 屏幕顶端进度条结束

app.use(router)
app.mount('#app')

// 应用接管后移除静态直出的正文(文档.html的即时首屏层)
document.querySelector('body > .static-content')?.remove()
