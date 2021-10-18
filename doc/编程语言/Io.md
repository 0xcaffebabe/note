# Io

- 优势：大量可定制语法和函数 强大的并发模型

## 起步

```io
"hello world" print # 打印
Vehicle := Object clone # 复制现有对象创建新对象
Vehicle print

Vehicle desc := "a vehicle" # 给一个槽赋值
Vehicle desc print # 输出槽
Vehicle slotNames print # 获取所有槽
```

## 原型与对象

```io
Vehicle := Object clone
car := Vehicle clone # Vehicle的实例

Bike := Vehicle clone # 创建一个继承于Vehicle的Bike

car name := "terrbyte"
car name print
```

## 方法

```io
obj := Object clone
obj say := method("go out" println) # 定义一个方法
obj say
obj proto print # 打印原型
```

## list 和 map

```io
list := list(1,2,3)
list average println
list sum println
list at(1) println
list append(1)
list pop println
list isEmpty println

map := Map clone
map atPut("name","cxk")
map at("name") println
```

## true false

```io
true and false println
false or true println
```

注意：0代表true

## 单例

```io
true clone println // itself
Vehicle := Object clone
Vehicle clone := Vehicle # 创建自己的单例
(Vehicle clone == Vehicle clone) println
```

## 循环与条件

```io
#loop("cxk" println) # 死循环
i := 1;
while(i <= 10,i print;i = i+1)

for(j,1,11,j print)
for(j, 1, 10, 2, j print) # 自定义步长为2

if(1 == 1,"true" print, "false" print)
```

## 运算符

```io
OperatorTable addOperator("xor", 11)
true xor := method(bool, if(bool, true, false)) # 定义xor结果为true的运算函数
false xor := method(bool, if(bool, false, true)) # 定义xor结果为false的运算函数

true xor false println
```

## 消息

## 反射

## DSL

通过IO的运算符定义 可以实现DSL

## forward

类似于ruby中的method_missiing

```io
object := Object clone
object forward := method(call message name println)

object unknow
```

## 并发

- 协程

```io
thread1 := Object clone
thread2 := Object clone

thread1 run := method(
  for(i,1,10, i println;yield)
)

thread2 run := method(
  for(i,11,20, i println;yield)
)

thread1 @@run; thread2 @@run
Coroutine currentCoroutine pause
```

- actor

- future

## 核心优势

- 占用空间小 用在嵌入式领域
- 语法简单
- 十分灵活 可以通过改变各种槽来修改语言
- 并发

## 不足

- 语法简单导致的表达能力弱
- 社区不活跃
- 性能
