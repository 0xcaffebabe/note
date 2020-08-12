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

## 数据结构

![批注 2020-02-26 195121](/assets/批注%202020-02-26%20195121.png)

- 层次化的目录结构，命名符合常规文件系统规范(类似文件系统）
- 每个节点在zookeeper中叫做znode,并且其有一个唯一的路径标识 
  - znode有两种类型：
    - 短暂（ephemeral），客户端断开连接zk删除ephemeral类型节点
    - 持久（persistent），客户端断开连接zk不删除persistent类型节点
  - 目录类型：
    - PERSISTENT
    - PERSISTENT_SEQUENTIAL（发生重复会自增）
    - EPHEMERAL
    - EPHEMERAL_SEQUENTIAL（发生重复会自增）
- 节点Znode可以包含数据和子节点（但是EPHEMERAL类型的节点不能有子节点）

## 特征/保障

- 顺序一致性 - 客户端的更新将按发送顺序应用。
- 原子性 - 更新成功或失败。没有部分结果。
- 统一视图 - 无论服务器连接到哪个服务器，客户端都将看到相同的服务视图。
- 可靠性 - 一旦应用了更新，它将从那时起持续到客户端覆盖更新。
- 及时性 - 系统的客户视图保证在特定时间范围内是最新的。

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

### zk的角色

角色|	说明
-|-
Leader(领导者)	|为客户端提供读和写的服务，负责投票的发起和决议，更新系统状态。
Follower（跟随者）|	为客户端提供读服务，如果是写服务则转发给Leader。在选举过程中参与投票。
Observe（观察者）|	为客户端提供读服务器，如果是写服务则转发给Leader。不参与选举过程中的投票，也不参与“过半写成功”策略。在不影响写性能的情况下提升集群的读性能。此角色于zookeeper3.3系列新增的角色。
client（客户端）|	连接zookeeper服务器的使用着，请求的发起者。独立于zookeeper服务器集群之外的角色。

### zab协议

#### 同步数据

- 写Leader

![2020812102252](/assets/2020812102252.jpg)

客户端向Leader发起写请求

Leader将写请求以Proposal的形式发给所有Follower并等待ACK

Follower收到Leader的Proposal后返回ACK

Leader得到过半数的ACK（Leader对自己默认有一个ACK）后向所有的Follower和Observer发送Commmit 如果一条消息没有接收到commit 那么这条消息对客户端不可见

Leader将处理结果返回给客户端

- 写Follower/Observer

![2020812102637](/assets/2020812102637.jpg)

多了一步转发请求

- 读操作

![2020812102720](/assets/2020812102720.jpg)

Leader/Follower/Observer都可直接处理读请求，从本地内存中读取数据并返回给客户端即可

### 选举过程

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