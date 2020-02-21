[toc]
# Intent 与 Intent过滤器
> Intent 是一个消息传递对象，您可以使用它从其他应用组件请求操作
其基本用例主要包括以下三个：
- 启动 Activity
- 启动服务
- 传递广播
## Intent类型
- 显式 Intent：按名称（完全限定类名）指定要启动的组件
- 隐式 Intent ：不会指定特定的组件，而是声明要执行的常规操作，从而允许其他应用中的组件来处理它

**从 Android 5.0（API 级别 21）开始，如果使用隐式 Intent 调用 bindService()，系统会引发异常**
##　构建 Intent
Intent 中包含的主要信息如下：
- 组件名称
- 操作
- 数据
- 类别
- Extra
- 标志
### 显式 Intent 示例
```java
// 在 Activity 中执行, 所以 'this' 就是当前的上下文
//  fileUrl 是一个URL, 类似 "http://www.example.com/image.png"
Intent downloadIntent = new Intent(this, DownloadService.class);
downloadIntent.setData(Uri.parse(fileUrl));
startService(downloadIntent);
```
### 隐式 Intent 示例
```java
// 创建一条文本消息
Intent sendIntent = new Intent();
sendIntent.setAction(Intent.ACTION_SEND);
sendIntent.putExtra(Intent.EXTRA_TEXT, textMessage);
sendIntent.setType("text/plain");

// 确定这个Intent可以匹配到Activity
if (sendIntent.resolveActivity(getPackageManager()) != null) {
    startActivity(sendIntent);
}
```
设置选择框标题：
```java
Intent chooser = Intent.createChooser(sendIntent, title);
```
### 接收隐式 Intent
以下是一个使用包含 Intent 过滤器的 Activity 声明，当数据类型为文本时，系统将接收 ACTION_SEND Intent ：
```xml
<activity android:name="ShareActivity">
    <intent-filter>
        <action android:name="android.intent.action.SEND"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <data android:mimeType="text/plain"/>
    </intent-filter>
</activity>
```
```
限制对组件的访问
---
如果必须确保只有您自己的应用才能启动您的某一组件，请针对该组件将 exported 属性设置为 "false"
```
