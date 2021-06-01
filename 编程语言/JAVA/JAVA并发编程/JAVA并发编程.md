# 并发编程

- 并发：指两个或多个事件在同一个时间段内发生。
- 并行：指两个或多个事件在同一时刻发生（同时发生）。

超线程：一个ALU对应多个PC

并发程序的特点：

- 线程之间相互制约的关系
- 线程执行过程需要上下文切换　断断续续的
- 并发数设置合理时(以CPU)　才会提高并发程序的性能

## 线程安全

线程安全性：当多个线程访问某个类时，这个类始终都能表现出正确的行为，则称这个类是线程安全的

线程安全问题都是由全局变量及静态变量引起的。若每个线程中对全局变量、静态变量只有读操作，而无写操作，一般来说，这个全局变量是线程安全的；若有多个线程同时执行写操作，一般都需要考虑线程同步， 否则的话就可能影响线程安全。

无状态对象一定是线程安全的。

JAVA API中的线程安全问题

- StringBuffer
- Vector

### 原子性

```java
if (condition){
    a++; // 当此段代码运行在多线程的环境时，则会产生线程安全问题
}
```

观察结果的失效就是大多数竞态条件的本质

一种常见的竞态条件发生在单例构造模式中：

```java
public static Object get(){

    if (instance == null){
        instance = new Object();
    }
    return instance;
}
```

为了解决观察失效这个问题，也就是为了避免静态条件，就需要对一组操作进行原子化，即不可分割。要不全做，要不就不做。这组操作称之为复合操作。

- 复合操作：由一系列原子操作构成

## 锁

### 非阻塞同步

互斥同步最主要的问题就是线程阻塞和唤醒所带来的性能问题，因此这种同步也称为阻塞同步

悲观的并发策略：认为只要不去做正确的同步措施，那就肯定会出现问题。无论共享数据是否真的会出现竞争，它都要进行加锁

乐观并发策略：先进行操作，如果没有其它线程争用共享数据，那操作就成功了，否则采取补偿措施

### 悲观锁 乐观锁

- 乐观锁

总是认为不会产生并发问题，每次去取数据的时候总认为不会有其他线程对数据进行修改，因此不会上锁，但是在更新时会判断其他线程在这之前有没有对数据进行修改，一般会使用版本号机制或CAS操作实现

```sql
update table set x=x+1, version=version+1 where id=${id} and version=${version};
```

- 悲观锁

总是假设最坏的情况，每次取数据时都认为其他线程会修改，所以都会加锁（读锁、写锁、行锁等），当其他线程想要访问数据时，都需要阻塞挂起

synchronized是悲观锁

### 自旋锁

>线程反复检查锁变量是否可用。由于线程在这一过程中保持执行，因此是一种忙等待

### 分布式锁

- zookeeper与redis实现

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

发布:

> 使对象能在当前代码作用域之外使用

逸出:

> 某个不该发布的对象被发布了

### 线程封闭

> 某个对象只能在线程之内使用

- Ad-hoc线程封闭

  - 完全由程序承担，很脆弱

- 栈封闭

  - 对象只能在局部（方法内）使用

### 不变性

> 不可变对象一定是线程安全的

- 对象创建后其状态就不能修改
- 对象的所有域都是final
- 在对象创建的过程中this引用没有逸出

### 安全发布

- 在静态初始化函数中初始化一个对象的引用
- 将对象的引用保存到volatile类型的域或者 Reference对象
- 将对象的引用保存到正确初始化的对象的final域
- 将对象的引用保存到由锁保护的域

## 对象的组合

**依赖状态的操作**：某个操作包含有基于状态的先验操作

```java
if (a== 1){
    a++;
}
```

### 实例封闭

> 将线程不安全的对象封装在某个进行良好并发控制的对象内

- 客户端加锁

```java
private Object obj = new Object();
...
synchronized(obj){
    obj.xxx();
}
```

## 基础构建模块

> JAVA5后自带了很多有关并发编程的类库

### 同步容器类

- 迭代器与ConcurrentModificationException
  - 当在迭代的时候，容器元素发生了修改，则会抛出这个异常

### 执行策略

- 什么线程
- 什么顺序
- 多少任务执行
- 多少任务等待
- 如何放弃以及通知放弃
- 任务执行前操作

## 取消与关闭

- 取消策略

通常，使用中断来取消是最合理的方式

```java
class MyThread extends  Thread{

    @Override
    public void run() {
        while(!isInterrupted()){
            System.out.println("running");
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                break;
            }
        }
        System.out.println("my thread done");
    }
}
```

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

## 停止基于线程的服务

- 使用生命周期管理ExecutorService
- 毒药对象
  - 本质上就是一个flag，当队列读取到这个毒药时，就会停止相关操作

## 处理非正常的线程终止

```java
hread.setDefaultUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() {
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

## JVM关闭钩子

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
