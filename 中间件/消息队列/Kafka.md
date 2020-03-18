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

## 高可用

Kafka 的架构：由多个 broker 组成，每个 broker 是一个节点；你创建一个 topic，这个 topic 可以划分为多个 partition，每个 partition 可以存在于不同的 broker 上，每个 partition 就放一部分数据

这就是天然的分布式消息队列，一个 topic 的数据，是分散放在多个机器上的，每个机器就放一部分数据

Kafka 0.8 以后，提供了 HA 机制，replica（复制品） 副本机制
每个 partition 的数据都会同步到其它机器上，形成自己的多个 replica 副本

写的时候，leader会将数据同步到follower上去，读的时候，就只能读leader
当某个节点挂了，由于其他节点有冗余数据，可以保证高可用