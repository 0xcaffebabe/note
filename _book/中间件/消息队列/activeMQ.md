

# 安装

- windows

## linux

- 下载

![批注 2019-07-18 153200](/assets/批注%202019-07-18%20153200.png)

- 解压

```shell
tar -xzf closer.cgi\?filename=%2Factivemq%2
F5.15.9%2Fapache-activemq-5.15.9-bin.tar.gz\&action=download
```

- 启动

```shell
./activemq start
```

# 使用

- 初始化

```java
// 创建连接
ConnectionFactory connectionFactory = new ActiveMQConnectionFactory(url);
Connection connection = connectionFactory.createConnection();
connection.start();
// 创建会话
Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
// 创建目的
Destination destination = session.createQueue(queueName);
```

## 队列模式

- 生产消息

```java
MessageProducer producer = session.createProducer(destination);

        for (int i = 0; i < 100; i++) {
            TextMessage textMessage = session.createTextMessage();
            textMessage.setText("text"+i);
            producer.send(textMessage);
        }
```

- 消费消息

```java
MessageConsumer consumer = session.createConsumer(destination);

        consumer.setMessageListener(new MessageListener() {
            public void onMessage(Message message) {
                System.out.println(message);
            }
        });
```

> 在队列模式下，消费者会平均消费生产者生产的消息

## 主题模式

```java
Destination destination = session.createTopic(topicName);
```

> 主题模式下，订阅之后才能收到消息 生产者生产消息会推送给所有消费者

# 集成Spring jms

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

# 集群

- 高可用
- 负载均衡

## 集群方式

- 客户端集群
- Broker集群
- Master Slave

# 企业开发需要解决的问题


