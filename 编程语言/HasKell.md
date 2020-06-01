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
main = interact wordCount
    where wordCount input = show(length (lines input)) ++ "\n"
```

```sh
runghc wc < wc.hs
```

## 类型系统

- 强类型
  - 不会进行自动转换
- 静态
  - 可以在编译期（而不是执行期）知道每个值和表达式的类型
- 自动推导

## 函数

- 使用函数

```haskell
-- 调用compare函数 参数分别为1，2
compare 1 2
```

- 函数定义

```haskell
-- 定义一个函数add，参数为a,b 函数体为a+b
add a b = a+b
```

- 分支

```haskell
if age <= 18 then "cxk" else "jntm"
```