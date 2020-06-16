# Dubbo

- 一款分布式服务框架
- 高性能和透明化的RPC远程服务调用方案
- SOA服务治理方案

## 需求

![20203814111](/assets/20203814111.jpg)

- 当服务越来越多时，服务 URL 配置管理变得非常困难，F5 硬件负载均衡器的单点压力也越来越大
- 当进一步发展，服务间依赖关系变得错踪复杂，甚至分不清哪个应用要在哪个应用之前启动，架构师都不能完整的描述应用的架构关系
- 接着，服务的调用量越来越大，服务的容量问题就暴露出来，这个服务需要多少机器支撑？什么时候该加机器

## 架构

![20203814260](/assets/20203814260.jpg)

节点        | 角色说明
--------- | -------------------
Provider  | 暴露服务的服务提供方
Consumer  | 调用远程服务的服务消费方
Registry  | 服务注册与发现的注册中心
Monitor   | 统计服务的调用次数和调用时间的监控中心
Container | 容器. Dubbo技术的服务端(Provider), 在启动执行的时候, 必须依赖容器才能正常启动.

## 工作流程

![批注 2020-03-21 142738](/assets/批注%202020-03-21%20142738.png)

- start: 启动Spring容器时,自动启动Dubbo的Provider
- register: Dubbo的Provider在启动后自动会去注册中心注册内容.注册的内容包括:
  - Provider的 IP
  - Provider 的端口.
  - Provider 对外提供的接口列表.哪些方法.哪些接口类
  - Dubbo 的版本.
  - 访问Provider的协议.
- subscribe: 订阅.当Consumer启动时,自动去Registry获取到所已注册的服务的信息.
- notify: 通知.当Provider的信息发生变化时, 自动由Registry向Consumer推送通知.
- invoke: 调用. Consumer 调用Provider中方法
  - 同步请求.消耗一定性能.但是必须是同步请求,因为需要接收调用方法后的结果.
- count:次数. 每隔2分钟,provoider和consumer自动向Monitor发送访问次数.Monitor进行统计.

## 注册中心

Dubbo支持Multicast，Zookeeper，Redis，Simple注册中心

### ZooKeeper

![](https://dubbo.apache.org/docs/zh-cn/user/sources/images/zookeeper.jpg)

- 服务提供者启动时: 向 /dubbo/com.foo.BarService/providers 目录下写入自己的 URL 地址
- 服务消费者启动时: 订阅 /dubbo/com.foo.BarService/providers 目录下的提供者 URL 地址。并向 /dubbo/com.foo.BarService/consumers 目录下写入自己的 URL 地址，当提供者发生变化时，zk会通知消费者
- 监控中心启动时: 订阅 /dubbo/com.foo.BarService 目录下的所有提供者和消费者 URL 地址

## 协议

Dubbo 默认协议采用单一长连接和 NIO 异步通讯，适合于小数据量大并发的服务调用，以及服务消费者机器数远大于服务提供者机器数的情况。

反之，Dubbo 默认协议不适合传送大数据量的服务，比如传文件，传视频等，除非请求量很低

![](https://dubbo.apache.org/docs/zh-cn/user/sources/images/dubbo-protocol.jpg)

缺省协议，使用基于 mina 1.1.7 和 hessian 3.2.1 的 tbremoting 交互。

- 连接个数：单连接
- 连接方式：长连接
- 传输协议：TCP
- 传输方式：NIO 异步传输
- 序列化：Hessian 二进制序列化
- 适用范围：传入传出参数数据包较小（建议小于100K），消费者比提供者个数多，单一消费者无法压满
- 提供者，尽量不要用 dubbo 协议传输大文件或超大字符串。
- 适用场景：常规远程服务方法调用

### Protocol Buffer

Protocol Buffer 其实是 Google 出品的一种轻量并且高效的结构化数据存储格式，性能比 JSON、XML 要高很多

- 序列化和反序列非常快
- 压缩后体积很小

## 负载均衡策略

- random loadbalance

随机调用实现负载均衡，可以对 provider 不同实例设置不同的权重，会按照权重来负载均衡

- roundrobin loadbalance

默认就是均匀地将流量打到各个机器上去，但是如果各个机器的性能不一样，容易导致性能差的机器负载过高。所以此时需要调整权重

- leastactive loadbalance

给不活跃的性能差的机器更少的请求

- consistanthash loadbalance

相同参数的请求一定分发到一个 provider 上去，provider 挂掉的时候，会基于虚拟节点均匀分配剩余的流量

### 建议在 Provider 端配置的 Consumer 端属性

1. `timeout`：方法调用的超时时间

2. `retries`：失败重试次数，缺省是 2 

3. `loadbalance`：负载均衡算法，缺省是随机 `random` + 权重。还可以配置轮询 `roundrobin`、最不活跃优先 `leastactive` 和一致性哈希 `consistenthash` 等

4. `actives`：消费者端的最大并发调用限制，即当 Consumer 对一个服务的并发调用到上限后，新调用会阻塞直到超时，在方法上配置 `dubbo:method` 则针对该方法进行并发限制，在接口上配置 `dubbo:service`，则针对该服务进行并发限制
5. `executes`服务提供方可以使用的最大线程数

### 在 Provider 端配置合理的 Provider 端属性

建议在 Provider 端配置的 Provider 端属性有：

1. `threads`：服务线程池大小
2. `executes`：一个服务提供者并行执行请求上限，即当 Provider 对一个服务的并发调用达到上限后，新调用会阻塞，此时 Consumer 可能会超时。在方法上配置 `dubbo:method` 则针对该方法进行并发限制，在接口上配置 `dubbo:service`，则针对该服务进行并发限制

## 集群容错策略

- failover cluster 模式

失败自动切换，自动重试其他机器，默认就是这个

- failfast cluster 模式

一次调用失败就立即失败

- failsafe cluster 模式

出现异常时忽略掉

- failback cluster 模式

失败了后台自动记录请求，然后定时重发

- forking cluster 模式

并行调用多个 provider，只要一个成功就立即返回

- broadcacst cluster

逐个调用所有的 provider。任何一个 provider 出错则报错

## spi

service provider interface

当某个接口有多个实现，需要根据指定的配置或者是默认的配置，选择相对应的实现

## 服务治理

### 调用链路自动生成

对各个服务之间的调用自动记录下来，然后自动将各个服务之间的依赖关系和调用链路生成出来，做成一张图

![批注 2020-03-21 145015](/assets/批注%202020-03-21%20145015.png)

### 服务访问压力以及时长统计

- 每个服务的每个接口每天被调用多少次
- 从源头入口开始，一个完整的请求链路经过几十个服务之后，完成一次请求，每天全链路走多少次

## 设计一个rpc框架

- 注册中心
  - 要能注册、拉取服务信息
- 网络请求的发送与接收
- 使用动态代理来封装
- 多个服务本地负载均衡
- 请求数据响应数据的序列化与反序列

## SpringCloud与Dubbo

SpringCloud 和Dubbo都可以实现RPC远程调用和服务治理

SpringCloud是一套目前比较完善的微服务框架，整合了分布式常用解决方案遇到了问题，Dubbo只是实现服务治理

## 整合spring boot

- provider

```groovy
compile group: 'org.apache.dubbo', name: 'dubbo-spring-boot-starter', version: '2.7.7'
compile group: 'org.apache.curator', name: 'curator-recipes', version: '4.2.0'
```
```properties
spring.application.name=dubbo-provider
dubbo.scan.base-packages=wang.ismy.dubbo
dubbo.protocol.name=dubbo
dubbo.protocol.port=666
dubbo.protocol.host=192.168.1.109
dubbo.registry.address=zookeeper://local:2181
```
```java
@DubboService(version = "1.0.0",timeout = 10000,interfaceClass = HelloService.class)
@Service
public class HelloServiceImpl implements HelloService{...}
```

- consumer

依赖配置同上

```java
@DubboReference(version = "1.0.0")
HelloService helloService;
```

## dubbo-admin

可视化管理服务

- 启动admin-server
- 配置admin-ui server ip
- npm run dev