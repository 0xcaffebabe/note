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

### 浏览器Web安全

- X-XSS-Protection
  - 控制浏览器对反射型XSS的防护
- Strict-Transport-Security
  - 强制所有通信使用HTTPS
- Content-Security-Policy
  - 控制浏览器只信任来自指定源的内容
- Access-Control-Allow-Origin

## 前端与协议

- HTTP

### 实时协议

- WebSocket
- Poll（轮询）：实时性差 影响性能
- Long-poll（长轮询）：比上面好一点
- 前端DDP（分布式数据协议）
  - meteor：服务端-客户端双向数据更新

### Native交互协议

混血应用特性：

- 可用系统资源少
- 浏览器内核支持较新的特性
- 可实现离线应用
- 机型兼容（屏幕兼容）
- 支持与Native交互

Web到Native协议调用：

- 通过URI
  - Web应用通过发起一个URI请求 Native会进行捕获
- addJavascriptInterface
  - Native会注入一个全局对象给Web调用

Native到Web：

- Native通过loadURL调用Web暴露的全局对象或者方法

#### JSBridge协议规范

- Native注册一个自定义JSBridge Schema头
  - 协议URL由几部分组成：欲被调用的类名、回调方法、欲被调用的方法、json对象（调用方法的参数）
