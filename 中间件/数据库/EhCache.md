# EhCache

>Ehcache是​​一个标准的开源缓存，可提高性能，减轻数据库负载并简化可伸缩性。
因为它健壮，可靠，功能齐全并可以与其他流行的库和框架集成,所以是最广泛使用的基于Java的缓存。
Ehcache可以从进程内缓存扩展到具有TB级缓存的混合进程内/进程外部署

## 基本架构

Ehcache是用来管理缓存的一个工具，其缓存的数据可以是存放在内存里面的，也可以是存放在硬盘上的。

其核心是CacheManager，一切Ehcache的应用都是从CacheManager开始的。它是用来管理Cache（缓存）的，一个应用可以有多个CacheManager，而一个CacheManager下又可以有多个Cache。

Cache内部保存的是一个个的Element，而一个Element中保存的是一个key和value的配对，相当于Map里面的一个Entry

## 缓存过期策略

当缓存需要被清理时（比如空间占用已经接近临界值了），需要使用某种淘汰算法来决定清理掉哪些数据

- FIFO：First In First Out，先进先出。判断被存储的时间，离目前最远的数据优先被淘汰。
- LRU：Least Recently Used，最近最少使用。判断最近被使用的时间，目前最远的数据优先被淘汰。
- LFU：Least Frequently Used，最不经常使用。在一段时间内，数据被使用次数最少的，优先被淘汰。

## Spring Boot整合EhCache

- 引入依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
<dependency>
    <groupId>net.sf.ehcache</groupId>
    <artifactId>ehcache</artifactId>
    <version>2.10.6</version>
</dependency>
```

- 配置

```yml
spring:
  cache:
    type: ehcache # 配置缓存类型
    ehcache:
      config: classpath:ehcache.xml # ehcache的配置文件
```

- 编写ehcache配置文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ehcache xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="http://ehcache.org/ehcache.xsd">

    <!-- 默认缓存 -->
    <defaultCache maxElementsInMemory="1000" eternal="true"
                  timeToIdleSeconds="120" timeToLiveSeconds="120" overflowToDisk="true"
                  diskSpoolBufferSizeMB="30" maxElementsOnDisk="10000000"
                  diskPersistent="true" diskExpiryThreadIntervalSeconds="120"
                  memoryStoreEvictionPolicy="LRU">
    </defaultCache>

    <!-- userCache详细配置 -->
    <cache name="userCache" maxElementsInMemory="1000" eternal="false"
           timeToIdleSeconds="120" timeToLiveSeconds="120" overflowToDisk="true"
           diskSpoolBufferSizeMB="30" maxElementsOnDisk="10000000"
           diskPersistent="false" diskExpiryThreadIntervalSeconds="120"
           memoryStoreEvictionPolicy="LRU">

    </cache>
        <!--
        一、以下属性是必须的：
       1、name： Cache的名称，必须是唯一的(ehcache会把这个cache放到HashMap里)。
    　　2、maxElementsInMemory：在内存中缓存的element的最大数目。
    　　3、maxElementsOnDisk：在磁盘上缓存的element的最大数目，默认值为0，表示不限制。
    　　４、eternal：设定缓存的elements是否永远不过期。如果为true，则缓存的数据始终有效，如果为false那么还要根据timeToIdleSeconds，timeToLiveSeconds判断。
    　　５、overflowToDisk： 如果内存中数据超过内存限制，是否要缓存到磁盘上。
        二、以下属性是可选的：
    　　１、timeToIdleSeconds： 对象空闲时间，指对象在多长时间没有被访问就会失效。只对eternal为false的有效。默认值0，表示一直可以访问。
    　　２、timeToLiveSeconds： 对象存活时间，指对象从创建到失效所需要的时间。只对eternal为false的有效。默认值0，表示一直可以访问。
    　　３、diskPersistent： 是否在磁盘上持久化。指重启jvm后，数据是否有效。默认为false。
    　　４、diskExpiryThreadIntervalSeconds： 对象检测线程运行时间间隔。标识对象状态的线程多长时间运行一次。
    　　５、diskSpoolBufferSizeMB： DiskStore使用的磁盘大小，默认值30MB。每个cache使用各自的DiskStore。
       ６、memoryStoreEvictionPolicy： 如果内存中数据超过内存限制，向磁盘缓存时的策略。默认值LRU，可选FIFO、LFU。   
    -->
</ehcache>
```

- 缓存注解配置

```java
@CacheConfig(cacheNames ={"userCache"}) // 设置缓存的标志
@Service
public class UserService {

    // 这个方法的返回值会被缓存
    @Cacheable
    public String username(){
        return UUID.randomUUID().toString();
    }
    
    // 这个方法会清除缓存
    @CacheEvict
    public void update(){ }
}
```

- 开启缓存

```java
@SpringBootApplication
@EnableCaching
public class EhcacheApplication {
    public static void main(String[] args) {
        SpringApplication.run(EhcacheApplication.class, args);
    }
}
```

## Redis+EhCache分布式缓存架构

![批注 2020-02-25 083538](/assets/批注%202020-02-25%20083538.png)

这里要注意的是以及缓存的过期时间要比二级缓存早

同时，由于查询redis要走网络，所以可以把ehcahe作为一级缓存，redis作为二级缓存