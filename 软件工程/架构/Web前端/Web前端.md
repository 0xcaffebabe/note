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

## 三层结构

### 结构层

XML -> HTML -> HTML5

DOCTYPE：指示浏览器使用哪个HTML版本编写的指令进行解析

语义化标签：语义化标签帮助人更容易理解

AMP HTML：提升页面资源载入效率的规范

Shadow DOM：用来支持实现Web Component，如video标签等，其不会被外界的css或者js所影响

### 浏览器脚本

ES5 -> CoffeScript -> ES6 -> TS

### 表现层

CSS

CSS统一处理：

- reset：清除所有元素默认样式
- normalize：为所有元素增加默认样式
- neat：上面两种方式的组合

CSS预处理：sass less ...

一个良好的预处理器的功能：

- 变量声明计算
- 语法表达式 if-else for
- 函数处理
- 属性继承
- 兼容性补全 自动添加浏览器私有前缀

动画实现：

- js实现：由于频繁重绘 非常消耗性能
- SVG动画：比js实现功能会更丰富 但一旦复杂起来 仍会影响性能
- CSS3 transition：只能实现过渡变化
- CSS3 animation：脱离JS 可以硬件加速 复杂动画也能应付
- Canvas 动画：本质是通过js控制标签来实现

### 响应式页面

- 基于UA跳转
- 基于媒体查询响应式

#### 结构层响应式

- 结构层数据响应式
  - 在前端判断不同端加载不同的数据
- 后端数据响应式
  - 后端渲染时直接判断 差别渲染
- 结构层媒体查询
  - 根据不同的屏幕渲染不同的图片 节省流量
  - Picture 可以包含多个图片 自动进行选择（Polyfill）
  - 后端模板判断渲染不同图片
  - CDN

#### 表现层响应式

- 响应式布局：栅格布局
- 屏幕适配布局：viewport
  - 控制zoom
  - REM适配

#### 行为层响应式

- 通过js进行判断执行不同脚本
- 后端判断直接渲染不同脚本

## 现代前端交互框架

### 直接DOM操作

随着AJAX技术的发展 在DOM操作上面也越来越复杂

这个时期的代表性框架就是jQuery，其主要功能就是封装了浏览器的DOM API

### MV*交互

- 前端MVC

通过将组件的数据及行为划分到 M V C 来进行管理，由系统统一来控制

![屏幕截图 2020-12-04 092957](/assets/屏幕截图%202020-12-04%20092957.png)

- 前端MVP

使用P来处理逻辑 M 和 V 只反映视图和数据

![屏幕截图 2020-12-04 093202](/assets/屏幕截图%202020-12-04%20093202.png)

各个部位职责更清晰 但是P的内容变得很重

- 前端MVVM

自动化的MVP 使用ViewModel 替代 P，这样数据的变化就会自动影响到识图 反之亦然

#### 数据更新检测

- 手动触发更新
- 脏检测机制：当ViewModel的某个值发生变化时找到其相关联的所有元素 然后比较更新
- 前端数据对象劫持：通过Object.defineProperies来监听get和set，当发生变化 则需要运行相对应节点的指令
- ES6 Proxy：实现效果跟上面一样

### Virtual DOM交互

通过新建一个虚拟的DOM数据结构 并将其与真实DOM对比 找出差异部分进行更新

![屏幕截图 2020-12-04 095325](/assets/屏幕截图%202020-12-04%20095325.png)

#### 核心实现

- 将真实DOM转换为虚拟DOM：

自己解析HTML而非使用DOM API来生成

- 对比虚拟DOM

使用多叉树遍历算法 DFS或者BFS 遍历过程中需要记录节点改变的内容、差异化改变的类型及位置（在哪里增加、删除等）

### 前端MNV*

Model Native View *

JS调用原生控件或者事件绑定
