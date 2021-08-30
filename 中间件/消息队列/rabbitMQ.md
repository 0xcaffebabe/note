# rabbitmq

> RabbitMQ是实现了高级消息队列协议（AMQP）的开源消息代理软件（亦称面向消息的中间件）。RabbitMQ服务器是用Erlang语言编写的，而集群和故障转移是构建在开放电信平台框架上的。所有主要的编程语言均有与代理接口通讯的客户端库。

- 性能非常高

## 对比

![批注 2020-03-12 143412](/assets/批注%202020-03-12%20143412.png)

## 安装

- 安装erlang
- 安装rabbitmq-server

以上操作均可以使用包管理工具完成

### 使用docker

```shell
docker run -d --hostname my-rabbit --name some-rabbit -p 15672:15672 -p 5672:5672 rabbitmq:3-management
```

## 核心概念

- Server
- Connection
- Channel
  - （信道）：它建立在上述的TCP连接中
- Message
- Virtual host
  - 权限控制的基本单位（类似于数据库中的database），一个VirtualHost里面有若干Exchange和 MessageQueue，以及指定被哪些user使用
- Exchange
  - 生产者将消息发送到Exchange（交换机），由Exchange将消息路由到一个 或多个Queue中（或者丢弃）。Exchange并不存储消息
- Binding
- Routing key
  - 生产者在将消息发送给Exchange的时候，一般会指定一个routing key， 来指定这个消息的路由规则，而这个routing key需要与Exchange Type及binding key联 合使用才能最终生效
- Queue
  - （队列）是RabbitMQ的内部对象，用于存储消息

## 使用

## JAVA客户端

- 获取连接

```java
ConnectionFactory factory = new ConnectionFactory();
factory.setHost("192.168.182.129");
factory.setUsername("my");
factory.setPassword("123");
factory.setPort(5672);
factory.setVirtualHost("/");

Connection connection = factory.newConnection();
```

- 创建队列/绑定队列

```java
Channel channel = connection.createChannel();
channel.queueDeclare("queue1",false,false,false,null);
```

- 生产者发送消息

```java
String msg = UUID.randomUUID().toString();
channel.basicPublish("","queue1",null,msg.getBytes());
```

- 消费者监听

```java
DefaultConsumer consumer = new DefaultConsumer(channel){
    @Override
    public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
        System.out.println("接收到消息:"+new String(body));

    }
};
channel.basicConsume("queue1",true,consumer);
```

### SpringBoot

- 引入依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
```

- 配置（生产者、消费者）

```yml
spring:
  rabbitmq:
    addresses: 192.168.182.129
    username: my
    password: 123
    virtual-host: /
```

- 生产者发送消息

```java
@Autowired
private RabbitTemplate rabbitTemplate;

public void sendUser(User user) throws Exception{
    CorrelationData correlationData = new CorrelationData(user.getUsername());
    rabbitTemplate.convertAndSend("user-exchange","user.abcd",user,correlationData);
}
```

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
    // 当这里抛出异常，会自动进行重试
    log.info("on message:{}",user);
}
```

## 消息模型

### 点对点

![批注 2020-03-12 151023](/assets/批注%202020-03-12%20151023.png)

当有多个消费端时，mq会把消息公平分发到每个消费端（轮询）

### 工作队列

![](https://www.rabbitmq.com/img/tutorials/python-two.png)

消息转发机制是平均分配，这样就会出现俩个消费者，由于每个消费者处理任务的效率不一，可以通过设置qos的方式来决定消费者的消费能力，从而达到资源的充分利用

```java
channel.basicQos(1);
```

手动ack后的消费端，mq会继续发消息给它，这样就能达到消费速度更快的客户端消费更多数据

### 订阅模型-Fanout

Fanout exchange（扇型交换机）将消息路由给绑定到它身上的所有队列

![批注 2020-03-12 181837](/assets/批注%202020-03-12%20181837.png)

- 生产者

```java
String exchangeName = "exchange1";
channel.exchangeDeclare(exchangeName,"fanout");
String msg = UUID.randomUUID().toString();
channel.basicPublish(exchangeName,"",null,msg.getBytes());
```

- 消费者

端a

```java
String queueName = "queue1";
String exchangeName = "exchange1";
channel.queueDeclare(queueName, false, false, false, null);
channel.queueBind(queueName, exchangeName, "");
DefaultConsumer consumer = new DefaultConsumer(channel) {
    @Override
    public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
        System.out.println("消费者接收到消息:" + new String(body));
    }
};
channel.basicConsume(queueName,true,consumer);
```

端b

```java
...
String queueName = "queue2";
...
```

### 订阅模型-Direct

Direct exchange（直连交换机）是根据消息携带的路由键（routing key）将消息投递给对应队列

![20203121903](/assets/20203121903.png)

- 生产端

```java
...
channel.basicPublish(exchangeName,"routing_key",null,msg.getBytes());
```

- 消费端

```java
...
channel.queueBind(queueName, exchangeName, "routing_key");
...
```

### 订阅模型-Topic

Topic类型的Exchange与Direct相比，都是可以根据RoutingKey把消息路由到不同的队列。只不过Topic类型Exchange可以让队列在绑定Routing key 的时候使用通配符

![202031311031](/assets/202031311031.png)

端a

```java
channel.queueBind(queueName, exchangeName, "#.sms");
```

端b

```java
channel.queueBind(queueName, exchangeName, "#.email");
```

当生产者的routingKey为log.sms时，消息会发送到端a

- `#` 可以匹配一个或多个词
- `*`只能匹配一个词

## 消息确认机制（ACK）

ACK：消费者通知RabbitMQ消息已经接收并且处理完毕了。RabbitMQ就可以删除该条消息了

- 自动ACK：消息一旦被接收，消费者自动发送ACK
- 手动ACK：消息接收后，不会发送ACK，需要手动调用

```java
DefaultConsumer consumer = new DefaultConsumer(channel){
    @Override
    public void handleDelivery(String consumerTag, Envelope envelope, AMQP.BasicProperties properties, byte[] body) throws IOException {
        System.out.println("接收到消息:"+new String(body));
        channel.basicAck(envelope.getDeliveryTag(),false);
    }
};
channel.basicConsume("queue1",false,consumer);
```

### 事务

```java
try{
    channel.txSelect();
    String msg = UUID.randomUUID().toString();
    channel.basicPublish(exchangeName,"log.email",null,msg.getBytes());
    channel.txCommit();
}catch (Exception e){
    channel.txRollback();
}
```

## 保证幂等性

当引入异常重试机制时，如何保证同一条消息不被重复消费

- 重试配置

```yml
spring:
  rabbitmq:
    listener:
      simple:
        retry:
          initial-interval: 100ms
          enabled: true
          max-attempts: 3
```

解决这个问题，需要根据业务的具体情况来分析，可以：

- 全局消息ID
- redis的天然幂等性
- 数据库的唯一约束

### 全局消息ID

当消费者处理完一条消息之后，将这个消息ID记录下来，当一条新消息到来之后，要判断是否记录过这条消息的ID，如果是，不再继续往下处理

## 死信队列

当由于一些诸如队列满或者消息被拒绝等原因，这些消息将被移入到一个备胎队列，死信队列就是专门用来存放这些消息的队列

### 普通队列绑定私信队列

```java
Map<String, Object> args = new HashMap<>(2);
// 死信队列交换机与死信队列路由键
args.put("deadExchangeName", deadExchangeName);
args.put("deadRoutingKey", deadRoutingKey);
Queue queue = new Queue("user_queue", true, false, false, args);
```

## 高可用

- 镜像集群模式

创建的 queue，无论元数据还是 queue 里的消息都会存在于多个实例上，就是说，每个 RabbitMQ 节点都有这个 queue 的一个完整镜像，写消息到 queue 的时候，都会自动把消息同步到多个实例的 queue 上

![批注 2020-03-18 194849](/assets/批注%202020-03-18%20194849.png)

## 顺序性

当多个consumer同时消费一个queue时，很有可能造成消费的顺序和存入的顺序不一致，解决方法是：
拆分多个 queue，每个 queue 一个 consumer