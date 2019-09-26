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
- 将对象的引用保存到volatile类型的域或者AtomicReference对象
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

> 确保某些活动直到其他活动都完成后才继续执行(并发编程中的屏障)

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

- Semaphore(信号量)

> 用来控制使用资源的主体数量

```java
        Semaphore semaphore = new Semaphore(5);

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
```

- CyclicBarrier（栅栏）

>闭锁用于等待事件，而栅栏用于等待其他线程

```java
        CyclicBarrier barrier = new CyclicBarrier(5, () -> System.out.println("mission complete"));

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

