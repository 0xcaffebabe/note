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
