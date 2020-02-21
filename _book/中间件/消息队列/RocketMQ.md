>Apache RocketMQ是一个采用Java语言开发的分布式的消息系统，由阿里巴巴团队开发，于2016年底贡献给Apache

# 核心概念

- Producer
  - 消息生产者，负责产生消息，一般由业务系统负责产生消息
  - Producer Group
    - 一类 Producer 的集合名称，这类 Producer 通常发送一类消息，且发送逻辑一致
- Consumer
  - 消息费者，负责消费消息，一般是后台系统负责异步消费
  - Push Consumer
    - 服务端向消费者端推送消息
  - Pull Consumer
    - 消费者端向服务定时拉取消息
  - Consumer Group
    - 一类 Consumer 的集合名称，这类 Consumer 通常消费一类消息，且消费逻辑一致
- NameServer
  - 集群架构中的组织协调员
  - 收集broker的工作情况
  - 不负责消息的处理
- Broker
  - 是RocketMQ的核心负责消息的发送、接收、高可用等（真正干活的）
  - 需要定时发送自身情况到NameServer，默认10秒发送一次，超时2分钟会认为该broker失效。
- Topic
  - 不同类型的消息以不同的Topic名称进行区分，如User、Order等
  - 是逻辑概念
  - Message Queue
    - 消息队列，用于存储消息





