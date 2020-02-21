# Handler
[toc]

>Handler 是一个消息分发对象。handler是Android给我们提供用来更新UI的一套机制，也是一套消息处理机制，我们可以发消息，也可以通过它处理消息

由于非UI线程无法修改界面（主要的原因是防止数据不一致）

那么，如果直接创建一个线程，进行UI更新操作，程序会崩掉：
```java
new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Thread.sleep(3000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }

                Toast.makeText(MainActivity.this,"获取到消息",Toast.LENGTH_SHORT).show();

            }
        }).start();
```
## 发送消息
```java
// 成员变量
private Handler handler = new Handler(new Handler.Callback() {
        @Override
        public boolean handleMessage(Message msg) {
            Toast.makeText(MainActivity.this,"获取到消息"+msg.what,Toast.LENGTH_SHORT).show();
            return true;
        }
    });

// 创建一个发送消息给Handler
new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Thread.sleep(3000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }

                Toast.makeText(MainActivity.this,"获取到消息",Toast.LENGTH_SHORT).show();
                Message message = new Message();
                message.what=0x123;
                handler.sendMessage(message);
            }
        }).start();
```
## 直接让Handler执行一段代码
```java
new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Thread.sleep(3000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }

                handler.post(new Runnable() {
                    @Override
                    public void run() {
                        Toast.makeText(MainActivity.this,"获取到消息",Toast.LENGTH_SHORT).show();
                    }
                });
                
            }
        }).start();
```
## Callback
这个类是Handler的一个内部类，作用主要是回调，在上面的例子我们已经认识到它的作用了

## UI线程与子线程通信
- Looper：类似一个消息泵。它本身是一个死循环，不断地从MessageQueue中提取Message或者Runnable
- MessageQueue：一个消息队列，可以看作是一个容器，用来存放消息

而Handler可以看做是一个Looper的暴露接口，向外部暴露一些事件，并暴露sendMessage()和post()函数

除了UI线程/主线程以外，普通的线程(先不提HandlerThread)是不自带Looper的
## 更新UI的四种方式
- 使用Handler消息传递
- Handler的post
- AsyncTask
- Activity.runOnUiThread
- View.post
后两种本质上也是使用了Handler

## 非UI线程更新UI
在oncreate方法中开启子线程更新ui，在thread没有休眠的情况下，因为ViewRootImp在activity的onresume方法中创建，在ViewRootImp方法中判断当前线程是否为主线程，oncreate在onresume之前执行，所以这种情况下，可以进行更新ui操作
```java
@Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        new Thread(new Runnable() {
            @Override
            public void run() {
                
                handler.post(new Runnable() {
                    @Override
                    public void run() {
                        Toast.makeText(MainActivity.this,"获取到消息",Toast.LENGTH_SHORT).show();
                    }
                });

            }
        }).start();

    }
```
以上代码可以正确运行