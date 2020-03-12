# 线程安全性

> 当多个线程访问某个类时，这个类始终都能表现出正确的行为，则称这个类是线程安全的

- 无状态对象一定是线程安全的

## 原子性

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

- 复合操作：由一系列原子操作构成

## 加锁机制

- 内置锁:`synchronized`关键字

> 重入：某个线程试图获得一个已经由它持有的锁

锁能使其保护的代码路径以串行形式访问

- 对持有锁的范围、时间进行良好设计

### 非阻塞同步

互斥同步最主要的问题就是线程阻塞和唤醒所带来的性能问题，因此这种同步也称为阻塞同步

悲观的并发策略：认为只要不去做正确的同步措施，那就肯定会出现问题。无论共享数据是否真的会出现竞争，它都要进行加锁

乐观并发策略：先进行操作，如果没有其它线程争用共享数据，那操作就成功了，否则采取补偿措施

#### CAS

乐观锁需要操作和冲突检测这两个步骤具备原子性。

比较并交换（Compare-and-Swap，CAS）

CAS 指令需要有 3 个操作数，分别是内存地址 V、旧的预期值 A 和新值 B。当执行操作时，只有当 V 的值等于 A，才将 V 的值更新为 B

# 对象的共享

## 可见性

在没有同步的情况下，编译器或者处理器都会对一些上下文无关的指令进行**重排序**，这可能会导致一个线程修改了某一个数值，而另一个线程无法马上读取到修改后的数值

- 失效数据
- 非原子的64位操作

  > 在java当中，一个64位大小的数值可以被分为2个32位的操作

### 加锁与可见性

![](https://wiki.jikexueyuan.com/project/java-concurrency/images/synchronous.jpg)

之所以要在访问某个共享的可变变量时要求所有线程在锁上同步，就是为了确保读写可见性。 加锁的含义不局限与互斥行为，还包括内存可见性

volatile是比synchronized更为轻量级的同步机制，它无法进行互斥操作，但能保证内存可见性

- 典型用法

```java
voatile boolean f;
...
while (f){
    // do something
}
```

## 发布与逸出

发布:

> 使对象能在当前代码作用域之外使用

逸出:

> 某个不该发布的对象被发布了

## 线程封闭

> 某个对象只能在线程之内使用

- Ad-hoc线程封闭

  - 完全由程序承担，很脆弱

- 栈封闭

  - 对象只能在局部（方法内）使用

- ThreadLocal

  - 使用ThreadLocal包装的对象只能在当前线程使用

## 不变性

> 不可变对象一定是线程安全的

- 对象创建后其状态就不能修改
- 对象的所有域都是final
- 在对象创建的过程中this引用没有逸出

## 安全发布

- 在静态初始化函数中初始化一个对象的引用
- 将对象的引用保存到volatile类型的域或者 Reference对象
- 将对象的引用保存到正确初始化的对象的final域
- 将对象的引用保存到由锁保护的域

# 对象的组合

**依赖状态的操作**：某个操作包含有基于状态的先验操作

```java
if (a== 1){
    a++;
}
```

## 实例封闭

> 将线程不安全的对象封装在某个进行良好并发控制的对象内

- 客户端加锁

```java
private Object obj = new Object();
...
synchronized(obj){
    obj.xxx();
}
```

# 基础构建模块

> JAVA5后自带了很多有关并发编程的类库

## 同步容器类

- 迭代器与ConcurrentModificationException
  - 当在迭代的时候，容器元素发生了修改，则会抛出这个异常

## 并发容器

- ConcurrentHashMap
  - 分段锁
- CopyOnWriteArrayList
  - 在写的时候不对原集合进行修改，而是重新复制一份，修改完之后，再移动指针

## 阻塞队列

- BlockingQueue
    - 该类型的队列执行take时如果没有元素则会一直阻塞，put如果超过了界限也会一直阻塞，直至有可用空间
    - 实现类:ArrayBlockingQueue与LinkedBlockingDeque等

## 同步工具类

- CountDownLatch(闭锁)

> 确保某些活动直到其他活动都完成后才继续执行

![202031219448](/assets/202031219448.png)

```java
CountDownLatch lock = new CountDownLatch(5);

for (int i = 0; i < 5; i++) {
    int finalI = i;
    new Thread(()->{
        Random random = new Random();
        try {
            Thread.sleep(random.nextInt(5000));
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("线程"+ finalI +"完成");
        lock.countDown();
    }).start();
}

lock.await();
System.out.println("all mission complete");
```

- FutureTask

>用来执行一些较长时间的计算，通过get来获取结果（阻塞或者超时）

用于异步获取执行结果或取消执行任务的场景

```java
FutureTask<Integer> futureTask = new FutureTask<>(() -> {
    int result = 0;
    for (int i = 0; i < 100; i++) {
        Thread.sleep(10);
        result += i;
    }
    return result;
});
new Thread(futureTask).start();
System.out.println(futureTask.get());
```

- Semaphore(信号量)

> 用来控制使用资源的主体数量

```java
Semaphore semaphore = new Semaphore(5);
// 最多只有5个线程能同时运行
for (int i = 0; i < 10; i++) {
    new Thread(()->{
        Random rnd = new Random();

        try {
            semaphore.acquire();
            System.out.println(Thread.currentThread()+"acquire lock");
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }finally {
            semaphore.release();
        }
    }).start();
}
```

- CyclicBarrier（栅栏）

>闭锁用于等待事件，而栅栏用于等待其他线程

![2020312194816](/assets/2020312194816.png)

```java
CyclicBarrier barrier = new CyclicBarrier(5, () -> System.out.println("mission complete"));
// 调用await的线程会进行等待，直到第5个线程调用await，所有线程才会继续执行
for (int i = 0; i < 5; i++) {
    new Thread(() -> {
        Random rnd= new Random();
        try {
            System.out.println(Thread.currentThread()+"run");
            Thread.sleep(rnd.nextInt(3000));
            barrier.await();
        } catch (InterruptedException | BrokenBarrierException e) {
            e.printStackTrace();
        }
    }).start();
}
```

# 任务执行

- 串行执行
- 显式创建线程执行

## Executor框架

```java
public interface Executor {

    void execute(Runnable command);
}
```

### 执行策略

- 什么线程
- 什么顺序
- 多少任务执行
- 多少任务等待
- 如何放弃以及通知放弃
- 任务执行前操作

### 线程池

```java
        Executors.newFixedThreadPool(5); // 创建固定长度的线程池
        Executors.newCachedThreadPool(); // 可缓存线程池，动态伸缩
        Executors.newSingleThreadExecutor(); // 单线程线程池
        Executors.newScheduledThreadPool(5); // 可以延迟或者定时执行
```

### 生命周期

ExecutorService继承了Executor，增加了一些方法

```java
public interface ExecutorService extends Executor {
    // 平缓关闭
    void shutdown();

    // 粗暴关闭
    List<Runnable> shutdownNow();

    boolean isShutdown();

    boolean isTerminated();

    boolean awaitTermination(long timeout, TimeUnit unit)
        throws InterruptedException;

    <T> Future<T> submit(Callable<T> task);

    <T> Future<T> submit(Runnable task, T result);

    Future<?> submit(Runnable task);

    <T> List<Future<T>> invokeAll(Collection<? extends Callable<T>> tasks)
        throws InterruptedException;

    <T> T invokeAny(Collection<? extends Callable<T>> tasks)
        throws InterruptedException, ExecutionException;
}

```

# 取消与关闭

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

## 使用Future取消

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

## 处理不可中断的阻塞

由于如IO等的资源一旦阻塞就无法进行中断，所以可对其做关闭处理来模拟中断

# 停止基于线程的服务

- 使用生命周期管理ExecutorService
- 毒药对象
  - 本质上就是一个flag，当队列读取到这个毒药时，就会停止相关操作

# 处理非正常的线程终止

```java
        Thread.setDefaultUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() {
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

# JVM关闭钩子

```java
        Runtime.getRuntime().addShutdownHook(new Thread(){
            @Override
            public void run() {
                System.out.println("jvm shutdown");
            }
        });
```

# 线程池的大小

N<sub>cpu</sub> = CPU数量
U<sub>cpu</sub> = 预期CPU使用率
W/C = 等待时间/计算时间

最优大小等于 N<sub>cpu</sub> * U<sub>cpu</sub> * (1 + W/C)

# 活跃性危险

- 死锁
    - 静态顺序死锁
    - 动态顺序死锁
    - 资源死锁
>死锁是指两个或两个以上的进程在执行过程中，由于竞争资源或者由于彼此通信而造成的一种阻塞的现象，若无外力作用，它们都将无法推进下去。此时称系统处于死锁状态或系统产生了死锁，这些永远在互相等待的进程称为死锁进程。

## 诊断与避免

- 定时锁
  - 获取-超时-退出

## 其他活跃性危险

- 饥饿
  - 无法获取到需要的资源
- 响应性慢
- 活锁
  - 线程不断重复某个操作

# 性能与伸缩性

- 引入线程的开销
  - 上下文切换
  - 内存同步
  - 阻塞

# 如何减少锁的竞争

- 缩小锁的范围
  - 缩小synchronized关键字包围的代码块
- 减小锁的粒度
  - 不同的操作使用不同的锁
- 分段锁
- 替代独占锁
  - 采取读写锁

# 并发程序测试

- 正确性测试
- 安全性测试
- 性能测试

## 性能测试陷阱

- 垃圾回收
- 动态编译（JIT）
- 编译优化
- 竞争程度

# 显式锁

- Lock接口

```java
public interface Lock {
    // 其中一个实现类：ReentrantLock
    void lock();

    void lockInterruptibly() throws InterruptedException;

    boolean tryLock();

    boolean tryLock(long time, TimeUnit unit) throws InterruptedException;

    void unlock();

    Condition newCondition();
}
```

显式锁拥有比内置锁(synchronized关键字)更多的功能，但使用起来更加复杂，显式锁作为一种高级工具，只有在synchronized无法满足需求的情况下才使用

ReentrantLock是一种互斥锁，也就说在同一时间内只有一个线程能对资源读或者写，如果要对读写分别控制，考虑使用ReadWriteLock

# 锁优化

## 自旋锁

是让一个线程在请求一个共享数据的锁时执行忙循环（自旋）一段时间，如果在这段时间内能获得锁，就可以避免进入阻塞状态

## 锁消除

对于被检测出不可能存在竞争的共享数据的锁进行消除

## 锁粗化

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

## 轻量级锁

轻量级锁是相对于传统的重量级锁而言，它使用 CAS 操作来避免重量级锁使用互斥量的开销

## 偏向锁

偏向于让第一个获取锁对象的线程，这个线程在之后获取该锁就不再需要进行同步操作，甚至连 CAS 操作也不再需要

# 并发编程良好实践

- 给线程起名字
- 缩小同步范围
- 多用同步工具少用原始的wait,notify
- 使用阻塞队列
- 多用 ConcurrentHashMap 而不是 Hashtable
- 使用栈封闭以及不变性保证线程安全
- 使用线程池