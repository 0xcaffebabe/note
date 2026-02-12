---
tags: ['中间件', 'Java']
---

# Tomcat

---

# 1. Tomcat 的本质（系统抽象）

Tomcat 本质是一个 **基于 Servlet 规范的请求执行容器**，其核心职责不是“运行 Web 应用”，而是完成以下五类系统功能：

## 1.1 五大核心子系统

| 子系统       | 本质职责                | 对应实现                         |
| --------- | ------------------- | ---------------------------- |
| 网络接入子系统   | 接收 TCP 连接与事件分发      | Endpoint / Acceptor / Poller |
| 协议处理子系统   | HTTP / AJP 协议解析与编码  | Processor / ProtocolHandler  |
| 请求路由子系统   | URL → Servlet 定位    | Mapper                       |
| 执行容器子系统   | Servlet / Filter 调用 | Container 体系                 |
| 生命周期管理子系统 | 组件统一初始化与控制          | Lifecycle                    |
| 资源隔离子系统   | 应用类加载隔离             | ClassLoader 体系               |

## 1.2 系统角色定位

Tomcat 在 Web 系统中承担：

* 协议终止器（HTTP Server）
* 请求路由器（Dispatcher）
* 组件执行容器（Component Runtime）
* 生命周期管理器（Lifecycle Manager）
* 类隔离运行环境（Isolated Runtime）

---

# 2. 系统整体分层架构

Tomcat 的请求处理可抽象为标准服务器执行流水线：

```
Client
  ↓
Socket 接入层
  ↓
协议解析层
  ↓
请求路由层
  ↓
执行管线
  ↓
Servlet 容器
  ↓
响应编码
```

## 2.1 分层职责

| 层   | 核心组件                   | 职责            |
| --- | ---------------------- | ------------- |
| 接入层 | Endpoint               | socket监听、连接管理 |
| 协议层 | Processor              | HTTP解析、请求对象构造 |
| 路由层 | Mapper                 | URL匹配容器       |
| 执行层 | Pipeline / FilterChain | 中间件处理         |
| 组件层 | Servlet                | 业务执行          |
| 编码层 | Processor              | 响应写回          |

---

# 3. 组件层级架构（容器模型）

Tomcat 使用分层容器组织应用。

```
Server
  └─ Service
        ├─ Connector
        └─ Engine
              └─ Host
                    └─ Context
                          └─ Wrapper
```

## 3.1 各层语义

| 层       | 含义        | 系统意义     |
| ------- | --------- | -------- |
| Server  | 进程级运行实例   | 顶层生命周期控制 |
| Service | 请求处理域     | 连接器与容器绑定 |
| Engine  | 虚拟主机调度    | 域名级路由    |
| Host    | 虚拟主机      | 多站点托管    |
| Context | Web应用     | 应用隔离边界   |
| Wrapper | Servlet实例 | 最终执行单元   |

## 3.2 设计模式

| 结构        | 模式   | 目的      |
| --------- | ---- | ------- |
| 容器层级      | 组合模式 | 统一组件管理  |
| Pipeline  | 责任链  | 可扩展请求处理 |
| Lifecycle | 模板方法 | 统一生命周期  |
| Adapter   | 适配器  | 协议与容器解耦 |

---

# 4. 请求执行模型（线程与事件）

Tomcat 默认采用 **事件驱动 + 线程池执行模型**。

## 4.1 线程角色

| 线程       | 职责        |
| -------- | --------- |
| Acceptor | 接收 TCP 连接 |
| Poller   | 监听 IO 事件  |
| Worker   | 执行业务处理    |

## 4.2 执行流程

```
Socket连接
   ↓
Acceptor接收
   ↓
注册Selector
   ↓
Poller监听就绪
   ↓
Worker处理请求
```

## 4.3 I/O 模型

| 模型   | 特点         |
| ---- | ---------- |
| BIO  | 阻塞线程       |
| NIO  | 事件驱动       |
| NIO2 | 异步回调       |
| APR  | Native性能优化 |

---

# 5. 请求路由与执行流水线

请求处理是一个多级函数映射：

```
(socket, protocol, host, path)
      → servlet
```

## 5.1 URL映射过程

```
域名 → Engine
路径前缀 → Host
应用路径 → Context
Servlet路径 → Wrapper
```

## 5.2 执行管线

```
Valve
  ↓
Filter
  ↓
Servlet
```

---

# 6. 生命周期管理系统

所有核心组件均实现 Lifecycle。

## 6.1 状态机

```
NEW
 → INITIALIZED
 → STARTING
 → STARTED
 → STOPPING
 → STOPPED
 → DESTROYED
```

## 6.2 生命周期传播

父容器控制子容器：

```
Server
  → Service
     → Engine
        → Host
           → Context
```

---

# 7. 类加载与应用隔离

Tomcat 通过 **多层类加载器** 实现应用隔离。

## 7.1 类加载结构

```
Bootstrap
   ↓
System
   ↓
Common
   ↓
Catalina
   ↓
Shared
   ↓
WebAppClassLoader
```

## 7.2 设计目标

* 应用隔离
* 热部署
* 共享库复用

## 7.3 双亲委派的可控破坏

WebAppClassLoader 可打破标准委派，原因：

* 允许应用覆盖共享库
* 支持 SPI 机制
* 解决 Servlet 规范需求

---

# 8. Servlet 执行模型

Servlet 执行是容器驱动的函数调用：

```
service(request, response)
```

执行上下文：

* FilterChain
* Session
* ServletContext
* Thread Context ClassLoader

---

# 9. JSP 编译系统

JSP 本质是 **模板到 Java 的编译过程**。

## 9.1 编译阶段

```
JSP → Java → Class → Servlet
```

## 9.2 执行模式

* 首次访问触发编译
* 类加载执行
* 可预编译

---

# 10. 会话管理模型

Session 由 Context 内 Manager 管理。

## 10.1 数据结构

```
ConcurrentHashMap<SessionId, Session>
```

## 10.2 生命周期

* 创建
* 访问更新
* 超时清理

---

# 11. 集群与扩展架构

Tomcat 不提供强一致分布式会话。

## 11.1 三种策略

| 策略        | 特征   |
| --------- | ---- |
| Session复制 | 高开销  |
| 粘性会话      | 负载不均 |
| 外部存储      | 推荐方案 |

推荐架构：

```
LoadBalancer
   ↓
Stateless Tomcat
   ↓
Session Store (Redis)
```

---

# 12. 安全模型

安全控制层次：

1 网络连接控制
2 认证授权
3 传输加密
4 应用隔离
5 安全策略

---

# 13. 性能优化体系

## 13.1 网络层

* keepalive
* 压缩
* 非阻塞IO

## 13.2 线程模型

* Executor共享线程池
* 队列控制

## 13.3 应用层

* 减少对象创建
* 会话最小化
* 缓存

---

# 14. Tomcat 在现代架构中的位置

```
Browser
   ↓
CDN
   ↓
Reverse Proxy
   ↓
Tomcat
   ↓
Application
   ↓
Database
```

---

# 15. 技术演进方向

| 方向            | 说明                  |
| ------------- | ------------------- |
| 阻塞 → 非阻塞      | NIO / Async Servlet |
| 单体 → 云原生      | 容器化部署               |
| 同步 → Reactive | 事件驱动                |
| HTTP1 → HTTP3 | QUIC                |

---

# 16. 总结

Tomcat 本质不是 Web 服务器实现，而是：

**一个协议驱动的组件执行操作系统。**

其核心能力：

* 网络事件处理
* 请求路由
* 组件生命周期管理
* 类加载隔离
* 执行管线扩展

它提供的是：

一个可隔离、可扩展、可管理的 Web 组件运行时环境。

---

## 关联内容（自动生成）

- [/编程语言/JAVA/JakartaEE/Servlet.md](/编程语言/JAVA/JakartaEE/Servlet.md) Servlet规范定义了Java Web容器的标准接口，Tomcat是其重要实现
- [/中间件/web中间件/web中间件.md](/中间件/web中间件/web中间件.md) Web中间件是位于网络协议层与应用业务逻辑层之间的系统软件，Tomcat是其中的Web容器实现
- [/编程语言/JAVA/JVM/类加载机制.md](/编程语言/JAVA/JVM/类加载机制.md) Tomcat的类加载机制基于JVM的类加载体系，实现了Web应用的隔离
- [/计算机网络/http/HTTP.md](/计算机网络/http/HTTP.md) Tomcat作为HTTP服务器，处理HTTP协议的请求和响应
- [/中间件/web中间件/Nginx.md](/中间件/web中间件/Nginx.md) Nginx与Tomcat经常配合使用，Nginx处理静态资源，Tomcat处理动态请求
- [/编程语言/JAVA/高级/NIO.md](/编程语言/JAVA/高级/NIO.md) Tomcat的NIO和NIO2实现基于Java NIO框架，提升并发处理能力
- [/编程语言/JAVA/JAVA并发编程/线程池.md](/编程语言/JAVA/JAVA并发编程/线程池.md) Tomcat使用线程池处理请求，与Java线程池技术密切相关
- [/操作系统/容器化.md](/操作系统/容器化.md) Tomcat应用可通过容器化技术进行部署和管理
- [/编程语言/JAVA/框架/netty/netty.md](/编程语言/JAVA/框架/netty/netty.md) Netty与Tomcat都处理网络请求，但Netty更偏向于底层网络编程框架
- [/软件工程/架构/系统设计/架构设计.md](/软件工程/架构/系统设计/架构设计.md) Tomcat的架构设计体现了分层、组件化等架构思想
