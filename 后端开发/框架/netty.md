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


# WebSocket示例

- 依赖

```xml
        <dependency>
            <groupId>io.netty</groupId>
            <artifactId>netty-all</artifactId>
            <version>5.0.0.Alpha2</version>
        </dependency>
```

- 定义服务器

```java
// 线程池
        NioEventLoopGroup mainGroup = new NioEventLoopGroup();
        NioEventLoopGroup subGroup = new NioEventLoopGroup();
        try{

            // 启动对象
            ServerBootstrap serverBootstrap = new ServerBootstrap();

            serverBootstrap
                    .group(mainGroup,subGroup)
                    // 通道类型
                    .channel(NioServerSocketChannel.class)
                    // 业务处理
                    .childHandler(new WebSocketChannelInitializer());
            ChannelFuture sync = serverBootstrap.bind(9090).sync();

            // 等待关闭
            sync.channel().closeFuture().sync();
        }catch (Exception e){
            e.printStackTrace();
        }finally {
            mainGroup.shutdownGracefully();
            subGroup.shutdownGracefully();
        }
```

- 定义handler

```java
public class WebSocketChannelInitializer extends ChannelInitializer<SocketChannel> {

    @Override
    protected void initChannel(SocketChannel channel) throws Exception {
        // 获取管道，添加ChannelHandler
        ChannelPipeline pipeline = channel.pipeline();
        pipeline.addLast(new HttpServerCodec());
        pipeline.addLast(new ChunkedWriteHandler());
        pipeline.addLast(new HttpObjectAggregator(1024*64));
        pipeline.addLast(new WebSocketServerProtocolHandler("/ws"));

        pipeline.addLast(new ChatHandler());
    }
}
```

- ChatHandler，处理请求建立以及消息到达

```java
public class ChatHandler extends SimpleChannelInboundHandler<TextWebSocketFrame> {

    private static ChannelGroup clients = new DefaultChannelGroup(GlobalEventExecutor.INSTANCE);


    @Override
    protected void messageReceived(ChannelHandlerContext ctx, TextWebSocketFrame msg) throws Exception {
        String text = msg.text();

        System.out.println("接收到消息：" + text);
        for (Channel client : clients) {
            // 将消息发送给所有客户端
            client.writeAndFlush(new TextWebSocketFrame(LocalDateTime.now() + "---" + text));
        }
    }

    @Override
    public void handlerAdded(ChannelHandlerContext ctx) throws Exception {
        clients.add(ctx.channel());
    }
}
```