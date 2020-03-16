# kafka

## 概念

- Producer 
- Consumer 
  - Consumer Group
- Broker：Kafka节点，一个Kafka节点就是一个broker，多个broker可以组成一个Kafka集群
- Topic：一类消息，消息存放的目录即主题
- Partition：topic物理上的分组，一个topic可以分为多个partition，每个partition是一个有序的队列
- Offset：偏移量，理解为消息partition中的索引即可
- Replication
  - Replication Leader
  - ReplicaManager

![2020316194249](/assets/2020316194249.png)

## 应用场景

- 消息队列
- 行为跟踪
- 日志收集
- 流处理
- 事件源
- 持久性日志

