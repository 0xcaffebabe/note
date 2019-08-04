- Pipelining: 中间操作都会返回流对象本身。 这样多个操作可以串联成一个管道， 如同流式风格（ﬂuent style）。 这样做可以对操作进行优化， 比如延迟执行(laziness)和短路( short-circuiting)。 
- 内部迭代： 以前对集合遍历都是通过Iterator或者增强for的方式, 显式的在集合外部进行迭代， 这叫做外部迭 代。 Stream提供了内部迭代的方式，流可以直接调用遍历方法。

# 获取流

- 根据Collection获取

```java
Stream<String> stream1 = list.stream(); 
```
- 根据Map获取流 

```java
 Stream<String> keyStream = map.keySet().stream(); 
Stream<String> valueStream = map.values().stream();
Stream<Map.Entry<String, String>> entryStream = map.entrySet().stream();
```

- 根据数组获取流 

```java
 Stream<String> stream = Stream.of(array); 
```

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


