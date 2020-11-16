# Erlang

- 无线程
- 轻量级线程
- 热拔插

## 起步

```erlang
% 注释
2 + 2.0.
"str".
[1, 2, 3].
Var = 1. % 定义变量
```

## 原子 列表 元组

```erlang
Color = red. % red是一个原子 赋值给Color
[1,2,"ds"]. % 列表是异质变长的
{1, 2 , "3"}. % 元组是变长的
```

## 模式匹配

```erlang
{X, Y} = {1, 2}.
[One|Two = [1,2,3,4]. % Two 匹配剩下的那些
All = <<W:4, Z:4>>. % 位匹配
<<A:4, B:4>> = All.
```

## 函数

```erlang
-module(basic).
-export([mirror/1, number/1]).
-export([sum/1]).

mirror(Anything) -> Anything.
number(one) -> 1. % 模式匹配

sum(0) -> 0;
sum(1) -> 1;
sum(N) -> N + sum(N-1). % 递归
```
