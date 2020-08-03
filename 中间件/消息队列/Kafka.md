# kafka

Kafka 是一个分布式的基于发布/订阅模式的消息队列（Message Queue），主要应用于大数据实时处理领域

## 架构

![屏幕截图 2020-08-03 133557](/assets/屏幕截图%202020-08-03%20133557.png)

- 1 ）Producer  ：消息生产者，就是向 kafka broker 发消息的客户端；
- 2 ）Consumer  ：消息消费者，向 kafka broker 取消息的客户端；
- 3 ）Consumer Group  （CG ）：消费者组，由多个 consumer 组成。 消费者组内每个消费者负
责消费不同分区的数据，一个分区只能由一个 组内 消费者消费；消费者组之间互不影响。所
有的消费者都属于某个消费者组，即 消费者组是逻辑上的一个订阅者。
- 4 ）Broker  ：一台 kafka 服务器就是一个 broker。一个集群由多个 broker 组成。一个 broker
可以容纳多个 topic。
- 5 ）Topic  ：可以理解为一个队列， 生产者和消费者面向的都是一个 topic；
- 6 ）Partition ：为了实现扩展性，一个非常大的 topic 可以分布到多个 broker（即服务器）上，
一个 topic  可以分为多个 partition，每个 partition 是一个有序的队列；
- 7） ）Replica： ：副本，为保证集群中的某个节点发生故障时，该节点上的 partition 数据不丢失，且 kafka 仍然能够继续工作，kafka 提供了副本机制，一个 topic 的每个分区都有若干个副本，
一个 leader 和若干个 follower。
- 8 ）leader ：每个分区多个副本的“主”，生产者发送数据的对象，以及消费者消费数据的对
象都是 leader。
- 9 ）follower ：每个分区多个副本中的“从”，实时从 leader 中同步数据，保持和 leader 数据
的同步。leader 发生故障时，某个 follower 会成为新的 follower。

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

## 搭建

```sh
docker run --name kafka01 \
-p 9092:9092 \
-e KAFKA_BROKER_ID=0 \
-e KAFKA_ZOOKEEPER_CONNECT=192.168.1.109:2181 \
-e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://192.168.182.129:9092 \
-e KAFKA_LISTENERS=PLAINTEXT://0.0.0.0:9092 \
-d  wurstmeister/kafka  
```

- 创建可视化管理界面

```sh
docker run -itd \
--restart=always \
--name=kafka-manager \
-p 9000:9000 \
-e ZK_HOSTS="192.168.1.109:2181" \
sheepkiller/kafka-manager
```

- kafka创建topic

```sh
/opt/kafka/bin/kafka-topics.sh --create --zookeeper 192.168.1.109:2181 --replication-factor 1 --partitions 1 --topic my_log
```