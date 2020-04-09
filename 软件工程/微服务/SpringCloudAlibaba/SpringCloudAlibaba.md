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

## Nacos注册中心

### 安装启动

```sh
git clone https://gitee.com/mirrors/Nacos.git
cd nacos/
mvn -Prelease-nacos -Dmaven.test.skip=true clean install -U  
ls -al distribution/target/

// change the $version to your actual path
cd distribution/target/nacos-server-$version/nacos/bin
```

- startup

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

### vs Zookeeper & Eureka

相同点:都可以实现分布式服务注册中心。

不同点:
Zookeeper采用CP保证数据的一致性的问题，原理采用Zab原子广播协议，当zk领导者因为某种原因宕机的情况下，会自动重新选一个新的领导角色，整个选举的过程为了保证数据的一致性的问题，在选举的过程中整个zk环境是不可以使用。I
注意:可运行的节点必须数量过半，整个zk集群才可以正常使用。

Eureka采用ap的设计理念架构注册中心，完全去中心化思想，也就是没有主从之分。。每个节点都是均等，采用相互注册原理，你中有我我中你，只要最后有一个eureka节点存在就可以保证整个微服务可以实现通讯。

Nacos.从1.0版本支持CP和AP混合模式集群，默认是采用Ap保证服务可用性，CP的形式底层集群raft协议保证数据的一致性的问题。
如果我们采用Ap模式注册服务的实例仅支持临时注册形式，在网络分区产生抖动的情况下任然还可以继续注册我们的服务列表。
如果选择CP模式的情况下会保证数据的强一致性，如果网络分区产生抖动的情况下，是无法注册我们的服务列表。选择CP模式可以支持注册实例持久。

**最主要的是Eureka集群中的各个节点是对等的，而Nacos则有主从之分**

## Nacos配置中心

```xml
<dependency>       
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>
```

- bootstrap.properties

```properties
spring.cloud.nacos.config.server-addr=127.0.0.1:8848
spring.cloud.nacos.config.name=provider-config
```

![批注 2020-04-02 143345](/assets/批注%202020-04-02%20143345.png)

- 使用

```java
applicationContext.getEnvironment().getProperty("app.name")
```

### 配置中心集群

![批注 2020-04-02 151146](/assets/批注%202020-04-02%20151146.png)

## Sentinel

- 替代hystrix

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

```java
@GetMapping("/name")
@SentinelResource(value = "test-resource",blockHandlerClass = {ServiceFallback.class})
public String name() { return "provider"+port; }
```