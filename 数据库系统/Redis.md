# redis

> redis是一款高性能的NOSQL系列的非关系型数据库

## 应用场景

- 缓存（数据查询、短连接、新闻内容、商品内容等等）
- 聊天室的在线好友列表
- 任务队列。（秒杀、抢购、12306等等）
- 应用排行榜
- 网站访问统计
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

## 持久化

### RDB

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

# appendfsync always ： 每一次操作都进行持久化
appendfsync everysec ： 每隔一秒进行一次持久化
# appendfsync no     ： 不进行持久化
```

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