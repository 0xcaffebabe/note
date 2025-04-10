# ActiveMQ

## 使用

- 初始化

```java
// 创建连接
ConnectionFactory connectionFactory = new ActiveMQConnectionFactory(url);
Connection connection = connectionFactory.createConnection();
connection.start();
// 创建会话 自动确认消息
Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
// 创建目的
Destination destination = session.createQueue(queueName);
```

## 队列模式

### 生产消息

```java
MessageProducer producer = session.createProducer(destination);

for (int i = 0; i < 100; i++) {
    TextMessage textMessage = session.createTextMessage();
    textMessage.setText("text"+i);
    producer.send(textMessage);
}
```

### 消费消息

- 使用消息监听器

```java
MessageConsumer consumer = session.createConsumer(destination);

consumer.setMessageListener(new MessageListener() {
    public void onMessage(Message message) {
        System.out.println(message);
    }
});
```

- 同步消费消息模式

```java
ActiveMQTextMessage msg = (ActiveMQTextMessage) consumer.receive();
System.out.println(msg);
```

#### 队列模式

```java
destination = session.createQueue(sourceQueue);
```

> 在队列模式下，消费者会平均消费生产者生产的消息

#### 主题模式

```java
Destination destination = session.createTopic(topicName);
```

> 主题模式也被称为订阅通知模式，订阅之后才能收到消息 生产者生产消息会推送给所有消费者

## 消息持久化

- PERSISTENT：指示JMS provider持久保存消息，以保证消息不会因为JMS provider的失败而丢失
- NON_PERSISTENT:不要求JMS provider持久保存消息

```java
producer.setDeliveryMode(DeliveryMode.PERSISTENT);
```

## 可靠数据传输

JMS消息只有在被确认之后，才认为已经被成功的消费了

- Session.AUTO_ACKNOWLEDGE：当客户成功的从receive方法返回的时候，或者从MessageListener.onMessage方法成功返回的时候，会话自动确认客户收到的消息
- Session.CLIENT_ACKNOWLEDGE:客户通过调用消息的acknowledge方法确认消息
- Session.DUPS_ACKNOWLEDGE:该选择只是会话迟钝的确认消息的提交

## 集成Spring JMS

- 配置

```java
@Bean
public ConnectionFactory connectionFactory(){
    return new ActiveMQConnectionFactory("tcp://127.0.0.1:61616");
}

@Bean
public Destination destination(){
    return new ActiveMQQueue("queue");
}

@Bean
public JmsTemplate jmsTemplate(ConnectionFactory connectionFactory){
    return new JmsTemplate(connectionFactory);
}
```

- 使用

```java
jmsTemplate.send(destination,new MessageCreator() {
    public Message createMessage(Session session) throws JMSException {
        TextMessage msg = session.createTextMessage();
        msg.setText(message);
        return msg;
    }
});
```

- 配置消费者

```java
@Bean
public MessageListener messageListener(){
    return new ConsumerMessageListener();
}

@Bean
public DefaultMessageListenerContainer 
defaultMessageListenerContainer(Destination destination,
                                ConnectionFactory connectionFactory,
                                MessageListener messageListener){

    DefaultMessageListenerContainer container = new DefaultMessageListenerContainer();
    container.setConnectionFactory(connectionFactory);
    container.setMessageListener(messageListener);
    container.setDestination(destination);
    return container;
}
```

## SpringBoot整合

- 依赖

```xml
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-activemq</artifactId>
</dependency>
```

- 配置

```yml
spring:
  activemq:
    broker-url: tcp://127.0.0.1:61616
    user: admin
    password: admin
queue: myQueue
```

```java
@Value("${queue}")
private String queueName;

@Bean
public Queue queue(){
    return new ActiveMQQueue(queueName);
}
```

- 使用

生产者

```java
@Component
public class Producer {

    @Autowired
    private JmsMessagingTemplate template;

    @Autowired
    private Queue queue;

    @Scheduled(fixedDelay = 5000)
    public void send() {
        String payload = UUID.randomUUID().toString();
        System.out.println("producer send:" + payload);
        template.convertAndSend(queue, payload);
    }
}
```

消费者

```java
@Component
public class Consumer {

    @JmsListener(destination = "myQueue")
    public void receive(String msg){
        System.out.println("consumer receive:"+msg);
    }
}
```

## 集群

- 高可用
- 负载均衡

### 集群方式

- 客户端集群
- Broker集群
- Master Slave

## 企业开发需要解决的问题


