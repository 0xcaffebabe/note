import {createApp} from 'vue'
import App from './App.vue'
import createRouter from './route'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.less'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import axios from 'axios'
import createStore from '@/store'

const app = createApp(App)

app.use(ElementPlus)
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

app.use(router)
app.mount('#app')
