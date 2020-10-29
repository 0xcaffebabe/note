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
