# SpringCloudAlibaba

>Spring Cloud Alibaba 致力于提供微服务开发的一站式解决方案。此项目包含开发分布式应用微服务的必需组件，方便开发者通过 Spring Cloud 编程模型轻松使用这些组件来开发分布式应用服务

## SpringCloud 第二代

项        | Spring Cloud第一代        | Spring Cloud第二代
-------- | ---------------------- | -----------------------------------------
网关       | Spring Cloud Zuul      | Spring Cloud Gateway
注册中心     | eureka(不再更新)，Consul,ZK | 阿里Nacos，拍拍贷radar等可选
配置中心     | spring cloud config    | 阿里Nacos，携程Apollo，随行付Config Keeper
客户端软负载均衡 | Ribbon                 | spring-cloud-loadbalancer
熔断器      | Hystrix                | spring-cloud-r4j(Resilience4J)，阿里Sentinel

## Nacos

- 服务发现和服务健康监测
- 动态配置服务
- 动态DNS服务
- 服务即其元数据管理

### 概念

- 地域 物理的数据中心，资源创建成功后不能更换
- 可用区 同一地域内，电力和网络互相独立的物理区域
- 接入点 地域的某个服务的入口域名
- 命名空间 不同的命名空间下，可以存在相同的 Group 或 Data ID 的配置。Namespace 的常用场景之一是不同环境的配置的区分隔离
- 配置
- 配置管理 系统配置的编辑、存储、分发、变更管理、历史版本管理、变更审计等
- 配置项 一个具体的可配置的参数与其值域，通常以 param-key=param-value 的形式存在
- 配置集 一组相关或者不相关的配置项的集合
- 配置集ID
- 配置分组 
- 配置快照 Nacos 的客户端 SDK 会在本地生成配置的快照 类似于缓存
- 服务
- 服务名
- 服务注册中心
- 服务发现 对服务下的实例的地址和元数据进行探测
- 元信息 服务或者配置的描述信息
- 应用
- 服务分组
- 虚拟集群 同一个服务下的所有服务实例组成一个默认集群
- 实例
- 权重
- 健康检查
- 健康保护阈值 止因过多实例不健康导致流量全部流向健康实例

![屏幕截图 2020-09-23 163728](/assets/屏幕截图%202020-09-23%20163728.png)

### 架构

![屏幕截图 2020-09-23 163102](/assets/屏幕截图%202020-09-23%20163102.png)

### 注册中心

### 使用

- 生产者

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
```
```properties
spring.application.name=provider
spring.cloud.nacos.discovery.server-addr=127.0.0.1:8848
```

- 消费者

```java
@FeignClient("provider")
public interface ProviderClient {
    @GetMapping("/name")
    String name();
}

@RestController
public static class Api {

    @Autowired
    private ProviderClient client;
    @GetMapping("/")
    public String home() {
        return client.name();
    }
}
```

#### vs Zookeeper & Eureka

不同点:

- Zookeeper采用CP保证数据的一致性的问题
- Eureka采用ap的设计理念架构注册中心，完全去中心化思想
- Nacos.从1.0版本支持CP和AP混合模式集群，默认是采用Ap保证服务可用性，CP的形式底层集群raft协议保证数据的一致性的问题。

**最主要的是Eureka集群中的各个节点是对等的，而Nacos则有主从之分**

### 配置中心

```xml
<dependency>       
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>
```

```properties
# bootstrap.properties
spring.cloud.nacos.config.server-addr=127.0.0.1:8848
spring.cloud.nacos.config.name=provider-config
# 指定配置文件后缀名
spring.cloud.nacos.config.file-extension=properties
```

![批注 2020-04-02 143345](/assets/批注%202020-04-02%20143345.png)

默认格式：${config-name}-${profile}.#{file-extension}

- 使用

```java
applicationContext.getEnvironment().getProperty("app.name")
```

#### 自定义namespace

不同的命名空间下，可以存在相同的 Group 或 Data ID 的配置。Namespace 的常用场景之一是不同环境的配置的区分隔离

通过指定 ${spring.cloud.nacos.config.namespace} 配置来实现

#### 自定义Group

${spring.cloud.nacos.config.group}

#### 自定义data-id

```properties
spring.cloud.nacos.config.extension-configs[0].data-id=xxx
# 配置支持刷新
spring.cloud.nacos.config.extension-configs[0].refresh=true
```

### 配置的优先级

- 高：通过内部相关规则(应用名、应用名+ Profile )自动生成相关的 Data Id 配置
- 中：通过 spring.cloud.nacos.config.extension-configs[n].data-id 的方式支持多个扩展 Data Id 的配置
- 低：通过 spring.cloud.nacos.config.shared-dataids 支持多个共享 Data Id 的配置

#### 配置中心集群

![批注 2020-04-02 151146](/assets/批注%202020-04-02%20151146.png)

## Sentinel

### 基本概念

- 资源：可以是 Java 应用程序中的任何内容
- 规则：包括流量控制规则、熔断降级规则以及系统保护规则

流量控制：Sentinel 作为一个调配器，可以根据需要把随机的请求调整成合适的形状

![屏幕截图 2020-09-28 160547](/assets/屏幕截图%202020-09-28%20160547.png)

流量控制可以从以下角度切入：

- 资源的调用关系，例如资源的调用链路，资源和资源之间的关系
- 运行指标，例如 QPS、线程池、系统负载等
- 控制的效果，例如直接限流、冷启动、排队等

熔断降级：

Hystrix 通过线程池的方式，来对依赖(在我们的概念中对应资源)进行了隔离。这样做的好处是资源和资源之间做到了最彻底的隔离。缺点是除了增加了线程切换的成本

sentinel 通过使用以下方式限制：

- 并发线程数 同计数器 当线程数达到一定数量 新的请求就会被拒绝
- 响应时间 当资源响应时间超过阈值 对该资源的访问会直接拒绝

### 基本原理

所有的资源都对应一个资源名称以及一个 Entry。Entry 可以通过对主流框架的适配自动创建，也可以通过注解的方式或调用 API 显式创建

通过一系列的Slot来实现相对应的功能

![屏幕截图 2020-09-28 163146](/assets/屏幕截图%202020-09-28%20163146.png)

### vs hystrix

item    | Sentinel                          | Hystrix
------- | --------------------------------- | ----------------------------
隔离策略    | 信号量隔离                             | 线程池隔离/信号量隔离
熔断降级策略  | 基于响应时间或失败比率                       | 基于失败比率
实时指标实现  | 滑动窗口                              | 滑动窗口（基于 RxJava）
规则配置    | 支持多种数据源                           | 支持多种数据源
扩展性     | 多个扩展点                             | 插件的形式
基于注解的支持 | 支持                                | 支持
限流      | 基于 QPS，支持基于调用关系的限流                | 有限的支持
流量整形    | 支持慢启动、匀速器模式                       | 不支持
系统负载保护  | 支持                                | 不支持
控制台     | 开箱即用，可配置规则、查看秒级监控、机器发现等           | 不完善
常见框架的适配 | Servlet、Spring Cloud、Dubbo、gRPC 等 | Servlet、Spring Cloud Netflix

### 基本使用

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
</dependency>
```

```java
@GetMapping("/name")
@SentinelResource(value = "resource1",blockHandlerClass = {ServiceFallback.class})
public String name() { return "provider"+port; }
```

#### sentinel-dashboard

- 添加流控规则

![屏幕截图 2020-09-28 162556](/assets/屏幕截图%202020-09-28%20162556.png)
