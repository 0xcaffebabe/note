# Scala

## 类型

```scala
object Hello extends App {
  println("hello world")
  println(1 + 1)
  println(5 + 3*4)
  println((5). + (3).*(4))
  println("abc".size)
  println("abc" + 4)
}
```

- 强类型语言

## 表达式与条件

```scala
object ExpressionAndCondition extends App {
  println(1 <= 2)
  val a = 5 // 声明不变量
  val b = 6
  if (a < b) {
    println("true")
  }else {
    println("false")
  }
}
```

- while 循环

```scala
var i = 1
while (i <= 3){
  println(i)
  i += 1
}
```

- for 循环

```scala
for(i <- args.indices){
  println(args(i))
}
args.foreach(str => println(str)) // 函数式
```

## 范围

```scala
val r1 = 1 to 10 by 2 // 步长为2
val r2 = 1 to 10 // 步长为1
val r3 = 1 until 10 by 2 // 步长为2 不包括10
```

## 元组

```scala
val name = ("c", "xk")
println(name._1 + name._2)
val (x, y) = (1, 2)
println(x+y)
```

## 类

```scala
class User(username: String, password: String) // pojo类
class UserService {
  val user = new User("cxk", "123")
  def printUser(){
    println(user)
  }
}
new UserService().printUser
```

### 构造器

```scala
class User(username: String){
  def this(username: String, password: String){
    this(username)
    println(password)
  }
}
```

## 扩展类

- 单例

```scala
object singleton { // 单例对象
  def print = println("he") // 类方法
}
singleton.print
```

- 继承

```scala
class Father(val name: String){
  def say = println("i am f")
}
class Son(override val name: String, val age: Int) extends Father(name){
  override def say: Unit = {
    super.say
    println("i am s")
  }
}
new Son("cx",1).say
```

- trait

```scala
trait Part {
  def say = println("i am say")
}
class Person extends Object with Part{}
new Person().say
```

## 函数定义

```scala
def add(a: Int, b: Int): Int = a+b
println(add(1,2))
```

## 集合

- list

```scala
val list = List(1,2,3)
println(list(2))
println(list == List(1,2,3))
```

- set

```scala
val set = Set(1,2,3)
println(set - 2) // 集合运算
println(set + 5)
println(set -- Set(1,2)) // 集合间运算
println(set ++ Set(5,6))
println(set == Set(1,2,3))
```

- map

```scala
val map = Map("name" -> "cxk","age" -> 18) // 不可变map
println(map("name"))
val mMap = new mutable.HashMap[String, Any] // 可变map
mMap += "name" -> "cxk"
mMap += "age" -> 18
```

### 集合函数

- 高阶函数：以函数作为输入或以函数作为输出

```scala
val list = List(1,2,3)
println(list.isEmpty)
println(list.length)
println(list.size)
println(list.head)
println(list.tail) // 返回去除第一个元素的list
println(list.last)
println(list.init) // 返回去除最后一个元素的list
println(list.reverse) // 都不会修改原列表
println(list.drop(1))
println(list.count(i => i >= 2)) // 计算符合条件的元素个数
println(list.filter(i => i >=2)) // 将符合条件的元素拿出来
println(list.map(i => i *2))
println(list.exists(i => i > 2)) // 是否存在这一的一个元素
println(list.sortWith((a,b) => a > b))
println((0 /: list){(sum, i) => sum+i}) // 从初始值0开始累加
println(list.foldLeft(0)((sum,i) => sum + i))
list.foreach(i => println(i))

val map = Map("name" -> "cxk", "age" -> 18)
map.foreach(entry => println(entry._1 + entry._2))
```

## Any 和 Nothing

Any是所有类型的父类 Nothing是所有类型的子类 Null是一个Trait null是Null的实例

![屏幕截图 2020-11-12 085642](/assets/屏幕截图%202020-11-12%20085642.png)

## 模式匹配

- switch

```scala
def switch(i: String): String = i match {
  case "1" => "one"
  case "2" => "two"
  case _ => "none"
}
println(switch("1"))
println(switch("ss"))
```

- 正则表达式

```scala
val reg = """\w""".r // 创建一个正则
println(reg.findFirstIn("i am your"))
```

## 并发

...

## 核心优势

- 并发
- 继承了 Java 的生态
- 语法灵活 有望自定义为DSL
- 内置的XML支持

## 不足

- 静态类型不适合OOP
- 虽然继承了 Java ，但某些语法还是很奇怪
- 引入了可变性
