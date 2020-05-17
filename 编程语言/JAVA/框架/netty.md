# Netty

>Netty是由JBOSS提供的一个java开源框架。Netty提供异步的、事件驱动的网络应用程序框架和工具，用以快速开发高性能、高可靠性的网络服务器和客户端程序。

# 使用场景

- 高性能领域
- 多线程并发领域    
- 异步通信领域

# JAVA IO通信

- BIO
  - 同步阻塞IO
- 伪异步IO
- NIO
  - 同步非阻塞IO
- AIO
  - 异步非阻塞IO

## 阻塞与非阻塞

阻塞和非阻塞关注的是程序在等待调用结果（消息，返回值）时的状态

阻塞调用是指调用结果返回之前，当前线程会被挂起。调用线程只有在得到结果之后才会返回。
非阻塞调用指在不能立刻得到结果之前，该调用不会阻塞当前线程

## 同步与异步

同步和异步关注的是消息通信机制 

所谓同步，就是在发出一个*调用*时，在没有得到结果之前，该*调用*就不返回。但是一旦调用返回，就得到返回值了。换句话说，就是由*调用者*主动等待这个*调用*的结果。

而异步则是相反，*调用*在发出之后，这个调用就直接返回了，所以没有返回结果。换句话说，当一个异步过程调用发出后，调用者不会立刻得到结果。而是在*调用*发出后，*被调用者*通过状态、通知来通知调用者，或通过回调函数处理这个调用

# Reactor模型

![](https://user-gold-cdn.xitu.io/2018/7/11/164874093c4d67ab?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)

- 多线程模型
  - 一个接收线程，多个处理线程

# Reactor主从多线程模型

- 处理高并发
- 一组线程接收请求，一组线程处理IO

![](https://images2015.cnblogs.com/blog/562880/201612/562880-20161210205346726-1115531540.png)

# 核心API

## ChannelHandler

ChannelHandler 为 Netty 中最核心的组件，它充当了所有处理入站和出站数据的应用程序逻辑的容器。ChannelHandler 主要用来处理各种事件，这里的事件很广泛，比如可以是连接、数据接收、异常、数据转换等

![](https://img2018.cnblogs.com/blog/1322310/201812/1322310-20181220211548971-1386097414.png)

## ChannelPipeline

ChannelPipeline 为 ChannelHandler 链提供了一个容器并定义了用于沿着链传播入站和出站事件流的 API

![](https://img-blog.csdn.net/20160504161903129?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)


## ChannelHandlerContext

使ChannelHandler与其ChannelPipeline和其他处理程序进行交互。处理程序可以通知ChannelPipeline中的下一个ChannelHandler，动态修改其所属的ChannelPipeline

## ChannelOption

- ChannelOption.SO_BACKLOG

ChannelOption.SO_BACKLOG对应的是tcp/ip协议listen函数中的backlog参数，函数listen(int socketfd,int backlog)用来初始化服务端可连接队列，服务端处理客户端连接请求是顺序处理的，所以同一时间只能处理一个客户端连接，多个客户端来的时候，服务端将不能处理的客户端连接请求放在队列中等待处理，backlog参数指定了队列的大小

- ChannelOption.SO_KEEPALIVE

Channeloption.SO_KEEPALIVE参数对应于套接字选项中的SO_KEEPALIVE，该参数用于设置TCP连接，当设置该选项以后，连接会测试链接的状态，这个选项用于可能长时间没有数据交流的连接。当设置该选项以后，如果在两小时内没有数据的通信时，TCP会自动发送一个活动探测数据报文

## ChannelFuture

ChannelFuture的作用是用来保存Channel异步操作的结果

## EventLoop

![](https://upload-images.jianshu.io/upload_images/7853175-16eb7a864ce8ea55.png?imageMogr2/auto-orient/strip|imageView2/2/w/1200/format/webp)

## ServerBootStrap

- 使用服务器的ServerBootStrap，用于接受客户端的连接以及为已接受的连接创建子通道。
- 用于客户端的BootStrap，不接受新的连接，并且是在父通道类完成一些操作。

## Unpooled类

操作缓冲区的工具类

## 服务器示例

- 依赖

```groovy
compile group: 'io.netty', name: 'netty-all', version: '4.1.50.Final'
```

- 定义服务器

```java
// 接收到来的连接
EventLoopGroup bossGroup = new NioEventLoopGroup();
// 处理已建立连接的流量
EventLoopGroup workerGroup = new NioEventLoopGroup();
try {
    // 复制启动服务器
    ServerBootstrap b = new ServerBootstrap();
    b.group(bossGroup, workerGroup)
            // 使用 NioServerSocketChannel 将到来的连接实例化为Channel
            .channel(NioServerSocketChannel.class)
            // 指定处理器来处理 channel 与 channel 的事件
            .childHandler(new ChannelInitializer<SocketChannel>() {
                @Override
                public void initChannel(SocketChannel ch) throws Exception {
                    ch.pipeline().addLast(new DiscardServerHandler());
                }
            })
            // 指定一些参数（针对到来的连接）
            .option(ChannelOption.SO_BACKLOG, 128)
            // 指定一些参数（针对channel）
            .childOption(ChannelOption.SO_KEEPALIVE, true);

    // Bind and start to accept incoming connections.
    ChannelFuture f = b.bind(port).sync();

    // Wait until the server socket is closed.
    // In this example, this does not happen, but you can do that to gracefully
    // shut down your server.
    f.channel().closeFuture().sync();
} finally {
    workerGroup.shutdownGracefully();
    bossGroup.shutdownGracefully();
}
```

- 处理请求建立以及消息到达

```java
public class DiscardServerHandler extends ChannelInboundHandlerAdapter {
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        ByteBuf buf = (ByteBuf) msg;
        byte[] bytes = new byte[buf.readableBytes()];
        buf.readBytes(bytes);
        System.out.println("接收到数据:" + new String(bytes));
        buf.release();
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }
}
```