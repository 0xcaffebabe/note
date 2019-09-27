> RabbitMQ是实现了高级消息队列协议（AMQP）的开源消息代理软件（亦称面向消息的中间件）。RabbitMQ服务器是用Erlang语言编写的，而集群和故障转移是构建在开放电信平台框架上的。所有主要的编程语言均有与代理接口通讯的客户端库。

# 安装

- 安装erlang
- 安装rabbitmq-server

以上操作均可以使用包管理工具完成

## 使用docker

```shell
docker run -d --hostname my-rabbit --name some-rabbit -p 15672:15672 -p 5672:5672 rabbitmq:3-management
```

# 消息模型

![](https://gitee.com/caffebabee/leyou/raw/master/day15-rabbitmq%E5%8F%8A%E6%95%B0%E6%8D%AE%E5%90%8C%E6%AD%A5/assets/1527068544487.png)

## 订阅模型-Fanout

- 可以有多个消费者
- 每个消费者有自己的queue（队列）
- 每个队列都要绑定到Exchange（交换机）
- 生产者发送的消息，只能发送到交换机，交换机来决定要发给哪个队列，生产者无法决定。
- 交换机把消息发送给绑定过的所有队列
- 队列的消费者都能拿到消息。实现一条消息被多个消费者消费

![](https://www.rabbitmq.com/img/tutorials/python-three-overall.png)

## 订阅模型-Direct

![](https://gitee.com/caffebabee/leyou/raw/master/day15-rabbitmq%E5%8F%8A%E6%95%B0%E6%8D%AE%E5%90%8C%E6%AD%A5/assets/1532766437787.png)

## 订阅模型-Topic

Topic类型的Exchange与Direct相比，都是可以根据RoutingKey把消息路由到不同的队列。只不过Topic类型Exchange可以让队列在绑定Routing key 的时候使用通配符

![](https://gitee.com/caffebabee/leyou/raw/master/day15-rabbitmq%E5%8F%8A%E6%95%B0%E6%8D%AE%E5%90%8C%E6%AD%A5/assets/1532766712166.png)

# 消息确认机制（ACK）

- 自动ACK：消息一旦被接收，消费者自动发送ACK
- 手动ACK：消息接收后，不会发送ACK，需要手动调用

# 核心概念

- Server
- Connection
- Channel
- Message
- Virtual host
- Exchange
- Binding
- Routing key
- Queue

# 使用

- 引入依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
    <version>2.1.6.RELEASE</version>
</dependency>
```

- 添加队列

![批注 2019-07-21 105204](/assets/批注%202019-07-21%20105204.png)

- 添加交换机

![批注 2019-07-21 105304](/assets/批注%202019-07-21%20105304.png)

- 添加绑定

![批注 2019-07-21 105352](/assets/批注%202019-07-21%20105352.png)

- 发送

```java
@Autowired
    private RabbitTemplate rabbitTemplate;

    public void sendUser(User user) throws Exception{
        CorrelationData correlationData =
                new CorrelationData(user.getUsername());

        rabbitTemplate.convertAndSend("user-exchange",
                "user.abcd",
                user,correlationData
                );
    }
```

- 接收

  - 消费端配置

    ```properties
    spring.rabbitmq.listener.simple.concurrency=5
    spring.rabbitmq.listener.simple.acknowledge-mode=auto
    spring.rabbitmq.listener.simple.max-concurrency=10
    spring.rabbitmq.listener.simple.prefetch=1
    ```

  - 消费

    ```java
    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(value = "user-queue"),
            exchange = @Exchange(name = "user-exchange",type = "topic"),
            key = "user.#"
    ))
    @RabbitHandler
    public void onMessage(@Payload User user){

        log.info("on message:{}",user);
    }
    ```

# 消息可靠投递方案

![批注 2019-07-21 113405](/assets/批注%202019-07-21%20113405.png)
