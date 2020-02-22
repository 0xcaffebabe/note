# Python

## 数据类型

- 整数型
- 浮点型
- 字符串
- 布尔型
- None

### 列表

```py
# 列表中的元素可以是任意类型的
list = [1,'2',3.0]
# 通过下标来获取/修改元素
list[0]='a'
print(list[0])
# 通过len函数来获取列表长度
print(len(list))
# 通过list的append函数来添加元素
list.append('xx')
```

### 字符串

字符串是字符的有序序列，所以也具有索引。也可以根据索引取出其中某一个字符

```py
print('cxk'[2])
# 字符串是不可变的，所以不能通过下标修改
# 'cxk'[2]='b'
# 同样可以用len获取长度
print(len('cxk'))
```

## 数值运算

```python
# 加法
print(33+725)
# 减法
print(33-11)
# 乘法
print(33*25)
# 除法
print(33/22)
# 取余
print(33 % 11)
# 次方
print(33**2)
# 整除
print(33//22)
```

## 比较运算

```py
print(2>3)
print(2==3)
print(2<=3)
print(2!=3)
```

## 变量与赋值

```py
a=5
```

## 函数

- 抽象
- 代码复用

### 函数定义

```py
def sum(a,b):
    return a+b
```

### 副作用

函数包含一些会引起程序或系统状态变化的操作，如修改全局变量、命令行输入输出、读写文件等，这样的变化叫做函数的副作用


### 几个内置函数

```py
# 获取终端的一个输入
str = input('input str')
# 将str转为int类型
a = int(str)
# 输出
print(a)
```

## 逻辑关键字

- and
- or
- not

## 分支语句

需要注意的是，python使用的缩进来代表c/java中的花括号

```py
if a<18:
    print('未成年')
elif a>=18 and a<=20:
    print('还年轻')
else:
    print('成年')
```

## 循环语句

- while循环

```py
while a>=0:
    print(a)
    a = a-1
```

- for循环

```py
list = [1,2,3]
for i in list:
    print(i)
```

## 错误处理与异常机制

### 异常捕获

```py
# 捕获所有异常
try:
    b=a/0
except:
    print('catch exception')
# 捕获某个异常
try:
    b=a/0
except ZeroDivisionError as e:
    print('catch exception:',e)
# 捕获多个异常
try:
    b=a/0
except (ZeroDivisionError,IndexError) as e:
    print('catch exception:',e)
# 增加finally语句，finally语句无论是否发生异常都会执行
try:
    b=a/0
except:
    print('catch exception')
finally:
    print("finally")
```

python常见的内置异常

异常名|	含义
-|-
Exception|	大多数异常的基类
SyntaxError|	无效语法
NameError|	名字（变量、函数、类等）不存在
ValueError|	不合适的值
IndexError|	索引超过范围
ImportError|	模块不存在
IOError|	I/O 相关错误
TypeError|	不合适的类型
AttributeError|	属性不存在
KeyError|	字典的键值不存在
ZeroDivisionError|	除法中被除数为 0

### 抛出异常

```py
try:
    raise ValueError("参数错误")
except ValueError as e:
    print('catch exception:',e)
```

## 面向对象

### 查看数据类型

```py
print(type(''))
```

### 类的定义

```py
class Person:
    pass # pass是占位符
```

### 实例化

```py
p = Person()
```

### 属性

```py
class Person:
    # 增加构造器参数,self，定义时必须有这个参数，但是调用时不必传递，等同于this
    def __init__(self,firstName,lastName):
        self.firstName = firstName
        self.lastName = lastName
# 创建对象时传入参数
p = Person('c','xk')
# 访问属性
print(p.firstName)
```

### 方法

```py
class Person:
    # 省略...
    def say(self):
        print(self.firstName+self.lastName)
# 调用方法
p.say()
```

## 模块和包

### 模块的导入

```py
# 导入模块
import random
# 使用模块
print(random.randint(1,9))
```

### 包

```
包/
├── __init__.py
├── 模块1.py
├── 模块2.py
├── 子包1/
    ├── __init__.py
    ├── 模块3.py
    └── 模块4.py
└── 子包2/
    ├── __init__.py
    ├── 模块5.py
    └── 孙子包1/
        ├── __init__.py
        └── 模块6.py
```

包的导入

```py
import package.subpackage.module
```

