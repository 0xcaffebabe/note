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