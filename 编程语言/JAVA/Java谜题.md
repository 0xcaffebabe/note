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
