# NIO

## 与BIO的区别

- BIO是面向流的，NIO是面向缓冲区的；
- BIO流是阻塞的，NIO流是不阻塞的;
- NIO有选择器，而IO没有。

## 传统BIO模型的缺点

- 严重依赖于线程 线程是很昂贵的
  - 线程内存资源 上下文切换成本

![202073116749](/assets/202073116749.jpg)

NIO 的线程模型

```java
 while(channel=Selector.select()){//选择就绪的事件和对应的连接
      if(channel.event==accept){
         registerNewChannelHandler(channel);//如果是新连接，则注册一个新的读写处理器
      }
      if(channel.event==write){
         getChannelHandler(channel).channelWritable(channel);//如果可以写，则执行写事件
      }
      if(channel.event==read){
          getChannelHandler(channel).channelReadable(channel);//如果可以读，则执行读事件
      }
    }
   }
```

## NIO 的 Reactor Proactor

### Reactor

![屏幕截图 2021-07-23 110347](/assets/屏幕截图%202021-07-23%20110347.png)

事件驱动思想

- 多线程模型
  - 一个接收线程，多个处理线程

- 步骤1：等待事件到来（Reactor负责）。
- 步骤2：将读就绪事件分发给用户定义的处理器（Reactor负责）。
- 步骤3：读数据（用户处理器负责）。
- 步骤4：处理数据（用户处理器负责）。

### Proactor

![202172311918](/assets/202172311918.png)

- 步骤1：等待事件到来（Proactor负责）。
- 步骤2：得到读就绪事件，执行读数据（现在由Proactor负责）。
- 步骤3：将读完成事件分发给用户处理器（Proactor负责）。
- 步骤4：处理数据（用户处理器负责）。

Proactor 中，直接监听读/写操作是否完成，也就是说读/写操作是否 OS 来完成，并将读写数据放入一个缓冲区提供给程序

## Buffer

- DirectByteBuffer 可以减少内存从内核到用户的拷贝 但是创建消费成本更高 需要池化
- HeapByteBuffer 使用堆内存

## 核心类

![屏幕截图 2020-09-28 140403](/assets/屏幕截图%202020-09-28%20140403.png)

### ByteBuffer

属性：

- capacity 缓冲区数组总长度
- position 下一个要操作的数据元素位置
- limit 缓冲区不可操作的下一个元素的位置 limit<=capacity
- mark 类似于书签

![屏幕截图 2020-09-28 141745](/assets/屏幕截图%202020-09-28%20141745.png)

![屏幕截图 2020-09-28 141838](/assets/屏幕截图%202020-09-28%20141838.png)

### NIO的文件读写

FileChannel.transferXXX:

![屏幕截图 2020-09-28 142245](/assets/屏幕截图%202020-09-28%20142245.png)

FileChannel.map: 将文件映射为内存区域

### 文件输出例子

```java
FileOutputStream fos = new FileOutputStream("file.txt");
FileChannel channel = fos.getChannel();
ByteBuffer buffer = ByteBuffer.allocate(1024);
buffer.put("20191204".getBytes());
// 翻转缓冲区
buffer.flip();
channel.write(buffer);
fos.close();
```

### 文件输入

```java
File file = new File("file.txt");
FileInputStream fis = new FileInputStream(file);
ByteBuffer buffer = ByteBuffer.allocate((int) file.length());
FileChannel channel = fis.getChannel();
channel.read(buffer);
System.out.println(new String(buffer.array()));
fis.close();
```

### 文件复制

```java
FileInputStream fis = new FileInputStream("file.txt");
FileOutputStream fos = new FileOutputStream("file1.txt");
FileChannel source = fis.getChannel();
FileChannel target = fos.getChannel();
target.transferFrom(source,0,source.size());
source.close();
target.close();
```

## 网络编程

- Selector

它是Java NIO核心组件中的一个，用于检查一个或多个NIO Channel（通道）的状态是否处于可读、可写。如此可以实现单线程管理多个channels,也就是可以管理多个网络链接

![](https://pic3.zhimg.com/80/v2-5458e9182d8e2e002d82327273561172_hd.jpg)

- SelectionKey

一个SelectionKey键表示了一个特定的通道对象和一个特定的选择器对象之间的注册关系

- ServerSocketChannel

Java NIO 中的 ServerSocketChannel 是一个可以监听新进来的 TCP 连接的通道, 就像标准 IO 中的 ServerSocket一样

- SocketChannel

Java NIO 中的 SocketChannel 是一个连接到 TCP 网络套接字的通道

### 客户端

```java
// 得到一个网络通道
SocketChannel channel = SocketChannel.open();
// 设置非阻塞方式
channel.configureBlocking(false);
// 提供服务器IP与端口
InetSocketAddress address = new InetSocketAddress("127.0.0.1", 1999);
// 连接
if (!channel.connect(address)) {
    while (!channel.finishConnect()) {
        System.out.println("客户端：正在连接服务器");
    }
}
// 发送数据
ByteBuffer buffer = ByteBuffer.wrap("cxk 打篮球".getBytes());
channel.write(buffer);
```

### 服务端框架

```java
// 获取网络通道
ServerSocketChannel serverSocketChannel = ServerSocketChannel.open();
// 获取选择器
Selector selector = Selector.open();
// 绑定端口
serverSocketChannel.bind(new InetSocketAddress(1999));
// 设置为非阻塞方式(accept时不阻塞)
serverSocketChannel.configureBlocking(false);
// 注册选择器，让选择器监听连接事件
serverSocketChannel.register(selector, SelectionKey.OP_ACCEPT);
while (true) {
    // 每2000ms轮询一次，select返回的结果是客户数
    if (selector.select(2000) == 0){
        System.out.println("等待客户连接");
        continue;
    }
    // 获取准备连接的所有客户
    Iterator<SelectionKey> iterator = selector.selectedKeys().iterator();
    while (iterator.hasNext()){
        SelectionKey key = iterator.next();
        if (key.isAcceptable()){
            // 客户端连接事件
            System.out.println("客户端连接");
            SocketChannel socketChannel = serverSocketChannel.accept();
            socketChannel.configureBlocking(false); // 读取客户端数据时不会阻塞
            socketChannel.register(selector,SelectionKey.OP_READ, ByteBuffer.allocate(1024));
        }
        if (key.isReadable()){
            // 读取客户端数据事件
            SocketChannel channel = (SocketChannel) key.channel();
            ByteBuffer buffer = (ByteBuffer) key.attachment();
            channel.read(buffer);
            System.out.println("客户端发来数据:"+new String(buffer.array()));
        }
        // 删除客户key，防止重复处理
        iterator.remove();
    }
}
```

## 系统层面的NIO

### BIO模型

![批注 2020-06-18 143426](/assets/批注%202020-06-18%20143426.png)

- socket=3 bind(3,port) listen(3) accept(3)=block|5
- recv(5)=block|data

弊端：每连接一线程

### 同步非阻塞 NIO 

![批注 2020-06-18 143440](/assets/批注%202020-06-18%20143440.png)

- fcntl 开启非阻塞

使用一个线程处理N个连接读写

每次循环会发生大量无用的系统调用

### 多路复用器

#### 同步IO模型

**(select, pselect)：**

- 传入fd列表，内核返回准备好的fd列表
- 在用户空间对fd轮询

弊端：需要在内核与用户空间之间拷贝fd

![批注 2020-06-18 143959](/assets/批注%202020-06-18%20143959.png)

**多路复用 无需再拷贝fd：**

调用epoll_create创建一个fd指向共享空间

将客户端fd存放在共享空间 使用 epoll_ctl_add epoll_ctl_mod  epoll_ctl_del 

使用epoll_wait会返回可用fd列表 程序再对fd列表操作

![批注 2020-06-18 144854](/assets/批注%202020-06-18%20144854.png)
