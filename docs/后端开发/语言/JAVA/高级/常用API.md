# API

> API（Application Programming Interface，应用程序接口）是一些预先定义的函数，或指软件系统不同组成部分衔接的约定。 目的是提供应用程序与开发人员基于某软件或硬件得以访问一组例程的能力，而又无需访问原码，或理解内部工作机制的细节。

# Scanner类

```java
Scanner scanner = new Scanner(System.in);

        int a = scanner.nextInt();
        int b = scanner.nextInt();

        System.out.println("max:" + (a > b ? a : b));
```

# 匿名对象

> 没有变量名的对象

```java
new Scanner(System.in).nextInt();
```

# Random类

```java
Random random = new Random();
System.out.println(random.nextInt());
```

# ArrayList类

## 常用方法

- public boolean add(E e) ：将指定的元素添加到此集合的尾部。
- public E remove(int index) ：移除此集合中指定位置上的元素。返回被删除的元素。
- public E get(int index) ：返回此集合中指定位置上的元素。返回获取的元素。
- public int size() ：返回此集合中的元素数。遍历集合时，可以控制索引范围，防止越界。

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

# String 类

特点：

- 字符串不变：字符串的值在创建后不能被更改。
- 因为String对象是不可变的，所以它们可以被共享。
- "abc" 等效于 char[] data={ 'a' , 'b' , 'c' }

# static关键字

- 静态变量
- 静态方法
- 静态代码初始化块

![批注 2019-08-01 154539](/assets/批注%202019-08-01%20154539.png)

# Arrays类

常用方法：

- toString
- sort

# Math类

- abs：取绝对值
- ceil：返回大于等于参数的小的整数（向上取整）
- floor：返回小于等于参数大的整数（向下取整）
- roud：四舍五入

# Object类

- toString
- equals

# Date类

```java
System.out.println(new Date());
System.out.println(new Date().getTime());
```

# DateFormat类

- SimpleDateFormat

```java
System.out.println(new SimpleDateFormat().format(new Date()));
```

`y M d H m s`

```java
System.out.println(new SimpleDateFormat("yyyy-MM-dd a H:m:s").format(new Date()));
```

# Calendar类

```java
        Calendar calendar = Calendar.getInstance();
        calendar.add(Calendar.YEAR,18);
        
        System.out.println(calendar.getTime());
```

# System类

```java
        System.currentTimeMillis();
        System.arraycopy();
```

# StringBuilder类

![01_StringBuilder的原理](/assets/01_StringBuilder的原理.bmp)

```java
        StringBuilder sb = new StringBuilder("hello");
        sb.append(" ")
                .append("world");
        System.out.println(sb.toString());
```

# 包装类

![02_包装类的概念](/assets/02_包装类的概念.bmp)

- 装箱拆箱
  - 自动装箱拆箱

## 基本类型与字符串的转换

```java
        System.out.println(Double.toString(1.6));
        System.out.println(Double.parseDouble("1.5"));
```








