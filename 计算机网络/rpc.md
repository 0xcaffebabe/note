# rpc

RPC : Remote Procedure Call ,即远程过程调用。
是分布式系统常见的一-种通信方法,从跨进程到跨物理机已经有几十年历史。

## 从一个方法调用开始

```java
System.our.println("hello world");
```

在本机上，完成这么样的一次方法调用需要：

1. 传递方法参数：将字符串hello world的引用地址压栈
2. 确定方法版本：像在JVM上 这个过程使用invokexxx指令来完成
3. 执行被调方法：从栈中弹出Parameter的值或引用，以此为输入，执行Callee内部的逻辑
4. 返回执行结果：将Callee的执行结果压栈

为了完成这些过程，就需要通过内存来传递数据 如果两个方法不在同一个进程，要如何传递数据？

- 管道（Pipe）或者具名管道（Named Pipe）：通过管道在进程间传递少量的字符流或字节流。普通管道只用于有亲缘关系进程（由一个进程启动的另外一个进程）间的通信
  ```sh
  ps aux | grep tomcat
  ```
- 信号（Signal）:用于通知目标进程有某种事件发生
  ```sh
  kill -9 666
  ```
- 信号量（Semaphore）:相当于操作系统提供的一个特殊变量
- 消息队列（Message Queue）:POSIX标准中定义了消息队列用于进程间数据量较多的通讯
- 共享内存（Shared Memory）：是效率最高的进程间通讯形式
- 套接字接口（Socket）:当仅限于本机进程间通讯时，套接字接口是被优化过的，不会经过网络协议栈，不需要打包拆包、计算校验和、维护序号和应答等操作

## 通信的成本

通过网络进行分布式运算的8宗罪

```
The network is reliable —— 网络是可靠的。
Latency is zero —— 延迟是不存在的。
Bandwidth is infinite —— 带宽是无限的。
The network is secure —— 网络是安全的。
Topology doesn't change —— 拓扑结构是一成不变的。
There is one administrator —— 总会有一个管理员。
Transport cost is zero —— 不必考虑传输成本。
The network is homogeneous —— 网络是同质化的。
```

## RPC的三个基本问题

- 如何表示数据
- 如何传递数据
- 如何确定方法

跨进程交互形式: RESTful、 WebService、 HTTP、 基于DB做数据交换、基于MQ做数据交换,以及RPC。

## 交互形式

- 依赖中间做数据交互

![批注 2020-05-08 204733](/assets/批注%202020-05-08%20204733.png)

- 直接交互

![批注 2020-05-08 204746](/assets/批注%202020-05-08%20204746.png)

## 核心原理

![批注 2020-05-08 205456](/assets/批注%202020-05-08%20205456.png)

## 另外一个角度

如果跳出程序方法调用的视角 不再以传递参数-调用方法-获取结果这样的思路思考 就会有焕然一新的视角