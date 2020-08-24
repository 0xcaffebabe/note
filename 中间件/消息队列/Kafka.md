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

- Partition ：为了实现扩展性，一个非常大的 topic 可以分布到多个 broker（即服务器）上，
一个 topic  可以分为多个 partition，每个 partition 是一个有序的队列；
- Replica： ：副本，为保证集群中的某个节点发生故障时，该节点上的 partition 数据不丢失，且 kafka 仍然能够继续工作，kafka 提供了副本机制，一个 topic 的每个分区都有若干个副本，
一个 leader 和若干个 follower。
- leader ：每个分区多个副本的“主”，生产者发送数据的对象，以及消费者消费数据的对
象都是 leader。
  - 生产者和消费者只与 leader 副本交互,当 leader 副本发生故障时会从 follower 中选举出一个 leader,但是 follower 中如果有和 leader 同步程度达不到要求的参加不了 leader 的竞选
- follower ：每个分区多个副本中的“从”，实时从 leader 中同步数据，保持和 leader 数据
的同步。leader 发生故障时，某个 follower 会成为新的 follower。

### 分区与副本机制

- 各个 Partition 可以分布在不同的 Broker 上, 这样便能提供比较好的并发能力（负载均衡）
- 副本极大地提高了消息存储的安全性, 提高了容灾能力，不过也相应的增加了所需要的存储空间

### zk的作用

主要为 Kafka 提供元数据的管理的功能

- Broker 注册 ：在 Zookeeper 上会有一个专门用来进行 Broker 服务器列表记录的节点
- Topic 注册：分区信息及与 Broker 的对应关系也都是由 Zookeeper 在维护

## 应用场景

- 消息队列
- 行为跟踪
- 日志收集
- 流处理
- 事件源
- 持久性日志

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

![屏幕截图 2020-08-24 085111](/assets/屏幕截图%202020-08-24%20085111.png)

保证顺序的方法就是：

1. 每个主题只分为一个区
2. 每次发送的消息发送到同一个分区

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

- Ecactly Once

将服务器的 ACK 级别设置为-1，可以保证 Producer 到 Server 之间不会丢失数据，即 AtLeast Once 语义

At Least Once + 幂等性 = Exactly Once

## 消费者

![屏幕截图 2020-08-21 133318](/assets/屏幕截图%202020-08-21%20133318.png)

分区的所有权从一个消费者转移到另一个消费者，这样的行为被称为再均衡

消费者通过向被指派为群组协调器的 broker（不同的群组可以有不同的协调器）发送心跳来维持它们和群组的从属关系以及它们对分区的所有权关系

```java
Properties props = new Properties();
//kafka 集群，broker-list
props.put("bootstrap.servers", "172.24.211.140:9092");
props.put("group.id", "consumer1");
props.put("key.deserializer",
        "org.apache.kafka.common.serialization.StringDeserializer");
props.put("value.deserializer",
        "org.apache.kafka.common.serialization.StringDeserializer");
KafkaConsumer<String, String> consumer = new KafkaConsumer<String,
                        String>(props);
consumer.subscribe(List.of("test"));
while(true){
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(1000));
    for (ConsumerRecord<String, String> record : records) {
        System.err.println(record);
    }
}
```

消费方式:

采用 pull（拉）模式从 broker 中读取数据

### 配置

- fetch.min.bytes
  - 指定了消费者从服务器获取记录的最小字节数
- fetch.max.wait.ms
  - 指定 broker 的等待时间
- max.partition.fetch.bytes
   - 指定了服务器从每个分区里返回给消费者的最大字节数
- session.timeout.ms
  - 指定了消费者在被认为死亡之前可以与服务器断开连接的时间
- auto.offset.reset
  - 指定了消费者在读取一个没有偏移量的分区或者偏移量无效的情况下（因消费者长时间失效，包含偏移量的记录已经过时并被删除）该作何处理
- enable.auto.commit
  - 指定了消费者是否自动提交偏移量
- partition.assignment.strategy 决定哪些分区应该被分配给哪个消费者
  - range:该策略会把主题的若干个连续的分区分配给消费者
  - 轮询：该策略把主题的所有分区逐个分配给消费者
- client.id
- max.poll.records 控制单次调用 call() 方法能够返回的记录数量
-  receive.buffer.bytes 和 send.buffer.bytes
   -  读写数据时用到的 TCP 缓冲区也可以设置大小

### 偏移量

更新分区当前偏移量的操作叫作**提交**

Kafka 0.9 版本之前，consumer 默认将 offset 保存在 Zookeeper 中，从 0.9 版本开始，consumer 默认将 offset 保存在 Kafka 一个内置的 topic 中，该 topic为__consumer_offsets。

自动提交：

- 如果 enable.auto.commit 被设为 true ，那么每过 5s，消费者会自动把从 poll() 方法接收到的最大偏移量提交上去

手动提交：

把 auto.commit.offset 设为 false ，使用 commitSync()

异步提交 commitAsync() , 但该方法在发生错误时不会进行重试

再均衡监听：

订阅的时候传入 ConsumerRebalanceListener 实现相关接口

从特定偏移量开始处理：`seekToBeginning(..)`

读取特定偏移量：`seek(..)`

### 退出

其他线程调用`consumer.wakeup()` 会使consumer在poll抛出异常 然后进行close即可

### 没有群组的消费者

调用assign为其设置消费的分区

## 深入

### 集群成员关系

broker通过创建临时节点把自己的 ID 注册到 Zookeeper

控制器：一个特殊的broker 通过在zk创建临时节点进行选举

控制器负责在节点加入或离开集群时进行分区首领选举。控制器使用epoch 来避免“脑裂”

### 复制

- 首领副本
  - 所有生产者请求和消费者请求都会经过这个副本
- 跟随者副本
  - 从首领那里复制消息，保持与首领一致的状态

### 请求处理

![屏幕截图 2020-08-21 143247](/assets/屏幕截图%202020-08-21%20143247.png)

生产请求：

在消息被写入分区的首领之后，broker 开始检查 acks 配置参数——如果 acks 被设为 0 或 1 ，那么 broker 立即返回响应；如果 acks 被设为 all ，那么请求会被保存在一个叫作炼狱的缓冲区里，直到首领发现所有跟随者副本都复制了消息，响应才会被返回给客户端

获取请求：

broker 将按照客户端指定的数量上限从分区里读取消息，再把消息返回给客户端。Kafka 使用零复制技术向客户端发送消息(直接从文件系统缓存复制到网卡)

![屏幕截图 2020-08-21 144218](/assets/屏幕截图%202020-08-21%20144218.png)

所有同步副本复制了这些消息，才允许消费者读取它们

![屏幕截图 2020-08-21 144435](/assets/屏幕截图%202020-08-21%20144435.png)

### 物理存储

文件管理：

分区分成若干个片段 当前正在写入数据的片段叫作活跃片段

## 可靠数据传递

kafka 的保证：

- 分区消息的顺序
- 只有当消息被写入分区的所有同步副本时（但不一定要写入磁盘），它才被认为是“已提交”的
- 只要还有一个副本是活跃的，那么已经提交的消息就不会丢失
- 消费者只能读取已提交的消息

副本的同步保证：

- 与 Zookeeper 之间有一个活跃的会话，也就是说，它在过去的 6s（可配置）内向Zookeeper 发送过心跳
- 过去的 10s 内（可配置）从首领那里获取过消息
- 过去的 10s 内从首领那里获取过最新的消息

### broker

复制系数：

主题级别 replication.factor broker级别  default.replication.factor

如果复制系数为 N，那么在 N-1 个 broker 失效的情况下，仍然能够从主题读取数据或向主题写入数据，同时 它们也会占用N倍的磁盘空间、

不完全首领选举：

如果把 unclean.leader.election.enable 设为 true ，就是允许不同步的副本成为首领 就要承担丢失数据和出现数据不一致的风险

最少同步副本：

min.insync.replicas 如果要确保已提交的数据被写入不止一个副本，就需要把最少同步副本数量设置为大一点

### 生产者

发送确认：

acks：0  能够通过网络把消息发送出去，那么就认为消息已成功写入

1 ：意味着首领在收到消息并把它写入到分区数据文件（不一定同步到磁盘上）时
会返回确认或错误响应

all： 首领在返回确认或错误响应之前，会等待所有同步副本都收到消息

重试参数：

对于一些错误 可以通过重试来解决 如： LEADER_NOT_AVAILABLE

### 消费者

显示提交偏移量：

- 处理完事件再提交
- 批量提交
- 重试
- 维护状态
- 避免对消息处理时间过程 否则会造成无法及时发送心跳
- 仅一次传递
  - 暂时支持不了 使用幂等性写入来实现

## 数据管道

需要考虑的问题：

- 及时性
- 可靠性
  - 至少一次传递 仅一次传递
- 吞吐量要求
  - 高
  - 动态调整
- 数据格式与转换问题
- 安全性
  - 传输安全
  - 权限安全
- 故障处理
- 数据管道与上下游的耦合

### Connect

启动 connect:

```sh
./bin/connect-distributed.sh ./config/connect-distributed.properties
```

文件数据源:

```
POST localhost:8083/connectors
{"name":"load-kafka-config", "config":{"connector.class":"FileStreamSource","file":"config/server.properties","topic":"kafka-config-topic"}}
```

传递文件数据源到主题上

**深入**

- 连接器
- 任务
- worker进程
- 转换器
- 偏移量管理

## 集群镜像

使用场景：

- 区域集群 中心集群
- 数据冗余
- 云迁移

### 多集群架构

跨数据中心通信：

- 高延迟
- 带宽有限
- 高成本

中心架构：

![屏幕截图 2020-08-22 144033](/assets/屏幕截图%202020-08-22%20144033.png)

主从架构：

![屏幕截图 2020-08-22 144112](/assets/屏幕截图%202020-08-22%20144112.png)

双活架构：

![屏幕截图 2020-08-22 144741](/assets/屏幕截图%202020-08-22%20144741.png)

主备架构：

![屏幕截图 2020-08-22 145035](/assets/屏幕截图%202020-08-22%20145035.png)

### MirrorMaker

![屏幕截图 2020-08-22 145553](/assets/屏幕截图%202020-08-22%20145553.png)

如果有可能，尽量让 MirrorMaker 运行在目标数据中心里

## 监控

所有度量指标都可以通过 Java Management Extensions（JMX）接口来访问

### broker

非同步分区数量：

- 如果集群里多个 broker 的非同步分区数量一直保持不变，那说明集群中的某个 broker 已经离线了
- 如果非同步分区的数量是波动的，或者虽然数量稳定但并没有 broker 离线，说明集群出现了性能问题

集群问题：

- 不均衡的负载
- 资源过度消耗

主机问题：

- 硬件
- 进程冲突
- 配置问题

## 流式处理

> 数据流:无边界数据集的抽象表示
> 数据流是有序的, 不可变的, 可重播的
> 流式处理是持续地从一个无边界的数据集读取数据，然后对它们进行处理并生成结果

### 概念

时间：

- 事件时间
  -  所追踪事件的发生时间和记录的创建时间
- 处理时间
  - 收到事件之后要对其进行处理的时间

状态：

- 内部状态
  -  只能被单个应用程序实例访问
- 外部状态
  - 使用外部的数据存储来维护

时间窗口：

![屏幕截图 2020-08-23 112304](/assets/屏幕截图%202020-08-23%20112304.png)

### 设计模式

单事件处理：

![屏幕截图 2020-08-23 112459](/assets/屏幕截图%202020-08-23%20112459.png)

本地状态事件处理：

![屏幕截图 2020-08-23 112551](/assets/屏幕截图%202020-08-23%20112551.png)

多阶段处理：

![屏幕截图 2020-08-23 112748](/assets/屏幕截图%202020-08-23%20112748.png)

外部数据源填充：

![屏幕截图 2020-08-23 112929](/assets/屏幕截图%202020-08-23%20112929.png)

连接流：

![屏幕截图 2020-08-23 113209](/assets/屏幕截图%202020-08-23%20113209.png)

对乱序事件重排序

重新处理：

使用新处理程序从头读取数据流生成结果流

### Kafka Streams 架构

拓扑结构：

![屏幕截图 2020-08-23 114308](/assets/屏幕截图%202020-08-23%20114308.png)

对拓扑结构伸缩：

![屏幕截图 2020-08-23 114438](/assets/屏幕截图%202020-08-23%20114438.png)