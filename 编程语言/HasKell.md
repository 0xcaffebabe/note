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