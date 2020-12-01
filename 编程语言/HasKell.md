# HashKell

## 编程环境

- ghc是生成快速本底代码的优化编译器。
- ghci是一个交互解析器和调试器。
- runghc是一个以脚本形式(并不要首先编译)运行Haskell代码的程序

## 基本操作

- 登入解释器

```sh
ghci
```

- 算术运算

```sh
Prelude> 2+2
```

- 逻辑运算

```sh
Prelude> True && False
```

不等于

```sh
Prelude> 1/=2
True
```

```haskell
if (5 /= 4) then "got it" else "oh no"
```

- 变量定义

```sh
Prelude> let name = "cxk"
Prelude> name
"cxk"
```

- 列表

```sh
Prelude> ["1","2"]
["1","2"]
```

列表中的项必须是相同类型

列举

```sh
Prelude> [1..10]
[1,2,3,4,5,6,7,8,9,10]
```

列表相加

```sh
Prelude> [1..5] ++ [6..10]
[1,2,3,4,5,6,7,8,9,10]
```

增加元素到列表头

```sh
Prelude> 1 : [2..5]
[1,2,3,4,5]
```

- 判断类型

```sh
Prelude> :type 'a'
'a' :: Char
```

## 第一个Haskell程序

```haskell
main = putStrLn "hello world"
```

```sh
runghc Helloworld.hs
```

## 类型系统

- 强类型
  - 不会进行自动转换
- 静态
  - 可以在编译期（而不是执行期）知道每个值和表达式的类型
- 自动推导
  - Haskell 编译器可以自动推断出程序中几乎所有表达式的类型

函数与类型不可分离

### 一些常用类型

- Char
  - 单个 Unicode 字符。
- Bool
  - 表示一个布尔逻辑值
- Int
  - 在 32 位机器里， Int 为 32 位宽，在 64 位机器里， Int 为 64 位宽
- Integer
  - 不限长度的带符号整数，在编写RSA加密，大数运算时很重要
- Double
  - 用于表示浮点数。长度由机器决定
- 元组

```haskell
(1,"cxk")
```

```haskell
:type (18, "cxk")
```

### 定义类型

```haskell
data Person = Person String Int -- 定义一个新类型，= 后面的Person是构造函数
let man = Person "cxk" 1
```

- 类型别名

```haskell
type Age = Int
```

- 代数类型

```haskell
data Name = String String | String
let name = Name "c" "xk"
let name1 = Name "cxk"
```

- 枚举

```haskell
data Color = Red | Blue | Yellow
:type Red -- Red :: Color
```

### 参数化类型

```haskell
-- 定义一个带有泛型a参数的类型
data Optional a = Just a | Nothing
```

## 函数

- 使用函数

```haskell
-- 调用compare函数 参数分别为1，2
compare 1 2
-- 嵌套调用
sqrt (sqrt 81)
```

- 函数类型

```haskell
:type sqrt
-- sqrt :: Floating a => a -> a
```

纯度

我们将带副作用的函数称为“不纯（impure）函数”，而将不带副作用的函数称为“纯（pure）函数”。

- 函数定义

```haskell
add :: (Int, Int) -> Int
add (x,y) = x+y
```

**非柯里化函数**：当函数有多个参数，必须通过元组一次性传入，染回返回结果

当函数有多个参数时，参数可以一个一个地依次输入，如果参数不足，将返回一个函数作为结果，这样的函数就是柯里化的函数。


- 分支

```haskell
if age <= 18 then "cxk" else "jntm"
-- 需要注意两个分支的返回值都需要是同类型
```

- 惰性求值

```haskell
isOdd (1+2)
-- 1+2只有在真正需要时，才会被计算
```

- 多态

```haskell
:type last
-- last :: [a] -> a
-- 输入一个列表，这个列表的元素类型为a，返回一个类型为a的元素
```

**软件的大部分风险，都来自于与外部世界进行交互**

## 模式匹配

```haskell
-- Haskell 允许将函数定义为一系列等式
-- 执行函数时，会逐个进行匹配
myNot True = False
myNot False = True
```