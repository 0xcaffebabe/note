# 目录
[toc]
# Activity
## 介绍
>Activity 是一个应用组件，用户可与其提供的屏幕进行交互，以执行拨打电话、拍摄照片、发送电子邮件或查看地图等操作。 每个 Activity 都会获得一个用于绘制其用户界面的窗口。窗口通常会充满屏幕，但也可小于屏幕并浮动在其他窗口之上。
一个应用通常由多个彼此松散联系的 Activity 组成。 一般会指定应用中的某个 Activity 为“主”Activity，即首次启动应用时呈现给用户的那个 Activity。 而且每个 Activity 均可启动另一个 Activity，以便执行不同的操作。 每次新 Activity 启动时，前一 Activity 便会停止，但系统会在堆栈（“返回栈”）中保留该 Activity。 当新 Activity 启动时，系统会将其推送到返回栈上，并取得用户焦点。 返回栈遵循基本的“后进先出”堆栈机制，因此，当用户完成当前 Activity 并按“返回”按钮时，系统会从堆栈中将其弹出（并销毁），然后恢复前一 Activity。 （任务和返回栈文档中对返回栈有更详细的阐述。）
当一个 Activity 因某个新 Activity 启动而停止时，系统会通过该 Activity 的生命周期回调方法通知其这一状态变化。Activity 因状态变化—系统是创建 Activity、停止 Activity、恢复 Activity 还是销毁 Activity— 而收到的回调方法可能有若干种，每一种回调都会为您提供执行与该状态变化相应的特定操作的机会。 例如，停止时，您的 Activity 应释放任何大型对象，例如网络或数据库连接。 当 Activity 恢复时，您可以重新获取所需资源，并恢复执行中断的操作。 这些状态转变都是 Activity 生命周期的一部分。
## 生命周期
- onCreate:系统在创建Activity时调用，必须在此方法内调用 setContentView()
- onPause：作为用户离开 Activity 的第一个信号（但并不总是意味着 Activity 会被销毁）进行调用
- onRestart：在 Activity 已停止并即将再次启动前调用
- onResume:在 Activity 即将开始与用户进行交互之前调用
- onStop：在 Activity 对用户不再可见时调用
- onDestory:在 Activity 被销毁前调用
![enter image description here](https://developer.android.com/images/activity_lifecycle.png)
## Activity创建
manifest:
```xml
<activity android:name=".MainActivity">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />

                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
</activity>
```
class:
```java
public class Main2Activity extends AppCompatActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main2);
    }
}
```
## Activity的启动
### 显式启动
```java
Intent intent = new Intent();
intent.setClass(MainActivity.this,Main2Activity.class);
startActivity(intent);
```
### 隐式启动
```java
Intent intent = new Intent();
intent.setAction(Intent.ACTION_VIEW);
intent.setData(Uri.parse("http://baidu.com"));
startActivity(intent);
```
隐式启动需要在xml中声明intent-fliter：
```xml
<intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
</intent-filter>
```
## Activity之间的数据传递
Activity之间通过Intent来传递数据，载体是Bundle:
```java
Intent intent = new Intent();
Bundle bundle = new Bundle();
bundle.putInt("int",1);
bundle.putString("string","adsa");
bundle.putSerializable("ser",new HashMap<>());
bundle.putParcelable();
```
（也可以选择不适用Bundle，直接通过Intent进行put）Bundle除了能传递基本类型与String外，还支持Serializable，可序列化对象，也能存放实现了Parcelable接口的对象，这是安卓自己的一个接口。

接收方则是通过调用```getIntent()```这个方法获取传递过来的Intent，如果不为空，则就可以通过Intent来获取数据
```java
Intent intent = getIntent();

if (intent != null){
    Log.i("test",String.valueOf(intent.getExtras().getInt("int")));
}
```
### 获取返回数据
当一个Activity返回到上一个Activity时，要如何进行数据交互？
使用回调：
Activity1:
```java
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        Button btn = findViewById(R.id.button);

        btn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
               startActivityForResult(new Intent(),1);
            }
        });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        Log.i("test",data.getStringExtra("name"));
        super.onActivityResult(requestCode, resultCode, data);

    }
```
Activity2:
```java
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main2);
        Intent intent = getIntent();

        if (intent != null){
            Log.i("test",String.valueOf(intent.getExtras().getInt("int")));
        }

        Intent intent1 = new Intent();
        intent1.putExtra("name","my");
        setResult(1,intent1);
    }
```
需要注意的是，如果要求Activity返回结果，需要使用```startActivityForResult```这个函数
## Activity与Task

