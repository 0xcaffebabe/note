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