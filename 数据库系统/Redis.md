# redis

> redis是一款高性能的NOSQL系列的非关系型数据库

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

- 字符串类型 string
- 哈希类型 hash
- 列表类型 list
- 集合类型 set
- 有序集合类型 sortedset

## 命令操作

### 字符串类型

- 存储：`set key value`
- 获取 `get key`
- 删除 `del key`

### 哈希类型

- 存储：`hset key field value`
- 获取：`hget key field`
- 删除： `hdel key field`

### 列表类型

- 将元素加入列表左边：`lpush key value`
- 将元素加入列表右边：`rpush key value`
- 范围获取：`lrange key start end`
- 删除列表最左边的元素，并将元素返回:`lpop key`
- 删除列表最右边的元素，并将元素返回:`rpop key`

### 集合类型

- 存储：`sadd key value`
- 获取：`smembers key`
- 删除：`srem key value`

### 有序集合类型

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
volatile-lru    | 从已设置过期时间的数据集中挑选最近最少使用的数据淘汰
volatile-ttl    | 从已设置过期时间的数据集中挑选将要过期的数据淘汰
volatile-random | 从已设置过期时间的数据集中任意选择数据淘汰
allkeys-lru     | 从所有数据集中挑选最近最少使用的数据淘汰
allkeys-random  | 从所有数据集中任意选择数据进行淘汰
noeviction      | 禁止驱逐数据


## 持久化

### RDB

将某个时间点的所有数据都存放到硬盘上

- 配置文件

> after 60 sec if at least 10000 keys changed save 60 10000

默认开启，保存在dump.rdb

```shell
# save时间，以下分别表示更改了1个key时间隔900s进行持久化存储；更改了10个key300s进行存储；更改10000个key60s进行存储。
save 900 1
save 300 10 # 在300秒内做了 10次写操作 才会触发
save 60 10000
```

### AOF

- 以日志的形式保存每次操作

```
appendonly no（关闭aof） --> appendonly yes （开启aof）

appendfsync always ： 每一次操作都进行持久化
appendfsync everysec ： 每隔一秒进行一次持久化
appendfsync no     ： 让操作系统来决定何时同步
```

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

redis的复制功能是支持多个数据库之间的数据同步。一类是主数据库（master）一类是从数据库（slave），主数据库可以进行读写操作，当发生写操作的时候自动将数据同步到从数据库，而从数据库一般是只读的，并接收主数据库同步过来的数据，一个主数据库可以有多个从数据库，而一个从数据库只能有一个主数据库

过程：

1：当一个从数据库启动时，会向主数据库发送sync命令，
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

哨兵(sentinel) 是一个分布式系统,你可以在一个架构中运行多个哨兵(sentinel) 进程,这些进程使用流言协议(gossipprotocols)来接收关于Master是否下线的信息,并使用投票协议(agreement protocols)来决定是否执行自动故障迁移,以及选择哪个Slave作为新的Master

![2020224134359](/assets/2020224134359.png)

## 集群

### 场景集群方案

- 官方方案redis-cluster搭建
- 客户端分片技术（不推荐），扩容/缩容时，必须手动调整分片程序，出现故障不能自动转移
- 主从复制方式：数据冗余

### redis-cluster原理

![2020225163638](/assets/2020225163638.png)

原理同HashMap

## 实现分布式锁

### 原理

1.获取锁的时候，对某个key执行setnx，加锁（如果设置成功（获得锁）返回1，否则返回0），并使用expire命令为锁添加一个超时时间，超过该时间则自动释放锁，锁的value值为一个随机生成的UUID，通过此在释放锁的时候进行判断。

2.获取锁的时候还设置一个获取的超时时间(防止死锁)，若超过这个时间则放弃获取锁。

3.释放锁的时候，通过UUID判断是不是该锁，若是该锁，则执行delete进行锁释放

### 实现

```java
public class RedisLock {
    
    private StringRedisTemplate template;

    private static final String LOCK_KEY = "LOCK";

    private String identifyValue;

    public RedisLock(StringRedisTemplate template) {this.template = template;}

    /**
     * @param acquireTimeout 获取锁之前的超时时间
     * @param expireTime     锁的过期时间
     * @return
     */
    public boolean lock(long acquireTimeout, long expireTime) {
        // 获取锁的时间
        long inTime = System.currentTimeMillis();
        identifyValue = UUID.randomUUID().toString();
        for (; ; ) {
            // 判断获取锁是否超时
            if (System.currentTimeMillis() - inTime >= acquireTimeout) {
                return false;
            }
            // 通过setnx的方式来获取锁
            if (template.opsForValue().setIfAbsent(LOCK_KEY, identifyValue, expireTime, TimeUnit.MILLISECONDS)) {
                // 获取锁成功
                return true;
            }
            // 获取锁失败，继续自旋
        }
    }

    public void release() {
        if (identifyValue == null){
            throw new IllegalStateException("没有获取锁");
        }
        // 删除的时候验证value，必须确保释放的锁是自己创建的
        if (!identifyValue.equals(template.opsForValue().get(LOCK_KEY))){
            throw new IllegalStateException("锁的value不一致");
        }
        template.delete(LOCK_KEY);
    }
}
```

### 与zookeeper比较

相对比来说Redis比Zookeeper性能要好，从可靠性角度分析，Zookeeper可靠性比Redis更好。因为Redis有效期不是很好控制，可能会产生有效期延迟