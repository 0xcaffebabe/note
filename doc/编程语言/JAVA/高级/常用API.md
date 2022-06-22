# 常用API

## Scanner

```java
Scanner scanner = new Scanner(System.in);
int a = scanner.nextInt();
int b = scanner.nextInt();
System.out.println("max:" + (a > b ? a : b));
```

## Random

```java
Random random = new Random();
System.out.println(random.nextInt());
```

## 基本类型与相对应的包装类型

基本类型    | 基本类型包装类
------- | ---------
byte    | Byte
short   | Short
int     | Integer
long    | Long
ﬂoat    | Float
double  | Double
char    | Character
boolean | Boolean

Long与Integer一样，都对一定范围内的值做了缓存，所以有些Long对象，数值相同的情况下，直接用==比较会相等，valueOf有做缓存，parseLong则没有

## String

特点：

- 字符串不变：字符串的值在创建后不能被更改。
  - String内部是实现byte数组实现的
- 因为String对象是不可变的，所以它们可以被共享。

```java
private final byte[] value;
```

并且这个数组一旦赋上值，就无法再修改这个数组的引用了，同时String封装的很好，没有提供外部公开接口能直接操作这个数组，并且String类为final的，保证不会被继承，方法也不会被覆写，所以**String不可变**

StringBuilder 线程不安全(效率更高)

StringBuffer 线程安全

### equals原理

```java
if (this == obj){
    return true;
}
if (obj instanceof String){
    if (this.value.length == obj.value.length){
        for(0...obj.length){
            if (this.value[i] != obj.value[i]){
                return false;
            }
        }
    }
}
return false;
```

### 乱码问题

如何解决 String 乱码

1. 选择可以表示中文的字符集 像iso8859-1就无法表示中文
2. 在可以指定字符集的地方指定字符集

## Arrays

常用方法：

- toString
- sort
- asList

使用的双轴快速排序

- binarySearch
- copyOf、copyOfRange

## Collections

- min、max

这里可以学习一下最值方法返回值泛型的定义：

```java
public static <T extends Object & Comparable<? super T>> T max
```

代表T必须继承自Object且实现了Comparable接口

- [包装线程安全的集合](/编程语言/JAVA/高级/集合/集合.md#线程安全)

synchronized打头的方法可以将指定的集合包装成线程安全的集合

具体原理是Collections内部有这些对应的线程安全集合，这些集合内部组合线程不安全的集合，通过synchronized加锁来操作内部的这些集合

- 不可变集合

unmodifiable 打头的方法则是会得到一些不可变集合，这些集合不能执行修改操作，否则会抛异常，也是通过对集合的包装来实现的

## Math

- abs：取绝对值
- ceil：返回大于等于参数的小的整数（向上取整）
- floor：返回小于等于参数大的整数（向下取整）
- roud：四舍五入

## Object

- toString
- equals
- hashCode
- wait
- notify

## Objects

- equals

Objects的equals内部的比较采用了deepEquals，这样即使两个对象是数组，也能放心比较

![一些判空方法](/assets/202002191416.jfif)

---

问：如何写好一个工具类

答： static final 关键字对方法进行修饰，工具类构造器必须是私有等等手段

### Clone

对象 clone 方法默认是浅拷贝，若想实现深拷贝需覆写 clone 方法实现域对象的深度遍历式拷贝。

- java天生就对原型模式做了很好的支持，这个支持就是Object中的clone方法

## LocalDateTime

```java
LocalDateTime.now()
```

## System

- currentTimeMillis
- arraycopy

## StringBuilder

![01_StringBuilder的原理](/assets/01_StringBuilder的原理.bmp)

```java
StringBuilder sb = new StringBuilder("hello");
sb.append(" ")
        .append("world");
System.out.println(sb.toString());
```

## 包装类

![02_包装类的概念](/assets/02_包装类的概念.bmp)

- 装箱拆箱
  - 自动装箱拆箱

选择包装类还是基本数据类型：

1. POJO类属性全部使用包装类
2. RPC方法参数与返回值全部使用包装类
3. 局部变量尽可能使用基本类型

### 基本类型与字符串的转换

```java
System.out.println(Double.toString(1.6));
System.out.println(Double.parseDouble("1.5"));
```
