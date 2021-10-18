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

## String

特点：

- 字符串不变：字符串的值在创建后不能被更改。
  - String内部是实现byte数组实现的
- 因为String对象是不可变的，所以它们可以被共享。

StringBuilder 线程不安全(效率更高)

StringBuffer 线程安全

**乱码问题**

## Arrays

常用方法：

- toString
- sort
- asList

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
