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

![20203814260](/assets/20203814260_9vfq3cjh5.jpg)

节点        | 角色说明
--------- | -------------------
Provider  | 暴露服务的服务提供方
Consumer  | 调用远程服务的服务消费方
Registry  | 服务注册与发现的注册中心
Monitor   | 统计服务的调用次数和调用时间的监控中心
Container | 服务运行容器

## 注册中心

Dubbo支持Multicast，Zookeeper，Redis，Simple注册中心

### ZooKeeper

![](https://dubbo.apache.org/docs/zh-cn/user/sources/images/zookeeper.jpg)

- 服务提供者启动时: 向 /dubbo/com.foo.BarService/providers 目录下写入自己的 URL 地址
- 服务消费者启动时: 订阅 /dubbo/com.foo.BarService/providers 目录下的提供者 URL 地址。并向 /dubbo/com.foo.BarService/consumers 目录下写入自己的 URL 地址，当提供者发生变化时，zk会通知消费者
- 监控中心启动时: 订阅 /dubbo/com.foo.BarService 目录下的所有提供者和消费者 URL 地址

## 协议

Dubbo 缺省协议采用单一长连接和 NIO 异步通讯，适合于小数据量大并发的服务调用，以及服务消费者机器数远大于服务提供者机器数的情况。

反之，Dubbo 缺省协议不适合传送大数据量的服务，比如传文件，传视频等，除非请求量很低

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

## SpringCloud与Dubbo

SpringCloud 和Dubbo都可以实现RPC远程调用和服务治理

SpringCloud是一套目前比较完善的微服务框架，整合了分布式常用解决方案遇到了问题，Dubbo只是实现服务治理