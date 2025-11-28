import {createApp} from 'vue'
import App from './Main.vue'
import createRouter from './route'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './style.less'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import axios from 'axios'
import createStore from '@/store'
import { SysUtils } from './util/SysUtils'
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });

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

axios.interceptors.request.use(config => {
  NProgress.start()
  return config
})
axios.interceptors.response.use(config => {
  NProgress.done()
  return config
}, error => {
  NProgress.done()
  return Promise.resolve(error)
})
// 屏幕顶端进度条结束

window.addEventListener('orientationchange', () => location.reload())

app.use(router)
app.mount('#app')
