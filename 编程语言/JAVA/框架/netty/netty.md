# Netty

>Netty是由JBOSS提供的一个java开源框架。Netty提供异步的、事件驱动的网络应用程序框架和工具，用以快速开发高性能、高可靠性的网络服务器和客户端程序。

## 使用场景

- 高性能领域
- 多线程并发领域    
- 异步通信领域

## Reactor主从多线程模型

- 处理高并发
- 一组线程接收请求，一组线程处理IO

![](https://images2015.cnblogs.com/blog/562880/201612/562880-20161210205346726-1115531540.png)

## 核心API

## 处理流式传输

数据通过网络传输，最终会缓存在一个字节数组里

所以就会可能出现传输：

![批注 2020-05-18 160509](/assets/批注%202020-05-18%20160509.png)

接收：

![批注 2020-05-18 160541](/assets/批注%202020-05-18%20160541.png)

### 解决方案1

创建一个缓冲区，每次数据到来时，将数据放入到缓冲区，如果缓冲区超过一定大小
则就进行处理

```java
public class TimeClientHandler extends ChannelInboundHandlerAdapter {
    private ByteBuf buf;

    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) {
        ByteBuf m = (ByteBuf) msg;
        buf.writeBytes(m); // (2)
        m.release();
        
        if (buf.readableBytes() >= 4) { // (3)
            long currentTimeMillis = (buf.readUnsignedInt() - 2208988800L) * 1000L;
            System.out.println(new Date(currentTimeMillis));
            ctx.close();
        }
    }
}
```

### 解决方案2

使用解码器

```java
public class TimeDecoder extends ByteToMessageDecoder {
    @Override
    protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
        // 如果缓冲区没有足够的数据，不进行处理，只有缓冲区累积一定的数据时，才将数据添加到out
        if (in.readableBytes() < 4){
            return;
        }
        // 添加到out后，代表解码器成功解码了一条消息
        out.add(in.readBytes(4));
    }
}
```
```java
b.handler(new ChannelInitializer<SocketChannel>() {
    @Override
    public void initChannel(SocketChannel ch) throws Exception {
        ch.pipeline().addLast(new TimeDecoder(),new TimeClientHandler());
    }
});
```
