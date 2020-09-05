# Tomcat

## 目录结构

![屏幕截图 2020-08-26 141912](/assets/屏幕截图%202020-08-26%20141912.png)

## 部署方式

- 直接将项目放到webapps目录下
- 配置conf/server.xml文件

  ```
  在<Host>标签体中配置
                    <Context docBase="D:\hello" path="/hehe" />
                     docBase:项目存放的路径
                     path：虚拟目录
  ```

- 在conf\Catalina\localhost创建任意名称的xml文件。在文件中编写

  ```
  <Context docBase="D:\hello" />
  ```

  - 虚拟目录：xml文件的名称

**JAVA WEB项目目录结构**

- 项目的根目录
  - WEB-INF目录：
    - web.xml：web项目的核心配置文件
    - classes目录：放置字节码文件的目录
    - lib目录：放置依赖的jar包

## 架构

整体设计：

![屏幕截图 2020-08-26 143148](/assets/屏幕截图%202020-08-26%20143148.png)

- Connector负责连接的建立以及数据返回
- Container(Engine)负责请求的具体处理
- Service 负责维护Conenctor与Container之间的映射关系

Container设计：

![屏幕截图 2020-08-26 144406](/assets/屏幕截图%202020-08-26%20144406.png)

- Engine：Container的具体实现
- Host：以域名为主的一个虚拟主机
- Wrapper：代表Servlet实例
- Context：代表一个独立的web应用
- PipeLine：各个组件之间传递消息的管道

Connector设计：

![屏幕截图 2020-08-26 144755](/assets/屏幕截图%202020-08-26%20144755.png)

- Endpoint负责监听连接，将连接交给Processor处理
- Processor再将请求映射到Container

Executor：

共享线程池由Service维护

外部依赖 Bootstrap和Catalina：

Bootstrap启动Cataina Catalina启动Server 实现了Bootstrap 与 Server进行解耦

### 启动流程

![屏幕截图 2020-08-26 145611](/assets/屏幕截图%202020-08-26%20145611.png)

### 请求处理

![屏幕截图 2020-08-26 145856](/assets/屏幕截图%202020-08-26%20145856.png)

总体流程：

- `CoyoteAdapter.service`
  - 请求映射：`CoyoteAdapter.postParseRequest`
  - 调用容器：`connector.getService().getContainer().getPipeline().getFirst().invoke(request, response)`

Catalina请求处理：

![屏幕截图 2020-08-27 145924](/assets/屏幕截图%202020-08-27%20145924.png)

### 类加载器

![屏幕截图 2020-08-26 150126](/assets/屏幕截图%202020-08-26%20150126.png)

通过每个app使用自己的类加载器来达到：

- 隔离：不同的app依赖类库不会相互影响
- 灵活：重新部署时的问题

对于Web 应用类加载器，它的加载顺序：

- 从缓存加载
- 如果缓存没有 从JVM的Bootstrap类加载器加载 （防止JAVA SE核心类被覆盖）
- 如果还是没有 从当前类加载器加载 （如果开启委托 则会遵循JVM双亲委托模型）
- 还没有 再从父类加载器加载

## Catalina

- Servlet容器
- Digester : XML解析工具

### Server 创建

- 解析Server：`Catalina.createStartDigester`
- 解析Engine：`EngineRuleSet.addRuleInstances`
- 解析Host：`HostRuleSet.addRuleInstances`
- 解析Context：`ContextRuleSet.addRuleInstances`

### Web应用启动流程

![屏幕截图 2020-08-26 153133](/assets/屏幕截图%202020-08-26%20153133.png)

StandardHost：

- 从server.xml配置加载
- 或者扫描webapps目录加载

HostConfig：

- START_EVENT事件：会根据context描述文件或者对webapps目录下war包目录等部署应用 调用`deployApps()`
- PERIODIC_EVENT事件：检查文件是否发生变更 是则重新部署(之前不存在的应用)或者重新加载(之前存在的应用)

StandardContext：

应用初始化及启动

ContextConfig：

- AFTER_INIT_EVENT事件：加载Context配置文件
- BEFORE_START_EVENT事件：处理docBase(应用所在文件夹)问题
- CONFIGURE_START_EVENT：初始化操作, 解析XML配置文件(或者扫描目录 使用注解的方式) 创建 Servlet Filter等组件

StandardWrapper：

- 根据配置load servlet 以及对 servlet 初始化

### Context的命名与请求路径映射

![屏幕截图 2020-08-26 160757](/assets/屏幕截图%202020-08-26%20160757.png)

### Catalina 自带的 Servlet

- DefaultServlet：处理静态资源 处理目录请求
  - 可配参数：<https://tomcat.apache.org/tomcat-7.0-doc/default-servlet.html>
- JspServlet:编译jsp文件 处理jsp请求

## Coyote

- 请求连接器的实现

支持的传输协议：

- HTTP1.1
- HTTP2.0
- AJP1.3

支持的IO方案：

- NIO
- NIO2
- APR

HTTP 配置：

```xml
<!-- server.xml -->
<Connector executor="tomcatThreadPool"
               port="8080" protocol="HTTP/1.1"
               connectionTimeout="20000"
               redirectPort="8443" />

<!-- 使用NIO方式处理HTTP1.1 -->
<Connector port="8443" protocol="org.apache.coyote.http11.Http11NioProtocol"
               maxThreads="150" SSLEnabled="true">
<!-- 
  maxThreads:指定Connector创建请求处理线程的最大数
  maxSpareThreads：允许空闲线程的最大数
  minSpareThreads
  tcpNoDelay：禁止TCP通过批量发送数据来提高网络利用率
  maxKeepAliveRequest: 最大keepalive的连接数
  socketBuffer
  enableLookups：是否开启request.getRemoteHost() DNS查询
 -->
```

### 概念

- Endpoint 通信端点 负责Socekt接收处理
- Porcessor 负责创建请求和响应 将请求转发到Catalina
- ProtocolHandler 封装Endpoint Processor
- UpgradeProtocol 处理HTTP协议的升级协议

### 请求流程

![屏幕截图 2020-08-27 152428](/assets/屏幕截图%202020-08-27%20152428.png)

### AJP

```xml
<!-- server.xml -->
<Connector protocol="AJP/1.3"
               address="::1"
               port="8009"
               redirectPort="8443" />
```

>AJP（Apache JServ Protocol）是定向包协议。因为性能原因，使用二进制格式来传输可读性文本。WEB服务器通过 TCP连接 和 SERVLET容器连接

包结构：

![屏幕截图 2020-08-27 154533](/assets/屏幕截图%202020-08-27%20154533.png)

有效载荷的前一个字节代表类型

![屏幕截图 2020-08-27 155233](/assets/屏幕截图%202020-08-27%20155233.png)

请求处理：

![屏幕截图 2020-08-27 155429](/assets/屏幕截图%202020-08-27%20155429.png)

## Jasper

使用单独的类加载器

### 编译方式

运行时编译：

![屏幕截图 2020-09-03 144855](/assets/屏幕截图%202020-09-03%20144855.png)

编译结果：

- 首选存放在 context-param 的scratchdir
- 否则是 $CATALINA_BASE/work/Engine名称/Host名称/Context名称
- 再否则在系统临时文件目录下

预编译：

jspc

### 编译原理

```java
// 继承该类
class index_jsp extends HttpJspBase
```

```java
private static final JspFactory _jspxFactory = JspFactory.getDefaultFactory();
private static Map<String, Long> _jspx_dependants; // 依赖的外部资源
private static final Set<String> _jspx_imports_packages = new HashSet(); // 导入的包
private static final Set<String> _jspx_imports_classes; // 导入的类
```

`_jspService` 处理请求：

- 定义了out pageContext session application config page 等局部变量
- 对于静态内容调用out.write
- 处理jsp标签

![屏幕截图 2020-09-03 152717](/assets/屏幕截图%202020-09-03%20152717.png)

## 配置管理

### JVM配置

```bat
:: JVM启动参数
set "JAVA_OPTS=%JAVA_OPTS% %JSSE_OPTS%"
```

系统属性：略

### 服务器配置

catalina.properties: 容器启动阶段的配置

server.xml: 服务器核心配置

- Server
- Service
- Executor 线程池配置 默认其他组件会创建自己的线程池

  ```xml
  <Executor name="tomcatThreadPool" namePrefix="catalina-exec-"
          maxThreads="150" minSpareThreads="4"/>
  ```
- Connector 默认配置了两个 HTTP 和 AJP
  ```xml
  <Connector port="8080" -- 监听端口
  executor="sharedThreadPool" -- 线程池
  enableLookups="false" -- 调用request.getRemoteHost 是否调用DNS解析获取主机名
  redirectPort="8443" -- SSL 转发端口
  acceptCount="100"  -- 控制 socket 排队连接的最大数
  connectionTimeout="2000o" -- Connector 接收连接处理的超时时间
  URIEncoding="UTF-8" -- 解码URI的编码
  compression="on" -- 开启压缩
  compressionMinSize="2048" -- 最小压缩尺寸
  noCompressionUserAgents="gozilla,traviata" -- 符合表达式的UA头不压缩
  compressableMimeType="text/html,text/xml,text/javascript,text/css,text/plain" />
  ```
- Engine 可以指定虚拟主机
- Host
  - name 域名
  - appBase 存放应用的目录
  - unpackWARs 是否解压war包
  - autoDeploy 定期检测 自动部署
  - Alias 可以配置新的域名
- Context
  - docBase 具体应用的目录
  - path Context路径
- CookieProcessor 指定cookie处理器
- Loader 用于管理 web 应用的类加载器
  - delegate 属性可以打破双亲委派模型
  - reloadable 属性会监控资源变化后重新加载应用
  - loaderClass 指定类加载器的具体实现
- Manger 会话管理器
  - Standard和Presistent
- Resources 资源共享
  ```xml
  <Context docBase="myApp" path=" /myApp">
    <Resources>
      <PreResources
      className='org.apache.catalina.webresources.FileResourceSet'
      base=" /Users/liuguangrui/Documents/sample/app.jsp"
      webAppMount=" /app/app.jsp"/>
    </Resources>
  </Context>
  ```
- JarScanner
- content.xml

### Web 应用配置

- context-param: ServerContext.getInitParameter() 可以获取到的参数
- session-config 会话配置
  - 三种追踪模式 COOKIE URL SSL
- servlet 声明servlet及其映射
- listener
- filter
- mime-mapping 映射文件类型与对应的content-type
- welcome-file-list
- error-page
- locale-encoding-mapping-list 本地化与响应编码的关系
- 安全配置
- jndi配置

### 内置的 Filter

- CorsFilter：解决跨域问题
- CsrfPreventionFilter：防止CSRF攻击
- ExpiresFilter：控制缓存过期与否
- FailedRequestFilter：解析参数失败就返回错误
- RemoteAddrFilter：只放行符合特定表达式的IP地址
- RemoteHostFilter：只放行符合特定表达式的主机
- RemoteIpFilter：前方有负载均衡器的情况下 将getRemoteAddr()替换为 X-Forwarded-For 中的IP
- RequestDumperFilter：以日志形式输出请求和响应对象 主要用于调试
- SetCharacterEncodingFilter：设置请求编码

### Tomcat 管理

`/host-manager/html`

## 集群

![屏幕截图 2020-09-04 111658](/assets/屏幕截图%202020-09-04%20111658.png)

Tomcat 本身就不适合配置集群 一种通用的解决方案是 接入层为 Nginx

Nginx 对后端的Tomcat进行负载均衡 

Tomcat上的Web应用最好是设计成无状态的 如果仍然需要保持会话 最好使用一台独立的服务器来存储会话 比如 Redis 

而不要使用Tomcat的会话同步功能

## 安全

安装部署：下载安全 移除自带的几个Web应用

server.xml: 

- 删除不必要的连接器
- 删除UserDatabase
- 修改关键配置：8005管理端口
- 避免恶意web应用的自动启动：autoDeploy
- 允许有限的客户端访问
- 避免将异常堆栈打印到客户端
- listing会导致目录泄漏以及DoS攻击

应用安全

传输安全(SSL)

JAVA安全策略

## 优化

### JVM 优化

### Tomcat 配置优化

server.xml:

- 链接器maxConnections 属性：超过该属性的连接会被阻塞
- tcpNoDelay：禁止TCP缓存并发送
- maxKeepAliveRequest
- socketBuffer
- enableLookups

网络传输优化：

- 静态文件压缩
- 高性能链接器(NIO NIO2)
- 禁用自动部署

JSP页面配置(web.xml):

- development 设置为false 不自动检测JSP页面变动
- ...

继承 web 服务器：

- 动静分离
- 负载均衡

### 应用优化

- 减少通信次数
- 减少通信数据流
- 推迟会话创建
- 不在会话存储大对象
- 合理定义对象作用域
- 使用连接池提高性能
- 使用缓存提高性能
- 最小化日志

## 附加功能

- 嵌入式启动
- websocket