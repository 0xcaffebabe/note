# JAVA编程规范

## 编码

### Integer缓存问题

>【强制】所有整型包装类对象之间值的比较，全部使用 equals 方法比较。
说明：对于 Integer var = ? 在 - 128 至 127 范围内的赋值，Integer 对象是在 IntegerCache.cache 产 生，会复用已有对象，这个区间内的 Integer 值可以直接使用 == 进行判断，但是这个区间之外的所有数据，都会在堆上产生，并不会复用已有对象，这是一个大坑，推荐使用 equals 方法进行判断

```java
Integer a = 100, b = 100, c = 150, d = 150;
System.out.println(a == b); // true
System.out.println(c == d); // false
```

直接创建包装类时，是通过`valueOf`方法来进行转换的，但是这个方法这里做了缓存，在某个区间内的同一个整数都会用同一个对象来表示

```java
if (i >= IntegerCache.low && i <= IntegerCache.high)
    return IntegerCache.cache[i + (-IntegerCache.low)];
return new Integer(i);
```

所以也就会造成上面那段代码的情况

同样，Long、Character、 Short 、Boolean都有这个问题

但是Boolean本来就取值范围就是true与false，所以这个包装类本身是使用了两个成员变量来缓存true与false

### 正确的序列化姿势

>【强制】当序列化类新增属性时，请不要修改 serialVersionUID 字段，以避免反序列失败；如果完全不兼容升级，避免反序列化混乱，那么请修改 serialVersionUID 值。
说明：注意 serialVersionUID 值不一致会抛出序列化运行时异常。

序列化的目的：**持久化、传输**

一些序列化方案

- 原生序列化
- Hessian 序列化
  - 跨语言的序列化方案
- Kryo 序列化
- JSON 序列化
  - json存在的一个问题是可能存在类型丢失

