- sequence of elements: 一个流对外提供一个接口，可以访问到一串特定的数据。流不存储元素，但是可以根据需要进行计算转化
- source：数据来源，如数据结构，数组，文件等
- aggregate operation：聚合操作，流支持像SQL操作或者其他函数式语言的操作，如filter/map/reduce/find/match/sorted等
- Pipelining: 中间操作都会返回流对象本身。 这样多个操作可以串联成一个管道， 如同流式风格（ﬂuent style）。 这样做可以对操作进行优化， 比如延迟执行(laziness)和短路( short-circuiting)。 
- Internal Iteration： 以前对集合遍历都是通过Iterator或者增强for的方式, 显式的在集合外部进行迭代， 这叫做外部迭代。 Stream提供了内部迭代的方式，流可以直接调用遍历方法。

# 处理流程

![](https://www.oracle.com/ocom/groups/public/@otn/documents/digitalasset/2179051.jpg)

- 流的创建
- 流的转换，将流转换为其他流的中间操作，可包括多个步骤(惰性操作)
- 流的计算结果。这个操作会强制执行之前的惰性操作。这个步骤以后，流就再也不用了

# 获取流

## Stream类

- of 方法，直接将数组转化

```java
Stream<Integer> integerStream = Stream.of(1, 2, 3);
```

- empty方法，产生一个空流
- generate 方法，接收一个Lambda表达式

```java
Stream<Double> stream = Stream.generate(Math::random);
```

- iterate方法，接收一个种子，和一个Lambda表达式

```java
Stream<BigInteger> iterate = Stream.iterate(BigInteger.ZERO, n -> n.add(BigInteger.ONE));
```

## 根据Collection获取

```java
Stream<String> stream = list.stream(); 
```
## 根据Map获取流 

```java
Stream<String> keyStream = map.keySet().stream(); 
Stream<String> valueStream = map.values().stream();
Stream<Map.Entry<String, String>> entryStream = map.entrySet().stream();
```
# 基本类型流

- IntStream，LongStream，DoubleStream

# 并行流

- 使得所有的中间转换操作都将被并行化
- Collections.parallelStream()将任何集合转为并行流
- Stream.parallel()方法，产生一个并行流


# 常用方法

- 延迟方法：返回值类型仍然是 Stream 接口自身类型的方法，因此支持链式调用。（除了终结方法外，其余方 法均为延迟方法。） 
- 终结方法：返回值类型不再是 Stream 接口自身类型的方法，因此不再支持类似 StringBuilder 那样的链式调 用。本小节中，终结方法包括 count 和 forEach 方法。

## forEach

## filter

## map

>要将流中的元素映射到另一个流中

```java
        Stream.of(1,2,3,4,5)
                .map(String::valueOf)
                .forEach(System.out::println);
```

## count

## limit

## skip

## concat


