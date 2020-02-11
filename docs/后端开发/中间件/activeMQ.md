# 消息中间件带来的好处

- 解耦
- 异步
- 横向扩展
- 安全可靠
- 顺序保证

> 中间件是一种独立的系统软件或服务程序，分布式应用软件借助这种软件在不同的技术之间共享资源。 中间件位于客户机/ 服务器的操作系统之上，管理计算机资源和网络通讯。

> 消息中间件是指一种在需要进行网络通信的系统进行通道的建立，数据或文件发送的中间件。消息中间件的一个重要作用是可以跨平台操作，为不同操作系统上的应用软件集成提供便利。

## JMS

> Java消息服务（Java Message Service，JMS）应用程序接口是一个Java平台中关于面向消息中间件（MOM）的API，用于在两个应用程序之间，或分布式系统中发送消息，进行异步通信。 Java消息服务是一个与具体平台无关的API，绝大多数MOM提供商都对JMS提供支持。

- 队列模型
- 主题模型

### JMS编码接口之间的关系

![批注 2019-07-18 152532](/assets/批注%202019-07-18%20152532.png)

## AMQP

> 高级消息队列协议即Advanced Message Queuing Protocol（AMQP）是一个用于统一面向消息中间件实现的一套标准协议，其设计目标是对于消息的排序、路由（包括点对点和订阅-发布）、保持可靠性、保证安全性。

## 对比

![批注 2019-07-18 150607](/assets/批注%202019-07-18%20150607.png)

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


