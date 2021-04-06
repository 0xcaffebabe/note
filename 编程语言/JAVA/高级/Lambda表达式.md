# Lambda 表达式

```java
(参数列表) ‐> { 代码语句 }
```

```java
// Lambda表达式的书写形式
Runnable run = () -> System.out.println("Hello World");// 1
ActionListener listener = event -> System.out.println("button clicked");// 2
Runnable multiLine = () -> {// 3 代码块
    System.out.print("Hello");
    System.out.println(" Hoolee");
};
BinaryOperator<Long> add = (Long x, Long y) -> x + y;// 4
BinaryOperator<Long> addImplicit = (x, y) -> x + y;// 5 类型推断
```

- 类似于匿名方法，一个没有名字的方法
- 可以忽略写参数类型
- 坚决不声明返回值类型
- 没有修饰符
- 单句表达式，将直接返回值，不用大括号
- 带return语句， 算多句，必须用大括号
- 无参数，仅保留括号
- 一个参数，可省略括号

## 使用前提

- 使用Lambda必须具有接口，且要求接口中有且仅有一个抽象方法(称之为函数式接口)。 无论是JDK内置的 Runnable 、 Comparator 接口还是自定义的接口，只有当接口中的抽象方法存在且唯一 时，才可以使用Lambda。
- 使用Lambda必须具有上下文推断。 也就是方法的参数或局部变量类型必须为Lambda对应的接口类型，才能使用Lambda作为该接口的实例。

> 有且仅有一个抽象方法的接口，称为"函数式接口"。

## 函数式接口

- 是一个接口，符合Java接口的定义
- 只包含一个抽象方法的接口
- 可以包括其他的default方法、static方法、private方法
- 由于只有一个未实现的方法，所以Lambda表达式可以自动填上这个尚未实现的方法
- 采用Lambda表达式，可以自动创建出一个(伪)嵌套类的对象(没有实际的嵌套类class文件产生)，然后使用，比真正嵌套类更加轻量，更加简洁高效

- @FunctionalInterface注解

> 一旦使用该注解来标记接口，编译器将会强制检查该接口是否确实有且仅有一个抽象方法，否则编译将会报错。


```java
@FunctionalInterface
public interface SuperRunnable {
    void superRun();
}
```

```java
public static void main(String[] args) {
    superRun(()-> System.out.println("hello world"));
}
private static void superRun(SuperRunnable sr){
    sr.superRun();
}
```

- 尽量使用系统自带的函数式接口，不要自己定义

接口               | 参数   | 返回值     | 示例
---------------- | ---- | ------- | --------------
`Predicate<T>`   | T    | Boolean | 接收一个参数，返回一个布尔值
`Consumer<T>`    | T    | void    | 接受一个参数，无返回
`Function<T, R>` | T    | R       | 接受一个参数，返回一个值
`Supplier<T>`    | None | T       | 无参数 返回一个值

## Lambda JVM层实现

Java编译器将Lambda表达式编译成使用表达式的类的一个私有方法，然后通过invokedynamic指令调用该方法。所以在Lambda表达式内，this引用指向的仍是使用表达式的类。

## 方法引用

- Class::staticMethod，如 Math::abs方法
  - Math::abs 等价于 x -> Math.abs(x)
- Class::instanceMethod，如String::compareToIgnoreCase方法
  - String::compareToIgnoreCase等价于(x,y)->x.compareToIgnoreCase(y)
- object::instanceMethod，如System.out::println方法
  - System.out::println等价于x->System.out.println(x)
  - 支持this::instanceMethod 调用
  - 支持super::instanceMethod 调用
- Class::new，调用某类构造函数，支持单个对象构建
  - `Supplier<Object> ` sp = Object::new
- Class[]::new，调用某类构造函数，支持数组对象构建
  - `Function<Integer,Object> ` f = Object[]::new

## 应用

- 类型信息
  - 被赋值后，可以看作是一个函数式接口的实例(对象)
  - 但是Lambda表达式没有存储目标类型(target type)的信息
  - 重载调用，依据重载的规则和类型参数推理
- 变量遮蔽
  - Lambda表达式可以访问外部嵌套块的变量
    - 但是变量要求是final或者是effectively final的
  - 在Lambda表达式中，不可以声明与(外部嵌套块)局部变量同名的参数或者局部变量
- 表达式中的this，就是创建这个表达式的方法的this参数
- 优先级比嵌套类要高
  - 无法创建命名实例，无法获取自身的引用(this)
- 方法引用比自定义Lambda表达式的优先级高
  - 系统自带的方法引用更简洁高效
  - 对于复杂的Lambda表达式，采用方法引用比内嵌Lambda表达式更清晰，更容易维护
- 坚持使用标准的函数式接口