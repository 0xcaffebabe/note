# List源码解析

## ArrayList

### 架构

![202002191425](/assets/202002191425.jfif)

- DEFAULT_CAPACITY 表示数组的初始大小，默认是 10
- size 表示当前数组的大小
- modCount 统计当前数组被修改的版本次数，数组结构有变动，就会 +1

### 解析

- 初始化

一共有三种方式可以初始化ArrayList

```java
public ArrayList(Collection<? extends E> c) {
    elementData = c.toArray();
    if ((size = elementData.length) != 0) {
        // 直接将传入的集合转成数组复制给内部数组
        if (elementData.getClass() != Object[].class)
            elementData = Arrays.copyOf(elementData, size, Object[].class);
    } else {
        this.elementData = {};
    }
}

public ArrayList() {
    this.elementData = {};
}

public ArrayList(int initialCapacity) {
    if (initialCapacity > 0) {
        this.elementData = new Object[initialCapacity];
    } else if (initialCapacity == 0) {
        this.elementData = {};
    } else {
        throw new IllegalArgumentException("Illegal Capacity: "+
                                           initialCapacity);
    }
}
```

- 新增与扩容

添加元素时：

- 判断是否需要扩展，如果需要则只需扩容
- 添加

```java
// 这个版本是基于JDK13的
private void add(E e, Object[] elementData, int s) {
    // 当发现现在list的size跟数组容量一样大时，则进行扩容
    if (s == elementData.length)
        // 这里扩容完，会产生一个新数组，我们要将新数组保存
        elementData = grow(size+1);
    //添加index:size
    elementData[s] = e;
    size = s + 1;
}
// 扩容核心代码
private Object[] grow(int minCapacity) {
    int oldCapacity = elementData.length;
    // 只有数组不为空时，才进行扩容，否则直接创建
    if (oldCapacity > 0 || elementData != DEFAULTCAPACITY_EMPTY_ELEMENTDATA) {
        // 计算数组的新容量
        int newCapacity = ArraysSupport.newLength(oldCapacity,
                minCapacity - oldCapacity, /* minimum growth */
                oldCapacity >> 1           /* preferred growth */);
        // 复制老数组到新数组
        return elementData = Arrays.copyOf(elementData, newCapacity);
    } else {
        return elementData = new Object[Math.max(DEFAULT_CAPACITY, minCapacity)];
    }
}
// 计算容量的方法
public static int newLength(int oldLength, int minGrowth, int prefGrowth) {
    // 判断list的size与elementData的差值如果大于elementData长度的一半
    // 新数组长度就等于老数组长度加上list的size与elementData的差值
    // 否则新数组的长度就等于老数组的1.5倍
    int newLength = Math.max(minGrowth, prefGrowth) + oldLength;
    if (newLength - MAX_ARRAY_LENGTH <= 0) { // 数组长度不能大于整数最大值
        return newLength;
    }
    return hugeLength(oldLength, minGrowth);
}
```

所以扩容的本质就是申请一个更大的数组，将旧数组的内容移过去

**源码扩容过程值得借鉴的地方**

- 通过自动扩容的方式，让使用者不用关心底层数据结构的变化，封装得很好
- 1.5 倍的扩容速度，可以让扩容速度在前期缓慢上升，在后期增速较快
- 扩容过程中，注意数组大小溢出的情况


- 删除

无论是根据Object删除还是index删除，都必须给出被删除元素的index

```java
private void fastRemove(Object[] es, int i) {
    modCount++;
    final int newSize;
    if ((newSize = size - 1) > i)
        // 将elementData 下标为i后面的全部元素往前移动一个位
        System.arraycopy(es, i + 1, es, i, newSize - i);
    // 如果删除的是最后一个元素，置为null就行
    es[size = newSize] = null; // 同时记得size-1
}
```

![202002191507](/assets/202002191507.jfif)

### 迭代器

- hasNext

```java
public boolean hasNext() {
    return cursor != size;
}
```

- next

```java
public E next() {
    // 有点乐观锁的意思，通过版本号来确定持有的数据是否被修改了
    if (modCount != expectedModCount)
        throw new ConcurrentModificationException();
    // 否则每次根据游标获取元素，获取完游标+1
    int i = cursor;
    if (i >= size)
        throw new NoSuchElementException();
    Object[] elementData = ArrayList.this.elementData;
    if (i >= elementData.length)
        throw new ConcurrentModificationException();
    cursor = i + 1;
    return (E) elementData[lastRet = i];
}
```

- remove

```java
public void remove() {
    if (lastRet < 0)
        throw new IllegalStateException();
   if (modCount != expectedModCount)
        throw new ConcurrentModificationException();
    // 将当前游标作为下标，删除这个位置的元素
    try {
        ArrayList.this.remove(lastRet);
        // 删除完之后要更新版本号
        cursor = lastRet;
        lastRet = -1;
        expectedModCount = modCount;
    } catch (IndexOutOfBoundsException ex) {
        throw new ConcurrentModificationException();
    }
}
```

### 线程安全

ArrayList 有线程安全问题的本质，是因为 ArrayList 自身的 elementData、size、modConut 在进行各种操作时，都没有加锁

---

问：对 ArrayList 的理解？

答：底层数据结构、对数组的封装、add、remove

问：为什么说扩容会消耗性能

答：扩容底层使用的是 System.arraycopy 方法，会把原数组的数据全部拷贝到新数组上，所以性能消耗比较严重


## LinkedList

### 架构

LinkedList 底层数据结构是一个双向链表

![202002191526](/assets/202002191526.jfif)

### 解析

- node的结构

```java
private static class Node<E> {
    E item;
    Node<E> next;
    Node<E> prev;
    
    Node(Node<E> prev, E element, Node<E> next) {
        this.item = element;
        this.next = next;
        this.prev = prev;
    }
}
```

- 尾部追加节点

```java
void linkLast(E e) {
    final Node<E> l = this.last;
    final Node<E> newNode = new Node<>(l, e, null);
    this.last = newNode;
    // 如果尾节点为空，则代表当前链表是空的，直接把插入节点作为头节点
    if (l == null)
        first = newNode;
    else
        l.next = newNode; // 否则就将插入节点设置为尾节点，并且把旧尾节点的next指向插入节点
    size++;
    modCount++;
}
```

- 头部追加节点

```java
private void linkFirst(E e) {
    final Node<E> f = this.first;
    final Node<E> newNode = new Node<>(null, e, f);
    this.first = newNode;
    // 如果头节点为空，则代表当前链表是空的，直接把插入节点作为尾节点
    if (f == null)
        last = newNode;
    else
        f.prev = newNode; // 否则就将插入节点设置为头节点，并且把旧头节点的prev指向插入节点
    size++;
    modCount++;
}
```

- 删除节点

```java
E unlink(Node<E> x) {
    // assert x != null;
    final E element = x.item;
    final Node<E> next = x.next;
    final Node<E> prev = x.prev;
    // 当前删除的是头节点，所以将删除节点的next变为头节点
    if (prev == null) {
        first = next;
    } else {
        // 否则设置删除节点的上一个节点的next指向删除节点的next
        prev.next = next;
        x.prev = null;
    }
    // 当前删除的是尾节点，所以将删除节点的prev变为尾节点
    if (next == null) {
        last = prev;
    } else {
        // 否则设置删除节点的下一个节点的prev指向删除节点的prev
        next.prev = prev;
        x.next = null;
    }
    
    x.item = null;
    size--;
    modCount++;
    return element;
}
```

- 根据下标查询节点

```java
Node<E> node(int index) {
    // assert isElementIndex(index);
    if (index < (size >> 1)) { // 在前半部分，所以从头节点迭代查找
        Node<E> x = first;
        for (int i = 0; i < index; i++)
            x = x.next;
        return x;
    } else { // 在后半部分，所以尾头节点迭代查找
        Node<E> x = last;
        for (int i = size - 1; i > index; i--)
            x = x.prev;
        return x;
    }
}
```

### 迭代器

```java
// 双向迭代器
private class ListItr implements ListIterator<E> {
    private Node<E> lastReturned;//上一次执行 next() 或者 previos() 方法时的节点位置
    private Node<E> next;//下一个节点
    private int nextIndex;//下一个节点的位置
    …………
}
```

- 从头到尾迭代

```java
public boolean hasNext() {
    return nextIndex < size;
}
    
public E next() {
    checkForComodification();
    if (!hasNext())
        throw new NoSuchElementException();

    lastReturned = next;
    next = next.next; // next指向当前遍历元素的next
    nextIndex++;
    return lastReturned.item;
}
```

- 从尾到头迭代

```java
public boolean hasPrevious() {
    return nextIndex > 0;
}

public E previous() {
    checkForComodification();
    if (!hasPrevious())
        throw new NoSuchElementException();
    // 主要是判断next为空的情况下要选择last作为遍历节点，否则选择遍历元素的prev
    lastReturned = next = (next == null) ? last : next.prev;
    nextIndex--;
    return lastReturned.item;
}
```

- 删除

```java
public void remove() {
    checkForComodification();
    // lastReturned 是本次迭代需要删除的值，分以下空和非空两种情况：
    // lastReturned 为空，说明调用者没有主动执行过 next() 或者 previos()，直接报错
    // lastReturned 不为空，是在上次执行 next() 或者 previos()方法时赋的值
    if (lastReturned == null)
        throw new IllegalStateException();
    Node<E> lastNext = lastReturned.next;
    //删除当前节点
    unlink(lastReturned);
    // next == lastReturned 的场景分析：从尾到头递归顺序，并且是第一次迭代，并且要删除最后一个元素的情况下
    // 这种情况下，previous() 方法里面设置了 lastReturned = next = last,所以 next 和 lastReturned会相等
    if (next == lastReturned)
        // 这时候 lastReturned 是尾节点，lastNext 是 null，所以 next 也是 null，这样在 previous() 执行时，发现 next 是 null，就会把尾节点赋值给 next
        next = lastNext;
    else
        nextIndex--;
    lastReturned = null;
    expectedModCount++;
}
```

---

问：ArrayList 和 LinkedList 有何不同

答：底层数据结构，数组结构导致的读写差异

问： ArrayList 和 LinkedList 应用场景

答：ArrayList 更适合于快速的查找匹配，不适合频繁新增删除，像工作中经常会对元素进行匹配查询的场景比较合适，LinkedList 更适合于经常新增和删除，对查询反而很少的场景

问：ArrayList 和 LinkedList 两者有没有最大容量

答：两个都有最大容量，是int的最大值，原因是ArrayList使用的数组容量不能超过int最大值，LinkedList则是因为size使用int表示的，所以也不能超过int的最大值

问：ArrayList 和 LinkedList 是如何对 null 值进行处理的

答：ArrayList 允许 null 值新增，也允许 null 值删除。删除 null 值时，是从头开始，找到第一值是 null 的元素删除；LinkedList 新增删除时对 null 值没有特殊校验，是允许新增和删除的

问：ArrayList 和 LinedList 是线程安全的么，为什么

答：都非线程安全，主要的问题点在于多线程环境下，所有线程任何时刻都可对数组和链表进行操作，这会导致值被覆盖，甚至混乱的情况

