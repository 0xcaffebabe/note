# Channel相关

## Channel

### 生命周期

<table border="1" width="90%"> 
 <thead> 
  <tr> 
   <th> <p class="表头单元格">状　　态</p> </th> 
   <th> <p class="表头单元格">描　　述</p> </th> 
  </tr> 
 </thead> 
 <tbody> 
  <tr> 
   <td> <p class="表格单元格"><code>ChannelUnregistered</code></p> </td> 
   <td> <p class="表格单元格"><code>Channel</code>已经被创建，但还未注册到<code>EventLoop</code></p> </td> 
  </tr> 
  <tr> 
   <td> <p class="表格单元格"><code>ChannelRegistered</code></p> </td> 
   <td> <p class="表格单元格"><code>Channel</code>已经被注册到了<code>EventLoop</code></p> </td> 
  </tr> 
  <tr> 
   <td> <p class="表格单元格"><code>ChannelActive</code></p> </td> 
   <td> <p class="表格单元格"><code>Channel</code>处于活动状态（已经连接到它的远程节点）。它现在可以接收和发送数据了</p> </td> 
  </tr> 
  <tr> 
   <td> <p class="表格单元格"><code>ChannelInactive</code></p> </td> 
   <td> <p class="表格单元格"><code>Channel</code>没有连接到远程节点</p> </td> 
  </tr> 
 </tbody> 
</table>

## ChannelHandler

### 生命周期

<table border="1" width="90%"> 
 <thead> 
  <tr> 
   <th> <p class="表头单元格">类　　型</p> </th> 
   <th> <p class="表头单元格">描　　述</p> </th> 
  </tr> 
 </thead> 
 <tbody> 
  <tr> 
   <td> <p class="表格单元格"><code>handlerAdded</code></p> </td> 
   <td> <p class="表格单元格">当把<code>ChannelHandler</code>添加到<code>ChannelPipeline</code>中时被调用</p> </td> 
  </tr> 
  <tr> 
   <td> <p class="表格单元格"><code>handlerRemoved</code></p> </td> 
   <td> <p class="表格单元格">当从<code>ChannelPipeline</code>中移除<code>ChannelHandler</code>时被调用</p> </td> 
  </tr> 
  <tr> 
   <td> <p class="表格单元格"><code>exceptionCaught</code></p> </td> 
   <td> <p class="表格单元格">当处理过程中在<code>ChannelPipeline</code>中有错误产生时被调用</p> </td> 
  </tr> 
 </tbody> 
</table>

### ChannelInboundHandler

- 入站消息操作

<table border="1" width="90%"> 
 <thead> 
  <tr> 
   <th> <p class="表头单元格">类　　型</p> </th> 
   <th> <p class="表头单元格">描　　述</p> </th> 
  </tr> 
 </thead> 
 <tbody> 
  <tr> 
   <td> <p class="表格单元格"><code>channelRegistered</code></p> </td> 
   <td> <p class="表格单元格">当<code>Channel</code>已经注册到它的<code>EventLoop</code>并且能够处理I/O时被调用</p> </td> 
  </tr> 
  <tr> 
   <td> <p class="表格单元格"><code>channelUnregistered</code></p> </td> 
   <td> <p class="表格单元格">当<code>Channel</code>从它的<code>EventLoop</code>注销并且无法处理任何I/O时被调用</p> </td> 
  </tr> 
  <tr> 
   <td> <p class="表格单元格"><code>channelActive</code></p> </td> 
   <td> <p class="表格单元格">当<code>Channel</code>处于活动状态时被调用；<code>Channel</code>已经连接/绑定并且已经就绪</p> </td> 
  </tr> 
  <tr> 
   <td> <p class="表格单元格"><code>channelInactive</code></p> </td> 
   <td> <p class="表格单元格">当<code>Channel</code>离开活动状态并且不再连接它的远程节点时被调用</p> </td> 
  </tr> 
  <tr> 
   <td> <p class="表格单元格"><code>channelReadComplete</code></p> </td> 
   <td> <p class="表格单元格">当<code>Channel</code>上的一个读操作完成时被调用<a href="#anchor61" id="ac61"><sup>[1]</sup></a></p> </td> 
  </tr> 
  <tr> 
   <td> <p class="表格单元格"><code>channelRead</code></p> </td> 
   <td> <p class="表格单元格">当从<code>Channel</code>读取数据时被调用</p> </td> 
  </tr> 
  <tr> 
   <td> <p class="表格单元格"><code>ChannelWritabilityChanged</code></p> </td> 
   <td> <p class="表格单元格">当<code>Channel</code>的可写状态发生改变时被调用。用户可以确保写操作不会完成得太快（以避免发生<code>OutOfMemoryError</code>）或者可以在<code>Channel</code>变为再次可写时恢复写入。可以通过调用<code>Channel</code>的<code>isWritable()</code>方法来检测<code>Channel</code>的可写性。与可写性相关的阈值可以通过<code>Channel.config(). setWriteHighWaterMark()</code>和<code>Channel.config().setWriteLowWater- Mark()</code>方法来设置</p> </td> 
  </tr> 
  <tr> 
   <td> <p class="表格单元格"><code>userEventTriggered</code></p> </td> 
   <td> <p class="表格单元格">当<code>ChannelnboundHandler.fireUserEventTriggered()</code>方法被调用时被调用，因为一个POJO被传经了<code>ChannelPipeline</code></p> </td> 
  </tr> 
 </tbody> 
</table>

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

<table border="1" width="90%"> 
 <thead> 
  <tr> 
   <th> <p class="表头单元格">类　　型</p> </th> 
   <th> <p class="表头单元格">描　　述</p> </th> 
  </tr> 
 </thead> 
 <tbody> 
  <tr> 
   <td> <p class="表格单元格"><code>bind(ChannelHandlerContext,</code><br> <code>SocketAddress,ChannelPromise)</code></p> </td> 
   <td> <p class="表格单元格">当请求将<code>Channel</code>绑定到本地地址时被调用</p> </td> 
  </tr> 
  <tr> 
   <td> <p class="表格单元格"><code>connect(ChannelHandlerContext,</code><br> <code>SocketAddress,SocketAddress,ChannelPromise)</code></p> </td> 
   <td> <p class="表格单元格">当请求将<code>Channel</code>连接到远程节点时被调用</p> </td> 
  </tr> 
  <tr> 
   <td> <p class="表格单元格"><code>disconnect(ChannelHandlerContext,</code><br> <code>ChannelPromise)</code></p> </td> 
   <td> <p class="表格单元格">当请求将<code>Channel</code>从远程节点断开时被调用</p> </td> 
  </tr> 
  <tr> 
   <td> <p class="表格单元格"><code>close(ChannelHandlerContext,ChannelPromise)</code></p> </td> 
   <td> <p class="表格单元格">当请求关闭<code>Channel</code>时被调用</p> </td> 
  </tr> 
  <tr> 
   <td> <p class="表格单元格"><code>deregister(ChannelHandlerContext,</code><br> <code>ChannelPromise)</code></p> </td> 
   <td> <p class="表格单元格">当请求将<code>Channel</code>从它的<code>EventLoop</code>注销时被调用</p> </td> 
  </tr> 
  <tr> 
   <td> <p class="表格单元格"><code>read(ChannelHandlerContext)</code></p> </td> 
   <td> <p class="表格单元格">当请求从<code>Channel</code>读取更多的数据时被调用</p> </td> 
  </tr> 
  <tr> 
   <td> <p class="表格单元格"><code>flush(ChannelHandlerContext)</code></p> </td> 
   <td> <p class="表格单元格">当请求通过<code>Channel</code>将入队数据冲刷到远程节点时被调用</p> </td> 
  </tr> 
  <tr> 
   <td> <p class="表格单元格"><code>write(ChannelHandlerContext,Object,<br></code><code>ChannelPromise)</code></p> </td> 
   <td> <p class="表格单元格">当请求通过<code>Channel</code>将数据写到远程节点时被调用</p> </td> 
  </tr> 
 </tbody> 
</table>

### ChannelHandlerAdapter

![批注 2020-07-08 105137](/assets/批注%202020-07-08%20105137.png)

### ResourceLeakDetector

通过分配1%的采样来检测内存泄漏

## ChannelPipeline

拦截流经 Channel 的入站和出站时间的ChannelHandler 示例链

### 修改

<table border="1" width="90%"> 
 <thead> 
  <tr> 
   <th> <p class="表头单元格">名　　称</p> </th> 
   <th> <p class="表头单元格">描　　述</p> </th> 
  </tr> 
 </thead> 
 <tbody> 
  <tr> 
   <td> <p class="表格单元格"><code>addFirst<br> addBefore<br> addAfter<br> addLast</code></p> </td> 
   <td> <p class="表格单元格">将一个<code>ChannelHandler</code>添加到<code>ChannelPipeline</code>中</p> </td> 
  </tr> 
  <tr> 
   <td> <p class="表格单元格"><code>remove</code></p> </td> 
   <td> <p class="表格单元格">将一个<code>ChannelHandler</code>从<code>ChannelPipeline</code>中移除</p> </td> 
  </tr> 
  <tr> 
   <td> <p class="表格单元格"><code>replace</code></p> </td> 
   <td> <p class="表格单元格">将<code>ChannelPipeline</code>中的一个<code>ChannelHandler</code>替换为另一个<code>Channel- Handler</code></p> </td> 
  </tr> 
 </tbody> 
</table>

### 访问 ChannelHandler

<table border="1" width="90%"> 
 <thead> 
  <tr> 
   <th> <p class="表头单元格">名　　称</p> </th> 
   <th> <p class="表头单元格">描　　述</p> </th> 
  </tr> 
 </thead> 
 <tbody> 
  <tr> 
   <td> <p class="表格单元格"><code>get</code></p> </td> 
   <td> <p class="表格单元格">通过类型或者名称返回<code>ChannelHandler</code></p> </td> 
  </tr> 
  <tr> 
   <td> <p class="表格单元格"><code>context</code></p> </td> 
   <td> <p class="表格单元格">返回和<code>ChannelHandler</code>绑定的<code>ChannelHandlerContext</code></p> </td> 
  </tr> 
  <tr> 
   <td> <p class="表格单元格"><code>names</code></p> </td> 
   <td> <p class="表格单元格">返回<code>ChannelPipeline</code>中所有<code>ChannelHandler</code>的名称</p> </td> 
  </tr> 
 </tbody> 
</table>

### 出入站事件

## ChannelHandlerContext

代表了 ChannelHandler 与 ChannelPipeline 之间的关联

这个类提供的一些访问在 Channel 与 ChannelPipeline 上也有

使用该类的目的是产生更短的事件流以及为了更高的性能