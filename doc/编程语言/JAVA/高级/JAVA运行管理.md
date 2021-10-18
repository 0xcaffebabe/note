# JAVA运行管理

## OS管理

- 进程级别的管理(黑盒)
- CPU/内存/IO等具体性能监控

### top命令

### vmstat命令

## JVM管理

- 线程/程序级别的管理(白盒)
- 查看虚拟机运行时各项信息
- –跟踪程序的执行过程，查看程序运行时信息
- 限制程序对资源的使用
- 将内存导出为文件进行具体分析

## JMX

JMX是一个为应用程序植入管理功能的框架

用户可以在任何Java应用程序中使用这些代理和服务实现管理

![](https://upload-images.jianshu.io/upload_images/5001962-1d62a1d30a912f44.png?imageMogr2/auto-orient/strip|imageView2/2/w/600/format/webp)

### MBean

代表着一个被管理的对象，类似JavaBean

对外暴露一个管理接口，即一些可读/写的属性，一些可操作的方法

### Agent

外界通过Agent可以访问到MBean

### 优点 

- JMX不需要较大成本，即可管理应用程序
- JMX提供一套标准化方法，来管理基于Java的应用程序/系统/网络
- JMX被用来作为JVM的外在管理方式
- JMX提供了一个可扩展、动态的管理架构
- JMX充分利用已有的Java技术
- JMX容易和现有的管理技术进行集成

## JAVA运行安全

### 启用

```java
System.setSecurityManager(new SecurityManager());
```

```shell
java –Djava.security.manager –Djava.security.policy=My.policy HelloWorld
```

### 安全策略文件

建立代码来源和访问权限的关系

```
 permission java.io.FilePermission “/tmp/*”, “read, write”
```

```java
FilePermission p = new FilePermission("/tmp/*","read,write");
```
