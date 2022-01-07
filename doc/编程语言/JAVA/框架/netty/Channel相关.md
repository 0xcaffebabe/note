# Channel相关

## Channel

### 生命周期

状态                    | 描述
--------------------- | ------------------------------------------
`ChannelUnregistered` | `Channel`已经被创建，但还未注册到`EventLoop`
`ChannelRegistered`   | `Channel`已经被注册到了`EventLoop`
`ChannelActive`       | `Channel`处于活动状态（已经连接到它的远程节点）。它现在可以接收和发送数据了
`ChannelInactive`     | `Channel`没有连接到远程节点


## ChannelHandler

### 生命周期

类型                | 描述
----------------- | -------------------------------------------
`handlerAdded`    | 当把`ChannelHandler`添加到`ChannelPipeline`中时被调用
`handlerRemoved`  | 当从`ChannelPipeline`中移除`ChannelHandler`时被调用
`exceptionCaught` | 当处理过程中在`ChannelPipeline`中有错误产生时被调用

### ChannelInboundHandler

- 入站消息操作

类型                          | 描述
--------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
`channelRegistered`         | 当`Channel`已经注册到它的`EventLoop`并且能够处理I/O时被调用
`channelUnregistered`       | 当`Channel`从它的`EventLoop`注销并且无法处理任何I/O时被调用
`channelActive`             | 当`Channel`处于活动状态时被调用；`Channel`已经连接/绑定并且已经就绪`channelInactive`                                                                                                                                                                                        | 当`Channel`离开活动状态并且不再连接它的远程节点时被调用
`channelReadComplete`       | 当`Channel`上的一个读操作完成时被调用
`channelRead`               | 当从`Channel`读取数据时被调用
`ChannelWritabilityChanged` | 当`Channel`的可写状态发生改变时被调用。用户可以确保写操作不会完成得太快（以避免发生`OutOfMemoryError`）或者可以在`Channel`变为再次可写时恢复写入。可以通过调用`Channel`的`isWritable()`方法来检测`Channel`的可写性。与可写性相关的阈值可以通过`Channel.config(). setWriteHighWaterMark()`和`Channel.config().setWriteLowWaterMark()`方法来设置
`userEventTriggered`        | 当`ChannelnboundHandler.fireUserEventTriggered()`方法被调用时被调用，因为一个POJO被传经了`ChannelPipeline`


需要注意的是 在channelRead方法里面需要显式释放ByteBuf

```java
@Override
public void channelRead(ChannelHandlerContext ctx, Object msg) {  ← --  丢弃已接收的消息
  ReferenceCountUtil.release(msg);
}
```

SimpleChannelInboundHandler 会自动释放资源

### ChannelOutboundHandler

- 出站消息操作

类型                                                                          | 描述
--------------------------------------------------------------------------- | ---------------------------------
`bind(ChannelHandlerContext,SocketAddress,ChannelPromise)`                  | 当请求将`Channel`绑定到本地地址时被调用
`connect(ChannelHandlerContext,SocketAddress,SocketAddress,ChannelPromise)` | 当请求将`Channel`连接到远程节点时被调用
`disconnect(ChannelHandlerContext,ChannelPromise)`                          | 当请求将`Channel`从远程节点断开时被调用
`close(ChannelHandlerContext,ChannelPromise)`                               | 当请求关闭`Channel`时被调用
`deregister(ChannelHandlerContext,ChannelPromise)`                          | 当请求将`Channel`从它的`EventLoop`注销时被调用
`read(ChannelHandlerContext)`                                               | 当请求从`Channel`读取更多的数据时被调用
`flush(ChannelHandlerContext)`                                              | 当请求通过`Channel`将入队数据冲刷到远程节点时被调用
`write(ChannelHandlerContext,Object,<br>``ChannelPromise)`                  | 当请求通过`Channel`将数据写到远程节点时被调用



### ChannelHandlerAdapter

![批注 2020-07-08 105137](/assets/批注%202020-07-08%20105137.png)

### ResourceLeakDetector

通过分配1%的采样来检测内存泄漏

## ChannelPipeline

拦截流经 Channel 的入站和出站时间的ChannelHandler 示例链

### 修改

名称                                    | 描述
------------------------------------- | --------------------------------------------------------------
`addFirst addBefore addAfter addLast` | 将一个`ChannelHandler`添加到`ChannelPipeline`中
`remove`                              | 将一个`ChannelHandler`从`ChannelPipeline`中移除
`replace`                             | 将`ChannelPipeline`中的一个`ChannelHandler`替换为另一个`Channel- Handler`

### 访问 ChannelHandler

名称        | 描述
--------- | ---------------------------------------------
`get`     | 通过类型或者名称返回`ChannelHandler`
`context` | 返回和`ChannelHandler`绑定的`ChannelHandlerContext`
`names`   | 返回`ChannelPipeline`中所有`ChannelHandler`的名称


### 出入站事件

## ChannelHandlerContext

代表了 ChannelHandler 与 ChannelPipeline 之间的关联

这个类提供的一些访问在 Channel 与 ChannelPipeline 上也有

使用该类的目的是产生更短的事件流以及为了更高的性能