# Disruptor

## 设计方案

- 环形数组结构
  - 为了避免垃圾回收，采用数组而非链表。同时，数组对处理器的缓存机制更加友好。
- 元素位置定位
  - 数组长度2^n，通过位运算，加快定位的速度。下标采取递增的形式。不用担心index溢出的问题。index是long类型，即使100万QPS的处理速度，也需要30万年才能用完。
- 无锁设计
  - 每个生产者或者消费者线程，会先申请可以操作的元素在数组中的位置，申请到之后，直接在该位置写入或者读取数据。

## 开发

- 定义Event - 队列中需要处理的元素
- 定义Event工厂，用于填充队列

disruptor初始化的时候，会调用Event工厂，对ringBuffer进行内存的提前分配 GC产生频率会降低

```java
public class StringEventFactory implements EventFactory<String> {
    @Override
    public String newInstance() {
        return UUID.randomUUID().toString();
    }
}
```

- 定义EventHandler（消费者），处理容器中的元素

```java
public class StringEventHandler implements EventHandler<String> {
    @Override
    public void onEvent(String s, long l, boolean b) throws Exception {
        System.out.println(Thread.currentThread().getName() + "handle " + s);
    }
}
```

```java
StringEventFactory eventFactory = new StringEventFactory();
int bufferSize = 1024;

Disruptor<String> disruptor =
        new Disruptor<>(eventFactory, bufferSize, Executors.defaultThreadFactory());
disruptor.handleEventsWith(new StringEventHandler());
disruptor.start();

RingBuffer<String> ringBuffer = disruptor.getRingBuffer();
for (int i = 0; i < 10; i++) {
    ringBuffer.publishEvent((s, l) -> {});
}
```

## 生产者线程模式

ProducerType有两种模式 Producer.MULTI和Producer.SINGLE

默认是MULTI，表示在多线程模式下产生sequence

如果确认是单线程生产者，那么可以指定SINGLE，效率会提升

## 等待策略

1，(常用）BlockingWaitStrategy：通过线程阻塞的方式，等待生产者唤醒，被唤醒后，再循环检查依赖的sequence是否已经消费。

2，BusySpinWaitStrategy：线程一直自旋等待，可能比较耗cpu

3，LiteBlockingWaitStrategy：线程阻塞等待生产者唤醒，与BlockingWaitStrategy相比，区别在signalNeeded.getAndSet,如果两个线程同时访问一个访问waitfor,一个访问signalAll时，可以减少lock加锁次数.

4，LiteTimeoutBlockingWaitStrategy：与LiteBlockingWaitStrategy相比，设置了阻塞时间，超过时间后抛异常。

5，PhasedBackoffWaitStrategy：根据时间参数和传入的等待策略来决定使用哪种等待策略

6，TimeoutBlockingWaitStrategy：相对于BlockingWaitStrategy来说，设置了等待时间，超过后抛异常

7，（常用）YieldingWaitStrategy：尝试100次，然后Thread.yield()让出cpu

8，（常用）SleepingWaitStrategy : sleep

## 消费者异常处理

默认：disruptor.setDefaultExceptionHandler()

覆盖：disruptor.handleExceptionFor().with()