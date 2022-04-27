# Kotlin

## 类型

### 基本类型

```kotlin
// 基本类型 Byte Short Int Long Double Float
val a = 1
// 同swift 不支持隐式转换
// val b: Double = a
println(a.toDouble())
// 字面常量 同 Java 但不支持八进制表示
println(100_000)
println(0b10000000)

// 加减乘除取余跟大部分语言是一样的
// 位运算
println(1 shl 2)
// 无符号整数 UByte UShort UInt ULong
// 布尔运算也是跟Java一样
println(true && false)
// 字符串
for(c in "cxk,jntm") {
    println(c)
}
// 原始字符串
val text = """
    <div>
        <span>abc</span>
    </div>
""".trimIndent()
// 字符串模板
println("$b --- ")

// 数组
Array(5) {}.forEach { println(it) }
// 原生类型数组
intArrayOf(1,2,3,4).forEach { println(it) }
```

### 类型检测与转换

```kotlin
println("cxk" is String)
println("cxk" !is String) // 等同于 !("cxk" is String)
var str: Any = "cxk"
if (str is String) {
    // 当编译器能保证变量在检测和使用之间不可改变时，智能转换才有效
    // 在该分支 str自动被转为String
    println(str.length)
}
// 不安全的转换操作
//println(str as Int)
// 安全的可用转换操作 转换失败返回null
println(str as? Int)
val list: List<String> = listOf("")
if (list is ArrayList) {
    // `list` 会智能转换为 `ArrayList<String>`
}
```

## 控制流

### 条件与循环

```kotlin
// if是表达式 会返回一个值
var a = if (1 >2) 11 else 999

// when语句
// 除非编译器能够检测出所有的可能情况都已经覆盖了 否则需要else语句
var str = "cxk"
val ans = when("cxk") {
    "cxk" -> "jntm"
    // 多种情况
    "jg", "ngm" -> "cxk"
    is String -> println("str is String")
    else -> "unknow"
}

// for循环遍历迭代器
for(item in listOf("1", "2", "3")){}
// 通过索引遍历数组
var arr = arrayOf("1", "3","3")
for(i in arr.indices) { println(arr[i])}
// 数字区间迭代
for(item in 1..10 step 2){println(item)}
for(item in 10 downTo 0 step 2){println(item)}

// while 和 do-while 循环
var i = 0
while (i < 10) {i++}
do {
    i--;
} while( i >= 0)
```

### 返回与跳转

```kotlin
// return 默认从最直接包围它的函数或者匿名函数返回
fun foo() {
    listOf(1, 2, 3, 4, 5).forEach {
        if (it == 3) return // 此时这里直接返回到foo的调用者 而非退出这个lambda表达式
        print(it)
    }
    println("this point is unreachable")
}
foo()
fun foo1() {
    listOf(1, 2, 3, 4, 5).forEach a@{
        if (it == 3) return@a// 此时这里就是退出lambda表达式
        print(it)
    }
    println("this point is reachable")
}
foo1()

// 标签
loop@ for(i in 1..10) {
    for(j in 1..10) {
        if (i == 1 && j == 2) break@loop
    }
}
```

### 异常

```kotlin
// kotlin 只有非受检异常
try {
    if (2 > 1) throw Exception("n")
}catch (e: Exception) {
    println(e)
} finally {
    println("clean")
}
// try是一个表达式 可以有一个返回值 出现异常返回catch代码块里的返回值
println(try {"cxk".toInt()}catch (e: NumberFormatException){null})
```

## 类

```kotlin
/ 空类
class Empty

class Person(name: String) {
    var innerName: String = name.uppercase()
    init {
        println("init code block ${innerName}")
    }
}

// 如果构造器有修饰符或者注解 则需要constructor关键字
class Animal protected constructor(){}

class Pet(owner: String) {
    // 次构造函数 将工作委托给主构造函数
    constructor(): this("cxk")
}

// 使用open代表该类开放继承
open class Remote {
    open val url = "baidu.com"
    open fun execute(){}
}
// 抽象类
abstract class BaseRemote: Remote() {
    // 覆盖属性
    // 可以用一个 var 属性覆盖一个 val 属性，但反之则不行
    override val url = "google.com"
    // 一个抽象成员覆盖一个非抽象的开放成员
    abstract override fun execute()

    open fun wrapper(){
        println("BaseRemote wrapper")
    }
}

interface HTTP {
    fun wrapper(){
        println("HTTP wrapper")
    }
}

class WarnRemote: BaseRemote(), HTTP{
    override fun execute() {
        TODO("Not yet implemented")
    }
    override fun wrapper(){
        // 调用父类的方法
        super<BaseRemote>.wrapper();
        // 调用特定接口的方法
        super<HTTP>.wrapper();
        println("WarnRemote wrapper")
    }
}
```

### 属性

```kotlin
// 编译期常量
const val PAGE_SIZE = 100

class Properties {
    var key: String = ""
    var value: String = ""

    // getter setter
    // 0是幕后属性
    var counter : Int = 0
        set(value) {field = value+1}
        get() {return ++field }

    // 延迟初始化属性
    lateinit var item: Item

    fun get(): Item? {
        if (::item.isInitialized) {
            return item
        }
        return null
    }
}
```

### 接口

```kotlin
interface Service{
    // 接口属性
    val name: String
        get() = "service"

    fun list()

    // 接口默认方法
    fun defaultList(){
        println(this.list())
    }
}
// 接口继承
interface BaseService: Service{}

class UserService: Service {
    override val name: String = "user-service"
    override fun list() {
        TODO("Not yet implemented")
    }
}
// 函数式接口
fun interface Consumer {
    fun accept(i: Int)
}
fun main(){
    Consumer { println(it)}.accept(1)
}
```

### 可见性修饰符

- private：包内可见 类成员内可见
- internal：模块内可见
- protected：类成员跟子类可见
- public：范围最大

### 扩展

```kotlin
// 一个类扩展新功能而无需继承该类或者使用像装饰者这样的设计模式
// 扩展一个类的函数
fun MutableList<Int>.print(){
    for(i in this) {
        println(i)
    }
}
fun String?.topPinyin(): String {
    if (this == null) return "null"
    return toString()
}
// 扩展属性
val String.Int: Int
    get() = this.toInt()
fun main() {
    // 调用的具体方法是由函数调用所在的表达式的类型来决定的
    mutableListOf(1,2,3,4).print()

    var s: String? = null
    println(s.topPinyin())

    println("1".Int)
}
```

### 数据类

```kotlin
// 会根据构造函数自动生成equals/hashCode/toString/copy
data class User(val name: String, val age: Int)

fun main() {
    val cxk = User("cxk", 18)
    val olderCxk = cxk.copy(age = 22)
    println(cxk == olderCxk)
    // 解构
    val (name, age) = cxk
    println("${name},${age}")
}
```

### 密封类

```kotlin
// 密封类的所有直接子类在编译时都是已知的
sealed class NetworkError: Error()
class ConnectRefusedError: NetworkError()
class TimeoutError: NetworkError()
```
