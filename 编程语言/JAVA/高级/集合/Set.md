# Set源码解析

HashSet、TreeSet 两个类是在 Map 的基础上组装起来的类

## HashSet

HashSet 使用的就是组合方式来内置 HashMap

**多用组合，少用继承**

### 操作

- 初始化

```java
// 当根据传入的集合进行初始化时，会根据集合的数量计算HashMap大小
public HashSet(Collection<? extends E> c) {
    map = new HashMap<>(Math.max((int) (c.size()/.75f) + 1, 16));
    addAll(c);
}
```

### 值得借鉴的地方

- 使用组合还是继承
- 包装复杂逻辑，暴露易用api
- 组合使用其他api时，要多了解组合的api

## TreeSet

TreeSet底层组合的是 TreeMap，迭代的时候，也可以按照 key 的排序顺序进行迭代

### TreeSet如何复用TreeMap的

第一种方式：直接使用

```java
public boolean add(E e) {
    return m.put(e, PRESENT)==null;
}
```

第二种方式：定义接口，交给服务提供者实现

TreeMap内部实现了NavigableSet接口来提供一些比较复杂的功能

## 问题

### TreeSet的使用场景

一般都是在需要把元素进行排序的时候使用 TreeSet，使用时需要注意元素最好实现 Comparable 接口

### 如何根据 key 的新增顺序进行遍历

选择使用 LinkedHashSet

### 如何对 key 进行去重

使用TreeSet，TreeSet 底层使用的是 TreeMap，TreeMap 在 put 的时候，如果发现 key 是相同的，会把 value 值进行覆盖，所有不会产生重复的 key