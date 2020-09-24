# Java 谜题

## 表达式

- 奇数性

```java
x % 2 == 1 // 用来判断x是否为奇数
```

当 x 为负数时, 该表达式永不成立

当取余操作返回一个非零结果时 与左操作数拥有相同的正负符号

```java
-1 % 2 == -1
```

- 找零时刻

浮点数问题

```java
2.00 - 1.10 != 0.9 // true
2.00 - 1.10 == 0.8999999999999999 // true
```

- 长整除

```java
long a = 24*60*60*1000*1000
long b = 24*60*60*1000
a / b == 5 // true
```

原因在于a的表达式计算时溢出了 它以int的方式计算最后才存入a

```java
a = 24L*60*60*1000*1000
a / b == 1000 // true
```

- 初级问题

```java
12345 + 5432l == 17777 // true
```

主要小写l 与数字1的区别

- 多重转型

```java
(int)(char)(byte)-1 == 65535 // true
```

1.从int的-1转为byte的-1
2.从byte的-1转为char 发生了符号扩展（char是无符号的 -1会被转为65535）
3.从char转为int

**如果通过观察不能确定成行将要做什么 那么它做的很有可能就不是你想要的**

- 互换内容

```java
x ^= y^= x^= y // 什么垃圾代码?
```

在单个表达式中不要对相同的变量赋值两次

- Dos

```java
int i = 0
true ? 'X' : 0 // 'X'
true ? 'X' : i // 88
```

三元表达式的如果第二个操作数与第三个操作数类型相同 则这个类型就是表达式的类型

否则如果类型不同 较小的类型会被提升为范围较大的那个类型

**条件表达式的操作数类型应该相同**

- 半斤

```java
short x = 0
int i =123456
x = x+i // 编译错误
x+=i // 会自动转型-7616
```

不要将复合赋值操作用于int类型以下的

用在int类型上 确保右侧类型不比int类型大

## 字符串

- 最后的笑声

```java
System.out.println('H' + 'A'); // 137
```

加号运算符在两个操作数都不是字符串的情况下, 执行的将会是加法 而非字符串连接, 两个char变量被提升为int了

- 转义字符的溃败

```java
System.out.println("a\u0022.length()) // 正常运行
```

\u0022 等同于 "

选择转义字符 而非转义unicode

- 可恶的unicode

```java
/**
 * F:\user\data 下存放了xxx
 * @author MY
 * @date 2020/9/15 10:38
 */
public class Main {
    public static void main(String[] args) {
        System.out.println("hello");
    }
}
```

这段代码无法通过编译 原因在第一行路径的\u 编译器会认为其是一个unicode编码 找不到\uxxx这个编码 编译就会出错

- 字符串奶酪

```java
byte[] bytes = new byte[256];
for(int i=0;i<256;i++)bytes[i]= (byte) i;
String str = new String(bytes);
for(int i=0;i<str.length();i++) System.out.print(str.charAt(i) + " ");
```

这段代码所产生出的字符串是在不停的平台上是不确定的, 主要是编码的问题

**即在使用比特数组生成字符串时要显式指定编码**

- 斜杠的受害者

```java
"note.ismy.wang".replaceAll(".","/") // 输出结果：//////////////
```

问题在于replaceAll 传递的第一个参数是一个正则表达式

- 正则表达式的受害者

```java
String.class.getName().replaceAll("\\.",File.separator)
```

上面的代码会抛出异常：IllegalArgumentException：character to be escaped is missing

原因在于replaceAll第二个参数会对字符串进行转义, 如果输入\ 就代表字符串未结束

解决方法是使用replace方法：

```java
String.class.getName().replace(".",File.separator)
```

- URL的愚弄

```java
https://javascript
System.out.println("hello world");
```

上面这段代码编译 运行没问题 原因在与https:被识别为一个标签

后面的// 则被识别为注释

**某些东西看起来过于奇怪 以至于不想对的 那么极有可能是错的**

- 不劳而获

```java
Random rnd = new Random();
StringBuffer word = null;
switch(rnd.nextInt(2)){
    case 1:word = new StringBuffer('P');
    case 2: word = new StringBuffer('G');
    default:word = new StringBuffer('M');
        word.append('a');
        word.append('i');
        word.append('n');
        System.out.println(word);
}
System.out.println(word);
```

最终只会打印出ain

三个bug:

1. nextInt最终的取值范围是0-1
2. 创建StringBuffer传入char时会变成int 导致变成创建char大小的缓冲区
3. case不加break

## 循环

- 尽情享受循环

```java
for(byte b = Byte.MIN_VALUE;b<Byte.MAX_VALUE;b++)
    if (b  == 0x90) System.out.println("hello");
```

这段代码什么也不会打印 主要是因为0x90 是十六机制 代表的是十进制的144 这已经超出了byte的表示范围（-128 - 127）

- 无情的++

```java
int j = 0;
for (int i = 0; i < 100; i++) j = j++;
System.out.println(j);
```

j的最终结果为0, j = j++等同于：

```java
int t = j;
j = j + 1;
j = t;
```

- 在循环中

```java
int count = 0;
for (int i = 0; i <= Integer.MAX_VALUE; i++) count++;
```

循环结束时 count等于多少？

答案是这个循环永远不会停止, 循环继续条件永远为真, 因为i溢出了

- 变幻莫测的值

```java
int i=0;
while(0xffffffff << i != 0 ) i++;
System.out.println(i);
```

这个循环也会无限循环, **移位操作符只会用其右操作数的低五位做移位操作,对于long变量 是低六位** 所以不论i多大, 这里i能做移位操作的最大只能达到32

**如果可能的话 移位长度应该是常量**

- 循环者

```java
double i = Double.POSITIVE_INFINITY;
while(i == i + 1); // 无限循环
```

无穷大+1还是无穷大

一个浮点数值越大, 它和其后继数值间隔越大 浮点数使用了固定的有效位来表示, 所以一个很大的数+1不会改变它的值

- 循环者的新娘

```java
double i = Double.NaN;
while (i != i); // 无限循环
```

Nah != Nah

- 循环者的爱子

```java
String i = "cccc";
while (i != i + 0); // 无限循环
```

- 循环者的鬼魂

```java
short i = -1;
while (i != 0){
    i >>>=1;
} // 无限循环
```

short会被提升为int 0xffffffff

右移之后 变成int的0x7fffffff 后又变成short 被砍掉高4为 变成 0xffff 回到了-1 死循环

- 循环者的诅咒

```java
Integer i = 129;
Integer j = 129;
while (i<=j && j<=i && j!=i); // 死循环
```

**当两个数都是包装类型时 比较操作符执行的是值比较 判等操作符执行的是引用比较**

- 循环者遇到了狼人

```java
Integer i = Integer.MIN_VALUE;
while (i != 0 && i == -i); // 死循环
```

还是整数溢出搞的鬼

- 被计数击倒了

```java
int count = 0;
for(float f = Integer.MAX_VALUE; f< Integer.MAX_VALUE+50;f++) count++;
System.out.println(count); // 0
```

f的值太大了 以至于+50 还是等于f

**不要使用浮点数作为循环索引**

- 分分钟

```java
int count = 0;
for (int i=0;i<60*1000*1000;i++){
    if (i % 60*1000 == 0) count ++;
}
System.out.println(count); // 1000000
```

运算符优先级问题：取模与乘法优先级相同

## 异常

- 优柔寡断

```java
boolean f(){
    try {
        return true;
    }finally {
        return false;
    }
}
```

这段代码返回false **finally语句总是在离开try后执行**

**finally不要使用 return break continue throw**

- 极端不可思议

```java
try {
    System.out.println("hw");
} catch (IOException e){} // 1.编译错误
try { }catch (Exception e){} // 2. 正常编译

// 3.正常编译
interface i1{
    void f() throws ClassNotFoundException,InterruptedException;
}
interface i2 {
    void f() throws IOException,InterruptedException;
}
interface i3 extends i1,i2{ }
new i3(){
    @Override
    public void f() throws InterruptedException {}
};
```

1. 对于受检异常, 如果catch到的异常没有在try代码块声明, 则无法编译
2. 但是JLS规定Exception与Throwable除外, 这些异常可以没有在try中声明
3. **一个方法可以抛出的异常是其所有父类/父接口声明的异常类型的交集**

- 不受欢迎的i

```java
private static final int i;

static {
    try {
        f();
    }catch (Exception e){
        i=-1;
    }
    
}

static void f() throws Exception{
    throw new Exception("eee");
}
```

这段代码会因为编译器无法确定i是否只被赋值一次而编译失败

- 不辞而别

```java
try {
    System.out.println("hello");
    System.exit(-1);
}finally {
    System.out.println("world");
}
```

System.exit会立即停止所有的程序线程 try代码块压根就不会完成 也就不会执行finally了

- 不情愿的对象

```java
class Object{
    private Object obj = new Object();

    public Object() {}
}
```

这个对象new的时候会抛出栈溢出异常

- 繁琐的流关闭

```java
FileInputStream in1 = null;
FileInputStream in2 = null;
try {
    in1 = new FileInputStream("xxx");
    in2 = new FileInputStream("xxx");
}finally {
    if (in1 != null) in1.close();
    if (in2 != null) in1.close();
}
```

这个程序的问题在于in1 close抛出异常就会导致in2不会关闭

解决方法使用JDK7 的自动关闭特性

- 循环中抛出异常

使用异常来控制循环 不仅代码难以阅读 并且速度十分慢

- 可怕的递归

```java
public static void main(String[] args){
    work();
    System.out.println("done");
}
static void work(){
    try {
        work();
    }finally {
        work();
    }
}
```

这个程序会的调用会从根节点生成一颗完全二叉树 树的深度为虚拟机的栈深度 这个递归虽然不是无限的 但对人类的生命而言也近乎无穷了

## 类

- 迷惑的重载

```java
public static void main(String[] args){
    new Main().confusing(null);
}
public void confusing(Object obj){
    System.out.println("obj");
}
public void confusing(double[] doubles){
    System.out.println("doubles");
}
```

最终会打印出doubles 方法的选择是从窄到宽的

- 狸猫换狗子

```java
class Animal{
    private static int count;
    public void incr(){count++;}
}
class Dog extends Animal{
    public Dog() { incr();}
}
class Cat extends Animal{
    public Cat() { incr();}
}
```

这段程序dog与cat的count会相互影响

- 会飞的复读鸭

```java
class Duck{
    public static void fly(){ System.out.println("i fly!"); }
}
class RepeatDuck extends Duck{
    public static void fly(){}
}

Duck duck = new RepeatDuck();
duck.fly(); // print i fly!
```

静态方法的调用不存在多态

**或许静态方法之所以叫静态就是因为不存在动态的分派机制**

- 错误的时间

```java
public class Main {
    private static final Main instance= new Main();
    private static final long i = System.currentTimeMillis();
    private final long initTime;
    public Main() {
        initTime = i;
        System.out.println(initTime);
    }
}
```

这个类会循环初始化 导致initTime第一次是为0

**当心这种情况**

- 不是你的类型

```java
String s = null;
s instanceof Object; // false 左操作符为null就会返回false

new Date() instanceof String; // 编译错误 如果两个操作数都是类 其中一个必须是另外一个的子类型

(String)new Object(); // 抛出运行时异常
```

- 发育不良

```java
class Father{
    private final String name;

    public Father() { name = makeName(); }

    protected String makeName(){ return "i am your father"; }

    @Override
    public String toString() { return name; }
}

class Son extends Father{
    String pname;
    public Son(String name) {
        this.pname = name;
    }

    @Override
    protected String makeName() {
        return "i am " + pname;
    }

}
```

创建一个Son对象 最终会打印出 i am null ,关键在于子类还没初始化完全 name就已经完成初始化

- null

```java
class Null{
    public static void print(){ System.out.println("hello world"); }
}

((Null)null).print(); // 可以打印
```

静态方法的调用只与类型相关 这或许是Java的设计缺陷 静态方法压根就不能通过对象实例调用

- 创建对象

```java
for (int i = 0; i < 100; i++) Object object = new Object();
```

这段代码无法通过编译 一个本地变量声明作为一条语句只能出现在语句块中

## 库

- 大问题

```java
BigInteger one = new BigInteger("1");
BigInteger two = new BigInteger("2");
one.add(two);
System.out.println(one); // print 1
```

BigInteger的实例是不可变的 算术操作只会返回新实例而非直接修改对象

- 分不清人

```java
class Person {
    public final String name;

    public Person(String name) { this.name = name; }

    @Override
    public boolean equals(Object o){
        if (o instanceof Person p) return  p.name.equals(this.name);
        return false;
    }
}

Set<Person> personSet = new HashSet<>();
personSet.add(new Person("cxk"));
System.out.println(personSet.contains(new Person("cxk"))); // false
```

任何时候 只要重写了equals方法 就必须重写hashCode方法 equals相等的对象hashCode必须相等 但hashCode相等不代表equals相等

- 六亲不认

```java
class Person {
    public final String name;

    public Person(String name) { this.name = name; }

    public int hashCode(){ return name.hashCode();}

    public boolean equals(Person p){
        return  p.name.equals(this.name);
    }
}
```

这个类声明虽然声明了hashCode 但是还是和上面一例一样 返回false

原因在与我们重载了equals方法 而非重写

**重载为错误和混乱提供了机会**

为避免犯这种错误 加上@Override

- 混乱的代价

```java
766 - 066 == 712 // true
```

以0开头的整型字面常量会被解释为八进制 不要这么做！！！

- 一行代码解决

```java
// 去除list中的重复元素并保持顺序
return new ArrayList<>(new LinkedHashSet<>(originList));

// 以,后面跟随者0-n个空格分割文本
str.split(",\\S*");

// 以字符串形式展示数组
Arrays.toString(...);

// 判断一个整数的二进制表示有多少1
Integer.bitCount(xxx);
```

了解类库可以节省大量时间与精力

- 可怕的日期API

```java
Calendar cal = Calendar.getInstance();
cal.set(2019,12,31);
System.out.println(cal.get(Calendar.YEAR));//2020
```

Calendar 或 Date 使用时一定要注意文档

- 名字游戏

```java
Map<String,String> map1 = new IdentityHashMap<>();
map1.put(new String("111"),"kk");
map1.put(new String("111"),"dd");
System.out.println(map1.size()); // 2

Map<String,String> map2 = new IdentityHashMap<>();
map2.put("111","kk");
map2.put("111","dd");
System.out.println(map2.size()); // 1
```

IdentityHashMap 是基于引用判断两个key是否相等的

Java 语言规范规定了字符串常量会进行复用 会有相同的引用

- 不生效的绝对值

```java
Math.abs(Integer.MIN_VALUE) < 0 // true
```

     * <p>Note that if the argument is equal to the value of
     * {@link Integer#MIN_VALUE}, the most negative representable
     * {@code int} value, the result is that same value, which is
     * negative.

- 奇葩的排序

```java
Integer[] a = new Integer[100];
Random rnd = new Random();
 for (int i = 0; i < 100; i++) {
     a[i] = rnd.nextInt();
 }
 Arrays.sort(a, new Comparator<Integer>(){
     @Override
     public int compare(Integer o1, Integer o2) {
         return o1-o2;
     }
 });
 System.out.println(Arrays.toString(a));
```

打印出来的数组基本是无序的(有序的可能性非常小) 原因在于使用的这个比较器 这个比较器通过减法来实现

在数值比较小的情况下没有 但一旦数组元素极大或极小则会发生溢出 导致结果不正确

## 类(升级版)

- 私人领域

```java
class Base { public String name = "cxk";}
class D extends Base {private String name = "jntm";}

System.out.println(new D().name); // 无法编译
```

对于成员变量 通过这种子类权限比父类更小的方式来隐藏

但对于成员方法 这种写法是非法的

违反了LSP

**隐藏会带来混乱** 

- 李鬼替代了李逵

```java
public class Main {
    public static void main(String[] args) { }
}

class String{}
```

这个程序将无法启动 报错：在类 Main 中找不到 main 方法

原因就是因为这个自定义的 String 

**避免重用平台类的名字 并且不要复用java.lang中的类名**

- 阴影中的类

```java
class X{
    static class Y { String Z = "Z1";}
    static C Y = new C();
}
class C {String Z = "Z2";}

System.out.println(X.Y.Z); // print Z2
```

**当一个变量和一个类型具有相同名字 变量名的优先级更高**

- 无法覆写的方法

```java
package p1;
public class Click {
    public void click(){print();}
    void print(){ System.out.println("print"); }
}

package p2;
public class Main {
    public static void main(String[] args) {
        new Click(){
            void click() { System.out.println("click"); } // 无法覆写
        }.click();
    }
}
```

**一个包内私有的方法不能被位于另一个包的某个方法直接覆写**

- 方法遮蔽

```java
import static java.util.Arrays.toString;
public class Main {
    static void print(){System.out.println(toString(new int[]{1,2,3}));} // 编译错误 找不到这样的toString方法
}
```

编译失败的原因在于本身就属于某个范围的成员的优先级比静态导入的优先级更高

**静态导致使用应该十分克制**

### 名字重用

- 覆写

```java
class Base {public void f(){}}
class D {public void f(){}} // 覆写Base.f
```

- 隐藏

```java
class Base {public static void f(){}}
class D {public static void f(){}} // 隐藏Base.f
```

- 重写

```java
class Base {
    public void f(){}
    public void f(int i){} // 重载f
}
```

- 遮蔽

```java
class Base {
    static String name = "cxk";
    static void f(){
        String name = "jntm"; // 变量遮蔽
    }
}

// 经常使用的遮蔽:
class Main {
    private String name;
    public Main(String name){
        this.name = name;
    }
}
```

- 遮掩

```java
class Main {
    static String System; // 遮掩 java.lang.System
}
```

## 库(升级版)

- 乒乓

```java
public static synchronized void main(String[] args) {
    new Thread(()->{
        pong();
    }).start();
    System.out.println("ping");
}
static synchronized void pong(){
    System.out.println("pong");
}
```

这段程序ping pong总会按照顺序打印出来 重点就在于main与pong都是同步方法 不会并发执行

- 反射的污染

```java
Iterator<Object> iterator = new HashSet<>().iterator();
Method method = iteraor.getClass().getMethod("hasNext");
System.out.println(method.invoke(iterator)); // IllegalAccessException
```

原因在于这个迭代器的实际实现类是某个内部类 Java语言规范规定**访问位于其他包中的非公共类型的成员是不合法的**

这个问题在使用了反射之后 就更加难以发现

- 吃饭睡觉打豆豆

```java
class Cat {
    void eat(){
        System.out.println("eat");
    }
    void sleep(){
        System.out.println("sleep");
    }
    void live(){
        new Thread(){
            @Override
            public void run() {
                while (true){
                    eat();
                    sleep(); // 编译错误
                }
            }
        }.start();
    }
}
```

这个类无法通过编译 原因在于Cat的sleep被Thread.sleep 遮蔽了

**事实证明 使用Runnable创建线程比继承Thread要更方便**

- 丢失的构造器

```java
class Outer {
    public class Inner{}
}

Outer.Inner.class.newInstance(); // NoSuchMethodException: Outer$Inner.<init>()
```

如果一个类为非静态内部类 那么它的默认构造函数就会变成变成一个携带着隐藏参数的构造器 这个参数就是外围的对象实例

**同时 newInstance这个方法现在也已经被废弃了 不推荐使用**

应该优先使用静态成员类

- hello 不 world

```java
String str = "hello world";
for (int i = 0; i < str.length(); i++) {
     System.out.write(str.charAt(i)); // 什么也不会输出
}
```

这里在write的时候 char被转为int了 write(int) 这个方法只有在遇到\n的byte表示时才会自动flush

- 线程中断

```java
Thread.currentThread().interrupt();
System.out.println(Thread.interrupted()); // true
System.out.println(Thread.interrupted()); // false
```

Thread.interrupted 会清除中断状态

- 复杂的初始化

```java
public class Main {
    private static boolean init = false;
    static {
        var t = new Thread(){
            @Override
            public void run() {
                init = true;
            }
        };
        t.start();
        try {
            t.join();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

    }
    public static synchronized void main(String[] args) {
        System.out.println(init);
    }
}
```

这段代码会造成死锁

主线程使用的时候 会对类进行初始化

初始化时 启动了新线程 新线程也会检查类的初始化 接着就卡死在了这里

**要让类的初始化尽可能简单**

## 高级

- 有害的括号

```java
int i = -(2147483648); // 错误：整数太大
```

2147483648 只能作为一元操作符的右操作数使用

- 奇怪的关系

```java
long x = Long.MAX_VALUE;
double y = (double) Long.MAX_VALUE;
long z = Long.MAX_VALUE - 1;

x == y; // true
y == z; // true
x == z; // false
```

== 运算符会进行二进制数据类型提升 也就说如果两个类型不相同 则较低的那个类型会被转换到较高的类型

- 原生类型的锅

```java
class List<T>{
    java.util.List<T> iterator(){
        return new ArrayList<T>();
    }
}

List list = new List<String>();
for(String s: list.iterator()){ // 编译错误：不兼容的类型
    System.out.println(s);
}
```

原生类型：支持泛型但是没有使用泛型

原因在于原生类型的泛型丢失了 这个时候iterator返回的是`ArrayList<Object>()`

**避免编写原生类型**

- 泛型遮蔽

内部类中也可以访问到外部类中的泛型参数 避免这个问题

- 序列化杀手

HashSet 或者 HashMap 在反序列化的时候会调用对象自身的方法

所以使用这些集合的时候 注意不要让这些集合的元素内部又指向这些集合 否则就会发生一些非预期结果

- 剪不断理还乱

```java
public class Main {
    private String name = "";

    public Main(String name) { this.name = name; }

    private String name(){return name;}
    private void run(){
        new Main("cxk"){
            void print(){
                System.out.println(name());
            }
        }.print();
    }

    public static void main(String[] args) {
        new Main("main").run();
    }
}
```

这个程序乍一看会由于调用了Main不存在的print方法无法通过编译 但其实发现他可以访问print方法

重点在于最终打印的出来是main 而非cxk 原因在于私有成员变量是无法被继承的 所以这里调用name方法打印的是main方法里Main传递的main

- 类常量的编译处理

```java
public class Client {
    public static void main(String[] args) {
        System.out.println(Server.one);
        System.out.println(Server.two);
        System.out.println(Server.three);
    }
}

public class Server {
    public static final String one = "1";
    public static final String two = "2";
    public static final String three = "3";
}
```

这里如果Server被重新编译 会打印出什么？

答案还是和原来一样 Java 语言规范规定常量在编译时都会直接被转化为常量值 而不会被间接引用 这个时候就算把Server.class 删掉 Client也能正常运行

- 假随机

打乱数组时用Random是不正确的  使用Collection.shuffle

## 餐后甜点

```java
int count = 0;
for(int =0;i<10;i++);{
    count++;
}
System.out.println(count);// print 1 for后面的分号所导致的
```

```java
Integer[]array = {3，1，4，1，5，9 };
Arrays.sort(array, new Comparator<Integer>({
    public int compare(Integer i1，Integer i2）{
    return i1<i2 ?-1: (i2 >i1 ?1:O);
});
System.out.println(Arrays.tostring(array));
```

```java
true?false:true == true?false:true
```
