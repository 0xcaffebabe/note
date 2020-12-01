# Web前端

![屏幕截图 2020-12-01 155259](/assets/屏幕截图%202020-12-01%20155259.png)

## 浏览器组成

### 渲染引擎

解析HTML构建DOM树 -> 构建渲染树 -> 渲染树布局阶段 -> 绘制渲染树

页面生成后 如果页面元素位置发生变化 就要从布局阶段开始重新渲染

- HTML解析
- CSS解析

### 持久化存储机制

- HTTP缓存
- localSorage：单个域下存放容量有限
- sessionStorage：浏览器关闭自动清空
- Cookie
  - sessionCookie
  - HTTP only
- WebSQL：特定浏览器的特性
- IndexDB：NoSQL类型的数据库 大小限制50M
- Application Cache
  - 渐渐废弃 使用ServiceWorkers替代
- cacheStorage
  - ServiceWorker规范中的Cache对象
- Flash缓存
