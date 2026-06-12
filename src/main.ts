import {createApp} from 'vue'
import App from './Main.vue'
import createRouter from './route'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './style.less'
import NProgress from '@/util/NProgress'
import createStore from '@/store'
import { SysUtils } from './util/SysUtils'
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });

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

window.addEventListener('orientationchange', () => location.reload())

app.use(router)
app.mount('#app')
