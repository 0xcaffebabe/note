# JAVA内存模型(JMM)

## 线程安全

当多个线程访问某个类时，这个类始终都能表现出正确的行为，则称这个类是线程安全的

### 解决方法

- 内置锁
  - 同步方法
    - 静态：当前类的同步代码块
    - 非静态：当前对象的同步代码块
  - 同步代码块
- 显式锁

## 死锁

两个线程互相等待对方持有的锁而陷入无限等待状态

## ThreadLocal

>当使用ThreadLocal维护变量时，ThreadLocal为每个使用该变量的线程提供独立的变量副本，所以每一个线程都可以独立地改变自己的副本，而不会影响其它线程所对应的副本

```java
public class Main implements Runnable{
    private ThreadLocal<String> ts = new ThreadLocal<>();

    @Override
    public void run() {
        ts.set(Thread.currentThread().getName());
        System.out.println(ts.get());
    }
}
```

### 原理

```java
public void set(T value) {
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    if (map != null) {
        map.set(this, value);
    } else {
         createMap(t, value);
    }
}
```

## JAVA内存模型JMM

>JMM定义了线程和主内存之间的抽象关系：线程之间的共享变量存储在主内存（main memory）中，每个线程都有一个私有的本地内存（local memory），本地内存中存储了该线程以读/写共享变量的副本







