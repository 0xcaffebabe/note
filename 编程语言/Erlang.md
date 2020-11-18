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

## 控制结构

- case

```erlang
Animal = "dog".
case Animal of
  "dog" -> "bark";
  "cat" -> "mow";
  _ -> "unknow"
end.
```

- if

```erlang
X = 0.
if
  X >=0 -> positive;
  X <0 -> negative
end.
```

## 匿名函数

```erlang
Add = fun(A, B) -> A+B end.
Add(1,2).
```

## 列表与高阶函数

```erlang
Numbers = [1,2,3].
lists:foreach(fun(I) -> io:format("~p~n",[I]) end, Numbers). % 迭代
lists:map(fun(I) -> I * I end, Numbers). % 映射\

lists:filter(fun(I) -> I > 1 end, Numbers).
lists:all(fun(I) -> I > 1 end, Numbers).
lists:any(fun(I) -> I > 1 end, Numbers).

lists:foldl(fun(I,SUM) -> I + SUM end, 0, [1,2,3,4,5]). % reduce
```
