> RabbitMQ是实现了高级消息队列协议（AMQP）的开源消息代理软件（亦称面向消息的中间件）。RabbitMQ服务器是用Erlang语言编写的，而集群和故障转移是构建在开放电信平台框架上的。所有主要的编程语言均有与代理接口通讯的客户端库。

# 安装

- 安装erlang
- 安装rabbitmq-server

以上操作均可以使用包管理工具完成

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



