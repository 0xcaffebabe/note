# redis

> redis是一款高性能的NOSQL系列的非关系型数据库

![批注 2020-06-18 145713](/assets/批注%202020-06-18%20145713.png)

## 应用场景

- 缓存
- 实时性要求高的数据
- 消息队列
- 热点数据
- 计数器
- 数据过期处理（可以精确到毫秒）
- 分布式集群架构中的session分离
- 分布式锁

## 数据结构

二进制安全：底层没有类型概念，只有byte数组
所以客户端需要将数据序列化成字节数组

![批注 2020-06-18 132234](/assets/批注%202020-06-18%20132234.png)

- string
  - 字符串、数值、bit位图
  - incr：抢购，秒杀，详情页，点赞，评论
  - 做简单的KV缓存
  - 使用位图来处理海量数据
- 哈希类型 hash
  - 做对象属性读写
- 列表类型 list
  - 可以做消息队列或者可以来存储列表信息，进行分页查询
- 集合类型 set
  - 自动去重
  - 推荐系统：数据交集
- 有序集合类型 sortedset
  - 排序

## 命令操作

### 字符串类型

- 存储 `set key value`
- 获取 `get key`
- 删除 `del key`

#### bitmap

- setbit
- bitpos
- bitcount
- bitop

例子：

统计某个时间窗口内的登录天数

```sh
setbit cxk 1 1 # 第一天登录
setbit cxk 364 1 # 第364天登录
bitcount cxk 0 10 # 0 - 10天这个时间窗口登录了几天
```

统计某个时间窗口活跃用户数

```sh
setbit 200618 1 1 # 18号1号用户登录
setbit 200619 1 1 # 19号1号用户登录
setbit 200619 7 1 # 19号7号用户登录
bitop or ret 200618 200619 # 使用或运算合并bit
bitcount ret 0 0 # 统计有多少位1
```

### 哈希类型

```sh
help @hash
```

- 存储：`hset key field value`
- 获取：`hget key field`
- 删除： `hdel key field`

### 列表类型

```sh
help @list
```

- 将元素加入列表左边：`lpush key value`
- 将元素加入列表右边：`rpush key value`
- 范围获取：`lrange key start end`
- 删除列表最左边的元素，并将元素返回:`lpop key`
- 删除列表最右边的元素，并将元素返回:`rpop key`

### 集合类型

```sh
help @set
```

- 存储：`sadd key value`
- 获取：`smembers key`
- 删除：`srem key value`
- SRANDMEMBER  key  count
  - 正数：取出一个去重的结果集（不能超过已有集）
  - 负数：取出一个带重复的结果集，一定满足你要的数量
  - 如果：0，不返回

例子：抽奖

```sh
sadd k 1 2 3 4 5 6 7 8 9 # 9个用户
SRANDMEMBER k 3 # 抽取三个不重复用户
SRANDMEMBER k -3 # 抽取三个可能会重复的用户
```

### 有序集合类型

```sh
help @sorted_set
```

![批注 2020-06-19 113509](/assets/批注%202020-06-19%20113509.png)

物理内存左小右大

- 存储：`zadd key score value`
- 获取：`zrange key start end`
- 删除：`zrem key value`

### 通用

- keys * : 查询所有的键(生产环境应禁用，原因：正则表达式可能会占用大量资源)
- type key ： 获取键对应的value的类型
- del key：删除指定的key value
- exists key：判断指定的key是否存在
- expire key time：指定key的生存时间，单位：秒

## 数据结构

### 字典

```c
typedef struct dictht {
    dictEntry **table;
    unsigned long size;
    unsigned long sizemask;
    unsigned long used;
} dictht;
typedef struct dictEntry {
    void *key;
    union {
        void *val;
        uint64_t u64;
        int64_t s64;
        double d;
    } v;
    struct dictEntry *next;
} dictEntry;
```

redis使用了两张哈希表来方便扩容时的rehash操作

在进行rehash时，为避免给服务器带来过大负担，并不是一次性将所有值rehash到另外一张表，而是通过渐进的方式，每次对字典执行添加、删除、查找或者更新操作时，都会执行一次渐进式 rehash。

### 跳跃表

![202031284446](/assets/202031284446.png)

查找时，从上层开始查找，找到对应的区间后再到下一层继续查找，类似于二分查找

这种查找数据结构跟红黑树相比：

- 插入非常快，因为不需要在插入后进行旋转
- 实现容易
- 支持无锁操作

## 数据淘汰策略

设置内存最大使用量，当内存使用量超出时，会施行数据淘汰策略

策略              | 描述
--------------- | --------------------------
volatile-lru    | 从已设置过期时间的数据集中挑选最近最少使用的数据淘汰（**最常用**）
volatile-ttl    | 从已设置过期时间的数据集中挑选将要过期的数据淘汰
volatile-random | 从已设置过期时间的数据集中任意选择数据淘汰
allkeys-lru     | 从所有数据集中挑选最近最少使用的数据淘汰
allkeys-random  | 从所有数据集中任意选择数据进行淘汰
noeviction      | 禁止驱逐数据，当内存不足时，写入操作会被拒绝

## 持久化

通用持久化方案：

- 快照
- 日志

不要只使用某一持久化机制
要充分利用两种持久化机制的优点并避免它们的缺点

### RDB

将某个时间点的所有数据都存放到硬盘上
是对 redis 中的数据执行周期性的持久化

- 配置文件

> after 60 sec if at least 10000 keys changed save 60 10000

默认开启，保存在dump.rdb

```shell
# save时间，以下分别表示更改了1个key时间隔900s进行持久化存储；更改了10个key300s进行存储；更改10000个key60s进行存储。
save 900 1
save 300 10 # 在300秒内做了 10次写操作 才会触发
save 60 10000
```

**优缺点**

是某个时刻的全部数据，非常适合做冷备
对redis性能的影响较小
恢复比较迅速
会丢失一定数据
在生成rdb文件时，可能会暂停对客户端的服务一段时间

### AOF

以日志的形式保存每次操作
对每条写入命令作为日志

```
appendonly no（关闭aof） --> appendonly yes （开启aof）

appendfsync always ： 每一次操作都进行持久化
appendfsync everysec ： 每隔一秒进行一次持久化
appendfsync no     ： 让操作系统来决定何时同步
```

**优缺点**

更好地保护数据不丢失
append-only没有磁盘寻址开销
适合做灾备
aof文件比rdb大
aof对性能有一定的影响

## 事件

### 文件事件

![202031285728](/assets/202031285728.png)

### 时间事件

Redis 将所有时间事件都放在一个无序链表中，通过遍历整个链表查找出已到达的时间事件，并调用相应的事件处理器

## Jedis

### 基本使用

```java
Jedis jedis = new Jedis("127.0.0.1");

jedis.set("name","my");
System.out.println(jedis.get("name"));
jedis.close();
```

### 连接池

```java
JedisPoolConfig config = new JedisPoolConfig();
config.setMaxIdle(15);
config.setMaxTotal(30);

JedisPool pool = new JedisPool(config);

Jedis resource = pool.getResource();
System.out.println(resource.ping());
resource.close();

pool.close();
```

## Spring Data Redis

### RedisTemplate基本操作

- redisTemplate.opsForValue() ：操作字符串
- redisTemplate.opsForHash() ：操作hash
- redisTemplate.opsForList()：操作list
- redisTemplate.opsForSet()：操作set
- redisTemplate.opsForZSet()：操作zset

StringRedisTemplate是K,V均为String的RedisTemplate

### 使用

```java
template.opsForValue().set("name","hello,bitch");
```

### 事务

```java
// 开启事务支持
template.setEnableTransactionSupport(true);
// begin
try{
    template.multi();
    // 事务中的多个命令被一次性发送给服务器
    template.opsForValue().set("java","langeuage");
    template.opsForValue().set("python","langeuage");
    // commit
    template.exec();    
}catch (Exception e){
    template.discard();
}
```

## 实现发布订阅

- 消费者订阅频道

```shell
127.0.0.1:6379> SUBSCRIBE redisChat
```

- 生产者向频道发送数据

```shell
127.0.0.1:6379> PUBLISH redisChat "Redis is a great caching technique"
```

## 主从复制

通用集群方案：

- 主备集群
  - 全量数据同步
- 分片集群

![批注 2020-05-08 093046](/assets/批注%202020-05-08%20093046.png)

![批注 2020-03-19 165905](/assets/批注%202020-03-19%20165905.png)

强一致性与弱一致性

![批注 2020-05-08 093718](/assets/批注%202020-05-08%20093718.png)

redis的复制功能是支持多个数据库之间的数据同步。一类是主数据库（master）一类是从数据库（slave），主数据库可以进行读写操作，当发生写操作的时候自动将数据同步到从数据库，而从数据库一般是只读的，并接收主数据库同步过来的数据，一个主数据库可以有多个从数据库，而一个从数据库只能有一个主数据库

从 redis2.8 开始，就支持主从复制的断点续传

过程：

1：当一个从数据库启动时，会向主数据库发送PSYNC命令，
2：主数据库接收到sync命令后会开始在后台保存快照（执行rdb操作），并将保存期间接收到的命令缓存起来
3：当快照完成后，redis会将快照文件和所有缓存的命令发送给从数据库。
4：从数据库收到后，会载入快照文件并执行收到的缓存的命令
5：此后，当主服务器每执行一次写命令，就向从服务器发送相同的写命令

### 主从链

当从服务器过大，主服务器无法很快地更新所有从服务器，所以可以在中间创建一个从服务器中间层

![20203129441](/assets/20203129441.png)

### 配置

主服务配置(6379)

```
# 设置主服务器密码
requirepass 123
```

从服务器配置(6380)

```
# 设置访问主服务器得我密码
masterauth 123
# 设置主服务器地址端口
slaveof 127.0.0.1 6379
```

只能对主服务器进行写操作，从服务器只能读操作

## Redis哨兵机制

- 集群监控：负责监控 redis master 和 slave 进程是否正常工作。
- 消息通知：如果某个 redis 实例有故障，那么哨兵负责发送消息作为报警通知给管理员。
- 故障转移：如果 master node 挂掉了，会自动转移到 slave node 上。
- 配置中心：如果故障转移发生了，通知 client 客户端新的 master 地址

哨兵至少需要 3 个实例，来保证自己的健壮性

哨兵(sentinel) 是一个分布式系统,你可以在一个架构中运行多个哨兵(sentinel) 进程,这些进程使用流言协议(gossip protocols)来接收关于Master是否下线的信息,并使用投票协议(agreement protocols)来决定是否执行自动故障迁移,以及选择哪个Slave作为新的Master

![2020224134359](/assets/2020224134359.png)

### 数据丢失

- 主备切换时，master异步向salve同步的命令丢失导致数据丢失
- 网络异常，导致master暂时失联，当master重新连接上网络时，变成了slave，数据丢失

解决：拒绝客户端的写请求

### sdown与odown

- sdown：主观宕机，某一哨兵发现无法连接master
- odown，一定数量的哨兵发现无法连接master

### 哨兵集群的自动发现

通过 redis 的 pub/sub 系统实现的，每个哨兵都会往 `__sentinel__`:hello 这个 channel 里发送一个消息，内容是自己的 host、ip 和 runid 还有对这个 master 的监控配置,这时候所有其他哨兵都可以消费到这个消息，并感知到其他的哨兵的存在

## 集群

- 自动将数据进行分片，每个 master 上放一部分数据
- 提供内置的高可用支持，部分 master 不可用时，还是可以继续工作的

6379：对外服务
16379：节点间通信

### 场景集群方案

- 官方方案redis-cluster搭建
- 客户端分片技术（不推荐），扩容/缩容时，必须手动调整分片程序，出现故障不能自动转移
- 主从复制方式：数据冗余

### redis-cluster原理

![2020225163638](/assets/2020225163638.png)

redis cluster 有固定的 16384 个 hash slot，集群中的每个node平均分配得到一定的slot

增加一个 master，就将其他 master 的 hash slot 移动部分过去，减少一个 master，就将它的 hash slot 移动到其他 master 上去

### 节点间的通信

redis 维护集群元数据采用了gossip协议，所有节点都持有一份元数据，不同的节点如果出现了元数据的变更，就不断将元数据发送给其它的节点

但是元数据的更新有延时，可能导致集群中的一些操作会有一些滞后

### gossip协议

- meet：某个节点发送 meet 给新加入的节点，让新节点加入集群中，然后新节点就会开始与其它节点进行通信
- ping：每个节点都会频繁给其它节点发送 ping，其中包含自己的状态还有自己维护的集群元数据，互相通过 ping 交换元数据
- pong：返回 ping 和 meeet，包含自己的状态和其它信息，也用于信息广播和更新
- fail：某个节点判断另一个节点 fail 之后，就发送 fail 给其它节点，通知其它节点说，某个节点宕机了

## 线程模型

redis采用 IO 多路复用机制同时监听多个 socket，将产生事件的 socket 压入内存队列中，事件分派器根据 socket 上的事件类型来选择对应的事件处理器进行处理

### 单线程模型也能高效率的原因

- 纯内存操作
- C语言实现
- 基于非阻塞IO多路复用
- 单线程避免了频繁上下文切换带来的性能损失以及多线程的锁竞争问题

## redis vs memcached

- redis支持复杂的数据结构
- redis支持原生集群
- redis 只使用单核，而 memcached 可以使用多核