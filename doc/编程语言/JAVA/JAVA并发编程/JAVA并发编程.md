# 并发编程

- 并发：指两个或多个事件在同一个时间段内发生。
- 并行：指两个或多个事件在同一时刻发生（同时发生）。

超线程：一个ALU对应多个PC

并发程序的特点：

- 线程之间相互制约的关系
- 线程执行过程需要上下文切换　断断续续的
- 并发数设置合理时(以CPU)　才会提高并发程序的性能

## 线程间通信

- 等待-唤醒机制

![06_等待唤醒案例分析](/assets/06_等待唤醒案例分析.bmp)

要注意，wait() notify() notifyAll()都需要在synchronized中

wait() 会释放锁，sleep() 不会

```java
Object object = new Object();

new Thread(){
    @Override
    public void run() {
        synchronized (object){
            System.out.println("要5个包子");
            // 进入等待，这时候锁会被释放
            try {
                object.wait();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println("得到了5个包子");
        }
    }
}.start();

new Thread(){
    @Override
    public void run() {
        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        synchronized (object){
            System.out.println("包子生产完毕，告诉顾客");
            // 通知等待线程中的任意一个
            object.notify();
        }
    }
}.start();
```

- wait与notify一定要在线程同步中使用,并且是同一个锁的资源
- 在调用sleep()方法的过程中，线程不会释放对象锁

## 对象的共享

- 发布: 使对象能在当前作用域之外使用
- 逸出: 某个不该发布的对象被发布了

如果this在构造器完成构造之前逸出，还没被构造完成的对象被别人使用，会发生什么问题？

### 线程封闭

> 某个对象只能在某个线程之内使用

#### Ad-hoc线程封闭

- 完全由程序保证对象不被逸出，很脆弱

#### 栈封闭

- 对象只能在局部（方法内）使用

```java
public void process() {
    Object obj = new Object();
    // 对对象做些计算
    int result = obj.process();
    return result;
}
```

#### [ThreadLocal](/编程语言/JAVA/JAVA并发编程/并发工具类.md#ThreadLocal)

- 保证线程自己的数据封闭在本线程内

```java
private static ThreadLocal<Connection> holder = ThreadLocal.withInitial(() -> getConnection());
```

### 不变性

> 不可变对象一定是线程安全的

- 对象创建后其状态就不能修改
- 对象的所有域都是final
- 在对象创建的过程中this引用没有逸出

### 安全发布

在多线程环境下使用可变的对象，需要通过安全发布的方式并且需要通过锁来保护

- 在静态初始化函数中初始化一个对象的引用（JVM同步机制保障）
- 将对象的引用保存到volatile类型的域或者 Reference对象
- 将对象的引用保存到正确初始化的对象的final域
- 将对象的引用保存到由锁保护的域

## 对象的组合

- 如何构建线程安全的类？

**依赖状态的操作**：某个操作包含有基于状态的先验操作

```java
if (a== 1){
    a++;
}
```

在并发编程中，由于其他线程也会修改状态，所以需要一些JUC中的基础类库来帮助我们在并发环境下执行基于依赖的操作

在提供多线程API时，将是否线程安全文档化

### 实例封闭

- 监视器模式（客户端加锁），最简单的封闭机制

> 将线程不安全的对象封装在某个进行良好并发控制的对象内

```java
private Object obj = new Object();
...
synchronized(obj){
    obj.xxx();
}
```

### 线程安全委托

> 线程不安全的对象将线程安全的职责委托给线程安全的对象

```java
// 线程安全的类
private AtomicInteger coutner = new AtomicInteger();
...
void increase() {
    counter.increase();
}
```

这种方式要求委托方对被委托方的API调用不能出现复合操作，否则委托方仍需要采用一定的线程安全机制

```java
private AtomicInteger coutner1 = new AtomicInteger();
private AtomicInteger coutner2 = new AtomicInteger();
...
// × 不安全
void increase() {
    coutner1.increase();
    coutner2.increase();
}
```

## 取消与关闭

一个可取消的任务必须拥有取消策略

```java
while(runnable) {
    // do something
}
```

使用中断来取消是最合理的方式，线程中断是线程之间协作的一种手段，中断是取消的一种语义实现，所以这要求你自己的线程必须决定如何响应中断

除非知道某个线程的中断策略，否则不要中断该线程

```java
// thread1
while(!isInterrupted()){
    System.out.println("running");
    try {
        Thread.sleep(1000);
    } catch (InterruptedException e) {
        break;
    }
}
System.out.println("my thread done");

// main thread
thread1.interrupt();
```

JVM 在线程阻塞状态时若发生中断，会抛出一个中断异常，在非阻塞情况下，就需要检查中断状态来判断是否发生中断

### 使用Future取消

```java
Future<Double> future = service.submit(() -> {
    try {
        Thread.sleep(2000);
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
    return Math.random();
});
try {
    Double ret = future.get(3, TimeUnit.SECONDS);
    System.out.println("result"+ret);
} catch (ExecutionException | TimeoutException e) {
    e.printStackTrace();
}finally {
    future.cancel(true);
    System.out.println("task cancel");
}
```

### 处理不可中断的阻塞

由于如IO等的资源一旦阻塞就无法进行中断，所以可对其做关闭处理来模拟中断

### 停止基于线程的服务

基于生产者消费者的队列模式，要求消费者等待生产者完全关闭后，才能安全结束

- 使用ExecutorService的生命周期管理方法
- 毒药对象
  - 本质上就是一个flag，当队列读取到这个毒药时，就会停止相关操作 这要求生产与消费者数量都要是已知的 因为只有接收到确定数量的毒药对象 才能判断是否所有生产者都停止了

### 处理非正常的线程终止

```java
thread.setDefaultUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() {
    @Override
    public void uncaughtException(Thread t, Throwable e) {
        System.out.println(t + "something happen" + e);
    }
});

new Thread(){
    @Override
    public void run() {
        throw new RuntimeException("aaaa");
    }
}.start();
```

### JVM关闭钩子

```java
Runtime.getRuntime().addShutdownHook(new Thread(){
    @Override
    public void run() {
        System.out.println("jvm shutdown");
    }
});
```

## 活跃性危险

- 死锁
    - 静态顺序死锁
    - 动态顺序死锁
    - 资源死锁
>死锁是指两个或两个以上的进程在执行过程中，由于竞争资源或者由于彼此通信而造成的一种阻塞的现象，若无外力作用，它们都将无法推进下去。此时称系统处于死锁状态或系统产生了死锁，这些永远在互相等待的进程称为死锁进程。

### 诊断与避免

- 定时锁
  - 获取-超时-退出

### 其他活跃性危险

- 饥饿
  - 无法获取到需要的资源
- 响应性慢
- 活锁
  - 线程不断重复某个操作

## 性能与伸缩性

- 引入线程的开销
  - 上下文切换
  - 内存同步
  - 阻塞

## 如何减少锁的竞争

- 缩小锁的范围
  - 缩小synchronized关键字包围的代码块
- 减小锁的粒度
  - 不同的操作使用不同的锁
- 分段锁
- 替代独占锁
  - 采取读写锁

## 并发程序测试

- 正确性测试
- 安全性测试
- 性能测试

### 性能测试陷阱

- 垃圾回收
- 动态编译（JIT）
- 编译优化
- 竞争程度

## 锁优化

### 自旋锁与自适应自旋

是让一个线程在请求一个共享数据的锁时执行忙循环（自旋）一段时间，如果在这段时间内能获得锁，就可以避免进入阻塞状态

自旋等待本身虽然避免了线程切换的开销，但它是要占用处理器时间的，如果等待时间比较短，自旋还是很划算的

自旋超过一定的阈值就不会再继续重试，自适应自旋则代表这个阈值不是固定的，会根据性能监控情况动态调整

### 锁消除

对于被检测出不可能存在竞争的共享数据的锁进行消除

### 锁细化

经历缩小锁的作用范围

### 锁粗化

如果一系列的连续操作都对同一个对象反复加锁和解锁，频繁的加锁操作就会导致性能损耗

如果虚拟机探测到由这样的一串零碎的操作都对同一个对象加锁，将会把加锁的范围扩展（粗化）到整个操作序列的外部

```java
synchronized(obj){
    //...
}
synchronized(obj){
    //...
}
synchronized(obj){
    //...
}
```

```java
synchronized(obj){
    //...
    //..
    //...
}
```

### 轻量级锁

轻量级锁是相对于传统的重量级锁而言，它使用 CAS 操作来避免重量级锁使用互斥量的开销

### 偏向锁

偏向于让第一个获取锁对象的线程，这个线程在之后获取该锁就不再需要进行同步操作，甚至连 CAS 操作也不再需要

## 并发编程良好实践

- 给线程起名字
- 缩小同步范围
- 多用同步工具少用原始的wait,notify
- 使用阻塞队列
- 多用 ConcurrentHashMap 而不是 Hashtable
- 使用栈封闭以及不变性保证线程安全
- 使用线程池
