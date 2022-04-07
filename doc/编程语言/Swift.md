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

## 控制流

### 循环

- for 循环

```swift
// 忽略下标
for _ in 1...10 {
    print("gogogo")
}
```

- while 循环

```swift
var i = 1
// i的后面一定要有空格
while i <= 10 {
    print(i)
    i += 2
}

```

- do-while循环

```swift
var j = 1
repeat {
    print(j)
    j += 2
}while(j <= 10)
```

### 选择

- if 同类C语言

- switch

```swift
// 每条case之间不用加break
var rank = "a"
switch rank {
// 同时case多个条件
case "a", "A":
    print("jn")
case "b":
    print("d")
default:
    print("defa")
// 空语句
//default:break
//default:()
}

// switch与范围
switch 5 {
case 1...5:
    print("1-5")
case 6...10:
    print("6-10")
default:()
}
// switch与元组
let response = (200, "OK")
switch response {
case(200, "OK"):
    print("done")
case(200, "GOON"):
    print("continue")
default:()
}
// 在case中解构变量
switch (0,0) {
case(let x, 0):
    print("x is \(x)")
case (0, let y):
    print("y is \(y)")
default:()
}
// 继续往下执行
switch 5 {
case 5:
    print("5")
    // 不会判断下面的case是否满足条件 无脑执行
    fallthrough
case 6:
    print("6")
default:()
}
```

### 控制转移

```swift
// 跳出多重循环
outter:
for index in 1...10{
    for index1 in 1...10 {
        if (index == 3 && index1 == 3) {
                print("i got go")
                break outter
        }
    }
}
```

### where

```swift
// where类似于SQL中的where 是一种条件限定
switch (3,3){
case let(x,y) where x == y:
    print("x == y")
case let(x,y):
    ()
}

for case let index in 1...10 where index % 3 == 0 {
    print(index)
}
```

### guard

```swift
// 防御式编程的语义化
// 只有满足条件才不会进入代码块
guard num >= 1 else {
    print("stop")
    exit(0)
}
```
