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

# 优化

## 禁用AJP连接

>AJP（Apache JServ Protocol）是定向包协议。因为性能原因，使用二进制格式来传输可读性文本。WEB服务器通过 TCP连接 和 SERVLET容器连接

## 设置线程池

## 设置运行模式

- bio
- nio
- apr

