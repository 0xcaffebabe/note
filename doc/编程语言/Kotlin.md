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
