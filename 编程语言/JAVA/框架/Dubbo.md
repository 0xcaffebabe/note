# 架构演进

![](https://dubbo.apache.org/docs/zh-cn/user/sources/images/dubbo-architecture-roadmap.jpg)

# 需求

![](https://dubbo.apache.org/docs/zh-cn/user/sources/images/dubbo-service-governance.jpg)

- 当服务越来越多时，服务 URL 配置管理变得非常困难，F5 硬件负载均衡器的单点压力也越来越大
- 当进一步发展，服务间依赖关系变得错踪复杂，甚至分不清哪个应用要在哪个应用之前启动，架构师都不能完整的描述应用的架构关系
- 接着，服务的调用量越来越大，服务的容量问题就暴露出来，这个服务需要多少机器支撑？什么时候该加机器

# 架构

![](https://dubbo.apache.org/docs/zh-cn/user/sources/images/dubbo-architecture.jpg)

节点        | 角色说明
--------- | -------------------
Provider  | 暴露服务的服务提供方
Consumer  | 调用远程服务的服务消费方
Registry  | 服务注册与发现的注册中心
Monitor   | 统计服务的调用次数和调用时间的监控中心
Container | 服务运行容器

# 注册中心

- ZooKeeper

![](https://dubbo.apache.org/docs/zh-cn/user/sources/images/zookeeper.jpg)

- 服务提供者启动时: 向 /dubbo/com.foo.BarService/providers 目录下写入自己的 URL 地址
- 服务消费者启动时: 订阅 /dubbo/com.foo.BarService/providers 目录下的提供者 URL 地址。并向 /dubbo/com.foo.BarService/consumers 目录下写入自己的 URL 地址
- 监控中心启动时: 订阅 /dubbo/com.foo.BarService 目录下的所有提供者和消费者 URL 地址

# 服务方

- 依赖

```xml
<dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>org.apache.zookeeper</groupId>
            <artifactId>zookeeper</artifactId>
            <version>3.5.6</version>
        </dependency>
        <dependency>
            <groupId>com.101tec</groupId>
            <artifactId>zkclient</artifactId>
            <version>0.11</version>
        </dependency>
        <dependency>
            <groupId>com.alibaba.boot</groupId>
            <artifactId>dubbo-spring-boot-starter</artifactId>
            <version>0.2.0</version>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>1.18.10</version>
        </dependency>

        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>dubbo</artifactId>
            <version>2.6.7</version>

        </dependency>
```

- 配置

```yml
server:
  port: 9090
spring:
  application:
    name: dubbo-service
  main:
    allow-bean-definition-overriding: true
dubbo:
  application:
    version: 1.0.0
    name: dubbo-service
  scan:
    base-packages: wang.ismy.dubbo.service
  protocol:
    name: dubbo
    port: 20880
  registry:
    address: zookeeper://my-pc:2181
    client: zkclient
```

- 编写服务实现类

```java
// 声明这是一个dubbo服务

@Service(version = "1.0.0")
public class UserServiceImpl implements UserService {

    @Override
    public List<User> findAll() {
        // 省略
    }
}
```

- 编写启动类

```java
@SpringBootApplication
@EnableDubbo
public class ServiceApplication {
    public static void main(String[] args) {
        new SpringApplicationBuilder(ServiceApplication.class)
                .web(WebApplicationType.NONE)
                .run(args);
    }
}
```

# 消费方

- 依赖

```xml
<dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.apache.zookeeper</groupId>
            <artifactId>zookeeper</artifactId>
            <version>3.5.6</version>
        </dependency>
        <dependency>
            <groupId>com.101tec</groupId>
            <artifactId>zkclient</artifactId>
            <version>0.11</version>
        </dependency>
        
        <dependency>
            <groupId>com.alibaba.boot</groupId>
            <artifactId>dubbo-spring-boot-starter</artifactId>
            <version>0.2.0</version>
        </dependency>

        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>dubbo</artifactId>
            <version>2.6.7</version>

```

- 配置

```yml
dubbo:
  application:
    name: dubbo-consumer
  registry:
    address: zookeeper://my-pc:2181
    client: zkclient
server:
  port: 9091
```

- 使用

```java
@Reference(version = "1.0.0")
private UserService userService;
```

# 负载均衡

- 设置负载均衡的方式

```java
@Reference(version = "1.0.0",loadbalance = "roudrobin")
private UserService userService;
```

- random
  - 随机
- roudrobin
  - 轮询

# 协议

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

