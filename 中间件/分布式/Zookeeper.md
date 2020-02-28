# Zookeeper

分布式开源框架，提供了协调分布式应用的基本服务，它提供了以下通用服务：

- 分布式同步（Distributed Synchronization）
- 命名服务（Naming Service）
- 集群维护（Group Maintenance）

## 应用场景

- 命名服务

通过使用命名服务，客户端应用能够根据指定名字来获取资源或服务的地址，提供者等信息

- 数据发布与订阅（配置中心）

发布者将数据发布到ZK节点上，供订阅者动态获取数据，实现配置信息的集中式管理和动态更新

- 分布式通知/协调

watcher注册与异步通知机制，能够很好的实现分布式环境下不同系统之间的通知与协调，实现对数据变更的实时处理

- 分布式事务

分布式事务中最重要的就是要有一个协调者，ZK就充当了这个角色

- 分布式锁

保持独占，就是所有试图来获取这个锁的客户端，最终只有一个可以成功获得这把锁
控制时序，就是所有试图来获取这个锁的客户端，最会按获取锁的顺序来获得锁

- 集群管理与Master选举

能够快速对集群中机器变化作出响应并将变化推送给客户端
有些业务逻辑（例如一些耗时的计算，网络I/O处理），往往只需要让整个集群中的某一台机器进行执行，其余机器可以共享这个结果

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
    - EPHEMERAL_SEQUENTIAL
- 节点Znode可以包含数据和子节点（但是EPHEMERAL类型的节点不能有子节点）

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

## 实现分布式锁

### 解决方案

- 数据库
- redis
- zookeeper
  - 实现简单，失效时间容易控制
- SpringCloud内置全局锁

### 原理

多个jvm同时在zookeeper.上创建同一个相同的节点(/lock) , 因为zookeeper节点是唯一的，如果是唯一的话，那么同时如果有多个客户端创建相同的节点/lock的话，最终只有看谁能够快速的抢资源，谁就能创建/lock节点,这个时候节点类型应该使用临时类型。

当一个JVM释放锁后（关闭zk连接），临时节点会被删除，等待锁的其他JVM会收到节点被删除的通知，这些等待的JVM会重新参与到竞争

需要注意的是，要根据业务设置锁等待时间，避免死锁

### 实现

- 上锁

```java
public void lock() {
    // 尝试获取锁，如果成功，就真的成功了
    if (tryLock()) {
        System.out.println(Thread.currentThread().getName() + "获取锁成功");
    // 否则等待锁
    } else {
        waitLock(); 
        // 当等待被唤醒后重新去竞争锁
        lock();
    }
}
private boolean tryLock() {
    try {
        // 通过zk创建临时节点的成功与否来表示是否获得锁
        zkClient.createEphemeral("/lock");
        return true;
    } catch (Exception e) {
        return false;
    }
}
private void waitLock() {
    // 监听节点被删除的事件
    zkClient.subscribeDataChanges("/lock", new IZkDataListener() {
        @Override
        public void handleDataDeleted(String s) throws Exception {
            // 如果节点被删除，唤醒latch
            if (latch != null) {
                latch.countDown();
            }
        }
    });
    // 如果zk有lock这个锁
    if (zkClient.exists("/lock")) {
        // 在这里进行等待，直至被上面的事件监听唤醒
        latch = new CountDownLatch(1);
        try {
            latch.await();
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }
    // 等待完成删除所有监听事件，避免监听器堆积影响性能
    zkClient.unsubscribeAll();
}
```

- 释放锁

```java
public void release() {
    if (zkClient != null) {
        // 关闭zk客户端，临时节点也随之被删除，相当于释放锁，让其他人去竞争
        zkClient.close();
        System.out.println(Thread.currentThread().getName()+"释放锁完成");
    }
}
```