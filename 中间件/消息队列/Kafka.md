# kafka

Kafka 是一个分布式的基于发布/订阅模式的消息队列（Message Queue），主要应用于大数据实时处理领域

## 特点

- 多生产者 多消费者
- 基于磁盘的数据存储
- 伸缩性
  -  broker可以不断扩展
- 高性能

## 基础概念

消息和批次
  - 消息是kafka的数据单元
  - 批次是一组消息

模式
  - schema 使用额外的结构定义消息内容

主题和分区
  - 消息通过主题分类
  - 主题被分为若干个分区 通过分区来实现数据冗余和伸缩性

![屏幕截图 2020-08-12 152257](/assets/屏幕截图%202020-08-12%20152257.png)

生产者和消费者
  - 生产者创建消息
  - 消费者读取消息 一个分区只能由一个组内消费者消费 通过偏移量记录消息消费位置

![屏幕截图 2020-08-12 152638](/assets/屏幕截图%202020-08-12%20152638.png)

broker 和集群
  - broker 独立的 kafka 服务器
  - 每个集群都有一个broker 充当集群控制器

![屏幕截图 2020-08-12 152955](/assets/屏幕截图%202020-08-12%20152955.png)

对于消息 kafka会保留一段时间或者达到一定大小的字节数 旧的消息会被删除

多集群

![屏幕截图 2020-08-12 153137](/assets/屏幕截图%202020-08-12%20153137.png)

## 使用场景

- 活动跟踪
  - 生产者产生事件 消费者读取事件进行统计
- 传递消息
- 度量指标 日志记录
  - 收集系统度量指标和日志
- 日志系统
- 流处理

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

- 安装java zookeeper
- 下载二进制包
- `./kafka-server-start.sh`

## 配置

broker 配置

- broker.id
  - 在集群中唯一
  - 需要多少个broker
    - 需要多少磁盘空间保留数据
    - 集群处理请求的能力
- port
- zookeeper.connect
- log.dirs
  - 消息保存在磁盘上的位置
- num.recovery.threads.per.data.dir
  - 使用指定的线程池来处理日志
- auto.create.topics.enable
  - 自动创建主题
    - 当一个生产者开始往主题写入消息时
    - 当一个消费者开始读取
    - 客户端向主题发送元数据请求

主题配置

- num.partitions
  - 默认分区数量
- log.retention.ms
  - 数据保留多久
- log.retention.bytes
  - 主题保留的数据大小
- log.segment.bytes
  - 一个日志片段的最大大小
- log.segment.ms
  - 日志片段的最长打开时间
- message.max.bytes
  - 消息最大大小

## 命令操作

- 列出topic

```sh
./kafka-topics.sh --list --zookeeper 172.17.0.1:2181
```

- 创建topic

```sh
/opt/kafka/bin/kafka-topics.sh --create --zookeeper 172.17.0.1:2181 --replication-factor 1 --partitions 2 --topic my_log
```

- 生产者

```sh
./kafka-console-producer.sh --topic first --broker-list 172.17.0.1:9092
```

- 消费者

```sh
./kafka-console-consumer.sh --topic first --bootstrap-server 172.17.0.1:9092
```

## 工作流程

![屏幕截图 2020-08-05 153846](/assets/屏幕截图%202020-08-05%20153846.png)

Kafka 中消息是以 topic 进行分类的，生产者生产消息，消费者消费消息，都是面向 topic的

每个 partition 对应于一个 log 文件，该 log 文件中存储的就是 producer 生产的数据

Producer 生产的数据会被不断追加到该log 文件末端，且每条数据都有自己的 offset。消费者组中的每个消费者，都会实时记录自己消费到了哪个 offset，以便出错恢复时，从上次的位置继续消费

![屏幕截图 2020-08-05 155131](/assets/屏幕截图%202020-08-05%20155131.png)

index与log文件的作用：

![屏幕截图 2020-08-05 155619](/assets/屏幕截图%202020-08-05%20155619.png)

## 生产者

![屏幕截图 2020-08-20 150154](/assets/屏幕截图%202020-08-20%20150154.png)

发送消息：

```java
Properties props = new Properties();
//kafka 集群，broker-list
props.put("bootstrap.servers", "172.24.211.140:9092");
props.put("key.serializer",
        "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer",
        "org.apache.kafka.common.serialization.StringSerializer");
Producer<String,  String> producer  =  new
        KafkaProducer<>(props);
for (int i = 0; i < 10; i++) {
    var record =
            new ProducerRecord<>("test", "Precision Products",
                    "France");
    producer.send(record, new Callback() {
        @Override
        public void onCompletion(RecordMetadata metadata, Exception exception) {
            System.out.println(metadata);
        }
    });

}
producer.close();
```

### 配置

- acks
  - 定了必须要有多少个分区副本收到消息，生产者才会认为消息写入是成功的 
  - acks=0 ，生产者在成功写入消息之前不会等待任何来自服务器的响应 当 broker 故障时有可能 丢失数据
  - acks=1 ，只要集群的首领节点收到消息，生产者就会收到一个来自服务器的成功响应 如果在 follower同步成功之前 leader 故障，那么将会丢失数据
  -  acks=all ，只有当所有参与复制的节点全部收到消息时，生产者才会收到一个来自服务器的成功响应 如果在 follower 同步完成后，broker 发送 ack 之前，leader 发生故障，那么会造成 数据重复
- buffer.memory
  - 设置生产者内存缓冲区的大小
- compression.type
   - 设置消息压缩算法
- retries
  - 决定了生产者可以重发消息的次数，如果达到这个次数，生产者会放弃重试并返回错误
- batch.size
  - 指定了一个批次可以使用的内存大小
- linger.ms
  -  KafkaProducer 会在批次填满或 linger.ms 达到上限时把批次发送出去。默认情况下，只要有可用的线程，生产者就会把消息发送出去
- client.id
- max.in.flight.requests.per.connection
  - 指定了生产者在收到服务器响应之前可以发送多少个消息
-  timeout.ms、request.timeout.ms 和 metadata.fetch.timeout.ms
-  max.block.ms
   - 调用send时最长的阻塞时间
 - max.request.siz
 - receive.buffer.bytes 和 send.buffer.bytes
   - 分别指定了 TCP socket 接收和发送数据包的缓冲区大小

**顺序保证**

- 将max.in.flight.requests.per.connection设置为1

### 序列化器

- 自定义序列化器：实现`Serializer`接口
  - 不推荐使用
- 其他序列化
  - avro：一种将shcema嵌入在数据里的序列化方式

### 分区策略

分区的原因：

- 方便扩展
- 提高并发

分区原则：

- 指明 partition 的情况下，直接将指明的值直接作为 partiton 值
- 没有指明 partition 值但有 key 的情况下，将 key 的 hash 值与 topic 的 partition数进行取余得到 partition 值
- 否则就是随机取一个值 然后再这个值的基础上进行轮询

自定义分区器：

实现`Partitioner`接口

### 数据可靠性保证

- 副本数据同步策略

![屏幕截图 2020-08-06 110118](/assets/屏幕截图%202020-08-06%20110118.png)

ISR：

Leader 维护了一个动态的 in-sync replica set (ISR)，意为和 leader 保持同步的 follower 集合。当 ISR 中的 follower 完成数据的同步之后，leader 就会给 follower 发送 ack。如果 follower 长 时 间 未 向 leader 同 步 数 据 ， 则 该 follower 将 被 踢 出 ISR

Leader 发生故障之后，就会从 ISR 中选举新的 leader

故障处理：

![屏幕截图 2020-08-06 113738](/assets/屏幕截图%202020-08-06%20113738.png)

LEO ：指的是每个副本最大的 offset

HW ：指的是消费者能见到的最大的 offset ，ISR  队列中最小的 LEO 

follower 发生故障后会被临时踢出 ISR，待该 follower 恢复后，follower 会读取本地磁盘记录的上次的 HW，并将 log 文件高于 HW 的部分截取掉，从 HW 开始向 leader 进行同步。等该 follower  的 LEO  大于等于该 Partition 的 的 HW，即 follower 追上 leader 之后，就可以重新加入 ISR 了

leader 发生故障之后，会从 ISR 中选出一个新的 leader，之后，为保证多个副本之间的数据一致性，其余的 follower 会先将各自的 log 文件高于 HW 的部分截掉，然后从新的 leader同步数据

- Ecactly Once

将服务器的 ACK 级别设置为-1，可以保证 Producer 到 Server 之间不会丢失数据，即 AtLeast Once 语义

At Least Once + 幂等性 = Exactly Once

## 消费者

### 消费方式

采用 pull（拉）模式从 broker 中读取数据

### 分区分配策略

- 轮询
- range

### offset的维护

Kafka 0.9 版本之前，consumer 默认将 offset 保存在 Zookeeper 中，从 0.9 版本开始，consumer 默认将 offset 保存在 Kafka 一个内置的 topic 中，该 topic为__consumer_offsets。

## kafka高效读写数据

- 顺序读写磁盘
  -  producer 生产数据，要写入到 log 文件中，写的过程是一直追加到文件末端，为顺序写
- 零拷贝
  - 数据直接从内核到网卡

## zk的作用

Kafka 集群中有一个 broker 会被选举为 Controller，负责管理集群 broker 的上下线，所有 topic 的分区副本分配和 leader 选举等工作。Controller 的管理工作都是依赖于 Zookeeper 的。

## 事务

- 生产者事务
- 消费者事务

## API

- 发送流程

![屏幕截图 2020-08-10 124605](/assets/屏幕截图%202020-08-10%20124605.png)