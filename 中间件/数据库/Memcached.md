# Memcached

> 免费 开源 高性能 分布式内存对象缓存系统

## 设计理念

- 简单KV存储

服务器不关心数据结构 需要程序前序列化再存储到服务器

- 一半一半

缓存逻辑一半在客户端 一半在服务器

客户端知道找哪台服务器读写 服务器知道如何存储item 如何淘汰内存

- 简单的集群

集群服务器之间无法通信 没有同步 没有广播 没有复制

- O(1)

所有命令操作很快 并且是锁友好的

- 过期是常态

memcached 是一种LRU缓存

- 缓存失效

客户端对集群服务器的操作时按需访问 而非直接向所有服务器广播

## 硬件需求

低CPU需求：默认使用4条工作线程 大多时候只需要一条缓存线程

内存需求：内存越多越好 集群节点内存大小最好一致 方便扩容缩容时不考虑权重问题

- 避免内存交换
- 是否为高速内存不重要

网络需求：

取决于实际使用情况 如果具有非常高的带宽 使用多个memcached比较好

### 硬件布局

- 缓存web服务器
- 缓存数据库 不是好主意 应该将内存留给数据库的索引优化
- 使用专用的服务器 好处是专用 扩展方便

### 容量规划

搭建集群前容量规划好 运行期扩展十分困难

## 服务器配置

- -m 参数告诉memcached可以使用多少内存 这个并非限制memcached实际内存使用 而是memcached存储缓存的最大限制
- -d 参数 后台启动
- -v 控制标准输入输出的打印
- -p 指定端口号 可以指定不同的端口号启动多个实例
- -l 绑定指定网卡或者IP
- -U UDP端口
- -s 使用unix socket

连接限制：默认连接数量限制为1024 查过这个限制的连接会被挂起 每个连接的内存开销很低

线程：memcached默认使用4个线程 采取了类似nginx的线程模型

打印memcached状态：

```sh
echo "stats settings" | nc localhost 11211
```

## 客户端配置

哈希算法：根据key来选择服务器

一致性哈希：减少服务器数量变动带来的重哈希问题

服务器配置要一致 避免在不同的服务器上哈希得到不同的结果

权重：有时候 一些机器资源更多 我们就给他更多的权重 处理更多的请求

失败还是故障转移：转移的一个问题在于可能会使请求返回旧数据 更多的情况下 对于缓存 直接让其失败就好

压缩：客户端都支持压缩大数据 小数据压缩得不偿失

管理连接对象：注意连接的管理 如果不注意 每次操作都打开一个连接 会造成连接泄漏

## Java 客户端

```xml
<dependency>
    <groupId>com.googlecode.xmemcached</groupId>
    <artifactId>xmemcached</artifactId>
    <version>2.4.6</version>
</dependency>
```
```java
MemcachedClient client = new XMemcachedClient("192.168.1.101", 11211);

//同步存储value到memcached，缓存超时为1小时，3600秒。
client.set("key", 3600, "jntm");
//从memcached获取key对应的value
Object someObject = client.get("key");
System.out.println(someObject);
//从memcached获取key对应的value,操作超时2秒
someObject = client.get("key", 2000);
//更新缓存的超时时间为10秒。
boolean success = client.touch("key", 10);
System.out.println(success);
//删除value
client.delete("key");
```