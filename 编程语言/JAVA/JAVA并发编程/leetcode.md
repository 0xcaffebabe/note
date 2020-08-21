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

## 交替打印FooBar

<https://leetcode-cn.com/problems/print-foobar-alternately/>

- 自旋

```java
class FooBar {
    private int n;
    private volatile boolean f = false;
    public FooBar(int n) {
        this.n = n;
    }

    public void foo(Runnable printFoo) throws InterruptedException {
        
        for (int i = 0; i < n; i++) {
        	// printFoo.run() outputs "foo". Do not change or remove this line.
                while(f){Thread.yield();}
                printFoo.run();
                f=true;
        }
    }

    public void bar(Runnable printBar) throws InterruptedException {
        
        for (int i = 0; i < n; i++) {
            // printBar.run() outputs "bar". Do not change or remove this line.
                while(!f){Thread.yield();}
                printBar.run();
                f=false;
        }
    }
}
```

## 打印零与奇偶数

<https://leetcode-cn.com/problems/print-zero-even-odd/submissions/>

```java
class ZeroEvenOdd {
    private final int n;
    private volatile int i =1;
    private volatile int f= 0;
    public ZeroEvenOdd(int n) {
        this.n = n;
    }

    // printNumber.accept(x) outputs "x", where x is an integer.
    public void zero(IntConsumer printNumber) throws InterruptedException {
        while(true){
            while(f != 0){
                Thread.yield();
                if (i>n){
                    return;
                }
            }
            printNumber.accept(0);
            if (i%2==1){
                f=1;
            }else{
                f=2;
            }
        }
        
    }

    public void odd(IntConsumer printNumber) throws InterruptedException {
        while(true){
            while(f != 1){
                Thread.yield();
                if (i>n){
                    return;
                }
            }
            printNumber.accept(i++);
            f=0;
        }
        
    }

    public void even(IntConsumer printNumber) throws InterruptedException {
        while(true){
            while(f != 2){
                Thread.yield();
                if (i>n){
                    return;
                }
            }
            printNumber.accept(i++);
            f=0;
        }
        
    }
}
```

## H20生成

<https://leetcode-cn.com/problems/building-h2o/submissions/>

```java
class H2O {

    private CyclicBarrier barrier;
    volatile boolean f = false;
    public H2O() {
        barrier = new CyclicBarrier(2,new Runnable(){
            public void run(){setF(false);}
        });
    }

    private void setF(boolean val){
        f = val;
    }

    public void hydrogen(Runnable releaseHydrogen) throws InterruptedException {
		
        // releaseHydrogen.run() outputs "H". Do not change or remove this line.
        while(!f){Thread.yield();}
        releaseHydrogen.run();
        try {
            barrier.await();
        }catch(Exception e){
            throw new RuntimeException(e);
        }
    }

    public void oxygen(Runnable releaseOxygen) throws InterruptedException {
        while(f){Thread.yield();}
        // releaseOxygen.run() outputs "O". Do not change or remove this line.
		releaseOxygen.run();
        f= true;
    }
}
```