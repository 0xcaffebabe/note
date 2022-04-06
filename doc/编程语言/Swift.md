# Swift

## 变量常量与基本类型

```swift
// 常量
let pi = 3.14
// 变量
var i = 1, j = 2
// 显式变量类型
var url: String = "www.baidu.com"

// 整型 取决于机器字长
print(Int.max)
// 无符号整型
print(UInt.max)
// 8位整型
print(Int8.max)

// 浮点数
let x: Float = 3.1415926
let y: Double = 3.155645
print(x, y)

// 不支持隐式转换
print(x+Float(y))

// 元组
var property: (String, Int, (Int, Int, Int)) = ("cxk", 18, (35, 35, 35))
print(property)
print(property.0)
print(property.1)
// 解构
let (name, age, quake) = property
// 解构忽略部分属性
let (name1, age1, _) = property
print(name, age, quake)
// 命名元组属性
var point: (x: Int, y: Int) = (1,2)
var point1 = (x:1, y: 2)
print("the point: \(point), point1: \(point1)")
```

## 运算符

基本的数值逻辑运算符操作跟 Java 一样, 但在 Swift3 之后 ++ -- 已被废弃

=== 与 !== 用来比较对象的引用

### 常量的首次赋值

```swift
let i: Int
var condition = false
if condition {
    i = 1
}else {
    i = 2
}
```

### 范围运算符

```swift
let a = 0..<10 // 前闭后开（0-9）
print(a)
// 前闭后闭（1-10）
for index in 1...10 {
    print(index)
    // 循环里的index是常量
    // index += 1
}

```