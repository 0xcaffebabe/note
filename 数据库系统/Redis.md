> redis是一款高性能的NOSQL系列的非关系型数据库

# 应用场景

- 缓存（数据查询、短连接、新闻内容、商品内容等等）
- 聊天室的在线好友列表
- 任务队列。（秒杀、抢购、12306等等）
- 应用排行榜
- 网站访问统计
- 数据过期处理（可以精确到毫秒
- 分布式集群架构中的session分离

# 数据结构

- 字符串类型 string
- 哈希类型 hash
- 列表类型 list
- 集合类型 set
- 有序集合类型 sortedset

# 命令操作

## 字符串类型

- 存储：`set key value`
- 获取 `get key`
- 删除 `del key`

## 哈希类型

- 存储：`hset key field value`
- 获取：`hget key field`
- 删除： `hdel key field`

## 列表类型

- 将元素加入列表左边：`lpush key value`
- 将元素加入列表右边：`rpush key value`
- 范围获取：`lrange key start end`
- 删除列表最左边的元素，并将元素返回:`lpop key`
- 删除列表最右边的元素，并将元素返回:`rpop key`

## 集合类型

- 存储：`sadd key value`
- 获取：`smembers key`
- 删除：`srem key value`

## 有序集合类型

- 存储：`zadd key score value`
- 获取：`zrange key start end`
- 删除：`zrem key value`

## 通用

- keys * : 查询所有的键
- type key ： 获取键对应的value的类型
- del key：删除指定的key value

# 持久化

## RDB

- 配置文件

> after 60 sec if at least 10000 keys changed save 60 10000

## AOF

```
appendonly no（关闭aof） --> appendonly yes （开启aof）

# appendfsync always ： 每一次操作都进行持久化
appendfsync everysec ： 每隔一秒进行一次持久化
# appendfsync no     ： 不进行持久化
```

# Jedis

## 基本使用

```java
        Jedis jedis = new Jedis("127.0.0.1");

        jedis.set("name","my");
        System.out.println(jedis.get("name"));
        jedis.close();
```

## 连接池

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







