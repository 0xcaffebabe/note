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

### redis不可以做什么

不适合冷数据 大量的数据

### 作为缓存

![批注 2020-06-22 111817](/assets/批注%202020-06-22%20111817.png)

## 简单使用

![屏幕截图 2020-09-23 150438](/assets/屏幕截图%202020-09-23%20150438.png)

```sh
redis-server # 默认配置启动
redis-server --port 6379 # 指定配置

redis-cli -h 主机名 -p 连接端口
redis-cli get key # 直接执行get命令
redis-cli shutdown # 关闭redis server
```

## 数据结构

二进制安全：底层没有类型概念，只有byte数组
所以客户端需要将数据序列化成字节数组

![批注 2020-06-18 132234](/assets/批注%202020-06-18%20132234.png)

### string

- 字符串、数值、bit位图

![屏幕截图 2020-09-24 142014](/assets/屏幕截图%202020-09-24%20142014.png)

内部编码：

- int：8个字节的长整型
- embstr：小于等于39个字节的字符串
- raw：大于39个字节的字符串

应用场景：

- 做简单的KV缓存

![屏幕截图 2020-09-24 144551](/assets/屏幕截图%202020-09-24%20144551.png)

设计合理的键名，有利于防止键冲突和项目的可维护性，比较推荐的方式是使用`业务名：对象名：id：[属性]`作为键名

- incr（计数）：抢购，秒杀，详情页，点赞，评论
- session服务器

![屏幕截图 2020-09-24 145419](/assets/屏幕截图%202020-09-24%20145419.png)

- 限速 通过对key设置过期时间的方式限制用户请求频率
- 使用位图来处理海量数据

2. 哈希类型 hash
  - 做对象属性读写
3. 列表类型 list
  - 可以做消息队列或者可以来存储列表信息，进行分页查询
4. 集合类型 set
  - 自动去重
  - 推荐系统：数据交集
5. 有序集合类型 sortedset
  - 排序

### 内部数据结构

![屏幕截图 2020-09-23 154040](/assets/屏幕截图%202020-09-23%20154040.png)

#### 字典

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

#### 跳跃表

![202031284446](/assets/202031284446.png)

查找时，从上层开始查找，找到对应的区间后再到下一层继续查找，类似于二分查找

这种查找数据结构跟红黑树相比：

- 插入非常快，因为不需要在插入后进行旋转
- 实现容易
- 支持无锁操作

## API

### 通用

- keys * : 查看所有的键(生产环境应禁用，原因：正则表达式可能会占用大量资源)
- dbsize 返回当前数据库中建的总数
- type key ： 获取键对应的value的类型
- del key：删除指定的key(可以是多个)
- exists key：判断指定的key是否存在
- expire key time：指定key的生存时间，单位：秒
- ttl key 查看键的剩余过期时间

### 字符串类型

![屏幕截图 2020-09-26 145223](/assets/屏幕截图%202020-09-26%20145223.png)

```sh
set key value [ex seconds] [px milliseconds] [nx|xx] # 设置值
# ex 以秒为单位的过期时间
# px 毫秒单位的过期时间
# nx：set if not exists
# xx set if exists
get key # 获取值

mset name cxk age 18 # 批量设置值
mget name age # 批量获取值

incr a # 自增1
incrby a 15 # 自增指定值
decrby a 15 # 自减指定值
incrbyfloat a 10.5 # 自增浮点数

append name jntm # 字符串追加值
strlen name # 获取字符串长度
set name 蔡徐坤
strlen name # redis将中文序列化为byte数组 中文的长度取决于终端的编码集
getset name world # 设置新值并返回旧值
setrange name 2 kd # 从指定位置设置字符串
getrange name 0 -1 # 获取指定范围的字符串
```

![屏幕截图 2020-09-24 143108](/assets/屏幕截图%202020-09-24%20143108.png)

- 在redis中 自增操作都是原子的 不用担心被别的客户端修改

#### bitmap

这个数据类型适合用来处理海量数据

```sh
setbit map 5 1 # 将偏移量为5的bit设置为1 在第一次初始化Bitmaps时，假如偏移量非常大，那么整个初始化过程执行会比较慢，可能会造成Redis的阻塞
getbit map 5 # 获取偏移量为5的值
bitcount map 0 -1 # 获取指定范围内1的个数
bitop and|or|not|xor ret map map1 # bitmap 集合运算
bitpos map 1 # bitmap 第一个值为1的bit的偏移量
```

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

#### HyperLogLog

通过HyperLogLog可以利用极小的内存空间完成大量元素的独立总数的统计

用小空间来估算如此巨大的数据，其中一定存在误差率（类似于布隆过滤器）

使用这个来估算数据 可以容忍一定的误差率

```sh
pfadd users user1 user2 user3 user4 # 添加元素
pfcount users # 统计个数
```

### 哈希类型

![屏幕截图 2020-09-26 145321](/assets/屏幕截图%202020-09-26%20145321.png)

```sh
hset user:1 name cxk age 18 # 设置field
hsetnx user:1 name cxk # set if not exists
hget user:1 name # 获取field
hdel user:1 name age # 删除field
hlen user:1 # 计算field个数
hmget user:1 name age # 批量获取field
hexists user:1 name # 判断field是否存在
hkeys user:1 # 获取所有field名称
hvals user:1 # 获取所有field value
hgetall user:1 # 获取全部kv对
hincrby user:1 age 1 # 对指定field自增
hincrbyfloat user:1 age 1.5 # 浮点数自增
```

内部编码：

- ziplist 压缩列表 这种类型使用更加紧凑的结构实现多个元素的连续存储 **节省内存**
- hashtable 读写效率比ziplist高

使用场景：

- 哈希类型是稀疏的，而关系型数据库是完全结构化的，哈希类型每个键可以有不同的field，而关系型数据库一旦添加新的列，所有行都要为其设置值
- 关系型数据库可以做复杂的关系查询，而Redis去模拟关系型复杂查询开发困难

### 列表类型

![屏幕截图 2020-09-26 145350](/assets/屏幕截图%202020-09-26%20145350.png)

- 将元素加入列表左边：`lpush key value`
- 将元素加入列表右边：`rpush key value`
- 元素插入：`linsert key before|after pivot value`
- 范围获取：`lrange key start end`
- 获取指定下标：`lindex key i`
- 获取列表长度:`llen key`
- 删除列表最左边的元素，并将元素返回:`lpop key`
- 删除列表最右边的元素，并将元素返回:`rpop key`
- 删除指定元素
  - 从左到右 最多删除一个：`lrem list 1 java`
  - 从右到左 最多删除一个：`lrem list -1 java`
  - 删除全部：`lrem list 0 java`
- 索引范围内的元素：`ltrim list 0 1`
- 修改指定下标的元素：`lset list 0 java`
- 阻塞操作
  - 3秒内获取不到就返回:`brpop list 3`

内部编码：

- ziplist
- linkedlist
- quicklist 结合了ziplist和linkedlist两者的优势

使用场景：

- 消息队列 户端使用lrpush从列表左侧插入元素 多个消费者客户端使用brpop命令阻塞式的“抢”

![屏幕截图 2020-09-24 153949](/assets/屏幕截图%202020-09-24%20153949.png)

- 分页列表 使用lrange实现

其他：

·lpush+lpop=Stack
·lpush+rpop=Queue
·lpsh+ltrim=Capped Collection
·lpush+brpop=Message Queue

### 集合类型

![屏幕截图 2020-09-26 145411](/assets/屏幕截图%202020-09-26%20145411.png)

```sh
sadd set a b c # 添加元素
srem set b # 删除元素
scard set # 计算元素个数(维护一个变量得到)
sismember set c # 判断元素是否在集合内
srandmember set 2 # 随机从集合返回指定个数元素
# 正数：取出一个去重的结果集（不能超过已有集）
# 负数：取出一个带重复的结果集，一定满足你要的数量
# 如果：0，不返回
spop set 1 # 随机弹出元素
smembers set # 获取所有元素

sinter s1 s2 # 求交集
sunion s1 s2 # 求并集
sdiff s1 s2 # 求差集
sinterstore s3 s1 s2 # 交集结果存储到s3
# ...
```

内部编码：

- intset 占用内存小
- hashtable

例子：用户标签

```sh
sadd user1 food movie sport music
sadd user2 food music network
sinter user1 user2 # 计算用户共同感兴趣的标签
```

例子：抽奖

```sh
sadd k 1 2 3 4 5 6 7 8 9 # 9个用户
SRANDMEMBER k 3 # 抽取三个不重复用户
SRANDMEMBER k -3 # 抽取三个可能会重复的用户
```

- sadd=Tagging（标签）
- spop/srandmember=Random item（生成随机数，比如抽奖）
- sadd+sinter=Social Graph（社交需求）

### 有序集合类型

![屏幕截图 2020-09-26 145503](/assets/屏幕截图%202020-09-26%20145503.png)

```sh
help @sorted_set
```

![批注 2020-06-19 113509](/assets/批注%202020-06-19%20113509.png)

物理内存左小右大

```sh
zadd users 251 tom # 添加成员 分数251
zcard users # 计算成员个数
zscore users tom # 获取某个成员分数
zrank users tom # 计算某个成员排名
zrem users tom # 删除成员
zincrby users 8 jerry # 增加某个成员的分数
zrange users 0 10 # 正序返回指定排名范围的成员
zrevrange users 0 10 # 倒序返回指定排名范围的成员
zrangebyscore users 0 255 # 正序返回指定分数范围的成员
zrevrangebyscore users 0 255 # 正序返回指定分数范围的成员
zcount users 0 255 # 计算指定分数范围的成员个数
zremrangebyrank users 0 1 # 删除指定排名范围内的成员
zremrangebyscore users 0 10 # 删除指定分数范围内的成员

zinterstore user:ranking:1_inter_2 2 user:ranking:1 user:ranking:2 weights 1 0.5 aggregate max # 并集
```

内部数据结构：

- ziplist
- skiplist

例子：点赞

```sh
zadd video 0 cxk # cxk发布了一个视频 0赞
zincrby video 1 cxk # 有人给cxk视频点了一个赞
zrem video cxk # 清空cxk的视频点赞
zrevrange video 0 9 # 获取点赞排行榜
```

### 键管理

单键管理：

```sh
rename name newname # 键重命名
randomkey # 随机返回数据库里的一个键
expire name 10 # 设置键10秒后过期
expireat name timestamp # 设置键在指定时间戳后过期
# 对于字符串 set 会清除其过期时间
# Redis不支持二级数据结构（例如哈希、列表）内部元素的过期功能
persist name # 去除键的过期时间
```

键迁移：

- move 同一redis内
- dump restre 通过RDB文件的方式
- migrate 自动通过网络传输数据

遍历键：

```sh
keys * # 获取所有键 如果Redis包含了大量的键，执行keys命令很可能会造成Redis阻塞
scan 0 # 渐进式遍历 该命令返回两个部分：1. 下一个游标 2. 遍历结果
# 如果要继续遍历 下一次scan后面接的就是返回的游标
```

数据库管理：

```sh
select 2 # 切换到2号数据库
flushdb # 清空数据库 如果当前数据库键值数量比较多，flushdb/flushall存在阻塞Redis的可能
flushall
```

Redis3.0后已经逐渐弱化多数据库这个功能

## 慢查询分析

一条客户端命令的生命周期：

![屏幕截图 2020-09-27 134926](/assets/屏幕截图%202020-09-27%20134926.png)


慢查询阈值设置：

- slowlog-log-slower-than：超过xx微秒则记录为慢查询
- slowlog-max-len

```sh
config set slowlog-log-slower-than 2 # 设置阈值
slowlog get [n] # 获取慢查询日志 n 指定条数
slowlog len # 获取慢查询日志列表长度
slowlog reset # 清空慢查询日志
```

慢查询日志结构：

1. id
2. time
3. duration
4. command
    - 参数..
5. ip:port

最佳实践：

- 线上建议调大慢查询列表
- 根据qps来配置slowlog-log-slower-than
- 及时转储slowlog

## redis shell

- redos-cli

```sh
redis-cli -r 3 ping # 重复执行3次ping命令
redis-cli -r 3 -i 1 ping # 每隔1秒发一次ping 重复3此
echo "world" | redis-cli -x set hello # 从stdin读入 作为redis的最后一个参数
redis-cli --scan # scan命令
redis-cli --rdb ./bak.rdb # 生成rdb文件
echo -en '*3\r\n$3\r\nSET\r\n$5\r\nhello\r\n$5\r\nworld\r\n*2\r\n$4\r\nincr\r\n$7\r\ncounter\r\n' | redis-cli --pipe # 直接发送命令给redis执行
redis-cli --bigkeys  # 分析内存占用比较大的键值对
redis-cli --latency # 查看客户端到目标redis的网络延时
redis-cli --latency-history -i 10 # 每隔10秒查看一次网络延时
redis-cli --latency-dist # 以统计图表的方式输出
redis-cli --stat # 获取redis的统计信息
redis-cli --raw get name # 返回数据不进行格式化(\xexxx)
```

- redis-server

```sh
redis-server --test-memory 1024 # 测试是否有足够的内存
```

- redis-benchmark

```sh
redis-benchmark -c 100 -n 20000 # 100个客户 共请求20000次
redis-benchmark -c 100 -n 20000  -q # 只显示 requests per second
redis-benchmark -c 100 -n 20000 -r 10000 # -r选项会在key、counter键上加一个12位的后缀，-r10000代表只对后四位做随机处理
redis-benchmark -c 100 -n 20000 -P 10 # 每隔请求的pipline数据量
redis-benchmark -c 100 -n 20000 -q -k 1 # k为1代表启用客户端连接keepalive
redis-benchmark -t get,set -q # 只对指定的命令测试
redis-benchmark -t get,set -q --csv # 按照csv文件格式输出
```

## Pipeline

Pipeline（流水线）机制能将一组Redis命令进行组装，通过一次RTT传输给Redis，再将这组Redis命令的执行结果按顺序返回给客户端

- redis-cli 的--pipeline选项
- 各种语言客户端的pipeline

客户端和服务端的网络延时越大，Pipeline的效果越明显

如果pipeline传递的数据过大 也会增加客户端的等待时间及网络阻塞

vs. 原生批量命令：

- 原生批量命令是原子的，Pipeline是非原子的
- 原生批量命令是一个命令对应多个key，Pipeline支持多个命令
- 原生批量命令是Redis服务端支持实现的，而Pipeline需要服务端和客户端的共同实现

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

将某个时间点的所有数据都存放到硬盘上, 是对 redis 中的数据执行周期性的持久化

`bgsave`命令：使用的fork系统调用创建一个子进程来持久化数据, 由于fork出来的子进程是写时复制，所以这达到了一个性能的平衡

![屏幕截图 2020-09-29 132917](/assets/屏幕截图%202020-09-29%20132917.png)

可以在redis-cli执行config set dir{newDir}和config set
dbfilename{newFileName} 来改变持久化文件位置

- 配置文件

> after 60 sec if at least 10000 keys changed save 60 10000

默认开启，保存在dump.rdb

```shell
save 900 1           #在900秒(15分钟)之后，如果至少有1个key发生变化，Redis就会自动触发BGSAVE命令创建快照。

save 300 10          #在300秒(5分钟)之后，如果至少有10个key发生变化，Redis就会自动触发BGSAVE命令创建快照。

save 60 10000        #在60秒(1分钟)之后，如果至少有10000个key发生变化，Redis就会自动触发BGSAVE命令创建快照。
```

**优缺点**

- 是某个时刻的全部数据，非常适合做冷备 全量备份等
- 恢复比较迅速
- **bgsave每次运行都要执行fork操作创建子进程，属于重量级操作**
- **会丢失一定数据**

### AOF

- 以日志的形式保存每次操作
- 对每条写入命令作为日志

![屏幕截图 2020-09-29 133711](/assets/屏幕截图%202020-09-29%20133711.png)

为什么使用AOF缓冲：Redis使用单线程响应命令，如果每次写AOF文件命令都直接追加到硬盘，那么性能完全取决于当前硬盘负载
载

```
appendonly yes 开启aof

appendfsync always    每一次操作都进行持久化 （每次写操作都执行fsync 性能极差）
appendfsync everysec  每隔一秒进行一次持久化 (折中的方案)
appendfsync no        让操作系统来决定何时同步 （让操作系统决定何时写到磁盘 数据不安全）
```

Redis 4.0 开始支持 RDB 和 AOF 的混合持久化（默认关闭，可以通过配置项 aof-use-rdb-preamble 开启）。

如果把混合持久化打开，AOF 重写的时候就直接把 RDB 的内容写到 AOF 文件开头。这样做的好处是可以结合 RDB 和 AOF 的优点

**优缺点**

- 更好地保护数据不丢失
- append-only没有磁盘寻址开销
- 适合做灾备
- **aof文件比rdb大**
- **aof对性能有一定的影响**

#### AOF重写

随着AOF文件越来越大，需要定期对AOF文件进行重写，达到压缩的目的

- 手动触发：bgrewriteaof
- 自动触发：根据auto-aof-rewrite-min-sizeauto-aof-rewrite-percentage参数确定自动触发时机

![屏幕截图 2020-09-29 135550](/assets/屏幕截图%202020-09-29%20135550.png)

执行 BGREWRITEAOF 命令时，Redis 服务器会维护一个 AOF 重写缓冲区，该缓冲区会在子进程创建新AOF文件期间，记录服务器执行的所有写命令。

当子进程完成创建新AOF文件的工作之后，服务器会将重写缓冲区中的所有内容追加到新AOF文件的末尾，使得新旧两个AOF文件所保存的数据库状态一致

#### 重启恢复流程

![屏幕截图 2020-09-29 135820](/assets/屏幕截图%202020-09-29%20135820.png)

如果aof文件损坏 可以尝试使用redis-check-aof --fix进行修复

### 问题定位与优化

fork的问题：

- 重量级操作 如果使用虚拟化技术 fork会比物理机更耗时
- fork虽然是写时复制 但是还是需要复制内存页表

持久化时各类资源的消耗：

- CPU：子进程负责把进程内的数据分批写入文件，这个过程
属于CPU密集操作
- 内存：子进程通过fork操作产生，占用内存大小等同于父进程，理论上需要两倍的内存来完成持久化操作，但Linux有写时复制机制
（copy-on-write）
- 磁盘：写入时硬盘压力很大 避免将redis和其他高硬盘负载的服务部署在一起

AOFfsync策略：

![屏幕截图 2020-09-29 142515](/assets/屏幕截图%202020-09-29%20142515.png)

使用everysec这种同步策略 当一个命令写入缓冲区后发现上次同步到磁盘的时间大于2秒 就会阻塞住 直至同步磁盘完成

这意味着使用这种策略至多会丢失2秒的数据

## 事件

### 文件事件

![202031285728](/assets/202031285728.png)

### 时间事件

Redis 将所有时间事件都放在一个无序链表中，通过遍历整个链表查找出已到达的时间事件，并调用相应的事件处理器

## 客户端

### RESP(redis 序列化协议)

- 发送命令

```
*< 参数数量 > CRLF
$< 参数 1 的字节数量 > CRLF
< 参数 1> CRLF
...
$< 参数 N 的字节数量 > CRLF
< 参数 N> CRLF
```

- 返回结果

状态回复：在RESP中第一个字节为"+"。

错误回复：在RESP中第一个字节为"-"。

整数回复：在RESP中第一个字节为"："。

字符串回复：在RESP中第一个字节为"$"。

多条字符串回复：在RESP中第一个字节为"*"。

###  java 客户端 Jedis

基本使用

```java
Jedis jedis = new Jedis("127.0.0.1");

jedis.set("name","my");
System.out.println(jedis.get("name"));
jedis.close();
```

连接池

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

### Spring Data Redis

RedisTemplate基本操作

- redisTemplate.opsForValue() ：操作字符串
- redisTemplate.opsForHash() ：操作hash
- redisTemplate.opsForList()：操作list
- redisTemplate.opsForSet()：操作set
- redisTemplate.opsForZSet()：操作zset

StringRedisTemplate是K,V均为String的RedisTemplate

使用

```java
template.opsForValue().set("name","hello,bitch");
```

### 事务

```sh
multi # 开启事务
set name hello
set hello world
exec # 提交事务
# discard 停止事务执行
```

命令语法错误导致的错误整个事务会回滚

```sh
set key java
watch key
multi
set key cxk
exec # 如果key在这个事务过程中别其他客户端修改 这个事务就不会执行
```

```java
// 开启事务支持
template.setEnableTransactionSupport(true);
try{
    // begin
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

### 客户端管理

```sh
client list
```
```
id=10733 addr=127.0.0.1:42158 fd=9 name= age=84021 idle=0 flags=N db=0 sub=0 psub=0 multi=-1 qbuf=26 qbuf-free=32742 obl=0 oll=0 omem=0 events=r cmd=client user=default
```

![屏幕截图 2020-09-28 153101](/assets/屏幕截图%202020-09-28%20153101.png)

标识：

- id
- addr
- fd
- name

输入缓冲区：

Redis为每个客户端分配了输入缓冲区，它的作用是将客户端发送的命令临时保存，同时Redis从会输入缓冲区拉取命令并执行

- qbuf 缓冲区的总容量
- qbuf-free 剩余容量

如果Redis的处理速度跟不上输入缓冲区的输入速度 机会造成缓冲区十分大

输出缓冲区：

Redis为每个客户端分配了输出缓冲区，它的作用是保存命令执行的结果返回给客户端

输出缓冲区由两部分组成：固定缓冲区（16KB）和动态缓冲区，其中固定缓冲区返回比较小的执行结果，而动态缓冲区返回比较大的结果。 固定缓冲区使用的是字节数组，动态缓冲区使用的是列表

- obl 固定缓冲区的长度
- oll 动态缓冲区列表的长度
- omem 代表使用的字节数

客户端存活状态：

单位为秒

- age 客户端已经连接的时间
- idle 最近一次的空闲时间

客户端类型：

- flag

![屏幕截图 2020-09-28 152911](/assets/屏幕截图%202020-09-28%20152911.png)

#### setName getName

设置名称方便管理

```sh
client setName cxk
client getName
```

#### 杀掉客户

```sh
client kill ip:port
```

#### 阻塞客户

```sh
client pause timeout # 阻塞当前客户端指定毫秒数
```

#### 监控客户端命令执行

```sh
monitor
```

### 客户端相关配置

- timeout 检测客户端空闲连接的超时时间，一旦idle时间达到了
timeout，客户端将会被关闭，如果设置为0就不进行检测
- maxclients 客户端最大连接数
- tcp-keepalive 检测TCP连接活性的周期
- tcp-backlog TCP三次握手后，会将接受的连接放入队列中，tcp-backlog就是队列的大小

### 客户端统计

```sh
info clients
```

- connected_clients：代表当前Redis节点的客户端连接数
- client_recent_max_input_buffer：当前所有输出缓冲区中队列对象个数的最大值
- client_recent_max_output_buffer: 前所有输入缓冲区中占用的最大容量
- locked_clients：正在执行阻塞命令（例如blpop、brpop、brpoplpush）的客户端个数

## 发布订阅

![屏幕截图 2020-09-27 154059](/assets/屏幕截图%202020-09-27%20154059.png)

新开启的订阅客户端，无法收到该频道之前的消息

```sh
pubsub channels # 查看活跃的频道(至少一个订阅者)
pubsub numsub chat # 查看频道订阅数
pubsub numpat # 查看模式订阅数
```

- 消费者

```sh
SUBSCRIBE redisChat # 订阅
unsubscribe redisChat # 取消订阅
psubscribe pattern # 按照给定模式订阅
punsubscribe pattern # 按照给定模式取消订阅
```

- 生产者向频道发送数据

```sh
PUBLISH redisChat "Redis is a great caching technique"
```

## GEO

地理信息定位功能

```sh
geoadd locations 116.38 39.55 beijing # 添加成员
geopos locations beijing # 获取
geodist locations beijing tianjin [m|km|mi|ft] # 计算两地距离
georadiusbymember locations beijing 150 km # 获取北京方圆150km内的成员
geohash locations beijing # 将二维经纬度转换为一维字符串
```

关于geohash：

- 字符串越长，表示的位置更精确
- 两个字符串越相似，它们之间的距离越近，Redis利用字符串前缀匹配
算法实现相关的命令
- Redis正是使用有序集合并结合geohash的特性实现了GEO的若干命令

## 分布式

通用集群方案：

- 主备集群
  - 全量数据同步
- 分片集群

## AKF

- X：全量，镜像
- Y：业务，功能
- Z：优先级，逻辑再拆分

![批注 2020-06-23 084747](/assets/批注%202020-06-23%20084747.png)

## 复制

- slaveof命令建立复制
- slaveof no one命令断开复制

redis的复制功能是支持多个数据库之间的数据同步。一类是主数据库（master）一类是从数据库（slave），主数据库可以进行读写操作，当发生写操作的时候自动将数据同步到从数据库，而从数据库一般是只读的，并接收主数据库同步过来的数据，一个主数据库可以有多个从数据库，而一个从数据库只能有一个主数据库

### 拓扑结构

- 一主一从

![屏幕截图 2020-10-04 133321](/assets/屏幕截图%202020-10-04%20133321.png)

用于主节点出现宕机时从节点提供故障转移支持

- 一主多从

![屏幕截图 2020-10-04 133416](/assets/屏幕截图%202020-10-04%20133416.png)

对于读占比较大的场景，可以把读命令发送到从节点来分担主节点压力

或者从节点用来执行一些如keys 等比较耗时的命令

**对于写并发量较高的场景，多个从节点会导致主节点写命令的多次发送从而过度消耗网络带宽**

- 主从链

![20203129441](/assets/20203129441.png)

通过引入复制中间层，可以有效降低主节点负载和需要传送给从节点的数据量

### 原理

#### 复制过程

![屏幕截图 2020-10-04 134259](/assets/屏幕截图%202020-10-04%20134259.png)

1. 执行slaveof后从节点只保存主节点的地址信息便直接返回
2. 从节点会建立一个socket套接字 门用于接受主节点发送的复制命令
3. 连接建立成功后从节点发送ping请求进行首次通信用于检测主从之间网络套接字是否可用以及节点当前是否可接受处理命令
4. 如果主节点设置了requirepass参数，则需要密码验证
5. 主从复制连接正常通信后，主节点会把持有的数据全部发送给从节点
6. 接下来主节点会持续地把写命令发送给从节点，保证主从
数据一致性

#### 数据同步

全量复制：

一般用于初次复制场景，会把主节点全部数据一次性发送给从节点

![屏幕截图 2020-10-04 135504](/assets/屏幕截图%202020-10-04%20135504.png)

部分复制：

- psync命令

![屏幕截图 2020-10-04 135617](/assets/屏幕截图%202020-10-04%20135617.png)

异步复制：

写命令的发送过程是异步完成，也就是说主节点自身处理完写命令后直接返回给客户端，并不等待从节点复制完成

### 问题

读写分离带来的问题：

- 数据延迟 写入master的数据无法马上在salve上读到
- 读到过期数据  Redis在3.2版本从节点读取数据之前会检查键的过期时间来决定是否返回数据
- 从节点故障 需要在客户端维护可用从节点列表，当从节点故障时立刻切换到其他从节点或主节点上

主从配置不一致的问题：

如最大限制内存如果不一致 导致从节点部分数据被淘汰 造成从节点数据与主节点不一致

避免全量复制：

- 从节点启动后会进行一次全量复制 这个无法避免
- 如果主节点重启 会导致运行ID改变 此时从节点也会进行一次全量复制
- 主从节点网络断开 如果连接后复制挤压缓冲区不足 也会触发全量复制

避免复制风暴：

复制风暴指大量从节点对同一主节点或者对同一台机器的多个主节点短时间内发起全量复制的过程

- 单主节点复制风暴

使用主从链代替一主多从来解决这个问题

![屏幕截图 2020-10-04 141732](/assets/屏幕截图%202020-10-04%20141732.png)

- 单机器复制风暴

避免将所有主节点放在同一台机器

![屏幕截图 2020-10-04 141808](/assets/屏幕截图%202020-10-04%20141808.png)

如果此时机器A网络挂掉 那么重新启动时 就会导致其他机器的流量全部压向机器A

### 配置

主服务配置(6379)

```
# 设置主服务器密码
requirepass 123
# 或者需要设置master bind address
bind 0.0.0.0
```

从服务器配置(6380)

```
# 设置访问主服务器得我密码
masterauth 123
# 设置主服务器地址端口
slaveof 127.0.0.1 6379
# 新版本
replicaof 127.0.0.1 6379
```

只能对主服务器进行写操作，从服务器只能读操作

一些主从配置项

```
replica-serve-stale-data yes
replica-read-only yes # 从节点的任何修改主节点都无法感知
repl-diskless-sync no

repl-disable-tcp-nodelay #用于控制是否关闭TCP_NODELAY，默认关闭

repl-backlog-size 1mb 
#增量复制

min-replicas-to-write 3
min-replicas-max-lag 10
```

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

### 哨兵配置

```
port 26379
sentinel monitor mymaster 172.17.0.5 6379 2
```

```sh
# 启动哨兵
redis-server ./sentinel.conf --sentinel
```

## 集群

- 自动将数据进行分片，每个 master 上放一部分数据
- 提供内置的高可用支持，部分 master 不可用时，还是可以继续工作的

6379：对外服务
16379：节点间通信

### 集群方案

- 根据业务拆分，不同的业务数据存放到不同的redis
- **官方方案redis-cluster搭建(一致性哈希)**
- 客户端分片技术（不推荐），扩容/缩容时，必须手动调整分片程序，出现故障不能自动转移
- 主从复制方式：数据冗余

### redis-cluster原理

- 客户端直接访问集群
- 代理访问集群

redis cluster 有固定的 16384 个 hash slot，集群中的每个node平均分配得到一定的slot

使用一致性哈希实现

优点：
增加节点，的确可以分担其他节点的压力，不会造成全局洗牌

缺点：
新增节点造成一小部分数据不能命中
1，问题，击穿，压到mysql
2，方案：每次取离我最近的2个物理节点


更倾向于 作为缓存，而不是数据库用！！！！

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

（Redis 6.0之后引入多线程来处理IO）

单线程对每个命令的执行时间是有要求的 某个命令执行过长 就会造成其他命令的阻塞

### 单线程模型也能高效率的原因

- 纯内存操作
- C语言实现
- 基于非阻塞IO多路复用
- 单线程避免了频繁上下文切换带来的性能损失以及多线程的锁竞争问题

## 整合Lua

```sh
redis-cli eval "return 1+1" 0
```

- 在redis-cli中

```sh
EVAL "local msg='hello world' return msg..KEYS[1]" 1 AAA BBB
```

- 独立文件

```lua
local count = redis.call("get", "count")
redis.call("incr","count")
return count
```

```sh
redis-cli --eval test.lua 0
```

### 部署

加载到redis

```sh
redis-cli script load "$(cat test.lua)"
```

得到sha1值

执行

```sh
redis-cli evalsha "7a2054836e94e19da22c13f160bd987fbc9ef146" 0
```

### lua脚本管理

- script load
- script exists
- script flush
- script kill

## redis vs memcached

- redis支持复杂的数据结构
- redis支持原生集群
- redis 只使用单核，而 memcached 可以使用多核