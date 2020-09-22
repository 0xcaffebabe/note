# Zookeeper

提供了协调分布式应用的基本服务，它提供了以下通用服务：

- 分布式同步（Distributed Synchronization）
- 命名服务（Naming Service）
- 集群维护（Group Maintenance）

## 应用场景

- 命名服务

通过使用命名服务，客户端应用能够根据指定名字来获取资源或服务的地址，提供者等信息

![批注 2020-03-21 150252](/assets/批注%202020-03-21%20150252.png)

- 数据发布与订阅（配置中心）

发布者将数据发布到ZK节点上，供订阅者动态获取数据，实现配置信息的集中式管理和动态更新

- 分布式通知/协调

watcher注册与异步通知机制，能够很好的实现分布式环境下不同系统之间的通知与协调，实现对数据变更的实时处理

![批注 2020-03-21 150114](/assets/批注%202020-03-21%20150114.png)

- 分布式事务

分布式事务中最重要的就是要有一个协调者，ZK就充当了这个角色

- 分布式锁

保持独占，就是所有试图来获取这个锁的客户端，最终只有一个可以成功获得这把锁
控制时序，就是所有试图来获取这个锁的客户端，最会按获取锁的顺序来获得锁

![批注 2020-03-21 150204](/assets/批注%202020-03-21%20150204.png)

- 集群管理与Master选举

能够快速对集群中机器变化作出响应并将变化推送给客户端
有些业务逻辑（例如一些耗时的计算，网络I/O处理），往往只需要让整个集群中的某一台机器进行执行，其余机器可以共享这个结果

![批注 2020-03-21 150325](/assets/批注%202020-03-21%20150325.png)

- 负载均衡

在分布式环境中，为了保证高可用性，通常同一个应用或同一个服务的提供方都会部署多份，达到对等服务。而消费者就须要在这些对等的服务器中选择一个来执行相关的业务逻辑

## 基础

### 数据结构

![批注 2020-02-26 195121](/assets/批注%202020-02-26%20195121.png)

- 层次化的目录结构，命名符合常规文件系统规范(类似文件系统）
- 每个节点在zookeeper中叫做znode,并且其有一个唯一的路径标识 
  - znode有4种类型：
    - 临时节点（ephemeral），客户端断开连接zk会删除ephemeral类型节点
    - 持久节点（persistent），客户端断开连接zk不删除persistent类型节点
    - PERSISTENT_SEQUENTIAL 持久且有序的节点 发生重复会自增 
    - EPHEMERAL_SEQUENTIAL 临时且有序的节点 发生重复会自增
- 节点Znode可以包含数据和子节点（但是EPHEMERAL类型的节点不能有子节点）
    - 如果一个znode节点包含任何数据，那么数据存储为字节数组

### 监视与通知

监视点会触发一个通知。为了接收多个通知，客户端必须在每次通知后设置一个新的监视点

客户端可以设置多种监视点：

- 监控znode的数据变化
- 监控znode子节点的变化
- 监控znode的创建或删除

### 版本号

每一个znode都有一个版本号，它随着每次数据变化而自增 使用版本号有效避免并发写问题

### 特征/保障

- 顺序一致性 - 客户端的更新将按发送顺序应用。
- 原子性 - 更新成功或失败。没有部分结果。
- 统一视图 - 无论服务器连接到哪个服务器，客户端都将看到相同的服务视图。
- 可靠性 - 一旦应用了更新，它将从那时起持续到客户端覆盖更新。
- 及时性 - 系统的客户视图保证在特定时间范围内是最新的。

## 架构

- 独立模式：单机
- 仲裁模式：集群

在集群模式下 最多能容忍服务器挂掉的数量为 总服务器/2 +1

### 会话

- zk客户端的会话可以透明地在多台服务器上转移
- 同一个会话中的请求遵循FIFO

会话状态：

![2020920145633](/assets/2020920145633.png)

网络分区时的CONNECTING：

如果因网络分区问题导致客户端与ZooKeeper集群被隔离而发生连接断开，那么其CONNECTING状态将会一直保持，直到显式地关闭这个会话，或者分区问题修复后，客户端能够获悉ZooKeeper服务器发送的会话已经过期

设置了超时时间t 果经过时间t之后服务接收不到这个会话的任何消息，服务就会声明会话过期

客户端如果经过t/3的时间未收到任何消息，客户端将向服务器发送心跳消息。在经过2t/3时间后，ZooKeeper客户端开始寻找其他的服务器

重连：

客户端重连时根据zxid来判断服务器数据是否最新 来决定是否连接

![202092015424](/assets/202092015424.png)

## JAVA操作

- 依赖

```xml
<dependency>
    <groupId>org.apache.zookeeper</groupId>
    <artifactId>zookeeper</artifactId>
    <version>3.5.7</version>
</dependency>
```

- 新增节点

```java
CountDownLatch latch = new CountDownLatch(1);
// 连接zk
ZooKeeper zk = new ZooKeeper("localhost:2181", 5000, new Watcher() {
    @Override
    public void process(WatchedEvent watchedEvent) {
        // 监听节点变化
        latch.countDown();
    }
});
latch.await();
// 创建节点
String ret = zk.create("/test", "jntm".getBytes(), ZooDefs.Ids.OPEN_ACL_UNSAFE, CreateMode.PERSISTENT);
System.out.println(ret);
zk.close();
```

## 实现负载均衡

使用Zookeeper实现负载均衡原理，服务器端将启动的服务注册到，zk注册中心上，采用临时节点。客户端从zk节点上获取最新服务节点信息，本地使用负载均衡算法，随机分配服务器

- 使用zkclient

```xml
<dependency>
    <groupId>com.101tec</groupId>
    <artifactId>zkclient</artifactId>
    <version>0.11</version>
</dependency>
```

- 服务端在启动之后注册到zk

```java
public void registerServer() {
    // 将当前服务器ip 端口作为一个节点value注册到/service节点下
    ZkClient zkClient = new ZkClient("127.0.0.1:2181", 5000);
    // 先创建父节点
    String root = "/service";
    if (!zkClient.exists(root)) {
        zkClient.createPersistent(root);
    }
    String nodeName = root+"/service_"+port;
    String nodeValue = "127.0.0.1:"+port;
    if (zkClient.exists(nodeName)){
        zkClient.delete(nodeName);
    }
    zkClient.createEphemeral(nodeName,nodeValue);
    System.out.println("服务注册成功");
}
```

- 客户端启动之后获取服务器列表

```java
public static void initServer() {
    // 连接zk获取/service节点下注册的所有节点，并且获取这些节点的value
    listServer.clear();
    ZkClient zkClient = new ZkClient("127.0.0.1:2181", 5000);
    String root = "/service";
    List<String> children = zkClient.getChildren(root);
    for (String s : children) {
        String path = root + "/" + s;
        String readData = zkClient.readData(path);
        listServer.add(readData);
    }
    System.out.println("获取服务器成功:"+listServer);
    // 监听节点变化，当新增服务或者服务下线之后都会得到通知
    zkClient.subscribeChildChanges(root, new IZkChildListener() {
        @Override
        public void handleChildChange(String rootPath, List<String> list) throws Exception {
            listServer.clear();
            for (String s : list) {
                String path = root + "/" + s;
                String readData = zkClient.readData(path);
                listServer.add(readData);
            }
            System.out.println("服务器列表发生改变:"+listServer);
        }
    });
}
```

- 客户端可以通过一些负载均衡算法选择服务器

```java
public static String getServer() {
    // 简单轮询
    count++;
    return listServer.get(count%2);
}
```

## master选举

### 原理

多个服务器在启动的时候，会在Zookeeper上创建相同的临时节点，谁如果能够创建成功，谁就为主(因为节点保证唯一)，如果主服务宕机之后，会话连接也会失效，其他服务器有开始重新选举。

### 实现

```java
// 创建节点成功就代表自己选举为主节点
if (createNode()){
    log.info("{}选举为主节点成功",serverPort);
}else {
    log.info("{}成为从节点",serverPort);
}
// 增加监听，当节点被删除（主节点挂掉了），重新竞争
zkClient.subscribeDataChanges(path, new IZkDataListener() {
    @Override
    public void handleDataChange(String dataPath, Object data) throws Exception {
    }
    @Override
    public void handleDataDeleted(String dataPath) throws Exception {
        log.info("重新选举");
        if (createNode()){
            log.info("{}选举为主节点成功",serverPort);
        }else {
            log.info("{}成为从节点",serverPort);
        }
    }
});

private boolean createNode() {
    try {
        zkClient.createEphemeral(path);
        return true;
    } catch (Exception e) {
        return false;
    }
}
```

## 集群

为了保证高可用，如果某个服务实现宕机的话，实现故障转移

整个集群可用节点数量必须大于一半，否则无法正常使用

脑裂问题：当由于网络故障 整个网络被分裂成几个独立的小岛 各个小岛之间的服务器还能通信 它们就会进行自己选举 后对外提供服务 导致整个大集群被分裂成几个小集群 从而导致数据不一致

### 服务器的构成

在独立服务器模式下：

![202092115855](/assets/202092115855.png)

- PrepRequestProcessor接受客户端的请求并执行这个请求，处理结果则是生成一个事务
- SyncRequestProcessor负责将事务持久化到磁盘上
- 在FinalRequestProcessor 如果Request对象包含事务数据，该处理器将会接受对ZooKeeper数据树的修改，否则，该处理器会从数据树中读取数据并返回给客户端

集群模式下的leader：

![2020921151321](/assets/2020921151321.png)

- ProposalRequestProcessor会准备一个提议，并将该提议发送给跟随者
    - 对于写操作请求，还会将请求转发给SyncRequestProcessor
    - SyncRequestProcessor执行完之后会触发AckRequestProcessor处理器，这个处理器是一个简单请求处理器，它仅仅生成确认消息并返回给自己
- CommitRequestProcessor会将收到足够多的确认消息的提议进行提交
- oBeAppliedRequestProcessor会做好commit消息的确认处理

集群模式下的跟随者：

![2020921152143](/assets/2020921152143.png)

- FollowerRequestProcessor处理器之后转发请求给CommitRequestProcessor，同时也会转发写请求到群首服务器
    - commit处理器在得到leader的commit消息之前会一直阻塞
- SendRequestProcessor会向leader发送确认消息

### 存储

- 日志

服务器通过事务日志来持久化事务 服务器会时不时地滚动日志，即关闭当前文件并打开一个新的文件

服务器只有在强制将事务写入事务日志之后才确认对应的提议

- 快照

每一个服务器会经常以序列化整个数据树的方式来提取快照

因为服务器在进行快照时还会继续处理请求，所以当快照完成时，数据树可能又发生了变化，我们称这样的快照是模糊的（fuzzy） 为了解决这个问题 需要记录序列化开始到序列化结束这段时间的操作 并将它重放到结果中

### 会话

会话状态由 leader 维护

为了保证会话的存活，服务器需要接收会话的心跳信息 心跳可以是消息请求或者ping消息

leader发送一个PING消息给它的追随者们，追随者们返回自从最新一次PING消息之后的一个session列表 群首服务器每半个tick就会发送一个ping消息

使用过期队列来管理会话的过期 通过一个叫bucket的数据结构批量管理会话 每次会将一批过期的会话清理掉

### 监视点

一个WatchManager类的实例负责管理当前已被注册的监视点列表，并负责触发它们 每种类型的服务器管理监视点的方法都是一样的

监视点只会保存在内存

### zk的角色

角色|	说明
-|-
Leader(领导者)	|为客户端提供读和写的服务，负责投票的发起和决议，更新系统状态。
Follower（跟随者）|	为客户端提供读服务，如果是写服务则转发给Leader。在选举过程中参与投票。
Observe（观察者）|	为客户端提供读服务器，如果是写服务则转发给Leader。观察者只获取一条包含已提交提议的内容的INFORM消息。不参与选举过程中的投票，也不参与“过半写成功”策略。在不影响写性能的情况下提升集群的读性能。
client（客户端）|	连接zookeeper服务器的使用着，请求的发起者。独立于zookeeper服务器集群之外的角色。

### zab协议

zab的事务保障：

- 如果leader按顺序广播了事务T1和事务T2，那么每个服务器在提交T2事务前保证事务T1已经提交完成
- 如果某个服务器按照事务T1、事务T2的顺序提交事务，所有其他服务器也必然会在提交事务T2前提交事务T1

zab的领导保障：

- 一个被选举的leader确保在提交完所有之前需要提交的事务，之后才开始广播新的事务
- 在任何时间点，都不会出现两个leader

#### 读写数据

- 写Leader

![2020812102252](/assets/2020812102252.jpg)

0. 客户端向Leader发起写请求
1. Leader将写请求 (对于这个请求的事务包括了两个重要字段：节点中**新的数据字段值**和该**节点新的版本号**) 以Proposal的形式发给所有Follower并等待ACK
2. Follower收到Leader的Proposal后返回ACK
3. Leader得到过半数的ACK（Leader对自己默认有一个ACK）后向所有的Follower和Observer发送Commmit (如果一条消息没有接收到commit 那么这条消息对客户端不可见)
4. Leader将处理结果返回给客户端

这里需要注意到的是请求的事务具有两个特性：

1. 原子性
2. 幂等性

每个事务都有一个zxid(事务ID), 这个id是保证事务按序执行的关键与集群选举的重要依据

- 写Follower/Observer

![2020812102637](/assets/2020812102637.jpg)

多了一步跟随者转发请求到领导者

- 读操作

![2020812102720](/assets/2020812102720.jpg)

Leader/Follower/Observer都可直接处理读请求，从本地内存中读取数据并返回给客户端即可， 所以ZooKeeper在处理以只读请求为主要负载时，性能会很高

#### 同步数据

当leader发生变化时 有两种方式来更新跟随者：

- DIFF 发送缺失的事务点
- SNAP 发送数据的完整快照

### 选举过程

![202092114316](/assets/202092114316.png)

服务器启动阶段的Leader选举：

- 每台服务器启动时，都会给自己投票。
- 投完票之后，会把自己的投票结果广播给集群中的每一台服务器。
- 这样每台服务器都有集群所有服务器的投票，会优先比较zxid zxid最大的就是为leader 如果zxid都相同 则leader 就是myid最大的那台服务器

服务器运行期间的Leader选举：

运行期间leader挂了 重复上面操作

### 搭建

- 在zk配置文件配置服务器集群

```
server.0=192.168.182.128:2888:3888
server.1=192.168.182.129:2888:3888
server.2=192.168.182.130:2888:3888
```

- 修改zk myid
- 启动各个zk

### 连接集群

```java
ZkClient zkClient = new ZkClient("192.168.182.128:2181,192.168.182.129:2181,192.168.182.130:2181");
zkClient.createPersistent("/lock");
zkClient.close();
```