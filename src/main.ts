import {createApp} from 'vue'
import App from './Main.vue'
import createRouter from './route'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './style.less'
import NProgress from '@/util/NProgress'
import createStore from '@/store'
import { SysUtils } from './util/SysUtils'
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

// 兼容旧的hash路由链接(/#/doc/xxx): 路由启动前改写为history模式地址
if (location.hash.startsWith('#/')) {
  history.replaceState(history.state, '', location.hash.substring(1))
}

const app = createApp(App)

// 全局变量
app.config.globalProperties.$isMobile = SysUtils.isMobile

app.use(createStore())
const router = createRouter()


// 屏幕顶端进度条开始
router.beforeEach((to, from, next) => {
  NProgress.start()
  next()
})
router.afterEach(() => {
  NProgress.done()
})

// 屏幕顶端进度条结束

app.use(router)
app.mount('#app')

// 应用接管后移除静态直出的正文(文档.html的即时首屏层)
document.querySelector('body > .static-content')?.remove()
