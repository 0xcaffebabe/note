# 多线程-leetcode

## 按序打印

- 解法1

CountDownLatch

```java
class Foo {
    private CountDownLatch latch2 = new CountDownLatch(1);
    private CountDownLatch latch3 = new CountDownLatch(1);
    public Foo() {
        
    }

    public void first(Runnable printFirst) throws InterruptedException {
        // printFirst.run() outputs "first". Do not change or remove this line.
        printFirst.run();
        latch2.countDown();
    }

    public void second(Runnable printSecond) throws InterruptedException {
        latch2.await();
        // printSecond.run() outputs "second". Do not change or remove this line.
        printSecond.run();
        latch3.countDown();
    }

    public void third(Runnable printThird) throws InterruptedException {
        latch3.await();
        // printThird.run() outputs "third". Do not change or remove this line.
        printThird.run();
    }
}
```