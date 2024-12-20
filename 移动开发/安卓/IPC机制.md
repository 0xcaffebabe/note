# IPC机制
IPC:进程间通信
## 安卓中的多进程模式
### 开启多进程
在清单文件中添加：android:process
```xml
<activity android:name=".Main2Activity" android:process=":p1"></activity>
```
代表该activity以包名.p1作为进程名进行运行
### 多线程造成的问题
- 静态成员、单例模式完全失效
- 线程同步机制失效
- SharedPrerences可靠性下降
- Application多次创建
## IPC
### Serializable接口
java当中自带的序列化接口
### Parceable接口
实现接口：
```java
public class User implements Parcelable {

    private String name;

    private int age;

    protected User(Parcel in) {
        name = in.readString();
        age = in.readInt();
    }

    // 省略构造器

    public static final Creator<User> CREATOR = new Creator<User>() {
        @Override
        public User createFromParcel(Parcel in) {
            return new User(in);
        }

        @Override
        public User[] newArray(int size) {
            return new User[size];
        }
    };

    @Override
    public int describeContents() {
        return 0;
    }

    @Override
    public void writeToParcel(Parcel dest, int flags) {
        dest.writeString(name);
        dest.writeInt(age);
    }


    //省略toString
}
```
这样，就可以直接在Intent中传送User类型的对象了：
```java
Intent intent = new Intent();
                intent.setClass(MainActivity.this,Main2Activity.class);
                intent.putExtra("user",new User("小明",15));
                startActivity(intent);
```
## 安卓中的IPC方式
- Bundle
- 文件共享
    *SharedPreferences本质：XML*
- Messenger
- AIDL
- ContentProvider