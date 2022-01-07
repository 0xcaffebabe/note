# Netty

>Netty是由JBOSS提供的一个java开源框架。Netty提供异步的、事件驱动的网络应用程序框架和工具，用以快速开发高性能、高可靠性的网络服务器和客户端程序。

使用场景：

- 高性能领域
- 多线程并发领域    
- 异步通信领域

## JAVA网络编程

- BIO
  - 同步阻塞IO

![批注 2020-07-04 091237](/assets/批注%202020-07-04%20091237.png)

- 伪异步IO
- NIO
  - 同步非阻塞IO

![批注 2020-07-04 091304](/assets/批注%202020-07-04%20091304.png)

- AIO
  - 异步非阻塞IO

## Reactor主从多线程模型

- 处理高并发
- 一组线程接收请求，一组线程处理IO

![Reactor主从多线程模型](/assets/202217154627.png)

## 特性

![批注 2020-07-04 091702](/assets/批注%202020-07-04%20091702.png)

- 非阻塞网络调用使得我们可以不必等待一个操作的完成。完全异步的I/O正是基于这个特性构建的，并且更进一步：异步方法会立即返回，并且在它完成时，会直接或者在稍后的某个时间点通知用户。

- 选择器使得我们能够通过较少的线程便可监视许多连接上的事件。

### 阻塞与非阻塞

阻塞和非阻塞关注的是程序在等待调用结果（消息，返回值）时的状态

阻塞调用是指调用结果返回之前，当前线程会被挂起。调用线程只有在得到结果之后才会返回。
非阻塞调用指在不能立刻得到结果之前，该调用不会阻塞当前线程

### 同步与异步

同步和异步关注的是消息通信机制 

所谓同步，就是在发出一个*调用*时，在没有得到结果之前，该*调用*就不返回。但是一旦调用返回，就得到返回值了。换句话说，就是由*调用者*主动等待这个*调用*的结果。

而异步则是相反，*调用*在发出之后，这个调用就直接返回了，所以没有返回结果。换句话说，当一个异步过程调用发出后，调用者不会立刻得到结果。而是在*调用*发出后，*被调用者*通过状态、通知来通知调用者，或通过回调函数处理这个调用

## 核心组件

- 回调
  - netty使用回调来将事件处理交给程序
- Future
  - netty的实现：ChannelFuture
  - ChannelFutureListener
    - 回调的更精细版本
- 事件与ChannelHandler

![批注 2020-07-04 092924](/assets/批注%202020-07-04%20092924.png)

## 组件和设计

### Channel

它代表一个到实体（如一个硬件设备、一个文件、一个网络套接字或者一个能够执行一个或者多个不同的I/O操作的程序组件）的开放连接，如读操作和写操作

- EmbeddedChannel；
- LocalServerChannel；
- NioDatagramChannel；
- NioSctpChannel；
- NioSocketChannel。

### EventLoop

![批注 2020-07-05 094441](/assets/批注%202020-07-05%20094441.png)

一个EventLoop在它的生命周期内只和一个Thread绑定 这个Thread会处理EventLoop所有的IO事件

一个Channel对应一个EventLoop 一个EventLoop有一个或多个Channel

### ChannelFuture

提供了另一种在操作完成时通知应用程序的方式。这个对象可以看作是一个异步操作的结果的占位符；它将在未来的某个时刻完成，并提供对其结果的访问。

属于同一个Channel的操作都能保证按调用的顺序执行

### ChannelHandler

ChannelHandler 为 Netty 中最核心的组件，它充当了所有处理入站和出站数据的应用程序逻辑的容器。ChannelHandler 主要用来处理各种事件，这里的事件很广泛，比如可以是连接、数据接收、异常、数据转换等

![](https://img2018.cnblogs.com/blog/1322310/201812/1322310-20181220211548971-1386097414.png)

- ChannelInboundHandler

### ChannelPipeline

ChannelPipeline 为 ChannelHandler 链提供了一个容器并定义了用于沿着链传播入站和出站事件流的 API

![](https://img-blog.csdn.net/20160504161903129?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

在netty中，有两种消息发送方式

- Channel: 消息会从头开始传递
- ChannelHandlerContext 消息会从某一个Handler开始传递

### 编码器解码器

- xxxDecoder
- xxxEncoder

### ServerBootStrap

- 使用服务器的ServerBootStrap，用于接受客户端的连接以及为已接受的连接创建子通道。
- 用于客户端的BootStrap，不接受新的连接，并且是在父通道类完成一些操作。

Server端需要两组EventLoop

![批注 2020-07-05 100502](/assets/批注%202020-07-05%20100502.png)

## 异常处理

- 入站异常
  - ChannelHnadler.exceptionCaught
- 出站异常
  - ChannelFutureListener
  - ChannelFuture

## 线程模型

线程模型确定了代码的执行方式

### 线程池模型

![批注 2020-07-08 111409](/assets/批注%202020-07-08%20111409.png)

不能消除由上下文切换所带来的开销

### EventLoop

```java
for (;;) {
    Runnable task = takeTask();
    if (task != null) {
        task.run();
        updateLastExecutionTime();
    }

    if (confirmShutdown()) {
        break;
    }
}
```

一个EventLoop 由 永远都不会变动的一个 Thread 驱动 

### 任务调度

- JDK自带的ScheduleExecutorService
- netty 自带的调度

```java
Channel ch = ...
ScheduledFuture<?> future = ch.eventLoop().schedule(  ← --  创建一个Runnable以供调度稍后执行
　　new Runnable() { 
　　@Override
　　public void run() {  ← --  要执行的代码
　　　　System.out.println("60 seconds later");　
　　}
}, 60, TimeUnit.SECONDS);　 ← --  调度任务在从现在开始的60 秒之后执行
```

### 线程管理

![批注 2020-07-08 112901](/assets/批注%202020-07-08%20112901.png)

所以一定不能将一个长时间运行的任务放入到执行队列中 否则EventLoop会被阻塞

### 线程分配

- 异步传输

![批注 2020-07-08 113146](/assets/批注%202020-07-08%20113146.png)

- 阻塞传输

![批注 2020-07-08 113208](/assets/批注%202020-07-08%20113208.png)

## 单元测试

### EmbeddedChannel

![批注 2020-07-10 105859](/assets/批注%202020-07-10%20105859.png)

```java
EmbeddedChannel channel = new EmbeddedChannel(new EchoServerHandler());

channel.writeInbound("hello"); // 入站数据
assertTrue(channel.finish()); // 标记为完成
String outData = channel.readOutbound(); // 出站数据
assertEquals("hello",outData);
```
